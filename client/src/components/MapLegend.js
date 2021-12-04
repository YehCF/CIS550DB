import React from "react";
import * as d3 from "d3";
import rd3 from "react-d3-library";

//Color array for Bivariate Choropleth Map
const nColors = 6;
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

// Convert Legend to React Component
const RD3Component = rd3.Component;
class MapLegend extends React.Component {
  // generate USA State Map Legend
  generateLegend = (axis1, axis2) => {
    const h = 100;
    const w = 100;
    const leftPad = 100;
    const topPad = 100;

    const node = document.createElement("div");
    const svgLegend = d3
      .select(node)
      .append("svg")
      .attr("width", w + leftPad)
      .attr("height", h + topPad)
      .attr("transform", "rotate(230)")
      .attr("style", "position: relative; top: -300px; left: 850px;");

    // rectangles (color matrix)
    svgLegend
      .selectAll(null)
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d) => (leftPad + d.col * w) / nColors)
      .attr("y", (d) => (topPad + d.row * h) / nColors)
      .attr("width", w / nColors)
      .attr("height", h / nColors)
      .attr("fill", function (d) {
        return colorArray[d.col][d.row];
      });

    const markerBoxHeight = 20;
    const markerBoxWidth = 20;
    const xRefX = 0;
    const xRefY = 15;
    const xArrowPoints = [
      [0, xRefY - 1.5],
      [0, xRefY + 1.5],
      [2.5, xRefY],
      [0, xRefY - 1.5],
    ];
    // x-axis with arrow
    svgLegend
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", [0, 0, markerBoxWidth, markerBoxHeight])
      .attr("refX", xRefX)
      .attr("refY", xRefY)
      .attr("markerWidth", markerBoxWidth)
      .attr("markerHeight", markerBoxHeight)
      .attr("orient", "auto-start-reverse")
      .append("path")
      .attr("d", d3.line()(xArrowPoints))
      .attr("stroke", "black");
    svgLegend
      .append("path")
      .attr(
        "d",
        d3.line()([
          [18, xRefY],
          [115, xRefY],
        ])
      )
      .attr("stroke", "black")
      .attr("stroke-width", 2.5)
      .attr("marker-end", "url(#arrow)")
      .attr("fill", "none");
    svgLegend
      .append("text")
      .attr("x", 35)
      .attr("y", 12)
      .attr("transform", "translate(120 12) rotate(180)")
      .text(function () {
        return axis1;
      });

    const yRefX = 18;
    const yRefY = 14;
    const yArrowPoints = [
      [yRefX + 1.5, yRefY],
      [yRefX, yRefY + 2.5],
      [yRefX - 1.5, yRefY],
    ];
    // y-axis with arrow
    svgLegend
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", [0, 0, markerBoxWidth, markerBoxHeight])
      .attr("refX", yRefX)
      .attr("refY", yRefY)
      .attr("markerWidth", markerBoxWidth)
      .attr("markerHeight", markerBoxHeight)
      .attr("orient", "auto-start-reverse")
      .append("path")
      .attr("d", d3.line()(yArrowPoints))
      .attr("stroke", "black");
    svgLegend
      .append("path")
      .attr(
        "d",
        d3.line()([
          [yRefX, yRefY],
          [yRefX, 115],
        ])
      )
      .attr("stroke", "black")
      .attr("stroke-width", 2.5)
      .attr("marker-end", "url(#arrow)")
      .attr("fill", "none");

    svgLegend
      .append("text")
      .attr("x", 40)
      .attr("y", -2)
      .attr("transform", "rotate(90)")
      .text(function () {
        return axis2;
      });
    return svgLegend;
  };

  render() {
    return (
      <RD3Component
        data={this.generateLegend("Case", this.props.axis.axis2).node()}
      />
    );
  }
}

export { nColors, colorArray, MapLegend };
