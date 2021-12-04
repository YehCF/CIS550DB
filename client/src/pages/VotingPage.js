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
import { DualAxes, Column } from "@ant-design/charts";
import { Row, Col, DatePicker, Space, Divider, Table, Slider, Select} from "antd";
import moment from "moment";
import ReactLoading from "react-loading";
import USAMap from "react-usa-map";
import MenuBar from "../components/MenuBar";
import {
    getPopulousVotes,
    getPercentVotes
} from "../fetcher";

import * as d3 from "d3";
import {nColors, colorArray, MapLegend} from "../components/MapLegend";

const nIndustryColors = 100;
const { Option } = Select;
const colorScaler = d3
    .scaleLinear()
    .range(["#f7f7f7", "#b40404"])
    .domain([0, nIndustryColors - 1]);
let industryColorArray = [];
for (let i = 0; i < nIndustryColors; i++) {
    industryColorArray[i] = colorScaler(i);
}

const percentToColor = (volatility) => {
    return industryColorArray[Math.floor(Math.max(0, volatility-1))];
};





/**The Bar Chart we'll use to Look at Populations*/
const DemoColumn = (res) => {
    //sort the data alphabetically so the x axis always stays in the same order
    const data = res.data.sort((a, b) => a.party_detailed.localeCompare(b.party_detailed));
    const config = {
        data,
        //grouped data by the count type (least vs. most populous states)
        isGroup: true,
        xField: "party_detailed",
        yField: "count",
        seriesField: "count_type",
        // label is to show the y value in each bar
        label: {
            position: "top",
            style: {
                fill: "black",
                opacity: 0.6,
            },
        },
        //autorotate x-axis labels so that we don't end up cutting them off
        xAxis: {
            label: {
                autoHide: false,
                autoRotate: true,
            },
        },
    };
    return <Column {...config} />;
};



const marks = {
    1976: '1976',
    1980: '1980',
    1990: '1990',
    2000: '2000',
    2010: '2010',
    2020: '2020'
};


const percentColumns = [
    {
        title: "State Name",
        dataIndex: "name",
        key: "name",
        sorter: (a, b) => a.name.localeCompare(b.name)
    },
    {
        title: "Number of Candidates",
        dataIndex: "num_candidates",
        key: "num_candidates",
        sorter: (a, b) => a.num_candidates - b.num_candidates
    },
    {
        title: "Percent of Candidates",
        dataIndex: "percent_vote",
        key: "percent_vote",
        sorter: (a, b) => a.percent_vote - b.percent_vote
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
            resultsPopGraph: [],
            currentParty: "DEMOCRAT",
            resultsPercents: {},
            resultsRankedCandidates: [],
            //not yet used
            selectedState: "",
            tableLoading: false,
        }
        this.handleYearChange = this.handleYearChange.bind(this);
        this.handleLimitChange = this.handleLimitChange.bind(this);
        this.handlePartyChange = this.handlePartyChange.bind(this);
        this.updatePopulousResults = this.updatePopulousResults.bind(this);
        this.updatePercentResults = this.updatePercentResults.bind(this);
   }

    handleYearChange(event){
        if (event[0] && event[1]) {
            this.setState( {
                minyear : event[0],
                maxyear: event[1]
            }, ()=>{
                this.updatePopulousResults();
                this.updatePercentResults();
            });

        }
    }

    handleLimitChange(event){
        this.setState({limitPopulous: event.target.value});
    }

    handlePartyChange(event){
        this.setState({currentParty: event}, ()=>{this.updatePercentResults()});
    }

    updatePopulousResults(event){
        getPopulousVotes(this.state.minyear, this.state.maxyear, this.state.limitPopulous).then((res)=>{
            var newGraphRes = []
            var i = 0;
            for (const obj of res.results){
                newGraphRes[i] = {party_detailed: obj.party_detailed, count_type: `${this.state.limitPopulous} Least Populous States`, count: obj.least_populous_count}
                newGraphRes[i + 1] = {party_detailed: obj.party_detailed, count_type: `${this.state.limitPopulous} Most Populous States`, count: obj.most_populous_count}
                i += 2;
            }
            this.setState({resultsPopulous: res.results, resultsPopGraph: newGraphRes});
        })
    }

    // initPercentResults(event){
    //     getPercentVotes(this.state.minyear, this.state.maxyear, this.state.currentParty).then((res)=>{
    //         for (const obj of res.results){
    //             this.state.resultsPercents[obj["state_abbreviation"]] = {
    //                 percent: obj.percent_vote,
    //                 fill: percentToColor(obj.percent_vote)
    //             }
    //         }
    //         console.log(this.state.resultsPercents)
    //     })
    // }

    updatePercentResults(event){
        getPercentVotes(this.state.minyear, this.state.maxyear, this.state.currentParty).then((res)=>{
            let newPercents = {};
            for (const obj of res.results){
                newPercents[obj["state_abbreviation"]] = {
                    percent: obj.percent_vote,
                    fill: percentToColor(obj.percent_vote)
                }
            }
            this.setState({
                resultsPercents: newPercents,
                resultsRankedCandidates: res.results
            })
            }
        )
    }

    componentDidMount() {
        this.updatePopulousResults();
        this.updatePercentResults();
    }

    render() {
        return (
            <div>
                <MenuBar />
                <Card>
                    <CardBody style={{backgroundColor: '#f7f7f7'}}>
                        <CardTitle>
                            <div style={{ width: "80vw", margin: "auto auto", marginTop: "3vh"}}>
                                <h3>Explore Elections</h3>
                            </div>
                        </CardTitle>
                        <div style={{ width: "80vw", margin: "auto auto", marginTop: "3vh"}}>
                            <p>Pick a year range! You are currently considering senate election data between years {this.state.minyear} and {this.state.maxyear}.</p>
                        </div>
                        <Slider style = {{ width: "80vw", margin: "0 auto", marginTop: "5vh", marginBottom: "5vh", color: '#dedede'}} range defaultValue={[1976, 2020]} min={1976} max={2020} marks={marks} onChange={this.handleYearChange}></Slider>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <CardTitle>
                            <div style={{ width: "80vw", margin: "auto auto", marginTop: "3vh"}}>
                                <h3> 🇺🇸 Pick a Party!</h3>
                            </div>
                        </CardTitle>
                        <div style={{ width: "80vw", margin: "0 auto", marginTop: "5vh" }}>
                            <p>Select a party from the menu below to learn more about its popularity across states!</p>
                        <Select defaultValue="DEMOCRAT" style={{ width: 500 }} onChange={this.handlePartyChange}>
                            <Option value="DEMOCRAT">Democrat</Option>
                            <Option value="REPUBLICAN">Republican</Option>
                            <Option value="INDEPENDENT">Independent</Option>
                            <Option value="DEMOCRATIC-FARMER-LABOR">Democratic Farmer Labor</Option>
                            <Option value="DEMOCRATIC-NONPARTISAN LEAGUE">Democratic-Nonpartisan League</Option>
                            <Option value="CONNECTICUT FOR LIEBERMAN">Connecticut for Lieberman</Option>
                            <Option value="INDEPENDENT FOR MAINE">Independent for Maine</Option>
                        </Select>
                        </div>
                        <Container
                            style={{
                                width: "80vw",
                                margin: "auto auto",
                                marginTop: "5vh",
                                marginBottom: "5vh",
                                alignItems: "center",
                            }}>
                            <USAMap customize={this.state.resultsPercents}/>
                        </Container>
                        <div style={{ width: "80vw", margin: "0 auto", marginTop: "5vh" }}>
                            <h4>How many {this.state.currentParty.toLowerCase()} candidates did each state send to the Senate between {this.state.minyear} and {this.state.maxyear}?</h4>
                        </div>
                        <Table
                            columns={percentColumns}
                            dataSource={this.state.resultsRankedCandidates}
                            // loading={this.state.tableLoading}
                            pagination={{
                                pageSizeOptions: [5, 10],
                                defaultPageSize: 5,
                                showQuickJumper: true,
                            }}
                            style={{ width: "80vw", margin: "0 auto", marginTop: "2vh" }}
                        />
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <CardTitle>
                            <div style={{ width: "80vw", margin: "auto auto", marginTop: "3vh"}}>
                                <h3> 🏙️ Most Populous  vs. Least Populous States </h3>
                            </div>
                        </CardTitle>

                        <Form style={{ width: "80vw", margin: "0 auto", marginTop: "5vh" }}>
                            <Row>
                                <Col flex={2}>
                                    <FormGroup style={{ width: "15vw", margin: "5 auto" }}>
                                        <p> Compare how the k most-populous and k least-populous states have voted between {this.state.minyear} and {this.state.maxyear}.
                                            Specify k in the box to the right!</p>
                                    </FormGroup>
                                </Col>
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
                        <div style={{ width: "80vw", margin: "0 auto", marginTop: "5vh" }}>
                            <DemoColumn data={this.state.resultsPopGraph} />
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <CardTitle>
                            <div style={{ width: "80vw", margin: "auto auto", marginTop: "3vh"}}>
                                <h3> Parties that Lose and Win the Most </h3>
                            </div>
                        </CardTitle>
                    </CardBody>
                </Card>
            </div>
        );
    }
}

export default VotingPage;
