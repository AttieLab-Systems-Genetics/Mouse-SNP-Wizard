import vcf
import sys

def main():
    """Main function to initiate the VCF to SQL conversion."""
    if len(sys.argv) > 2:
        vcf_reader = vcf.Reader(open(sys.argv[1], 'r'))
        output_file = sys.argv[2] if sys.argv[2].endswith('.sql') else f"{sys.argv[2].split('.')[0]}.sql"
        table_name = output_file.split('.')[0].replace('-', '_')
    else:
        print("Usage: python3 rs_vcf_to_sql.py <input.vcf> <output.sql>")
        sys.exit()

    sql_columns = ['chrom', 'pos', 'alt', 'ref', 'rs_number']
    batch_size = 1000
    data_batch = []

    with open(output_file, 'w') as f:
        create_table(f, table_name)
        process_vcf_records(vcf_reader, f, table_name, sql_columns, batch_size, data_batch)

def create_table(f, table_name):
    """Create the SQL table."""
    create_table_statement = (
        f"CREATE TABLE IF NOT EXISTS {table_name} ("
        f"chrom CHAR(2), "
        f"pos INT, "
        f"ref TEXT, "
        f"alt TEXT, "
        f"rs_number TEXT);"
        "\n"
    )
    f.write(create_table_statement)

def process_vcf_records(vcf_reader, f, table_name, sql_columns, batch_size, data_batch):
    """Process the VCF records and write to SQL."""
    row_count = 0
    for record in vcf_reader:
        row_count += 1
        if len(record.CHROM) > 2:
            print(f"Skipping row {row_count} with chromosome {record.CHROM}")
            continue

        data_row = prepare_data_row(record)
        data_batch.append(format_data_row(data_row, sql_columns))

        if len(data_batch) >= batch_size:
            write_batch_to_sql(f, table_name, sql_columns, data_batch, row_count)

    write_batch_to_sql(f, table_name, sql_columns, data_batch, row_count)

def prepare_data_row(record):
    """Prepare a data row from a VCF record."""
    return {
        'chrom': record.CHROM,
        'pos': record.POS,
        'alt': str(record.ALT),
        'ref': record.REF,
        'rs_number': record.ID if record.ID else ''
    }

def format_data_row(data_row, sql_columns):
    """Format a data row for SQL insertion."""
    sanitized_data = {k: v.replace("'", "''") if isinstance(v, str) else v for k, v in data_row.items()}
    sorted_data = sorted(sanitized_data.items(), key=lambda x: sql_columns.index(x[0]))
    return '(' + ', '.join([f"'{v}'" if isinstance(v, str) else str(v) for k, v in sorted_data]) + ')'

def write_batch_to_sql(f, table_name, sql_columns, data_batch, row_count):
    """Write a batch of rows to SQL."""
    bulk_insert_statement = (
    "INSERT INTO " + table_name + " (" + ', '.join(map(lambda column: f'"{column}"', sql_columns)) + ") "
    f"VALUES {', '.join(data_batch)};\n"
    )
    f.write(bulk_insert_statement)
    print(f"Wrote {row_count:,} rows to SQL.")
    data_batch.clear()

if __name__ == "__main__":
    main()