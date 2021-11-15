import React from "react";
import {
  Form,
  FormInput,
  FormGroup,
  Card,
  CardBody,
  CardTitle,
} from "shards-react";
import { Divider, Row, Col, DatePicker, Space } from "antd";
import moment from "moment";
import MenuBar from "../components/MenuBar";
import { getAllStates, getStateStock, getStateCases } from "../fetcher";
import USAMap from "react-usa-map";
import * as d3 from "d3";

//Color array for Bivariate Choropleth Map
const h = 100;
const w = 100;
const nColors = 5;
var svg = d3.select("body").append("svg").attr("width", w).attr("height", h);
var data = d3.range(nColors).reduce(function (arr, elem) {
  return arr.concat(
    d3.range(nColors).map(function (d) {
      return {
        col: elem,
        row: d,
      };
    })
  );
}, []);
const scale1 = d3
  .scaleLinear()
  .range(["#e8e8e8", "#5ac8c8"])
  .domain([0, nColors - 1]);
const scale2 = d3
  .scaleLinear()
  .range(["#e8e8e8", "#be64ac"])
  .domain([0, nColors - 1]);
let colorArray = [];
for (let i = 0; i < nColors; i++) {
  let subArray = [];
  for (let j = 0; j < nColors; j++) {
    subArray[j] = d3.scaleLinear().range([scale1(j), scale2(i)])(0.5);
  }
  colorArray[i] = subArray;
}
const rects = svg
  .selectAll(null)
  .data(data)
  .enter()
  .append("rect")
  .attr("x", (d) => (d.col * w) / nColors)
  .attr("y", (d) => (d.row * h) / nColors)
  .attr("width", w / nColors)
  .attr("height", h / nColors)
  .attr("transform", "translate(0, 0)")
  .attr("fill", function (d) {
    return colorArray[d.col][d.row];
  });

const dateFormat = "YYYY-MM-DD";
const { RangePicker } = DatePicker;

// helper for stock related info
const volatilityToColor = (volatility) => {
  const maxVolatilityRatio = 1.2;
  const color_index = Math.round(
    Math.min(volatility, maxVolatilityRatio) * (nColors / maxVolatilityRatio)
  );
  return Math.min(color_index, nColors - 1);
};

// helper for state confirmed case ratio (currently, this ratio is normalized)
const ncaseRatioToColor = (ratio) => {
  const maxRatio = 1.0;
  const color_index = Math.round(
    Math.min(ratio, maxRatio) * (nColors / maxRatio)
  );
  return Math.min(color_index, nColors - 1);
};

class StatePage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      startDate: "2020-03-01",
      endDate: "2020-12-31",
      stateResults: {},
      allStates: new Set([]),
      selectedStateInfo: null,
    };

    this.handleStateStock = this.handleStateStock.bind(this);
    this.handleStateCases = this.handleStateCases.bind(this);
    this.handleCalendarChange = this.handleCalendarChange.bind(this);
  }

  initStateResults() {
    // set state abbreviations
    getAllStates()
      .then((res) => {
        const states = new Set([]);
        for (const obj of res.results) {
          states.add(obj["state"]);
        }
        this.setState({ allStates: states });
      })
      .then(() => {
        // template for each state
        const stateInfo = {
          stockVolatility: 0,
          numConfirmedCases: 0,
          numConfirmedCasesRatio: 0,
          fill: colorArray[0][0], // default color
          // TO-DO: add other key-values for initialization
        };
        for (const state of this.state.allStates) {
          this.state.stateResults[state] = {
            ...stateInfo,
            clickHandler: (event) => {
              this.setState({
                selectedStateInfo: {
                  state: state,
                  ...this.state.stateResults[event.target.dataset.name],
                },
              });
            },
          };
        }
      });
  }

  componentDidMount() {
    this.initStateResults();
    this.handleStateCases();
    this.handleStateStock();
  }

  handleCalendarChange(event) {
    this.setState({
      startDate: event[0].format(dateFormat).toString(),
      endDate: event[1].format(dateFormat).toString(),
    });
    this.handleStateStock(event);
  }

  handleStateStock(event) {
    // event => null or the input from calendar
    let start = this.state.startDate;
    let end = this.state.endDate;
    if (event && event[0] && event[1]) {
      start = event[0].format(dateFormat).toString();
      end = event[1].format(dateFormat).toString();
    }
    getStateStock(start, end).then((res) => {
      // collect new state results
      const newStateResults = {};
      // only update the stock related info
      for (const info of res.results) {
        if (info["state"]) {
          newStateResults[info["state"]] = {
            ...this.state.stateResults[info["state"]],
            stockVolatility: info["volatility"].toFixed(3),
            fill: colorArray[
              ncaseRatioToColor(
                this.state.stateResults[info["state"]]["numConfirmedCasesRatio"]
              )
            ][volatilityToColor(info["volatility"])],
          };
        }
      }
      // set state to update the map for new stock info
      this.setState({
        stateResults: { ...this.state.stateResults, ...newStateResults },
      });
    });
  }

  handleStateCases(event) {
    let start = this.state.startDate;
    let end = this.state.endDate;
    if (event && event[0] && event[1]) {
      start = event[0].format(dateFormat).toString();
      end = event[1].format(dateFormat).toString();
    }
    getStateCases(start, end).then((res) => {
      // collect new state results
      const newStateResults = {};
      // only update the stock related info
      for (const info of res.results) {
        if (info["state"]) {
          newStateResults[info["state"]] = {
            ...this.state.stateResults[info["state"]],
            numConfirmedCases: info["ncase"],
            numConfirmedCasesRatio: info["ratio"].toFixed(3),
            fill: colorArray[ncaseRatioToColor(info["ratio"])][
              volatilityToColor(
                this.state.stateResults[info["state"]]["stockVolatility"]
              )
            ],
          };
        }
      }
      // set state to update the map for new stock info
      this.setState({
        stateResults: { ...this.state.stateResults, ...newStateResults },
      });
    });
  }

  goToStock() {
    // TO-DO
    window.location = `/stock`;
  }

  render() {
    return (
      <div id="test">
        <MenuBar />
        <Divider>
          <Form style={{ width: "80vw", margin: "0 auto", marginTop: "5vh" }}>
            <Row>
              <Space direction="vertical" size={1}>
                <label>Start to End Date</label>
                <RangePicker
                  defaultValue={[
                    moment("2020-03-01", dateFormat),
                    moment("2020-12-31", dateFormat),
                  ]}
                  format={dateFormat}
                  onCalendarChange={this.handleCalendarChange}
                />
              </Space>
            </Row>
          </Form>
        </Divider>
        <Divider>
          <div
            id="map"
            style={{ width: "70vw", margin: "0 auto", marginTop: "5vh" }}
          >
            <USAMap customize={this.state.stateResults} />
          </div>
        </Divider>
        <Divider>
          <div style={{ width: "30vw", margin: "0 auto", marginTop: "5vh" }}>
            {this.state.selectedStateInfo && (
              <Card>
                <CardBody>
                  <CardTitle>
                    <h3>{this.state.selectedStateInfo["state"]}</h3>
                  </CardTitle>
                  <Row gutter="30" align="middle" justify="center">
                    <Col>
                      Confirmed Cases:{" "}
                      {this.state.selectedStateInfo["numConfirmedCases"]} (n)
                    </Col>
                    <Col>
                      Normalized Ratio to Population:
                      {this.state.selectedStateInfo["numConfirmedCasesRatio"]}
                    </Col>
                  </Row>
                  {/* for stock */}
                  <Row gutter="30" align="middle" justify="center">
                    <Col>
                      Volatility:{" "}
                      {this.state.selectedStateInfo["stockVolatility"]}
                    </Col>
                    <Col>
                      {/* TO-DO: change to  {this.state.selectedStateInfo["companyCode"]} */}
                      Company: <a onClick={this.goToStock}>APPL</a>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            )}
          </div>
        </Divider>
      </div>
    );
  }
}

export default StatePage;
