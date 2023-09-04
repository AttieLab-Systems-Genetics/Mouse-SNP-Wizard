import vcf
import sys
import time
import os


columns = ['chrom', 'pos', 'ref', 'rs_number', 'symbol', 'gene', 'consequence', 'protein_position', 'amino_acids', 'impact', 'sift']

def main():
    # Check for required command line arguments
    if len(sys.argv) < 2:
        print("Error: No VCF file specified")
        exit()
    elif len(sys.argv) < 3:
        print("Error: No output file specified")
        exit()
    
    vcf_file, output_file, flags = parse_arguments()

    # Initialize VCF reader
    vcf_reader = vcf.Reader(open(vcf_file, 'r'))
    
    # Create hash tables for mapping consequences and impacts
    consequences_hash, impacts_hash = create_hash_tables()

    # Process VCF metadata
    samples, indexes = process_vcf_metadata(vcf_reader)

    # Add sample names to CSV columns
    columns.extend(samples)

    # Open output file
    f = open(output_file, 'w')

    # Initialize SQL output file
    initialize_sql_file(vcf_reader, f, output_file)

    # Process VCF and write SQL
    process_vcf_and_write_sql(vcf_reader, f, impacts_hash, output_file.split('.')[0], columns, 10000, '-v' in flags, indexes, consequences_hash)

    # Close output file
    f.close()


def process_vcf_and_write_sql(vcf_reader, f, impacts_hash, table_name, columns, batch_size, verbose, indexes, consequences_hash):
    snp_count = 0
    row_count = 0
    data_batch = []

    for record in vcf_reader:
        snp_count += 1

        # Create hash table for mapping genotype values to alleles
        value_hash = {
            '0/0': record.REF,
            '1/1': record.ALT[0],
            './.': None,
            **{f"{i}/{i}": record.ALT[i-1] for i in range(2, len(record.ALT) + 1)}
        }

        data_row = prepare_data_row(record, vcf_reader, value_hash)
        
        if 'CSQ' in record.INFO:
            saved_data_rows = []
            for record_info in record.INFO['CSQ']:
                new_data_row = data_row.copy()
                row_count += 1
                # Split the record info into an array
                record_info = record_info.split('|')

                # Assign values to the data row using helper function
                assign_values_to_data_row(new_data_row, record_info, indexes, impacts_hash)

                # Check for duplicate row and handle consequences
                duplicate = handle_consequences_and_duplicates(new_data_row, saved_data_rows, record_info, indexes, consequences_hash)

                # Skip duplicate rows
                if duplicate:
                    continue

                # Sanitize and sort data
                sanitized_data = sanitize_and_sort_data(new_data_row, columns)

                # Prepare and write batch of rows to CSV
                data_batch.append('(' + ', '.join(sanitized_data) + ')')
                write_data_batch_to_csv(data_batch, f, table_name, columns, batch_size, verbose, row_count, snp_count)

        if len(data_batch) >= batch_size:
            write_bulk_insert(f, data_batch, table_name, columns, row_count, snp_count, verbose)

    # Finalize any remaining batches and create indices
    write_bulk_insert(f, data_batch, table_name, columns, row_count, snp_count, verbose)
    create_indices_and_constraints(f, table_name)

def parse_arguments():
    vcf_file = sys.argv[1]
    output_file = (sys.argv[2] if sys.argv[2].endswith('.sql') else sys.argv[2].split('0')[0] + '.sql').lstrip('./\\')
    flags = sys.argv[3:]

    if '-h' in flags or '--help' in flags:
        print("Usage: python3 vcf_convert.py <vcf_file> <output_file> [flags]")
        print("Flags:")
        print("-h, --help\t\t\tDisplay this help message")
        print("-v, --verbose\t\t\tDisplay verbose output")
        print("-f, --force\t\t\tForce remove output file if it already exists")
        exit()

    handle_existing_file(output_file, flags)
    
    return vcf_file, output_file, flags

def handle_existing_file(output_file, flags):
    verbose = '-v' in flags
    force_remove = '-f' in flags
    
    if os.path.exists(output_file):
        if verbose:
            print("Verbose output enabled!")
        
        if force_remove:
            print("Output file already exists, removing...")
            os.remove(output_file)
            return

        print("Output file exists. Removing in 10s. Ctrl+C to cancel. Use -f flag to force remove.")
        time.sleep(10)
        os.remove(output_file)

def create_hash_tables():
    consequences = ["intergenic_variant","regulatory_region_variant","upstream_gene_variant","non_coding_transcript_exon_variant","downstream_gene_variant","intron_variant","non_coding_transcript_variant","3_prime_UTR_variant","synonymous_variant","splice_region_variant","inframe_insertion","inframe_deletion","splice_polypyrimidine_tract_variant","5_prime_UTR_variant","NMD_transcript_variant","frameshift_variant","start_lost","stop_gained","splice_acceptor_variant","splice_donor_region_variant","splice_donor_variant","stop_retained_variant","stop_lost","splice_donor_5th_base_variant","coding_sequence_variant","protein_altering_variant","start_retained_variant","transcript_ablation","incomplete_terminal_codon_variant","missense_variant","initiator_codon_variant","mature_miRNA_variant"]  # Add all consequence types here
    all_impacts = ["LOW", "MODIFIER", "MODERATE", "HIGH"]

    consequences_hash = {consequences[i]: i for i in range(len(consequences))}
    impacts_hash = {all_impacts[i]: i for i in range(len(all_impacts))}
    

    return consequences_hash, impacts_hash

def process_vcf_metadata(vcf_reader):
    # Extract sample names from VCF
    samples = vcf_reader.samples

    infos = vcf_reader.infos['CSQ'].desc.index('Format: ') + 8
    infos = vcf_reader.infos['CSQ'].desc[50:].split('|')
    infos = [info.strip().lower() for info in infos]

    # Extract needed indexes from the 'infos' list
    indexes = {key: infos.index(key) if key in infos else -1 for key in ['symbol', 'consequence', 'protein_position', 'amino_acids', 'impact', 'sift', 'gene']}
    return samples, indexes


def initialize_sql_file(vcf_reader, f,output_file):
    # Define SQL table columns based on given indexes
    column_definitions = [
        "chrom VARCHAR(2)",
        "pos INT",
        "ref TEXT",
        "rs_number TEXT",
        "symbol TEXT",
        "gene TEXT",
        "consequence INT[]",
        "protein_position TEXT",
        "amino_acids TEXT",
        "impact TEXT",
        "sift TEXT"
    ]
    
    # Include sample names as SQL table columns
    samples_with_quotes = ', '.join([f'"{sample}" TEXT' for sample in vcf_reader.samples])
    column_definitions.append(samples_with_quotes)

    # Create SQL CREATE TABLE statement
    create_table_statement = (
        f"CREATE TABLE IF NOT EXISTS {output_file.split('.')[0]} ("
        f"{', '.join(column_definitions)}"
        ");\n"
    )
    
    # Write CREATE TABLE statement to output SQL file
    f.write(create_table_statement)



def assign_values_to_data_row(new_data_row, record_info, indexes, impacts_hash):
    for index_name, idx in indexes.items():
        if (index_name == 'impact'):
            new_data_row[index_name] = None if idx == -1 else None if record_info[idx] == '' else impacts_hash[record_info[idx]]
        else:
            new_data_row[index_name] = None if idx == -1 else None if record_info[idx] == '' else record_info[idx]

def handle_consequences_and_duplicates(new_data_row, saved_data_rows, record_info, indexes, consequences_hash):
    consequence_index = indexes.get('consequence', -1)
    if consequence_index != -1:
        consequences = []
        for consequence in record_info[consequence_index].split('&'):
            if consequence in consequences_hash:
                consequences.append(consequences_hash[consequence])
        if consequences:
            new_data_row['consequence'] = '{' + ','.join(map(str, consequences)) + '}'

    if new_data_row not in saved_data_rows:
        saved_data_rows.append(new_data_row)
        return False # Not a duplicate row
    return True # Skip duplicate rows
    

def sanitize_and_sort_data(new_data_row, columns):
    sanitized_data = {k: v.replace("'", "''") if isinstance(v, str) else v for k, v in new_data_row.items()}
    sorted_data = sorted(sanitized_data.items(), key=lambda x: columns.index(x[0]) if x[0] in columns else len(columns))
    return ['NULL' if (v is None or v == 'None') else f"'{v}'" if isinstance(v, str) else str(v) for k, v in sorted_data]

def write_data_batch_to_csv(data_batch, f, table_name, columns, batch_size, verbose, row_count, snp_count):
    if len(data_batch) >= batch_size:
        bulk_insert_statement = "INSERT INTO {} ({}) VALUES {};\n".format(
            table_name,
            ', '.join(map(lambda column: f'"{column}"', columns)),
            ', '.join(data_batch)
        )
        f.write(bulk_insert_statement)
        if verbose:
            print(f"Wrote {row_count:,} rows to CSV. {snp_count:,} SNPs written")
        data_batch.clear()

def prepare_data_row(record, vcf_reader, value_hash):
    data_row = {
        'chrom': record.CHROM,
        'pos': record.POS,
        'ref': record.REF,
        'rs_number': record.ID if record.ID != None and record.ID != '.' else None
    }
    # Add sample-specific data
    for sample in vcf_reader.samples:
        gt = record.genotype(sample).data.GT.replace('|', '/')
        fi = record.genotype(sample).data.FI
        if gt in value_hash:
            data_row[sample] = str(value_hash[gt]).lower() if fi == 0 else str(value_hash[gt])
        else:
            data_row[sample] = '?'
    return data_row

def write_bulk_insert(f, data_batch, table_name, columns, row_count, snp_count, verbose):
    bulk_insert_statement = "INSERT INTO {} ({}) VALUES {};\n".format(
        table_name, ', '.join(map(lambda column: f'"{column}"', columns)), ', '.join(data_batch))
    f.write(bulk_insert_statement)
    if verbose:
        print("Wrote {:,} rows to CSV. {:,} SNPs written".format(row_count, snp_count))
    data_batch.clear()


def create_indices_and_constraints(f, table_name):
    # Create Indices for Position and Chromosome
    f.write(f"CREATE INDEX {table_name}_pos_chrom_idx ON {table_name} (pos, chrom);\n")
    
    # Create Index for Consequence
    f.write(f"CREATE INDEX {table_name}_consequence_idx ON {table_name} USING GIN (consequence);\n")
    
    # Alter Symbols Table
    f.write(f"ALTER TABLE symbols ADD COLUMN {table_name} BOOLEAN DEFAULT FALSE;\n")
    f.write(f"UPDATE symbols SET {table_name} = TRUE WHERE symbol IN (SELECT DISTINCT symbol FROM {table_name}) OR symbol IS NULL;\n")
    f.write(f"INSERT INTO symbols (symbol,{table_name}) SELECT DISTINCT symbol, TRUE FROM {table_name} WHERE symbol NOT IN (SELECT symbol FROM symbols) AND symbol IS NOT NULL;\n")

    # Add symbol_id column
    f.write(f"ALTER TABLE {table_name} ADD COLUMN symbol_id INTEGER;\n")
    f.write(f"UPDATE {table_name} SET symbol_id = symbols.id FROM symbols WHERE {table_name}.symbol = symbols.symbol;\n")

    # Remove symbol column
    f.write(f"ALTER TABLE {table_name} DROP COLUMN symbol;\n")

    # Add Foreign Key
    f.write(f"ALTER TABLE {table_name} ADD CONSTRAINT fk_symbols FOREIGN KEY (symbol_id) REFERENCES symbols (id);\n")
    
    # Create Index for symbol_id
    f.write(f"CREATE INDEX {table_name}_symbol_id_idx ON {table_name} (symbol_id);\n")

    # Alter Consequences Table
    f.write(f"ALTER TABLE consequences ADD COLUMN {table_name} int;\n")
    f.write(f"UPDATE consequences SET {table_name} = sub.count FROM (SELECT id, COUNT(*) as count FROM consequences JOIN (SELECT unnest(consequence) FROM {table_name}) AS t(unnest) ON consequences.id = t.unnest GROUP BY id) AS sub WHERE consequences.id = sub.id;\n")


if __name__ == "__main__":
    main()