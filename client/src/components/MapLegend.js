import React from "react";
import * as d3 from "d3";
import rd3 from "react-d3-library";

//Color array for Bivariate Choropleth Map
const h = 100;
const w = 100;
const nColors = 6;
const node = document.createElement("div");
const svgLegend = d3
  .select(node)
  .append("svg")
  .attr("width", w)
  .attr("height", h)
  .attr("transform", "rotate(230)")
  .attr("style", "position: relative; top: -200px; left: 420px;");

const data = d3.range(nColors).reduce(function (arr, elem) {
  return arr.concat(
    d3.range(nColors).map(function (d) {
      return {
        col: elem,
        row: d,
      };
    })
  );
}, []);
const scale1 = d3
  .scaleLinear()
  .range(["#e8e8e8", "#5ac8c8"])
  .domain([0, nColors - 1]);
const scale2 = d3
  .scaleLinear()
  .range(["#e8e8e8", "#be64ac"])
  .domain([0, nColors - 1]);
let colorArray = [];
for (let i = 0; i < nColors; i++) {
  let subArray = [];
  for (let j = 0; j < nColors; j++) {
    subArray[j] = d3.scaleLinear().range([scale1(j), scale2(i)])(0.5);
  }
  colorArray[i] = subArray;
}
const rects = svgLegend
  .selectAll(null)
  .data(data)
  .enter()
  .append("rect")
  .attr("x", (d) => (d.col * w) / nColors)
  .attr("y", (d) => (d.row * h) / nColors)
  .attr("width", w / nColors)
  .attr("height", h / nColors)
  .attr("fill", function (d) {
    return colorArray[d.col][d.row];
  });

const RD3Component = rd3.Component;

class MapLegend extends React.Component {
  constructor(props) {
    super(props);
    this.state = { d3: "" };
  }

  componentDidMount() {
    this.setState({ d3: svgLegend.node() });
  }

  render() {
    return (
      <div>
        <RD3Component data={this.state.d3} />
      </div>
    );
  }
}

export { nColors, colorArray, MapLegend };
