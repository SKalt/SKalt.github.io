// d3 provided

var svg = d3.select('#udr-graph').append('svg');
var width = Number(svg.style('width').replace('px', ''));
var height = Number(svg.style('height').replace('px', ''));
// based off of https://bl.ocks.org/mbostock/4062045

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));
