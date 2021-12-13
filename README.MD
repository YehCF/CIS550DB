
# CIS450/550 - Final Project: Polls, Pandemics, and Possibly More!
## Members: 
- Benjamin Kosko, bkosko@seas.upenn.edu, bkosko
- Victor Lin, lin1129@seas.upenn.edu, victorHLin
- Chun-Fu Yeh, cfyeh@seas.upenn.edu, YehCF
- Sarah Payne, paynesa@seas.upenn.edu, paynesa

## Dependencies 

### Server:
* `chart.js` 3.6.1
* `cors` 2.8.5
* `express` 4.17.1
* `mysql` 2.18.1
* `node-fetch` 3.0.0
* `nodemon` 2.0.12
* `supertest` 6.1.6
* `jest` 27.1.0

### Client: 
* `ant-design/charts` 1.2.14
* `fortawesome/fontawesome-svg-core` 1.2.36
* `fortawesome/free-solid-svg-icons` 5.15.4
* `fortawesome/react-fontawesome` 0.1.16
* `testing-library/jest-dom` 5.14.1
* `testing-library/react` 11.2.7
* `testing-library/user-event` 12.8.3
* `antd` 4.16.13
* `antd-button-color` 1.0.4
* `bootstrap` 5.1.3
* `canvasjs` 1.8.3
* `chart.js` 3.6.1
* `colormap` 2.3.2
* `d3` 7.1.1
* `d3-format` 3.0.1
* `datamaps` 0.5.9
* `font-awesome` 4.7.0
* `query-string` 7.0.1
* `react`17.0.2
* `react-bootstrap` 2.0.3
* `react-chartjs-2` 4.0.0
* `react-d3-library` 1.1.8
* `react-dom` 17.0.2
* `react-loading` 2.0.3
* `react-promise-tracker` 2.1.0
* `react-promise-tracker` 2.1.0
* `react-router-dom` 5.3.0
* `react-scripts` 4.0.3
* `react-usa-map` 1.5.0
* `react-vis` 1.11.7
* `reactstrap` 9.0.1
* `shards-react` 1.0.3
* `web-vitals` 1.1.2


### Data Wrangling
* R: `tidyverse` and `dpylr`


## Running the Code

### Running the App
Open two terminal windows. In one, type the following commands: 
```bash
cd server
npm install
npm start
```
In the other type: 
```bash
cd client
npm install
npm start
```
In a few moments, the server should be running and a browser window should pop up. If no window pops up, open your
browser and go to `http://localhost:3000/`. 


### Running the Data Wrangling

***Elections Data Wrangling*** Place `preprocess_voting.R` and `1976-2020-senate.csv` in the same directory (both are in the `preprocessing/voting_preprocessing`
directory by default). Then either execute the R scripe on the command line or open `preprocess_voting.R` in RStudio, set the session's working
directory to the source file location, and execute the entire script. 

***Stock Data Wrangling*** Run `stock_preprocess.ipynb` to preprocess the original table downloaded from (https://www.kaggle.com/shannanl/sp500-dataset?select=sp500+agg.csv). Then, the preprocessed stock table can be retrieved.

  
