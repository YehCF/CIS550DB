import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import StockPage from "./pages/StockPage";
import StatePage from "./pages/StatePage";
import YelpPage from "./pages/YelpPage";
import CovidPage from "./pages/CovidPage";
import VotingPage from "./pages/VotingPage";

import "antd/dist/antd.css";

import "bootstrap/dist/css/bootstrap.min.css";
import "shards-ui/dist/css/shards.min.css";
import "./components/style.css";

ReactDOM.render(
  <div>
    <Router>
      <Switch>
        <Route exact path="/" render={() => <StatePage />} />
        <Route exact path="/stock" render={() => <StockPage />} />
        <Route exact path="/yelp" render={() => <YelpPage />} />
        <Route exact path="/covid" render={() => <CovidPage />} />
        <Route exact path="/vote" render={() => <VotingPage />} />
      </Switch>
    </Router>
  </div>,
  document.getElementById("root")
);
