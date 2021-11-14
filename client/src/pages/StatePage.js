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
import { getAllStates, getStateStock } from "../fetcher";
import USAMap from "react-usa-map";
import colormap from "colormap";

const dateFormat = "YYYY-MM-DD";
const { RangePicker } = DatePicker;

// colors on the map
const numberOfColors = 15;

const colors = colormap({
  colormap: "portland",
  nshades: numberOfColors + 1,
  format: "hex",
  alpha: 1.0,
});

// helper for stock related info
const volatilityToColor = (volatility) => {
  const maxVolatilityRatio = 1.2;
  volatility = Math.round(
    Math.min(volatility, maxVolatilityRatio) *
      (numberOfColors / maxVolatilityRatio)
  );
  return colors[volatility];
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
          ncase: 0,
          fill: colors[0],
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
        newStateResults[info["state"]] = {
          ...this.state.stateResults[info["state"]],
          stockVolatility: info["volatility"].toFixed(3),
          fill: volatilityToColor(info["volatility"]),
        };
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
