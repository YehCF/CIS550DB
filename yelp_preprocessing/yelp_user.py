#Cause the original data is too large to load at once. So you need to execute chunk.sh and store all chunk file's in /chunkFile/ first
#After chunking the data you can execute this python file.

##This python file will clean up unuse column and combine all chunk files to one
import pandas as pd
import json
import csv

import os
path = './chunkFile/'
files = os.listdir(path)
count = 0

for fname in files:
    parse_df = pd.read_json(open(path + fname, "r", encoding="utf8"), lines=True)
     #Data cleaning
    cols_to_keep = ['user_id', 'review_count','average_stars']
    parse_df.drop(parse_df.columns.difference(cols_to_keep), axis=1, inplace=True)

     #write the result to csv
    if count == 0: #only first file need to write header
       parse_df.to_csv('./clean_user.csv', index = False)
       count += 1
    else:
       parse_df.to_csv('./clean_user.csv', mode='a', index = False, header=False)