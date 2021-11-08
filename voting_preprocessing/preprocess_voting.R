# This code uses the R tidyverse to preprocess the voting data
# written by Sarah Payne, 11/8/2021

# load in the tidyverse and uncleaned data 
library(tidyverse)
uncleaned_data <- read_csv("1976-2020-senate.csv")

# rename the columns to the names we want in our schema
uncleaned_data_correct_cols <- uncleaned_data %>% 
  # we can use the R builtin vector of state abbreviations to check that all the 
  # state abbreviations in our table are valid 
  mutate(state_abbreviation = factor(state_po, levels=state.abb), 
  candidate_name =  candidate,
  votes = candidatevotes,
  total_votes = totalvotes) %>%
  # select only the columns we will be including in our database
  select(year, state_abbreviation, stage, 
         special, candidate_name, party_detailed, 
         party_simplified, writein, votes, total_votes)

# cannot have NAs in the primary key so drop any row that does 
uncleaned_data_primary <- uncleaned_data_correct_cols %>% 
  drop_na(year, state_abbreviation, candidate_name)

# check for duplicates with the primary keys we had originally intended to use 
uncleaned_data_primary %>% 
  group_by(state_abbreviation, year, candidate_name) %>% 
  mutate(duplicate_count = n()) %>% 
  filter(duplicate_count > 1)

# from this, we can see that there are actually quite a few duplicate rows because of candidates that
# run for multiple parties (e.g. conservative & republican). There are also multiple stages of election represented 
# (both general and runoff), which will also cause duplicates with the previous primary key attributes. 
uncleaned_data_primary_new_attrs <- uncleaned_data_primary %>% 
  drop_na(party_detailed, stage)

# check for duplicates again with the new primary keys: 
uncleaned_data_primary_new_attrs %>% 
  group_by(state_abbreviation, year, candidate_name, party_detailed, stage) %>%
  mutate(duplicate_count = n()) %>%
  filter(duplicate_count > 1)

# from this, it looks like there's some weird stuff going on in the 2002 LA election. Let's take a closer look:
LA_2002 <- uncleaned_data_primary_new_attrs %>% 
  filter(year == 2002 & state_abbreviation == "LA")
sum(LA_2002$votes)

# the sum of the votes is equal to the total votes, so for the duplicate entries, it seems like they split 
# votes across entries rather than entering too many votes. Let's sum up the votes for these duplicates: 
duplicates_removed <- uncleaned_data_primary_new_attrs %>% 
  group_by(year, state_abbreviation, stage, special, candidate_name, party_detailed, party_simplified, writein, total_votes) %>%
  # since we grouped by every other column, we can easily sum the votes and won't affect anything without duplicates
  summarise(votes = sum(votes)) 

# now let's sanity check that we don't have any duplicates 
duplicates_removed %>% 
  group_by(state_abbreviation, year, candidate_name, party_detailed, stage) %>%
  mutate(duplicate_count = n()) %>%
  filter(duplicate_count > 1)
# good to go! 

# get the percent of the vote that each candidate got
percent_votes_df <- duplicates_removed %>% mutate(
  percent_votes = votes / total_votes *100
)

# get which candidate won by checking which one got the maximum number of votes
cleaned_won <- percent_votes_df %>% 
  group_by(year, state_abbreviation) %>% 
  # get the maximum number of votes 
  mutate(max_votes = max(votes), 
         # conversion of bools to (0,1) for compatibility 
         won = ifelse(max_votes == votes, 1, 0)) %>%
  # we don't need the maximum votes column anymore 
  select(-max_votes)

# as above, we convert bools to integers for compatibility 
final_cleaned_df <- cleaned_won %>%
  mutate(special = ifelse(special, 1, 0), 
         writein = ifelse(writein, 1, 0))

# write out the results
final_cleaned_df %>% write_csv("cleaned_voting_data.csv")
