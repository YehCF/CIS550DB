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
import { Row, Col, DatePicker, Space, Divider, Table, Slider} from "antd";
import moment from "moment";
import ReactLoading from "react-loading";
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
    getPartyCounts,
    getPopulousVotes
} from "../fetcher";

import * as d3 from "d3";

const dateFormat = "YYYY-MM-DD";
const { RangePicker } = DatePicker;
const default_period = ["1976", "2020"];

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

const marks = {
    1976: '1976',
    1980: '1980',
    1990: '1990',
    2000: '2000',
    2010: '2010',
    2020: '2020'
};

const populousColumns = [
    {
        title: "Party",
        dataIndex: "party_detailed",
        key: "party_detailed",
        sorter: (a, b) => a.party_detailed.localeCompare(b.party_detailed),
    },
    {
        title: "Least Populous Votes",
        dataIndex: "least_populous_count",
        key: "least_populous_count",
        sorter: (a, b) => a.least_populous_count - b.least_populous_count
    },
    {
        title: "Most Populous Votes",
        dataIndex: "most_populous_count",
        key: "most_populous_count",
        sorter: (a, b) => a.most_populous_count - b.most_populous_count
    }
]

class VotingPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            minyear: 1976,
            maxyear: 2020,
            limitPopulous: 5,
            resultsPopulous: [],
            selectedState: "",
            tableLoading: false,
        }
        this.handleYearChange = this.handleYearChange.bind(this);
        this.handleLimitChange = this.handleLimitChange.bind(this);
        this.updatePopulousResults = this.updatePopulousResults.bind(this);
    }

    handleYearChange(event){
        if (event[0] && event[1]) {
            this.setState( {
                minyear : event[0],
                maxyear: event[1]
            });
            getPopulousVotes(event[0], event[1], this.state.limitPopulous).then((res)=>{
                this.setState({resultsPopulous: res.results});
            })
        }
    }

    handleLimitChange(event){
        this.setState({limitPopulous: event.target.value});
    }

    updatePopulousResults(event){
        getPopulousVotes(this.state.minyear, this.state.maxyear, this.state.limitPopulous).then((res)=>{
            console.log(res.results);
            this.setState({resultsPopulous: res.results});
        })
    }

    componentDidMount() {
        getPopulousVotes(this.state.minyear, this.state.maxyear, this.state.limitPopulous).then((res) =>{
            this.setState({resultsPopulous: res.results});
        });
    }

    render() {
        return (
            <div>
                <MenuBar />
                <Card>
                    <CardBody style={{backgroundColor: '#f7f7f7'}}>
                        <CardTitle>
                            <div style={{ width: "80vw", margin: "auto auto", marginTop: "3vh"}}>
                                <h3>Overall Year Selection</h3>
                            </div>
                        </CardTitle>
                        <Slider style = {{ width: "80vw", margin: "0 auto", marginTop: "5vh", marginBottom: "5vh", color: '#dedede'}} range defaultValue={[1976, 2020]} min={1976} max={2020} marks={marks} onChange={this.handleYearChange}></Slider>

                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <CardTitle>
                            <div style={{ width: "80vw", margin: "auto auto", marginTop: "3vh"}}>
                                <h3>Populous vs. Least Populous States</h3>
                            </div>
                        </CardTitle>
                        <div style={{ width: "80vw", margin: "auto auto", marginTop: "3vh"}}>
                            <p>TO DO: add description here</p>
                        </div>
                        <Form style={{ width: "80vw", margin: "0 auto", marginTop: "5vh" }}>
                            <Row>
                                <Col flex={2}>
                                    <FormGroup style={{ width: "15vw", margin: "5 auto" }}>
                                        <label>Value of k</label>
                                        <FormInput
                                            placeholder="e.g., 5"
                                            value={this.state.limitPopulous}
                                            onChange={this.handleLimitChange}
                                        />
                                    </FormGroup>
                                </Col>

                                <Col flex={2}>
                                    <FormGroup style={{ width: "15vw", margin: "5 auto" }}>
                                        <Button
                                            style={{ marginTop: "3vh", margin: "5 auto" }}
                                            onClick={this.updatePopulousResults}
                                        >
                                            Apply
                                        </Button>
                                    </FormGroup>
                                </Col>
                            </Row>
                        </Form>
                        <Table
                            columns={populousColumns}
                            dataSource={this.state.resultsPopulous}
                            loading={this.state.tableLoading}
                            pagination={{
                                pageSizeOptions: [5, 10],
                                defaultPageSize: 5,
                                showQuickJumper: true,
                            }}
                            style={{ width: "80vw", margin: "0 auto", marginTop: "2vh" }}
                        />
                    </CardBody>
                </Card>


            </div>
        );
    }
}

export default VotingPage;
