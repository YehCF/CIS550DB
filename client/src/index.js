import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import StockPage from "./pages/StockPage";
import StatePage from "./pages/StatePage";
import YelpPage from "./pages/YelpPage";
import "antd/dist/antd.css";

import "bootstrap/dist/css/bootstrap.min.css";
import "shards-ui/dist/css/shards.min.css";

ReactDOM.render(
  <div>
    <Router>
      <Switch>
        <Route exact path="/" render={() => <StatePage />} />
        <Route exact path="/stock" render={() => <StockPage />} />
        <Route exact	path="/yelp" render={() => <YelpPage /> }/>
      </Switch>
    </Router>
  </div>,
  document.getElementById("root")
);
