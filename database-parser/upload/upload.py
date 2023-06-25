#Upload CSV file to postgresql database
import pandas as pd
from sqlalchemy import create_engine

# Create a connection to your database
engine = create_engine('postgresql://yourusername:example@localhost:5432/postgres')

chunksize = 100000
for chunk in pd.read_csv('../SNPs.csv', chunksize=chunksize):
    chunk.to_sql('mytable', engine, if_exists='append')