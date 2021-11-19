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

// Route 2
app.get("/stock", routes.stock);
// Route 3
app.get("/stock/popular", routes.stock_popular);
// Route 4
app.get("/state/stock", routes.state_stock);

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