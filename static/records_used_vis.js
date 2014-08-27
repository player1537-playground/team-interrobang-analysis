function daysBetweenDates(first, second) {
    return (second-first)/(1000*60*60*24);
}

function RecordsUsedVis() {
    var width = 1000,
	height = 500,
	margin = { left: 40, top: 40, right: 40, bottom: 40 },
	xScale = d3.time.scale()
	    .range([0, width - margin.left - margin.right]),
	yScale = d3.scale.linear()
	    .domain([0, 50])
	    .range([height - margin.top - margin.bottom, 0]),
	yAxis = d3.svg.axis()
	    .scale(yScale)
	    .orient("left"),
	xAxis = d3.svg.axis()
	    .scale(xScale)
	    .orient("bottom"),
	x = function(d) { return new Date(d.date); },
	y = function(d) { return +d.used; },
	line = d3.svg.line()
	    .x(function(d) { return xScale(x(d)); })
	    .y(function(d) { return yScale(y(d)); }),
	barsWidth = 1,
	color = d3.scale.ordinal()
	    .domain(yScale.domain())
	    .range(colorbrewer.Oranges[3]);
    
    var my = function(selection) {
	selection.each(function(data) {
	    console.log(data);

	    xScale
		.domain(d3.extent(data, x));
	    
	    /*
	    var days = daysBetweenDates.apply(null, xScale.domain()),
		barsWidth = Math.floor(xScale.range()[1] / days);
	     */
	    
	    var svg = d3.select(this).selectAll("svg").data([data]);
	    svg.enter().append("svg")
		.style("width", width + "px")
		.style("height", height + "px");
	    
	    var drawingArea = svg.selectAll(".drawing-area")
		    .data(function(d) { return [d]; });
	    drawingArea.enter().append("g")
		.attr("class", "drawing-area")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	    
	    var bars = drawingArea.selectAll("rect").data(function(d) { return d; });
	    bars.enter().append("rect");
	    bars
		.attr("x", function(d) { return xScale(x(d)); })
		.attr("width", barsWidth)
		.attr("y", function(d) { return yScale(y(d)); })
		.attr("height", function(d) { return yScale(0) - yScale(y(d)); })
		.attr("fill", function(d) { return color(y(d)); });
	    
	    var yAxisEl = svg.selectAll(".y.axis").data([0]);
	    yAxisEl.enter().append("g")
		.attr("class", "y axis");
	    yAxisEl
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.call(yAxis);
	    yAxisEl.selectAll("path")
		.style("fill", "none")
		.style("stroke", "black");
	});
    };
    
    my.width = function(_) {
	if (!arguments.length) return width;
	width = _;
	return my;
    };
    
    return my;
}

queue()
    .defer(d3.json, "/api/records_used")
    .await(function(error, data) {
	var chart = RecordsUsedVis();
	
	d3.select("body")
	    .datum(data)
	    .call(chart);
    });
