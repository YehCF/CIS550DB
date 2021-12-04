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
import { Column, Line} from "@ant-design/charts";
import { Row, Col, Table, Slider, Select} from "antd";
import ReactLoading from "react-loading";
import USAMap from "react-usa-map";
import MenuBar from "../components/MenuBar";
import {
    getPopulousVotes,
    getPercentVotes,
    getLeastMostVotes,
    getCompanyPolitical
} from "../fetcher";
import * as d3 from "d3";
import rd3 from "react-d3-library";
import {Legend} from "chart.js";

/**Set up our drop-down menus*/
const { Option } = Select;

/**The marks we add to our year slider: extremities and every 10 years*/
const marks = {
    1976: '1976',
    1980: '1980',
    1990: '1990',
    2000: '2000',
    2010: '2010',
    2020: '2020'
};

/**Create an array of colors that we'll use for the map*/
const npercentColors = 101;
const colorScaler = d3
    .scaleLinear()
    .range(["#f7f7f7", "#b40404"])
    .domain([0, npercentColors - 1]);
let percentColorArray = [];
for (let i = 0; i < npercentColors; i++) {
    percentColorArray[i] = colorScaler(i);
}

/**Maps a percentage onto a color by indexing into the array created above*/
const percentToColor = (percentage) => {
    return percentColorArray[Math.floor(percentage)];
};

// Categorical Map Legend with D3
const industryLegend = [
    "0%",
    "10%",
    "20%",
    "30%",
    "40%",
    "50%",
    "60%",
    "70%",
    "80%",
    "90%",
    "100%",
];
const percentColorReduced = [
    percentColorArray[0],
    percentColorArray[10],
    percentColorArray[20],
    percentColorArray[30],
    percentColorArray[40],
    percentColorArray[50],
    percentColorArray[60],
    percentColorArray[70],
    percentColorArray[80],
    percentColorArray[90],
    percentColorArray[100],
]
const node = document.createElement("div");
const svgLegend = d3
    .select(node)
    .append("svg")
    .attr("width", 300)
    .attr("height", 600)
    .attr("style", "position: relative; top: -550px; left: 950px;");
const data = d3.range(11).reduce(function (arr, elem) {
    return arr.concat(
        d3.range(11).map(function (d) {
            return {
                col: elem,
            };
        })
    );
}, []);
svgLegend
    .selectAll(null)
    .data(data)
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", (d) => d.col * 50)
    .attr("width", 30)
    .attr("height", 30)
    .attr("fill", function (d) {
        return percentColorReduced[d.col];
    });
svgLegend
    .selectAll(null)
    .data(data)
    .enter()
    .append("text")
    .attr("x", 40)
    .attr("y", (d) => d.col * 50 + 20)
    .text(function (d) {
        return industryLegend[d.col];
    });

const RD3Component = rd3.Component;
class CategoricalMapLegend extends React.Component {
    constructor(props) {
        super(props);
        this.state = { d3: "" };
    }

    componentDidMount() {
        this.setState({ d3: svgLegend.node() });
    }

    render() {
        return <RD3Component data={this.state.d3} />;
    }
}




/**The Bar Chart we'll use to look at populous vs. not populous states*/
const PopulousBarChart = (res) => {
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

/**The Line Chart we'll use to look at company distribution across states*/
const CompanyLineChart = (res) => {
    //sort by x-axis values (years) so that we have clear lines
    const data = res.data.sort((a,b)=> a.year - b.year);
    const config = {
        data,
        // the data is grouped by party -- we want a different line for each one
        isGroup: true,
        xField: "year",
        yField: "num_companies",
        seriesField: "party_detailed",

    }
    return <Line {...config} />;
}

/**The columns for the percent table underneath our map: state name, number of candidates, and percent of candidates*/
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

/**The columns for the least vs. most voted party table: party name, number of elections with the least votes, and number of
 * elections with the most votes*/
const leastMostColumns = [
    {
        title: "Party Name",
        dataIndex: "party_detailed",
        key: "party_detailed",
        sorter: (a, b) => a.party_detailed.localeCompare(b.party_detailed)
    },
    {
        title: "Elections with Least Votes",
        dataIndex: "least_elections",
        key: "least_elections",
        sorter: (a, b) => a.least_elections - b.least_elections
    },
    {
        title: "Elections Won",
        dataIndex: "most_elections",
        key: "most_elections",
        sorter: (a, b) => a.most_elections - b.most_elections
    }
]

class VotingPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            //by default, we look at all years in the data
            minyear: 1976,
            maxyear: 2020,
            // k = 5 and party = democrat by default
            limitPopulous: 5,
            currentParty: "DEMOCRAT",
            //by default, do not filter by states
            currentState: "ALL",
            // the results
            resultsPopulous: [],
            resultsPercents: {},
            resultsRankedCandidates: [],
            resultsMostLeastVotes: [],
            resultsCompanies: [],
            // booleans to check whether our tables are loading or not
            tableLoading1: true,
            tableLoading2: true,
        }
        this.handleYearChange = this.handleYearChange.bind(this);
        this.handleLimitChange = this.handleLimitChange.bind(this);
        this.handlePartyChange = this.handlePartyChange.bind(this);
        this.handleStateChange = this.handleStateChange.bind(this);
        this.updatePopulousResults = this.updatePopulousResults.bind(this);
        this.updatePercentResults = this.updatePercentResults.bind(this);
        this.updateMostLeastResults = this.updateMostLeastResults.bind(this);
        this.updateMostLeastResults = this.updateMostLeastResults.bind(this);
        this.updateCompanyResults = this.updateCompanyResults.bind(this);
   }

    /**Handler function that is called when the slider at the top of the page is adjusted*/
    handleYearChange(event){
        if (event[0] && event[1]) {
            // once we've updated the years, we need to update all the other information, since the whole page is year-based
            this.setState( {
                minyear : event[0],
                maxyear: event[1]
            }, ()=>{
                this.updatePopulousResults();
                this.updatePercentResults();
                this.updateMostLeastResults();
                this.updateCompanyResults();
            });
        }
    }

    /**Handler function called when the party visualized on the map changes*/
    handlePartyChange(event){
        this.setState(
            {currentParty: event},
            // once the party has been updated, we need to update the map and the table
            ()=>{this.updatePercentResults()});
    }

    /**Handler function called when the limit (k) is changed on the populous state card*/
    handleLimitChange(event){
        this.setState({limitPopulous: event.target.value});
    }

    /**Handler function called when the state currently under consideration for the wins/losses table is changed*/
    handleStateChange(event){
        this.setState(
            {currentState: event},
            // once the state has been updated, we need to update the table as well
            ()=> {this.updateMostLeastResults()});
    }

    /**Update the results of percent votes that are rendered on the map and the table below*/
    updatePercentResults(event){
        // don't show the results until everything is done loading
        this.setState({tableLoading1: true}, ()=>{
            getPercentVotes(this.state.minyear, this.state.maxyear, this.state.currentParty).then((res)=>{
                    //get the mappings of percentages to colors for the map and create a JSON in the format needed for the map
                    let newPercents = {};
                    for (const obj of res.results){
                        newPercents[obj["state_abbreviation"]] = {
                            percent: obj.percent_vote,
                            fill: percentToColor(obj.percent_vote)
                        }
                    }
                    // store the results for the map and the table, and allow them to be shown
                    this.setState({
                        resultsPercents: newPercents,
                        resultsRankedCandidates: res.results,
                        tableLoading1: false
                    })
                }
            )
        });
    }

    /**Update the results of elections in the most vs. least populous states*/
    updatePopulousResults(event){
        getPopulousVotes(this.state.minyear, this.state.maxyear, this.state.limitPopulous).then((res)=>{
            // we need to re-format the data for the bar graph by splitting up the most and least populous objects and adding k to the labels
            var newGraphRes = []
            var i = 0;
            for (const obj of res.results){
                newGraphRes[i] = {party_detailed: obj.party_detailed, count_type: `${this.state.limitPopulous} Least Populous States`, count: obj.least_populous_count}
                newGraphRes[i + 1] = {party_detailed: obj.party_detailed, count_type: `${this.state.limitPopulous} Most Populous States`, count: obj.most_populous_count}
                i += 2;
            }
            this.setState({resultsPopulous: newGraphRes});
        })
    }

    /**Update the results of the parties that got the most losses and wins*/
    updateMostLeastResults(event){
        // don't display the results until the new data is loaded
        this.setState({tableLoading2: true}, ()=>{
            getLeastMostVotes(this.state.minyear, this.state.maxyear, this.state.currentState).then((res)=>{
                this.setState({resultsMostLeastVotes: res.results, tableLoading2: false})
            })
        })
    }

    /**Update the results of the parties of states where comapnies are located*/
    updateCompanyResults(event){
        getCompanyPolitical(this.state.minyear, this.state.maxyear).then((res)=>{
            this.setState({resultsCompanies: res.results});
        })
    }

    /**When the component mounts, get all the relevant data and render it*/
    componentDidMount() {
        this.updatePopulousResults();
        this.updatePercentResults();
        this.updateMostLeastResults();
        this.updateCompanyResults();
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
                            {this.state.tableLoading1 && (
                                <div style={{display: "flex", justifyContent: "center", height: 0,}}>
                                    <ReactLoading type={"spokes"} color={"blue"} height={25} width={25}/>
                                </div>
                            )}
                            <USAMap customize={this.state.resultsPercents}/>
                            <CategoricalMapLegend />
                        </Container>
                        <div style={{ width: "80vw", margin: "0 auto", marginTop: "5vh" }}>
                            <h4>How many {this.state.currentParty.toLowerCase()} candidates did each state send to the Senate between {this.state.minyear} and {this.state.maxyear}?</h4>
                        </div>
                        <Table
                            columns={percentColumns}
                            dataSource={this.state.resultsRankedCandidates}
                            loading={this.state.table1Loading}
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
                            <PopulousBarChart data={this.state.resultsPopulous} />
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <CardTitle>
                            <div style={{ width: "80vw", margin: "auto auto", marginTop: "3vh", marginBottom: "3vh"}}>
                                <h3> 🏅 Who got the Most and Least Votes? </h3>
                            </div>
                        </CardTitle>
                        <div style={{ width: "80vw", margin: "auto auto", marginTop: "3vh", marginBottom: "3vh"}}>
                            The number of elections for which each party got either the most or least votes out of any party in the election.
                            Optionally, filter by state by selecting one from the menu below.
                        </div>
                        <div style={{ width: "80vw", margin: "auto auto", marginTop: "3vh", marginBottom: "3vh"}}>
                            <Select defaultValue="ALL" style={{ width: 500 }} onChange={this.handleStateChange}>
                                <Option value="ALL">All States</Option>
                                <Option value="AL">Alabama</Option>
                                <Option value="AK">Alaska</Option>
                                <Option value="AZ">Arizona</Option>
                                <Option value="AR">Arkansas</Option>
                                <Option value="CA">California</Option>
                                <Option value="CO">Colorado</Option>
                                <Option value="CT">Connecticut</Option>
                                <Option value="DE">Delaware</Option>
                                <Option value="FL">Florida</Option>
                                <Option value="GA">Georgia</Option>
                                <Option value="HI">Hawaii</Option>
                                <Option value="ID">Idaho</Option>
                                <Option value="IL">Illinois</Option>
                                <Option value="IN">Indiana</Option>
                                <Option value="IA">Iowa</Option>
                                <Option value="KS">Kansas</Option>
                                <Option value="KY">Kentucky</Option>
                                <Option value="LA">Louisiana</Option>
                                <Option value="ME">Maine</Option>
                                <Option value="MD">Maryland</Option>
                                <Option value="MA">Massachusetts</Option>
                                <Option value="MI">Michigan</Option>
                                <Option value="MN">Minnesota</Option>
                                <Option value="MS">Mississippi</Option>
                                <Option value="MO">Missouri</Option>
                                <Option value="MT">Montana</Option>
                                <Option value="NE">Nebraska</Option>
                                <Option value="NV">Nevada</Option>
                                <Option value="NH">New Hampshire</Option>
                                <Option value="NJ">New Jersey</Option>
                                <Option value="NM">New Mexico</Option>
                                <Option value="NY">New York</Option>
                                <Option value="NC">North Carolina</Option>
                                <Option value="ND">North Dakota</Option>
                                <Option value="OH">Ohio</Option>
                                <Option value="OK">Oklahoma</Option>
                                <Option value="OR">Oregon</Option>
                                <Option value="PA">Pennsylvania</Option>
                                <Option value="RI">Rhode Island</Option>
                                <Option value="SC">South Carolina</Option>
                                <Option value="SD">South Dakota</Option>
                                <Option value="TN">Tennessee</Option>
                                <Option value="TX">Texas</Option>
                                <Option value="UT">Utah</Option>
                                <Option value="VT">Vermont</Option>
                                <Option value="VA">Virginia</Option>
                                <Option value="WA">Washington</Option>
                                <Option value="WV">West Virginia</Option>
                                <Option value="WI">Wisconsin</Option>
                                <Option value="WY">Wyoming</Option>
                            </Select>
                        </div>
                        <Table
                            columns={leastMostColumns}
                            dataSource={this.state.resultsMostLeastVotes}
                            loading={this.state.tableLoading2}
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
                            <div style={{ width: "80vw", margin: "auto auto", marginTop: "3vh", marginBottom: "3vh"}}>
                                <h3> 💸 Do Companies Prefer Red or Blue States? </h3>
                            </div>
                        </CardTitle>
                        <div style={{ width: "80vw", margin: "auto auto", marginTop: "3vh", marginBottom: "3vh"}}>
                            <p> This graph shows the number of companies located in states that elected each party between {this.state.minyear} and {this.state.maxyear}. </p>
                        </div>
                        <div style={{ width: "80vw", margin: "0 auto", marginTop: "5vh" , marginBottom: "5vh"}}>
                            <CompanyLineChart data={this.state.resultsCompanies} />
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    }
}
export default VotingPage;
