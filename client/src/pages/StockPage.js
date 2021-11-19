import React from "react";
import {
  Form,
  FormInput,
  FormGroup,
  Button,
  Card,
  CardBody,
  CardTitle,
  Container,
} from "shards-react";

import { Row, Col, DatePicker, Space, Divider, Table } from "antd";

import moment from "moment";

import { DualAxes } from "@ant-design/charts";

import USAMap from "react-usa-map";

import MenuBar from "../components/MenuBar";
import {
  getCaseAndStock,
  getAllStocks,
  getStocks,
  getAllIndustries,
  getAllStates,
  getStateIndustry,
} from "../fetcher";

import * as d3 from "d3";

const dateFormat = "YYYY-MM-DD";
const { RangePicker } = DatePicker;
const default_period = ["2020-01-01", "2020-12-31"];

const nIndustryColors = 11;
const colorScaler = d3
  .scaleLinear()
  .range(["#e8e8e8", "#5ac8c8"])
  .domain([0, nIndustryColors - 1]);
let industryColorArray = [];
for (let i = 0; i < nIndustryColors; i++) {
  industryColorArray[i] = colorScaler(i);
}
console.log(industryColorArray);

const stockColumns = [
  {
    title: "Code",
    dataIndex: "code",
    key: "code",
    sorter: (a, b) => a.code.localeCompare(b.code),
  },
  {
    title: "Company",
    dataIndex: "name",
    key: "name",
    sorter: (a, b) => a.name.localeCompare(b.name),
  },
  {
    title: "Industry",
    dataIndex: "industry",
    key: "industry",
    sorter: (a, b) => a.industry.localeCompare(b.industry),
  },
  {
    title: "Volatility",
    dataIndex: "volatility",
    key: "volatility",
    sorter: (a, b) => a.volatility - b.volatility,
  },
  {
    title: "Max Price",
    dataIndex: "max_price",
    key: "max_price",
    sorter: (a, b) => a.max_price - b.max_price,
  },
  {
    title: "Min Price",
    dataIndex: "min_price",
    key: "min_price",
    sorter: (a, b) => a.min_price - b.min_price,
  },
  {
    title: "Max Volume",
    dataIndex: "max_volume",
    key: "max_volume",
    sorter: (a, b) => a.max_volume - b.max_volume,
  },
  {
    title: "Min Volume",
    dataIndex: "min_volume",
    key: "min_volume",
    sorter: (a, b) => a.min_volume - b.min_volume,
  },
  {
    title: "Corr With New Case",
    dataIndex: "r_with_new_case",
    key: "r_with_new_case",
    sorter: (a, b) => a.r_with_new_case - b.r_with_new_case,
  },
];

const StockDualAxes = (data) => {
  var config = {
    data: [data.data, data.data],
    xField: "date",
    yField: ["price", "new_case"],
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

class StockPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // for first section (explore stock vs. case)
      code: "",
      usstate: "",
      industry: "",
      threshold: 0.0,
      corr: 0.0,
      startDate: default_period[0],
      endDate: default_period[1],
      stockTableResults: [],
      selectedStockInfo: null,
      selectedStockSeries: [],
      tableLoading: true,
      allIndustries: [],
      industryToColor: {},
      stateIndustryResults: {},
      // for second section (explore state vs. industry)
      industryStartDate: default_period[0],
      industryEndDate: default_period[1],
      industryThreshold: 0.5,
    };
    this.handleCodeChange = this.handleCodeChange.bind(this);
    this.handleStateChange = this.handleStateChange.bind(this);
    this.handleCalendarChange = this.handleCalendarChange.bind(this);
    this.handleThresholdChange = this.handleThresholdChange.bind(this);
    this.handleCorrelationChange = this.handleCorrelationChange.bind(this);
    this.updateSearchResults = this.updateSearchResults.bind(this);
    this.updateSelectedStock = this.updateSelectedStock.bind(this);
    this.handleIndustryCalendarChange =
      this.handleIndustryCalendarChange.bind(this);
    this.handleIndustryThresholdChange =
      this.handleIndustryThresholdChange.bind(this);
    this.updateStateIndustryResults =
      this.updateStateIndustryResults.bind(this);
  }

  handleCodeChange(event) {
    this.setState({ code: event.target.value });
  }

  handleStateChange(event) {
    this.setState({ usstate: event.target.value });
  }

  handleCalendarChange(event) {
    if (event[0] && event[1]) {
      this.setState({
        startDate: event[0].format(dateFormat).toString(),
        endDate: event[1].format(dateFormat).toString(),
      });
    }
  }

  handleThresholdChange(event) {
    this.setState({ threshold: event.target.value });
  }
  handleCorrelationChange(event) {
    this.setState({ corr: event.target.value });
  }

  updateSearchResults() {
    this.setState({ tableLoading: true });
    getStocks(
      this.state.code,
      this.state.usstate,
      this.state.startDate,
      this.state.endDate,
      this.state.industry,
      this.state.threshold,
      this.state.corr
    ).then((res) => {
      console.log(res.results);
      this.setState({ stockTableResults: res.results });
      this.setState({ tableLoading: false });
    });
  }

  updateSelectedStock(rowRecord) {
    getCaseAndStock(
      rowRecord.code,
      null,
      this.state.startDate,
      this.state.endDate
    ).then((res) => {
      this.setState({ selectedStockInfo: rowRecord });
      this.setState({ selectedStockSeries: res.results });
    });
  }

  initIndustries() {
    getAllIndustries()
      .then((res) => {
        for (const obj of res.results) {
          this.state.allIndustries.push(obj["industry"]);
        }
      })
      .then((res) => {
        // map color
        for (let i = 0; i < this.state.allIndustries.length; i++) {
          this.state.industryToColor[this.state.allIndustries[i]] =
            industryColorArray[i];
        }
      });
  }

  initStateIndustryResults() {
    getAllStates().then((res) => {
      // this.state.stateIndustryResults
      // format: {"NY": {"industry": (string)}, "CA": {"industry": (string)}, ...}
      for (const obj of res.results) {
        if (obj["state"]) {
          this.state.stateIndustryResults[obj["state"]] = {
            industry: this.state.allIndustries[0],
            fill: this.state.industryToColor[this.state.allIndustries[0]],
          };
        }
      }
    });
  }

  handleIndustryThresholdChange(event) {
    this.setState({ industryThreshold: event.target.value });
  }
  handleIndustryCalendarChange(event) {
    if (event[0] && event[1]) {
      this.setState({
        industryStartDate: event[0].format(dateFormat).toString(),
        industryEndDate: event[1].format(dateFormat).toString(),
      });
    }
  }

  updateStateIndustryResults() {
    getStateIndustry(
      this.state.industryStartDate,
      this.state.industryEndDate,
      this.state.industryThreshold
    ).then((res) => {
      let newStateIndustryResults = {};
      for (const obj of res.results) {
        if (obj["state"]) {
          newStateIndustryResults[obj["state"]] = {
            industry: obj["industry"],
            fill: this.state.industryToColor[obj["industry"]],
          };
        }
      }
      this.setState({
        stateIndustryResults: {
          ...this.state.stateIndustryResults,
          ...newStateIndustryResults,
        },
      });
    });
    console.log("inn");
  }

  componentDidMount() {
    this.setState({ tableLoading: true });
    getAllStocks().then((res) => {
      this.setState({ stockTableResults: res.results });
      this.setState({ tableLoading: false });
    });
    this.initIndustries();
    this.initStateIndustryResults();
    this.updateStateIndustryResults();
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
                <h3>Explore Stock & Case Correlations</h3>
              </div>
            </CardTitle>
            <Form style={{ width: "80vw", margin: "0 auto", marginTop: "5vh" }}>
              <Row>
                <Col flex={2}>
                  <FormGroup style={{ width: "15vw", margin: "5 auto" }}>
                    <label>Company Code</label>
                    <FormInput
                      placeholder="e.g., AAPL"
                      value={this.state.code}
                      onChange={this.handleCodeChange}
                    />
                  </FormGroup>
                </Col>
                <Col flex={2}>
                  <FormGroup style={{ width: "15vw", margin: "5 auto" }}>
                    <label>State</label>
                    <FormInput
                      placeholder="e.g., CA"
                      value={this.state.usstate}
                      onChange={this.handleStateChange}
                    />
                  </FormGroup>
                </Col>
                <Col flex={2}>
                  <Space
                    direction="vertical"
                    size={1}
                    style={{ width: "20vw", margin: "5 auto" }}
                  >
                    <label>Period</label>
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
                    <label>Volatility Threshold</label>
                    <FormInput
                      placeholder="e.g., 0.5"
                      value={this.state.threshold}
                      onChange={this.handleThresholdChange}
                    />
                  </FormGroup>
                </Col>
                <Col flex={3}>
                  <FormGroup style={{ width: "15vw", margin: "5 auto" }}>
                    <label>Correlation Threshold</label>
                    <FormInput
                      placeholder="e.g., 0.5"
                      value={this.state.corr}
                      onChange={this.handleCorrelationChange}
                    />
                  </FormGroup>
                </Col>
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
                    this.updateSelectedStock(record);
                  },
                };
              }}
              columns={stockColumns}
              dataSource={this.state.stockTableResults}
              loading={this.state.tableLoading}
              pagination={{
                pageSizeOptions: [5, 10],
                defaultPageSize: 5,
                showQuickJumper: true,
              }}
              style={{ width: "80vw", margin: "0 auto", marginTop: "2vh" }}
            />
            {this.state.selectedStockInfo && (
              <div>
                <div
                  style={{
                    width: "80vw",
                    margin: "auto auto",
                  }}
                >
                  <h3>{this.state.selectedStockInfo["name"]}</h3>
                  <h6>
                    Volatility: {this.state.selectedStockInfo["volatility"]}
                  </h6>
                  <h6>
                    Pearson r: {this.state.selectedStockInfo["r_with_new_case"]}
                  </h6>
                  <StockDualAxes data={this.state.selectedStockSeries} />
                </div>
              </div>
            )}
            {/* <div>
          <Divider />
        </div> */}
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <CardTitle>
              <div
                style={{ width: "80vw", margin: "auto auto", marginTop: "3vh" }}
              >
                <h3>Explore Volatile Industry</h3>
              </div>
            </CardTitle>
            <Form style={{ width: "80vw", margin: "0 auto", marginTop: "5vh" }}>
              <Row>
                <Col flex={2}>
                  <FormGroup style={{ width: "15vw", margin: "5 auto" }}>
                    <label>Volatility Threshold</label>
                    <FormInput
                      placeholder="e.g., 0.5"
                      value={this.state.industryThreshold}
                      onChange={this.handleIndustryThresholdChange}
                    />
                  </FormGroup>
                </Col>
                <Col flex={2}>
                  <Space
                    direction="vertical"
                    size={1}
                    style={{ width: "20vw", margin: "5 auto" }}
                  >
                    <label>Period</label>
                    <RangePicker
                      defaultValue={[
                        moment(default_period[0], dateFormat),
                        moment(default_period[1], dateFormat),
                      ]}
                      format={dateFormat}
                      onCalendarChange={this.handleIndustryCalendarChange}
                    />
                  </Space>
                </Col>
                <Col flex={2}>
                  <FormGroup style={{ width: "15vw", margin: "5 auto" }}>
                    <Button
                      style={{ marginTop: "3vh", margin: "5 auto" }}
                      onClick={this.updateStateIndustryResults}
                    >
                      Apply
                    </Button>
                  </FormGroup>
                </Col>
              </Row>
            </Form>
            <Container
              id="map"
              style={{
                width: "80vw",
                margin: "auto auto",
                marginTop: "5vh",
                alignItems: "center",
              }}
            >
              <USAMap customize={this.state.stateIndustryResults} />
            </Container>
          </CardBody>
        </Card>
      </div>
    );
  }
}

export default StockPage;
