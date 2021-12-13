import React from "react";
import { Form, Card, CardBody, CardTitle, FormGroup } from "shards-react";
import { Row, DatePicker, Space, Radio } from "antd";
import moment from "moment";
import MenuBar from "../components/MenuBar";
import {
  getAllStates,
  getStateVolatility,
  getStateCaseNorm,
  getYelpMap,
  getAllStateVax,
  getPercentVotes,
} from "../fetcher";
import USAMap from "react-usa-map";
import { nColors, colorArray, MapLegend } from "../components/MapLegend";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import ReactLoading from "react-loading";

const dateFormat = "YYYY-MM-DD";
const { RangePicker } = DatePicker;

// Radio Setting
const options = [
  { label: "Vax", value: "Vax" },
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

const numWinsToColor = (winRatio) => {
  const maxWinsRatio = 100.0;
  const color_index = Math.round(
    Math.min(winRatio, maxWinsRatio) * (nColors / maxWinsRatio)
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

// helper for yelp related info
const numReviewsToColor = (numReview) => {
  const maxNumReviews = 100;
  const color_index = Math.round(
    Math.min(numReview, maxNumReviews) * (nColors / maxNumReviews)
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
    this.state = {
      startDate: "2020-03-01",
      endDate: "2020-12-31",
      stateResults: {},
      allStates: {},
      selectedStateInfo: null,
      selectedTopic: "Vax",
      // The mapping from the Radio Value to the Attribute in stateResults[state]
      topicToAttribute: {
        Stock: "stockVolatility",
        Vax: "numVaccinatedRatio",
        Vote: "numWinsRatio",
        Yelp: "numReviews",
      },
      // The mapping from topic to specific color function
      topicToColorFunc: {
        Stock: volatilityToColor,
        Vax: ncaseRatioToColor,
        Vote: numWinsToColor,
        Yelp: numReviewsToColor,
      },
      // The mapping from topic to legend name
      topicToLegend: {
        Stock: "Volatility",
        Vax: "Vax",
        Vote: "Democrat",
        Yelp: "Reviews",
      },
      // default to case and stock
      legendLabels: { axis1: "Case", axis2: "Vax" },
      mapLoading: true,
    };

    this.handleCalendarChange = this.handleCalendarChange.bind(this);
    this.handleRadioChange = this.handleRadioChange.bind(this);
  }

  // UI
  async handleCalendarChange(event) {
    if (event && event[0] && event[1]) {
      this.setState({ mapLoading: true });
      this.setState({
        startDate: event[0].format(dateFormat).toString(),
        endDate: event[1].format(dateFormat).toString(),
      });
      // update data
      // case
      await this.handleStateResults(event);
      // plot
      this.updateStateMapColor();
      this.setState({ mapLoading: false });
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

  async initStateResults() {
    // set state abbreviations
    this.setState({ mapLoading: true });
    await getAllStates()
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
          numVaccinated: 0,
          numVaccinatedRatio: 0,
          numWins: 0,
          numWinsRatio: 0,
          numReviews: 0,
          fill: colorArray[0][0], // default color
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
    await this.handleStateResults();
    this.updateStateMapColor();
    this.setState({ mapLoading: false });
  }

  // this method fetches all the needed info from the DB
  async handleStateResults(event) {
    let startDate = this.state.startDate;
    let endDate = this.state.endDate;
    if (event && event[0] && event[1]) {
      startDate = event[0].format(dateFormat).toString();
      endDate = event[1].format(dateFormat).toString();
    }
    // get case obj
    const caseInfo = await getStateCaseNorm(startDate, endDate).then((res) => {
      // collect new state results
      const newStateResults = {};
      // only update the stock related info
      for (const info of res.results) {
        if (info["state"]) {
          newStateResults[info["state"]] = {
            numConfirmedCases: info["new_case"],
            numConfirmedCasesRatio: info["norm_ratio"].toFixed(3),
          };
        }
      }
      return newStateResults;
    });
    // get stock obj
    const stockInfo = await getStateVolatility(startDate, endDate).then(
      (res) => {
        // collect new state results
        const newStateResults = {};
        // only update the stock related info
        for (const info of res.results) {
          if (info["state"]) {
            newStateResults[info["state"]] = {
              stockVolatility: info["volatility"].toFixed(3),
            };
          }
        }
        return newStateResults;
      }
    );
    // get yelp obj
    const yelpInfo = await getYelpMap(startDate, endDate).then((res) => {
      // collect new state results
      const newStateResults = {};
      // only update the stock related info
      for (const info of res.results) {
        if (info["state"]) {
          newStateResults[info["state"]] = {
            numReviews: info["review_count"],
          };
        }
      }
      return newStateResults;
    });

    // get vote obj
    const voteInfo = await getPercentVotes("1976", "2020", "Democrat").then(
      (res) => {
        // collect new state results
        const newStateResults = {};
        // only update the stock related info
        for (const info of res.results) {
          if (info["state_abbreviation"]) {
            newStateResults[info["state_abbreviation"]] = {
              numWins: info["num_candidates"],
              numWinsRatio: info["percent_vote"],
            };
          }
        }
        return newStateResults;
      }
    );
    // get vaccination obj
    const vacInfo = await getAllStateVax(startDate, endDate).then((res) => {
      // collect new state results
      const newStateResults = {};
      // only update the stock related info
      for (const info of res.results) {
        if (info["state"]) {
          newStateResults[info["state"]] = {
            numVaccinated: info["num_vaccinated"],
            numVaccinatedRatio: info["norm_num_vaccinated"],
          };
        }
      }
      return newStateResults;
    });

    // merge
    const mergedStateResults = {};
    for (const [state, fullname] of Object.entries(this.state.allStates)) {
      mergedStateResults[state] = {
        ...this.state.stateResults[state],
        ...stockInfo[state],
        ...caseInfo[state],
        ...yelpInfo[state],
        ...vacInfo[state],
        ...voteInfo[state],
      };
    }

    this.setState({ stateResults: mergedStateResults });
  }

  goToStock() {
    window.location = `/stock`;
  }
  goToYelp(state, start, end) {
    //if state not exist in yelp data(yelp data only contains 31 state data), it will show all state stats
    window.location =
      `/yelp?state=` + state + `&start=` + start + `&end=` + end;
  }
  goToVote() {
    window.location = `/vote`;
  }
  goToCOVID() {
    window.location = `/covid`;
  }

  componentDidMount() {
    this.initStateResults();
  }

  render() {
    return (
      <div>
        <MenuBar />

        <Form
          style={{
            width: "80vw",
            margin: "0 auto",
            marginTop: "5vh",
          }}
        >
          <Row>
            <FormGroup style={{ width: "25vw", margin: "5 auto" }}>
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
                style={{ width: "20vw", margin: "5 auto" }}
              />
            </FormGroup>
          </Row>
        </Form>

        <div
          id="map"
          style={{ width: "70vw", margin: "0 auto", marginTop: "5vh" }}
        >
          {this.state.mapLoading && (
            <div
              style={{
                position: "relative",
                top: "250px",
                left: "450px",
                height: 0,
              }}
            >
              <ReactLoading
                type={"bars"}
                color={"#FEFEE8"}
                height={50}
                width={70}
              />
            </div>
          )}
          <USAMap customize={this.state.stateResults} />
          <MapLegend axis={this.state.legendLabels} />
          <div
            style={{
              width: "40vw",
              height: 300,
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
                    -{" "}
                    <span class="state-card-info">
                      {" "}
                      {this.state.selectedStateInfo["numVaccinated"]}{" "}
                    </span>{" "}
                    people have received at least one shot of a vaccine{" "}
                    <a
                      onClick={(event) => this.goToCOVID()}
                      class="state-card-goto"
                    >
                      <FontAwesomeIcon icon={faInfoCircle} />
                    </a>
                  </Row>
                  <Row style={{ marginTop: "15px" }}>
                    - The Democrat wins{" "}
                    <span class="state-card-info">
                      {" "}
                      {this.state.selectedStateInfo["numWinsRatio"]}{" "}
                    </span>{" "}
                    % of the elections in 1976 - 2020.
                    <a
                      onClick={(event) => this.goToVote()}
                      class="state-card-goto"
                    >
                      <FontAwesomeIcon icon={faInfoCircle} />
                    </a>
                  </Row>
                  <Row style={{ marginTop: "15px" }}>
                    - The average volatility is{" "}
                    <span class="state-card-info">
                      {this.state.selectedStateInfo["stockVolatility"]}
                    </span>
                    <a
                      onClick={(event) => this.goToStock()}
                      class="state-card-goto"
                    >
                      <FontAwesomeIcon icon={faInfoCircle} />
                    </a>
                  </Row>
                  <Row style={{ marginTop: "15px" }}>
                    - There are{" "}
                    <span class="state-card-info">
                      {this.state.selectedStateInfo["numReviews"]}
                    </span>{" "}
                    reviews!
                    <a
                      onClick={(event) =>
                        this.goToYelp(
                          this.state.selectedStateInfo["state"],
                          this.state.startDate,
                          this.state.endDate
                        )
                      }
                      class="state-card-goto"
                    >
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


