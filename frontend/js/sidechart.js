/*
 * Javascript for the side chart
 * Based on d3.js examples
 */

$(document).ready(function() {
	// Set d3 time format parser
	var parseDate = d3.utcParse("%Y-%m-%dT%H:%M:%S.%LZ");

	// Set the ranges
	// XXX: 100 = hardcoded width+height !
	var x = d3.scaleLinear().range([0, 100]);
	var y = d3.scaleLinear().range([100, 0]);

	// Define the axes
	var xAxis = d3.axisBottom(x).ticks(5);
	var yAxis = d3.axisLeft(y).ticks(5);

	// Define the line
	var valueline = d3.line()
		.x(function(d) { return x(d.date); })
		.y(function(d) { return y(d.close); });

	// Adds the svg canvas
	var svg = d3.select("sideChart")
		.append("svg")
		.attr("width", 100)
		.attr("height", 100)
		.append("g");
});
