# Upload CSV file to postgresql database
import pandas as pd
from sqlalchemy import create_engine, Table, Column, Integer, MetaData
from getpass import getpass
import sys
import os

# Check if command line has an agrument
if len(sys.argv) != 2:
    print("Usage: python upload.py <filename>")
    exit()

# Check if file exists
if not os.path.isfile(sys.argv[1]):
    print("File does not exist")
    exit()


def get_connection_string():
    username = input("Please enter your PostgreSQL username: ")
    password = getpass("Please enter your PostgreSQL password (hidden): ")
    hostname = input("Please enter your PostgreSQL hostname (default is localhost): ") or 'localhost'
    port = input("Please enter your PostgreSQL port (default is 5432): ") or '5432'
    database = input("Please enter your PostgreSQL database (default is postgres): ") or 'postgres'
    return f'postgresql://{username}:{password}@{hostname}:{port}/{database}'

def main():
    # Create a connection to your database
    engine = create_engine(get_connection_string())

    #Check connection
    try:
        engine.connect()
    except:
        print("Connection failed, would you like to try again?")
        if input("Y/N: ").lower() == 'y':
            main()
        exit()
    
    table_name = input("Please enter the name of the table you would like to create/add to: ")
    #Check if table exists
    if table_name in engine.table_names():
        print("Table already exists, would you like to add to it?")
        if input("Y/N: ").lower() == 'y':
            pass
        else:
            exit()
            
    chunksize = 100000
    for chunk in pd.read_csv('../SNPs.csv', chunksize=chunksize):
        chunk.to_sql('mytable', engine, if_exists='append')

if __name__ == '__main__':
    main()