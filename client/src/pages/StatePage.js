import React from "react";
import { Form, Card, CardBody, CardTitle, FormGroup } from "shards-react";
import { Divider, Row, Col, DatePicker, Space, Radio } from "antd";
import moment from "moment";
import MenuBar from "../components/MenuBar";
import { getAllStates, getStateVolatility, getStateCaseNorm } from "../fetcher";
import USAMap from "react-usa-map";
import { nColors, colorArray, MapLegend } from "../components/MapLegend";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";

const dateFormat = "YYYY-MM-DD";
const { RangePicker } = DatePicker;

// Radio Setting
const options = [
  { label: "Case", value: "Case" },
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
  /**
   * StateResults:
   *    {"state_abbreviation": {fill: colorArray[ncaseRatioToColor(ratio)][otherAttributeToColor(attr_value)],
   *                            numConfirmedCases: xxxx,
   *                            numConfirmedCasesRatio: xxxx,
   *                            case_related: xxx,
   *                            vote_related: xxx,
   *                            volatility: xxx,
   *                            yelp_related: xxx}}
   * Descriptions:
   *  - Each time, when the start & end time are updated, all state-wise statistics would be updated (fetched)
   *  - One axis of the map shows the numConfirmedCasesRatio
   *  - The other axis of the map shows the color defined by the Radio UI (currently, default to Stock)
   *  - Upon the change of the Radio UI, the color of the selected attribute would be set (replace the current one on the map)
   *  - No data would be re-fetched if the user only change the Radio
   */
  constructor(props) {
    super(props);
    console.log(props);
    this.state = {
      startDate: "2020-03-01",
      endDate: "2020-12-31",
      stateResults: {},
      allStates: {},
      selectedStateInfo: null,
      selectedTopic: "Stock",
      // The mapping from the Radio Value to the Attribute in stateResults[state]
      topicToAttribute: {
        Stock: "stockVolatility",
        Case: "",
        Vote: "",
        Yelp: "",
      },
      topicToColorFunc: {
        Stock: volatilityToColor,
        Case: "",
        Vote: "",
        Yelp: "",
      },
      topicToLegend: {
        Stock: "Volatility",
        Case: "Case",
        Vote: "Vote",
        Yelp: "Reviews",
      },
      legendLabels: { axis1: "Case", axis2: "Stock" },
    };

    this.handleStateStock = this.handleStateStock.bind(this);
    this.handleStateCases = this.handleStateCases.bind(this);
    this.handleCalendarChange = this.handleCalendarChange.bind(this);
    this.handleRadioChange = this.handleRadioChange.bind(this);
  }

  // UI
  handleCalendarChange(event) {
    if (event[0] && event[1]) {
      this.setState({
        startDate: event[0].format(dateFormat).toString(),
        endDate: event[1].format(dateFormat).toString(),
      });
      // update data
      // case
      // vote
      // stock
      this.handleStateStock(event);
      // yelp
    }
  }

  handleRadioChange(event) {
    this.setState({
      selectedTopic: event.target.value,
    });
    this.updateStateMapColor(event);
    this.setState({
      legendLabels: {
        axis1: "Case",
        axis2: this.state.topicToLegend[event.target.value],
      },
    });
  }

  updateStateMapColor(event) {
    // event comes from handleRadioChange
    let topic = this.state.selectedTopic;
    if (event) {
      topic = event.target.value;
    }
    let attr = this.state.topicToAttribute[topic];
    let attrColorFunc = this.state.topicToColorFunc[topic];

    if (attr && attrColorFunc) {
      // update the fill of each state in stateResults
      const newStateResults = {};
      for (const [state, info] of Object.entries(this.state.stateResults)) {
        if (
          state &&
          info &&
          info["numConfirmedCasesRatio"] >= 0 &&
          info[attr] >= 0
        ) {
          newStateResults[state] = {
            ...info,
            fill: colorArray[ncaseRatioToColor(info["numConfirmedCasesRatio"])][
              attrColorFunc(info[attr])
            ],
          };
        }
      }
      // set state to update the map for new stock info
      this.setState({
        stateResults: { ...this.state.stateResults, ...newStateResults },
      });
    }
  }

  initStateResults() {
    // set state abbreviations
    getAllStates()
      .then((res) => {
        const states = {};
        for (const obj of res.results) {
          // abbreviation: fullname
          states[obj["state"]] = obj["name"];
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
          // TODO: add other key-values for initialization
          // TODO: case, vote, yelp
        };
        // initialize with clickHandler for each state
        for (const [state, fullname] of Object.entries(this.state.allStates)) {
          this.state.stateResults[state] = {
            ...stateInfo,
            name: fullname,
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
    this.handleStateStock();
    this.handleStateCases();
  }

  handleStateStock(event) {
    // event: null or the input from calendar
    let startDate = this.state.startDate;
    let endDate = this.state.endDate;
    if (event && event[0] && event[1]) {
      startDate = event[0].format(dateFormat).toString();
      endDate = event[1].format(dateFormat).toString();
    }
    getStateVolatility(startDate, endDate).then((res) => {
      // collect new state results
      const newStateResults = {};
      // only update the stock related info
      for (const info of res.results) {
        if (info["state"]) {
          newStateResults[info["state"]] = {
            ...this.state.stateResults[info["state"]],
            stockVolatility: info["volatility"].toFixed(3),
          };
        }
      }
      // set state to update the map for new stock info
      this.setState({
        stateResults: { ...this.state.stateResults, ...newStateResults },
      });
      // update the color based on the Radio
      this.updateStateMapColor();
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
          };
        }
      }
      // set state to update the map for new stock info
      this.setState({
        stateResults: { ...this.state.stateResults, ...newStateResults },
      });
      // update the color based on the Radio
      this.updateStateMapColor();
    });
  }

  // fetch state vote
  handleStateVote() {}

  // fetch state yelp
  handleStateYelp() {}

  goToStock() {
    // TO-DO
    window.location = `/stock`;
  }

  componentDidMount() {
    this.initStateResults();
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
                onChange={this.handleRadioChange}
                value={this.state.selectedTopic}
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
          <MapLegend axis={this.state.legendLabels} />
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
                    <h5>
                      {this.state.selectedStateInfo["name"]} (
                      {this.state.selectedStateInfo["state"]})
                    </h5>
                  </CardTitle>
                  <Row style={{ marginTop: "15px" }}>
                    - There are{" "}
                    <span class="state-card-info">
                      {" "}
                      {this.state.selectedStateInfo["numConfirmedCases"]}{" "}
                    </span>
                    confirmed cases
                  </Row>
                  <Row style={{ marginTop: "15px" }}>
                    - Case related sentence{" "}
                    <a onClick={this.goToStock} class="state-card-goto">
                      <FontAwesomeIcon icon={faInfoCircle} />
                    </a>
                  </Row>
                  <Row style={{ marginTop: "15px" }}>
                    - Vote related sentence
                    <a onClick={this.goToStock} class="state-card-goto">
                      <FontAwesomeIcon icon={faInfoCircle} />
                    </a>
                  </Row>
                  <Row style={{ marginTop: "15px" }}>
                    - The average volatility is{" "}
                    <span class="state-card-info">
                      {this.state.selectedStateInfo["stockVolatility"]}
                    </span>
                    <a onClick={this.goToStock} class="state-card-goto">
                      <FontAwesomeIcon icon={faInfoCircle} />
                    </a>
                  </Row>
                  <Row style={{ marginTop: "15px" }}>
                    - Vote related sentence{" "}
                    <a onClick={this.goToStock} class="state-card-goto">
                      <FontAwesomeIcon icon={faInfoCircle} />
                    </a>
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
