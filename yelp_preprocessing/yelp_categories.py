from google.colab import drive
import json
import csv
import pandas as pd

prefix = '/content/drive'
drive.mount(prefix, force_remount=True)

#Store yelp_academic_dataset_business.json data to Dataframe
file_path = '/content/drive/My Drive/550 data/raw data/yelp_academic_dataset_business.json'
business_categories = pd.read_json(open(file_path, "r", encoding="utf8"), lines=True)

#filter unuse data
business_categories = business_categories[['business_id', 'categories']]

#drop null data in categories
business_categories = business_categories.dropna(subset=['categories'])

#As shown in the output of all the entries in the categories column, 
#one returaunt can have multiple categories, of which are represented in the column separated by commas. 
#As such, in order to make the data useful as feature variables,
#we will split the categories listed such that each row contains one listed categories. 
#If a particular returaunt has 2 categories, that row will appear twice for each of the categories.
business_categories.categories = business_categories.categories.apply(lambda x : x.split(','))
business_categories = business_categories.explode('categories')

#write parse_df to csv into csv
business_categories.to_csv('./business_categories.csv', index = False)

#We need another table to constraints categories, so we filter the unique category
categories_df = pd.DataFrame(business_categories.categories.unique(), columns=['categories'])

#write categories to csv
categories_df.to_csv('./clean_categories.csv', index = False)