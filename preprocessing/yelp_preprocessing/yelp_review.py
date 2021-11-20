#Cause the original data is too large to load at once. So you need to execute chunk.sh and store all chunk file's in /chunkFile/ first
#After chunking the data you can execute this python file.

##This python file will clean up unuse column and combine all chunk files to one
import json
import pandas as pd
import os

def parse_date(parse_df):
  parse_df = parse_df.drop(columns=['useful', 'funny', 'cool', 'text'])
  parse_df['review_id'] = parse_df['review_id'].astype('string')
  parse_df['user_id'] = parse_df['user_id'].astype('string')
  parse_df['business_id'] = parse_df['business_id'].astype('string')
  parse_df['date'] = parse_df['date'].dt.strftime('%Y-%m-%d')
  parse_df = parse_df[parse_df['date'] >= "2019-01"]

  return parse_df


path = './chunkFile/'
#path = './test/'
files = os.listdir(path)
count = 0

for fname in files:
    #load file to Dataframe
    parse_df = pd.read_json(open(path + fname, "r", encoding="utf8"), lines=True)
    #Data cleaning
    parse_df = parse_date(parse_df)
    #write the result to csv
    if count == 0:  #only first file need to write header
       parse_df.to_csv('./clean_reviews.csv', index = False)
       count += 1
    else:
       parse_df.to_csv('./clean_reviews.csv', mode='a', index = False, header=False)