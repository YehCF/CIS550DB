import React from "react";
import { Form, FormInput, FormGroup } from "shards-react";

import { Row, Col, DatePicker, Space } from "antd";

import moment from "moment";

import { DualAxes } from "@ant-design/charts";

import MenuBar from "../components/MenuBar";
import { getCaseAndStock } from "../fetcher";

const dateFormat = "YYYY-MM-DD";
const { RangePicker } = DatePicker;

const DemoDualAxes = (data) => {
  var config = {
    data: [data.data, data.data],
    xField: "date",
    yField: ["price", "new_case"],
    geometryOptions: [
      {
        geometry: "line",
        smooth: false,
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
      code: "AAPL",
      startDate: "2020-03-01",
      endDate: "2020-12-31",
      stockResults: [],
      usstate: "CA",
    };
    this.handleCodeChange = this.handleCodeChange.bind(this);
    this.handleStateChange = this.handleStateChange.bind(this);
    this.handleCalendarChange = this.handleCalendarChange.bind(this);
  }

  handleCodeChange(event) {
    this.setState({ code: event.target.value });
    getCaseAndStock(
      event.target.value,
      this.state.usstate,
      this.state.startDate,
      this.state.endDate
    ).then((res) => {
      this.setState({ stockResults: res.results });
    });
  }

  handleStateChange(event) {
    this.setState({ usstate: event.target.value });
    getCaseAndStock(
      this.state.code,
      event.target.value,
      this.state.startDate,
      this.state.endDate
    ).then((res) => {
      console.log(res.results);
      this.setState({ stockResults: res.results });
    });
  }

  handleCalendarChange(event) {
    this.setState({
      startDate: event[0].format(dateFormat).toString(),
      endDate: event[1].format(dateFormat).toString(),
    });
    getCaseAndStock(
      this.state.code,
      this.state.usstate,
      event[0].format(dateFormat).toString(),
      event[1].format(dateFormat).toString()
    ).then((res) => {
      this.setState({ stockResults: res.results });
    });
  }

  componentDidMount() {
    getCaseAndStock(
      this.state.code,
      this.state.usstate,
      this.state.startDate,
      this.state.endDate
    ).then((res) => {
      this.setState({ stockResults: res.results });
    });
  }

  render() {
    return (
      <div>
        <MenuBar />
        <Form style={{ width: "80vw", margin: "0 auto", marginTop: "5vh" }}>
          <Row>
            <Col>
              <FormGroup style={{ width: "20vw", margin: "5 auto" }}>
                <label>Company Code</label>
                <FormInput
                  placeholder="AAPL"
                  value={this.state.code}
                  onChange={this.handleCodeChange}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col>
              <FormGroup style={{ width: "20vw", margin: "5 auto" }}>
                <label>State</label>
                <FormInput
                  placeholder="CA"
                  value={this.state.usstate}
                  onChange={this.handleStateChange}
                />
              </FormGroup>
            </Col>
          </Row>
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
        <div
          style={{
            width: "80vw",
            height: "20vw",
            margin: "0 auto",
            marginTop: "5vh",
          }}
        >
          Price & New Cases
          <DemoDualAxes data={this.state.stockResults} />
        </div>
      </div>
    );
  }
}

export default StockPage;
