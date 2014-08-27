function HourlyVis() {
    var width = 1000,
	height = 800,
	margin = { left: 60, top: 40, right: 40, bottom: 80 },
	xScale = d3.scale.ordinal()
	    .domain(d3.range(0, 24))
	    .rangeRoundBands([0, width - margin.left - margin.right]),
	yScale = d3.scale.linear()
	    .range([height - margin.top - margin.bottom, 0]),
	yAxis = d3.svg.axis()
	    .scale(yScale)
	    .orient("left"),
	xAxis = d3.svg.axis()
	    .scale(xScale)
	    .orient("bottom"),
	x = function(d) { return +d.key; },
	y = function(d) {
	    return +d.value.records > 0
		? +d.value.count / +d.value.records
		: 0 ;
	},
	color = function(d, i) { 
	    return ["steelblue", "lightsteelblue"][i % 2];
	};
    
    var my = function(selection) {
	updateSize();
	
	selection.each(function(data) {
	    data = d3.map(data).entries();
	    
	    console.log(xScale.range());
	    yScale
		.domain([0, d3.max(data, y)]);
	    
	    var svg = d3.select(this).selectAll("svg").data([data]);
	    svg.enter().append("svg");
	    svg
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
		.attr("width", xScale.rangeBand())
		.attr("y", function(d) { return yScale(y(d)); })
		.attr("height", function(d) { return yScale(0) - yScale(y(d)); })
		.attr("fill", color);
	    
	    var barLabel = drawingArea.selectAll(".bar-label").data(function(d) { return d; });
	    barLabel.enter().append("text")
		.attr("class", "bar-label");
	    barLabel
		.attr("x", function(d) { return xScale(x(d)) + xScale.rangeBand() / 2; })
		.attr("text-anchor", "middle")
		.attr("y", function(d) { return yScale(y(d)); })
		.text(function(d) { return y(d).toFixed(1); });
	   
	    
	    var yAxisEl = svg.selectAll(".y.axis").data([0]);
	    yAxisEl.enter().append("g")
		.attr("class", "y axis");
	    yAxisEl
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.call(yAxis);
	    yAxisEl.selectAll("path")
		.style("fill", "none")
		.style("stroke", "black");
	    
	    var xAxisEl = svg.selectAll(".x.axis").data([0]);
	    xAxisEl.enter().append("g")
		.attr("class", "x axis");
	    xAxisEl
		.attr("transform", "translate(" + margin.left + "," + (height - margin.bottom) + ")")
		.call(xAxis);
	    xAxisEl.selectAll("path")
		.style("fill", "none")
		.style("stroke", "black");
	    xAxisEl.selectAll("text")
		.attr("transform", function() {
		    var x = d3.select(this).attr("x"),
			y = d3.select(this).attr("y");
		    return "rotate(65 " + x + "," + y + ")";
		}).style("text-anchor", "start")
		.text(function(d) { return d + ":00-" + (d + 1) + ":00"; });
	});
	
	function updateSize(e) {
	    width = window.innerWidth - 100;
	    height = window.innerHeight - 100;
	    
	    xScale.rangeRoundBands([0, width - margin.left - margin.right]);
	    yScale.range([height - margin.top - margin.bottom, 0]);
	};
	
	d3.select(window)
	    .on("resize", function() {
		updateSize();
		my(selection);
	    });
    };
    
    return my;
}

function makeClosure() {
    return function() {
	queue()
	    .defer(d3.json, "/api/hourly?timestamp=" + new Date())
	    .await(function(error, data) {
		var chart = HourlyVis();
		
		d3.select("body")
		    .datum(data)
		    .call(chart);
		
		d3.timer(makeClosure(), 1*60*1000 /* one minute */);
	    });
	return true;
	
    };
}

d3.timer(makeClosure(), 0);