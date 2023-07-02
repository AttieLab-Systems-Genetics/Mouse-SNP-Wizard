import pandas as pd
from sqlalchemy import create_engine, MetaData, text
import sys

import os

# Check if command line has an agrument
if len(sys.argv) != 2:
    print("Usage: python upload-rs-numbers.py <filename>")
    exit()

# Check if file exists
if not os.path.isfile(sys.argv[1]):
    print("File does not exist")
    exit()


def get_connection_string():
    username = input("Please enter your PostgreSQL username: ")
    password = input("Please enter your PostgreSQL password: ")
    hostname = input("Please enter your PostgreSQL hostname (default is localhost): ") or 'localhost'
    port = input("Please enter your PostgreSQL port (default is 5432): ") or '5432'
    database = input("Please enter your PostgreSQL database (default is postgres): ") or 'postgres'
    return f'postgresql://{username}:{password}@{hostname}:{port}/{database}'

def main():
    # Create a connection to your database
    engine = create_engine(get_connection_string())
    metadata = MetaData()
    metadata.reflect(bind=engine)
    #Check connection
    try:
        connection = engine.connect()
    except:
        print("Connection failed, would you like to try again?")
        if input("Y/N: ").lower() == 'y':
            main()
        exit()
    
    

    #prompt user for table name
    table_name = input("Please enter the name of the table you would like to create/add to: ")
    #Check if table exists
    if table_name not in metadata.tables:
        print("the table does not exist, please create it first")
        exit()

    #Read the tsv file in chunks
    chunksize = 100000
    #There are many headers in the file, so skip them (they start with ##)
    #Count the number of lines to skip
    skip_lines = 0
    with open(sys.argv[1]) as f:
        for i, l in enumerate(f):
            if not l.startswith('##'):
                skip_lines = i
                break

    print("Uploading rs_numbers")
    lines_uploaded = 0
    for chunk in pd.read_csv(sys.argv[1], sep='\t', skiprows=range(0, skip_lines), chunksize=chunksize):
        #Add the rs_numbers to the temp table (only use the CHROM, POS, and ID columns)
        #Rename #CHROM to chromosome, POS to position and ID to rs_number
        chunk.rename(columns={'#CHROM': 'chromosome', 'POS': 'position', 'ID': 'rs_number'}, inplace=True)
        #Chromosome is an char array, so convert it to a string
        chunk['chromosome'] = chunk['chromosome'].astype(str)
        print("Uploading chunk")

        chunk[['rs_number', 'chromosome', 'position']].to_sql('rs_numbers', engine, if_exists='append', index=False)
        lines_uploaded += chunksize
        #Print lines uploaded with commas
        print(f"{lines_uploaded:,} lines uploaded")
    print("Finished uploading rs_numbers")
    
    
    exit()
    #Update the rs_numbers in the main table
    if 'rs_number' not in metadata.tables[table_name].columns:
        connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN rs_number VARCHAR(255)"))

    print("Updating rs_numbers")
    connection.execute(text(f"UPDATE {table_name} SET rs_number = temp_rs_numbers.ID FROM temp_rs_numbers WHERE {table_name}.chromosome = temp_rs_numbers.chromosome AND {table_name}.position = temp_rs_numbers.position"))
    print("Finished updating rs_numbers")
    #Drop the temp table
    connection.execute(text(f"DROP TABLE temp_rs_numbers"))
    print("Finished dropping temp table")


    #Close the connection
    connection.close()
    print("Connection closed")


if __name__ == '__main__':
    main()