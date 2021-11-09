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

app.listen(config.server_port, () => {
  console.log(
    `Server running at http://${config.server_host}:${config.server_port}/`
  );
});

module.exports = app;
