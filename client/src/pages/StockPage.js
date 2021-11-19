import React from "react";
import { Form, FormInput, FormGroup, Button } from "shards-react";

import { Row, Col, DatePicker, Space, Divider, Table, Spin } from "antd";

import moment from "moment";

import { DualAxes } from "@ant-design/charts";

import MenuBar from "../components/MenuBar";
import { getCaseAndStock, getAllStocks, getStocks } from "../fetcher";

const dateFormat = "YYYY-MM-DD";
const { RangePicker } = DatePicker;
const default_period = ["2020-01-01", "2020-12-31"];

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
      code: "",
      usstate: "",
      industry: "",
      threshold: "",
      corr: "",
      startDate: default_period[0],
      endDate: default_period[1],
      stockTableResults: [],
      selectedStockInfo: null,
      selectedStockSeries: [],
      tableLoading: true,
    };
    this.handleCodeChange = this.handleCodeChange.bind(this);
    this.handleStateChange = this.handleStateChange.bind(this);
    this.handleCalendarChange = this.handleCalendarChange.bind(this);
    this.handleThresholdChange = this.handleThresholdChange.bind(this);
    this.handleCorrelationChange = this.handleCorrelationChange.bind(this);
    this.updateSearchResults = this.updateSearchResults.bind(this);
    this.updateSelectedStock = this.updateSelectedStock.bind(this);
  }

  handleCodeChange(event) {
    this.setState({ code: event.target.value });
  }

  handleStateChange(event) {
    this.setState({ usstate: event.target.value });
  }

  handleCalendarChange(event) {
    if (event) {
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

  componentDidMount() {
    this.setState({ tableLoading: true });
    getAllStocks().then((res) => {
      this.setState({ stockTableResults: res.results });
      this.setState({ tableLoading: false });
    });

    // getCaseAndStock(
    //   this.state.code,
    //   this.state.usstate,
    //   this.state.startDate,
    //   this.state.endDate
    // ).then((res) => {
    //   this.setState({ stockResults: res.results });
    // });
  }

  render() {
    return (
      <div>
        <MenuBar />
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
                <label>Start to End Date</label>
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
        <Divider />

        <div
          style={{
            width: "80vw",
            height: "25vw",
            margin: "auto auto",
            marginTop: "5vh",
          }}
        >
          {this.state.selectedStockInfo && (
            <div>
              <h3>{this.state.selectedStockInfo["name"]}</h3>
              <h6>
                Volatility:{" "}
                {this.state.selectedStockInfo["volatility"].toFixed(3)}
              </h6>
              <h6>
                Pearson r:{" "}
                {this.state.selectedStockInfo["r_with_new_case"].toFixed(3)}
              </h6>
              <StockDualAxes data={this.state.selectedStockSeries} />
            </div>
          )}
        </div>
        <Divider />
      </div>
    );
  }
}

export default StockPage;
