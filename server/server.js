const express = require("express");
const mysql = require("mysql");
const routes = require("./routes");
const config = require("./config.json");
const cors = require("cors");
const {company_political, elections_fewest} = require("./routes");

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
// app.get("/elections", )
app.get("/elections/fewest", elections_fewest);
// app.get("/elections/most_of_party")
// app.get("/elections/populous")

/*Combination Routes*/
app.get("/stock/political", company_political);

app.listen(config.server_port, () => {
  console.log(
    `Server running at http://${config.server_host}:${config.server_port}/`
  );
});

module.exports = app;
