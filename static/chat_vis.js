function create2DArray(rows, cols, value) {
  var array = [], row = [];
  while (cols--) row.push(value);
  while (rows--) array.push(row.slice());
  return array;
}

function RawChatVis() {
    var width = 1000,
	height = 500,
	xScale = d3.time.scale()
	    .range([0, width]);
    
    var my = function(selection) {
	selection.each(function(d) {
	    var ul = d3.select(this).selectAll("ul").data([d]);
	    ul.enter().append("ul");
	    
	    var li = ul.selectAll("li").data(function(d) { return d; });
	    li.enter().append("li");
	    
	    var date = li.selectAll(".date").data(function(d) { return [d.date]; });
	    date.enter().append("p")
		.attr("class", "date");
	    date
		.text(String);
	    
	    var server = li.selectAll(".server").data(function(d) { return [d.server_name]; });
	    server.enter().append("p")
		.attr("class", "date");
	    server
		.text(String);
	    
	    var player = li.selectAll(".player").data(function(d) { return [d.player_name]; });
	    player.enter().append("p")
		.attr("class", "player");
	    player
		.text(String);
	    
	    var message = li.selectAll(".message").data(function(d) { return [d.message]; });
	    message.enter().append("p")
		.attr("class", "message");
	    message
		.text(String);
	});
    };
    
    my.width = function(_) {
	if (!arguments.length) return width;
	width = _;
	return my;
    };
    
    return my;
}

function MatrixChatVis() {
    var	cellWidth = 2,
	cellHeight = cellWidth,
	color = d3.scale.ordinal()
	    .range(colorbrewer.BuGn[3]);
    
    var my = function(selection) {
	selection.each(function(data) {
	    var splitSeparator = /\s+/;
	    
	    var allWords = data.reduce(function(prev, d) { 
		return prev + " " + d.message;
	    }, "").split(splitSeparator);
	    //console.log(allWords);
	    
	    var words = d3.set(allWords).values().sort();
	    //console.log(words);
	    
	    var wordMapping = {};
	    words.forEach(function(d, i) {
		wordMapping[d] = i;
	    });
	    
	    var wordPairs = data.map(function(d) {
		return d3.pairs(d.message.split(splitSeparator));
	    });
	    
	    var wordMatrix = {};
	    wordPairs.forEach(function(message) {
		message.forEach(function(d) {
		    var ind1 = wordMapping[d[0]],
			ind2 = wordMapping[d[1]];
		    
		    if (typeof wordMatrix[ind1] === "undefined") {
			wordMatrix[ind1] = {};
		    }
		    
		    if (typeof wordMatrix[ind1][ind2] === "undefined") {
			wordMatrix[ind1][ind2] = 0;
		    }
		    
		    wordMatrix[ind1][ind2]++;
		});
	    });
	    console.log(wordMatrix);
	    
	    var nestedWordPoints = d3.map(wordMatrix).entries().map(function(d) {
		var y = +d.key,
		    row = d.value;
		
		return d3.map(row).entries().map(function(dd) {
		    var x = +dd.key,
			value = dd.value;
		    
		    return [x, y, value];
		});
	    });
	    console.log(nestedWordPoints);
	    
	    var wordPoints = Array.prototype.concat.apply([], nestedWordPoints);
	    console.log(wordPoints);
	    
	    var maxValue = wordPoints.map(function(d) {
		return d[2];
	    }).reduce(Math.max, 0);
	    color.domain([0, maxValue]);

	    var svg = d3.select(this).selectAll(".matrix-svg").data([wordPoints]);
	    svg.enter().append("svg")
		.attr("class", "matrix-svg")
		.style("width", words.length * cellWidth + "px")
		.style("height", words.length * cellHeight + "px");
	    
	    var points = svg.selectAll(".point").data(function(d) { return d; });
	    points.enter().append("rect")
		.attr("class", "point")
		.attr("width", cellWidth)
		.attr("height", cellHeight);
	    points
		.attr("fill", function(d) { return color(d[2] + 1); })
		.attr("x", function(d) { return d[0] * cellWidth; })
		.attr("y", function(d) { return d[1] * cellHeight; });
	    
	    /*
	    var zoomed = d3.selectAll(".zoomed-svg").data([0]);
	    zoomed.enter().append("svg")
		.attr("class", "zoomed-svg")
		.style("position", "absolute")
		.style("top", "0px")
		.style("right", "0px");
	     */
	});
    };
    
    return my;    
}

queue()
    .defer(d3.json, "/api/chat/recent")
    .await(function(error, data) {
	var chart = MatrixChatVis();
	
	d3.select("body")
	    .datum(data)
	    .call(chart);
    });
