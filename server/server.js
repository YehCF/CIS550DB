const express = require("express");
const mysql = require("mysql");
const routes = require("./routes");
const config = require("./config.json");
const cors = require("cors");

const app = express();
app.use(
  cors({
    origin: "*",
  })
);

// Route 1 - register as GET
app.get("/hello", routes.hello);

// Route for State
app.get("/states", routes.states);

// Route for Stock
app.get("/stock", routes.stocks);
app.get("/search/stock", routes.search_stocks);
app.get("/state/industry", routes.state_industry);
app.get("/case/stock", routes.case_and_stock);

// Route for StateMap (for Testing)
app.get("/state/volatility", routes.state_volatility);
app.get("/state/case/norm", routes.state_case_norm);

/*Yelp Route*/
// Route 5
app.get("/yelp", routes.yelp_map);
//Route 6
app.get("/yelp/categories", routes.yelp_categories);
//Route 7
app.get("/yelp/state", routes.yelp_state);
//Route 8
app.get("/yelp/time", routes.yelp_time);
//Route 9
app.get("/yelp/filter", routes.yelp_filter);

/*Election Routes*/
// Route 10
app.get("/elections", routes.elections);
// Route 11
app.get("/elections/fewest", routes.elections_fewest);
// Route 12
app.get("/elections/most_of_party", routes.elections_most_party);
// Route 13
app.get("/elections/populous", routes.elections_populous);

/*Combination Routes*/
// Route 14
app.get("/stock/political", routes.company_political);

app.listen(config.server_port, () => {
  console.log(
    `Server running at http://${config.server_host}:${config.server_port}/`
  );
});

module.exports = app;
