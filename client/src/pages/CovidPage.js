import React from "react";
import { render } from "react-dom";

// COVID PAGE
import {
  Form,
  FormInput,
  FormGroup,
  Button,
  Card,
  CardBody,
  CardTitle,
} from "shards-react";

import { Row, Col, DatePicker, Space, Divider, Table } from "antd";

import moment from "moment";

import { DualAxes, Column } from "@ant-design/charts";

import MenuBar from "../components/MenuBar";
import {
  getCovidData,
  getCaseAndVax,
  getCovidSeason,
  getCaseAndVaxCulm,
} from "../fetcher";

import * as d3 from "d3";

const dateFormat = "YYYY-MM-DD";
const { RangePicker } = DatePicker;
const default_period = ["2020-01-01", "2021-12-31"];

const nIndustryColors = 11;
const colorScaler = d3
  .scaleLinear()
  .range(["#e8e8e8", "#5ac8c8"])
  .domain([0, nIndustryColors - 1]);

let industryColorArray = [];
for (let i = 0; i < nIndustryColors; i++) {
  industryColorArray[i] = colorScaler(i);
}

const stateColumns = [
  {
    title: "State",
    dataIndex: "state",
    key: "state",
    sorter: (a, b) => a.state.localeCompare(b.state),
  },
  {
    title: "Total Confirmed Cases (to-date)",
    dataIndex: "conf_cases",
    key: "conf_cases",
    sorter: (a, b) => a.conf_cases - b.conf_cases,
  },
  {
    title: "Average Confirmed Cases per day",
    dataIndex: "avg_conf_cases",
    key: "avg_conf_cases",
    sorter: (a, b) => a.avg_conf_cases - b.avg_conf_cases,
  },
  {
    title: "Total Probable Cases (to-date)",
    dataIndex: "tot_prob_cases",
    key: "tot_prob_cases",
    sorter: (a, b) => a.tot_prob_cases - b.tot_prob_cases,
  },
  {
    title: "Average Probable Cases per day",
    dataIndex: "avg_prob_cases",
    key: "avg_prob_cases",
    sorter: (a, b) => a.avg_prob_cases - b.avg_prob_cases,
  },
  {
    title: "Total Confirmed Deaths (to-date)",
    dataIndex: "tot_death",
    key: "tot_death",
    sorter: (a, b) => a.tot_death - b.tot_death,
  },
  {
    title: "Average Confirmed Deaths, per day ",
    dataIndex: "avg_death",
    key: "avg_death",
    sorter: (a, b) => a.avg_death - b.avg_death,
  },
];

const CovidDualAxes = (data) => {
  var config = {
    data: [data.data, data.data],
    xField: "date",
    yField: ["vaxs", "new_case"],
    width: "100px",
    geometryOptions: [
      {
        geometry: "line",
        smooth: true,
        color: "#5B8FF9",
        label: {
          formatter: function formatter(datum) {
            return "";
          },
        },
        lineStyle: {
          lineWidth: 3,
          lineDash: [5, 5],
        },
      },
      {
        geometry: "line",
        smooth: true,
        color: "#5AD8A6",
        lineStyle: {
          lineWidth: 4,
          opacity: 0.5,
        },
        label: {
          formatter: function formatter(datum) {
            return "";
          },
        },
        point: {
          shape: "circle",
          size: 4,
          style: {
            opacity: 0.5,
            stroke: "#5AD8A6",
            fill: "#fff",
          },
        },
      },
    ],
  };
  return <DualAxes {...config} />;
};

//Bar Chart
const DemoColumn = (res) => {
  const data = res.data;
  /**
   * [{
   *  state: 'NY',
   *  attr: val
   * }]
   */
  const config = {
    data,
    isGroup: true,
    xField: "season",
    yField: "cases",
    seriesField: "year",

    label: {
      position: "middle",
      layout: [
        {
          type: "interval-adjust-position",
        },
        {
          type: "interval-hide-overlap",
        },
        {
          type: "adjust-color",
        },
      ],
    },
    meta: {
      state: {
        alias: "State",
      },
      volatility: {
        alias: "Volatility",
      },
    },
  };
  return <Column {...config} />;
};

class CovidPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      code: "",
      usstate: "",
      industry: "",
      threshold: 0.0,
      startDate: default_period[0],
      endDate: default_period[1],
      covidTableResults: [],
      selectedCovidInfo: null, // use this for graph
      selectedCOVID_VAX: [], // use this for graph
      selectedCOVID_VAX2: [], // use this for graph

      tableLoading: true,
      allIndustries: [],
      industryToColor: {},
      stateIndustryResults: {},
      // for second section (explore state vs. industry)
      industryStartDate: default_period[0],
      industryEndDate: default_period[1],
      mapLoading: true,
      demoData: [],
    };
    this.handleCodeChange = this.handleCodeChange.bind(this);
    this.handleStateChange = this.handleStateChange.bind(this);
    this.handleCalendarChange = this.handleCalendarChange.bind(this);
    this.updateSearchResults = this.updateSearchResults.bind(this);
    this.updateSelectedCOVID = this.updateSelectedCOVID.bind(this);
    this.updateSelectedCOVID2 = this.updateSelectedCOVID2.bind(this);

    this.updateSeasonResults = this.updateSeasonResults.bind(this);
  }

  handleCodeChange(event) {
    this.setState({ code: event.target.value });
  }

  handleStateChange(event) {
    this.setState({ usstate: event.target.value });
  }

  handleCalendarChange(event) {
    if (event && event[0] && event[1]) {
      this.setState({
        startDate: event[0].format(dateFormat).toString(),
        endDate: event[1].format(dateFormat).toString(),
      });
    }
  }

  updateSearchResults() {
    this.setState({ tableLoading: true });
    getCovidData(
      this.state.startDate,
      this.state.endDate,
      this.state.code
    ).then((res) => {
      this.setState({ covidTableResults: res.results });
      this.setState({ tableLoading: false });
    });
  }

  // for demo purpose
  updateSeasonResults(rowRecord) {
    getCovidSeason(rowRecord["state"]).then((res) => {
      this.setState({ demoData: res.results });
    });
  }

  updateSelectedCOVID(rowRecord) {
    getCaseAndVax(
      rowRecord["state"],
      this.state.startDate,
      this.state.endDate
    ).then((res) => {
      this.setState({ selectedCovidInfo: rowRecord });
      this.setState({ selectedCOVID_VAX: res.results });
    });
  }

  updateSelectedCOVID2(rowRecord) {
    getCaseAndVaxCulm(
      rowRecord["state"],
      this.state.startDate,
      this.state.endDate
    ).then((res) => {
      this.setState({ selectedCovidInfo: rowRecord });
      this.setState({ selectedCOVID_VAX2: res.results });
    });
  }

  componentDidMount() {
    this.setState({ tableLoading: true });
    getCovidData(default_period[0], default_period[1]).then((res) => {
      this.setState({ covidTableResults: res.results });
      this.setState({ tableLoading: false });
    });
  }

  render() {
    return (
      <div>
        <MenuBar />
        <Card>
          <CardBody>
            <CardTitle>
              <div
                style={{ width: "80vw", margin: "0 auto", marginTop: "2vh" }}
              >
                <h3>Deep Dive Into Covid Data</h3>
                <div style={{ fontSize: "13.5px", fontWeight: "normal" }}>
                  Select a state from the table below to see more in-depth data
                </div>
              </div>
            </CardTitle>
            <Form style={{ width: "80vw", margin: "0 auto", marginTop: "5vh" }}>
              <Row>
                <Col flex={2}>
                  <FormGroup style={{ width: "15vw", margin: "5 auto" }}>
                    <label>State</label>
                    <FormInput
                      placeholder="e.g. CA"
                      value={this.state.code}
                      onChange={this.handleCodeChange}
                    />
                  </FormGroup>
                </Col>
                <Col flex={2}>
                  <Space
                    direction="vertical"
                    size={1}
                    style={{ width: "20vw", margin: "5 auto" }}
                  >
                    <label>Data Range</label>
                    <RangePicker
                      defaultValue={[
                        moment(default_period[0], dateFormat),
                        moment(default_period[1], dateFormat),
                      ]}
                      format={dateFormat}
                      onCalendarChange={this.handleCalendarChange}
                    />
                  </Space>
                </Col>
              </Row>
              <Row>
                <Col flex={2}>
                  <FormGroup style={{ width: "15vw", margin: "5 auto" }}>
                    <Button
                      style={{ marginTop: "3vh", margin: "5 auto" }}
                      onClick={this.updateSearchResults}
                    >
                      Search
                    </Button>
                  </FormGroup>
                </Col>
              </Row>
            </Form>
            <Divider />
            <Table
              onRow={(record, rowIndex) => {
                return {
                  onClick: (event) => {
                    this.updateSelectedCOVID(record);
                    this.updateSelectedCOVID2(record);
                    this.updateSeasonResults(record);
                  },
                };
              }}
              columns={stateColumns}
              dataSource={this.state.covidTableResults}
              loading={this.state.tableLoading}
              pagination={{
                pageSizeOptions: [5, 10],
                defaultPageSize: 5,
                showQuickJumper: true,
              }}
              style={{ width: "80vw", margin: "0 auto", marginTop: "2vh" }}
            />
            {this.state.selectedCovidInfo && (
              <div>
                <div
                  style={{
                    width: "80vw",
                    margin: "auto auto",
                  }}
                >
                  <h4>
                    Data for:{" "}
                    <span style={{ color: "blue" }}>
                      {" "}
                      {this.state.selectedCovidInfo["state"]}{" "}
                    </span>
                  </h4>
                  <h5> New Cases & Daily Vaccine Administrations: </h5>
                  <CovidDualAxes data={this.state.selectedCOVID_VAX} />
                  <br />
                  <h5> New Cases & Cumulative Vaccine Administrations: </h5>
                  <CovidDualAxes data={this.state.selectedCOVID_VAX2} />
                  <h5>
                    <br />
                    New Cases & The Seasons{" "}
                    <DemoColumn data={this.state.demoData} />
                  </h5>
                </div>
              </div>
            )}
            <div></div>

          </CardBody>
        </Card>
      </div>
    );
  }
}

export default CovidPage;
