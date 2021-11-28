import React from 'react';
//npm i react-loading
import ReactLoading from 'react-loading';
import { usePromiseTracker } from "react-promise-tracker";
// npm install react-promise-tracker --save
import { trackPromise } from 'react-promise-tracker';
import { Form, FormGroup } from "shards-react";
import { SearchOutlined } from '@ant-design/icons';
import moment from "moment";
// npm install antd-button-color
import Button from "antd-button-color";
import { DualAxes } from "@ant-design/charts";

import {
    Select,
    Row,
    Col,
    DatePicker,
    Space
} from 'antd'


import MenuBar from '../components/MenuBar';
import {getYelpCategories,
        getYelpState,
        getYelpTime,
        getYelpFilter } from '../fetcher'

const dateFormat = "YYYY-MM-DD";
const { RangePicker } = DatePicker;
var start = '';
var end = '';
const LoadingIndicator = props => {
    const { promiseInProgress } = usePromiseTracker();
    
    return (
        promiseInProgress && 
        <div style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}>
            <ReactLoading type={"spokes"} color={"blue"}   height={'20%'} width={'20%'} />
        </div>
    );  
}

const disabledDate = current => {
    return current < moment(start) || current > moment(end);
  };


const ReviewDiagram = (data) => {
var config = {
    data: [data.data, data.data],
    xField: "review_date",
    yField: ["review_count", "new_case"],
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

const StarDiagram = (data) => {
var config = {
    data: [data.data, data.data],
    xField: "review_date",
    yField: ["average_star", "new_case"],
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

class YelpPage extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            usstate: null,
            startTime: '',
            endTime: '',
            categories: null,
            yelpStateFilter: [],
            yelpCategoriesFilter: [],
            yelpResults: [],
            isFetching : true,
            disable: false,
            graph_review_name: '',
            graph_star_name: ''
        }

        this.handleStateChange = this.handleStateChange.bind(this)
        this.handleCategoreisChange = this.handleCategoreisChange.bind(this)
        this.handleSearch = this.handleSearch.bind(this)
        this.handleCalendarChange = this.handleCalendarChange.bind(this)
        this.handleClear = this.handleClear.bind(this)
    }
    handleStateChange(value) {
        this.setState({ usstate: value === undefined ? null :value })
    } 
    
    handleCategoreisChange(value) {
        this.setState({ categories: value === undefined ? null :value})
    }

    handleCalendarChange(event) {
        this.setState({
            startTime: event ? (event[0] ? event[0].format(dateFormat).toString():start) : start,
            endTime: event ? (event[1] ? event[1].format(dateFormat).toString():end) : end,
          });
    }

    handleSearch() {
        this.setState({
            disable: true,
            graph_review_name: '',
            graph_star_name: ''
         });
        trackPromise(
            getYelpFilter(this.state.startTime, this.state.endTime, this.state.usstate ? this.state.usstate:'',
             this.state.categories ? encodeURIComponent(this.state.categories):'').then(res => {
                this.setState({ yelpResults: res.results,
                                disable: false,
                                graph_review_name: "Review Count of " + 
                                        (this.state.usstate ? this.state.usstate:"All") + " state, " 
                                        + (this.state.categories ? this.state.categories:"All") + " categories, from "
                                        + (this.state.startTime !== '' ? this.state.startTime:start) + " to " 
                                        + (this.state.endTime !== '' ? this.state.endTime:end) + " V.S COVID-19",
                                graph_star_name: "Average Star of " + 
                                        (this.state.usstate ? this.state.usstate:"All") + " state, " 
                                        + (this.state.categories ? this.state.categories:"All") + " categories, from "
                                        + (this.state.startTime !== '' ? this.state.startTime:start) + " to " 
                                        + (this.state.endTime !== '' ? this.state.endTime:end) + " V.S COVID-19" })
            }) 
        )
       
    }

    handleClear(){
        // Array.from(document.querySelectorAll(".ant-select-single .ant-select-selector .ant-select-selection-item")).forEach(
        //     // console.log(input.innerText)
        //     input => (input.innerText = null)
        //   );
        this.setState({
            usstate: null,
            startTime: start,
            endTime: end,
            categories: null,
          });
    }
    
   
    componentDidMount() {
        this.setState({
            isFetching: true,
            disable: true
         });

        getYelpTime().then(res=>{
            this.setState({
                startTime: res.results[0].start_date,
                endTime:  res.results[0].end_date
              })
              start = this.state.startTime
              end = this.state.endTime
        })

        getYelpState().then(res=>{
            this.setState({yelpStateFilter: res.results.map(d => ({
                "value" : d.state,
                "label" : d.state
              }))})
        })


        getYelpCategories().then(res=>{
            this.setState({yelpCategoriesFilter: res.results.map(d => ({
                "value" : d.categories,
                "label" : d.categories
              }))
            })
        })

        
        getYelpFilter(this.state.startTime, this.state.endTime, this.state.usstate ? this.state.usstate:'',
            this.state.categories ? encodeURIComponent(this.state.categories):'').then(res => {
                 this.setState({ 
                     yelpResults: res.results
                    ,isFetching: false
                    ,usstate: null
                    ,categories: null
                    ,disable: false,
                    graph_review_name: "Review Count of " + 
                            (this.state.usstate ? this.state.usstate:"All") + " state, " 
                            + (this.state.categories ? this.state.categories:"All") + " categories from "
                            + (this.state.startTime !== '' ? this.state.startTime:start) + " to " 
                            + (this.state.endTime !== '' ? this.state.endTime:end) + " V.S COVID-19",
                    graph_star_name: "Average Star of " + 
                            (this.state.usstate ? this.state.usstate:"All") + " state, " 
                            + (this.state.categories ? this.state.categories:"All") + " categories, from "
                            + (this.state.startTime !== '' ? this.state.startTime:start) + " to " 
                            + (this.state.endTime !== '' ? this.state.endTime:end) + " V.S COVID-19" 
            })
        })
        
    }

    render() {
        // console.log(!this.state.isFetching)
        // console.log(this.state.yelpResults.length)
        let graph_review='';
        let graph_star='';
        if(!this.state.disable && !this.state.isFetching){
            graph_review = <ReviewDiagram data={this.state.yelpResults}/>;
            graph_star = <StarDiagram data={this.state.yelpResults}/>;
        }else{
            graph_review = "";
            graph_star = "";
        }
        
        if(!this.state.isFetching){
            return (

                <div>
                    <MenuBar />
                    <Form style={{ width: '80vw', margin: '0 auto', marginTop: '5vh' }}>
                        <Row>
                        
                            <Col><FormGroup style={{ width: '20vw', margin: '0 auto' }}> 
                                <h3>State</h3>
                                <Select showSearch  style={{width: 200}} allowClear
                                    disabled={this.state.disable}
                                    placeholder="Input State Name" 
                                    options={this.state.yelpStateFilter}
                                    value={this.state.usstate}
                                    onChange={this.handleStateChange} />
                                    
                            </FormGroup></Col>
                        </Row>
                        <Row>
                            <Col><FormGroup style={{ width: '20vw', margin: '0 auto' }}>
                                <h3>Categories</h3>
                                <Select showSearch  style={{width: 300}} allowClear
                                    disabled={this.state.disable}
                                    placeholder="Input Categoriesate Name" 
                                    options={this.state.yelpCategoriesFilter} 
                                    value={this.state.categories}
                                    onChange={this.handleCategoreisChange}/>
                            </FormGroup></Col>
                        </Row>
                    
                        <Row>
                                <Space direction="vertical" size={1}>
                                <h3>Date Range</h3>
                                <RangePicker
                                    defaultValue={[
                                        moment(this.state.startTime, dateFormat),
                                        moment(this.state.endTime, dateFormat),
                                    ]}
                                    disabledDate={disabledDate}
                                    disabled={this.state.disable}
                                    format={dateFormat}
                                    required
                                    onCalendarChange={this.handleCalendarChange}
                                    value={[
                                        moment(this.state.startTime, dateFormat),
                                        moment(this.state.endTime, dateFormat),
                                        ]}
                                />
                                </Space>
                        </Row>
                        
                        <br></br>
                        <Row>
                            <Col><FormGroup style={{ width: '10vw', margin: '0 auto' }}>
                                <Button type="primary" icon={<SearchOutlined />} disabled={this.state.disable} onClick={this.handleSearch}  height={'20%'} width={'20%'} >
                                    Search
                                </Button>
                            </FormGroup></Col>
                            <Col>
                                <Button danger onClick={this.handleClear} disabled={this.state.disable} height={'20%'} width={'20%'} >
                                    Clear
                                </Button>
                            
                            </Col>
                        </Row>
                        <LoadingIndicator/>
                        <br/>

                        <h5>{this.state.graph_review_name}</h5>
                        {graph_review}
                           
                        <br/>
                        
                        <h5>{this.state.graph_star_name}</h5>
                        {graph_star}
                    </Form>
                    
                </div>
            )
        }else{
            return(
                <div style={{display: 'flex',  justifyContent:'center', alignItems:'center', height: '100vh'}}>
                    <ReactLoading type={"spokes"} color={"blue"}   height={'20%'} width={'20%'} />
                </div>
                
                
            )
            
        }
    }
}

export default YelpPage
