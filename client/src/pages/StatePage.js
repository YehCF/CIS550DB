import React from "react";
import { Form, Card, CardBody, CardTitle, FormGroup } from "shards-react";
import { Divider, Row, Col, DatePicker, Space, Radio } from "antd";
import moment from "moment";
import MenuBar from "../components/MenuBar";
import { getAllStates, getStateVolatility, getStateCaseNorm } from "../fetcher";
import USAMap from "react-usa-map";
import { nColors, colorArray, MapLegend } from "../components/MapLegend";

const dateFormat = "YYYY-MM-DD";
const { RangePicker } = DatePicker;

// Radio Setting
const options = [
  { label: "Case", value: "case" },
  { label: "Vote", value: "Vote" },
  { label: "Stock", value: "Stock" },
  { label: "Yelp", value: "Yelp" },
];

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
    getStateVolatility(start, end).then((res) => {
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
    getStateCaseNorm(start, end).then((res) => {
      // collect new state results
      const newStateResults = {};
      // only update the stock related info
      for (const info of res.results) {
        if (info["state"]) {
          newStateResults[info["state"]] = {
            ...this.state.stateResults[info["state"]],
            numConfirmedCases: info["new_case"],
            numConfirmedCasesRatio: info["norm_ratio"].toFixed(3),
            fill: colorArray[ncaseRatioToColor(info["norm_ratio"])][
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
      <div>
        <MenuBar />
        <Form style={{ width: "80vw", margin: "0 auto", marginTop: "5vh" }}>
          <Row>
            <FormGroup style={{ width: "15vw", margin: "5 auto" }}>
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
            </FormGroup>
          </Row>
          <Row>
            <FormGroup style={{ width: "15vw", margin: "5 auto" }}>
              <label>Topic</label>
              <Radio.Group
                options={options}
                // onChange={this
                value="Stock"
                optionType="button"
                buttonStyle="solid"
              />
            </FormGroup>
          </Row>
        </Form>
        <div
          id="map"
          style={{ width: "70vw", margin: "0 auto", marginTop: "5vh" }}
        >
          <USAMap customize={this.state.stateResults} />
          <MapLegend axis={{ axis1: "case", axis2: "volatility" }} />
          <div
            style={{
              width: "25vw",
              height: 200,
              margin: "auto auto",
              marginTop: "1vh",
            }}
          >
            {this.state.selectedStateInfo && (
              <Card>
                <CardBody>
                  <CardTitle style={{ textAlign: "center" }}>
                    <h4>{this.state.selectedStateInfo["state"]}</h4>
                  </CardTitle>
                  <Row style={{ marginTop: "15px" }}>
                    - There are{" "}
                    {this.state.selectedStateInfo["numConfirmedCases"]}{" "}
                    confirmed cases
                  </Row>
                  <Row style={{ marginTop: "15px" }}>
                    - Case related sentence
                  </Row>
                  <Row style={{ marginTop: "15px" }}>
                    - Vote related sentence
                  </Row>
                  <Row style={{ marginTop: "15px" }}>
                    - The average volatility is{" "}
                    {this.state.selectedStateInfo["stockVolatility"]}
                    <a onClick={this.goToStock} style={{ color: "blue" }}>
                      (learn more)
                    </a>
                  </Row>
                  <Row style={{ marginTop: "15px" }}>
                    - Vote related sentence
                  </Row>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default StatePage;

// {/* for stock */}
// <Row gutter="30" align="middle" justify="center">
// <Col>
//   Volatility:{" "}
//   {this.state.selectedStateInfo["stockVolatility"]}
// </Col>
// <Col>
//   {/* TO-DO: change to  {this.state.selectedStateInfo["companyCode"]} */}
//   Company: <a onClick={this.goToStock}>APPL</a>
// </Col>
// </Row>
