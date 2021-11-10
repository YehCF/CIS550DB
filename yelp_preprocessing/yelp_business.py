from google.colab import drive
import json
import csv
import pandas as pd

prefix = '/content/drive'
drive.mount(prefix, force_remount=True)

#Store yelp_academic_dataset_business.json data to Dataframe
file_path = '/content/drive/My Drive/550 data/raw data/yelp_academic_dataset_business.json'
parse_df = pd.read_json(open('yelp_academic_dataset_business.json', "r", encoding="utf8"), lines=True)

#filter unuse data
parse_df = parse_df[['business_id', 'name', 'state', 'stars', 'review_count', 'attributes']]
#we only need RestaurantsTakeOut in attributes column
parse_df['TakeOut'] = parse_df.attributes.apply(lambda x : "NULL" if x is None or 'RestaurantsTakeOut' not in x else ("1" if x['RestaurantsTakeOut'] == 'True' else "0"))
#drop attributes column
parse_df.drop(columns='attributes', inplace=True)

#Store result to csv
parse_df.to_csv('clean_business.csv', index = False)