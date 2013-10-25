var arcs = [],
chords = [],
svg, labels, dataIndex;

var last_chord = {};

colArray = ["#012345", "#123456", "#23456a", "#3456ab", "#456abc", "#56abcd", "#6abcde", "#abcdef"]

var fill = d3.scale.ordinal()
    .domain(d3.range(4))
    .range(colArray);

var w = 480,
h = 480,
r0 = Math.min(w, h) * .41,
r1 = r0 * 1.1;


/*** Functions ***/

function render(data, ls, di){

    labels = ls;
    dataIndex = di;

    var chord = d3.layout.chord()
	.padding(.05)
	.sortSubgroups(d3.descending)
	.matrix(data);

    // create svg
    var svg = d3.select("#chart")
	.append("svg:svg")
	.attr("width", w)
	.attr("height", h)
	.append("svg:g")
	.attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");
    
    // draw arcs
    svg.append("svg:g")
	.selectAll("path")
	.data(chord.groups)
	.enter().append("svg:path")
	.attr("class", "arc")
	.style("fill", function(d) { return fill(d.index); })
	.style("stroke", function(d) { return fill(d.index); })
	.attr("d", d3.svg.arc().innerRadius(r0).outerRadius(r1))
	.on("click", toggleSelection())
	.on("mouseover", function(){$(this).css('cursor','pointer')})

    // draw chords
    svg.append("svg:g")
	.attr("class", "chord")
	.selectAll("path")
	.data(chord.chords)
	.enter().append("svg:path")
	.attr("d", d3.svg.chord().radius(r0))
	.style("fill", function(d) { return fill(d.target.index); })
	.style("stroke", '#333')
	.style("opacity", 1)

    drawTicks(chord,svg);

    last_chord = chord;

    return svg;
};

function rerender(data, ls, di){

    labels = ls;
    dataIndex = di;

    $('div#metadata #sector').empty();
    $('div#metadata #meta').empty();
    
    var chord = d3.layout.chord()
	.padding(.05)
	.sortSubgroups(d3.descending)
	.matrix(data);

    // update arcs
    svg.selectAll(".arc")
	.data(chord.groups)
	.transition()
	.duration(1500)
	.attrTween("d", arcTween(last_chord));

    // used to time tick drawing
    var last = svg.select(".chord").selectAll("path")[0].length - 1

    // update chords
    svg.select(".chord")
	.selectAll("path")
	.data(chord.chords)
	.transition()
	.style('opacity','1')
	.style('stroke-width','1')
	.duration(1500)
	.attrTween("d", chordTween(last_chord))
	.each("end", function(d,i) {
	    if (i == last) {
		drawTicks(chord,svg);
	    }
	});

    last_chord = chord;
}

function drawTicks(chord,svg) {
    var ticks = svg.append("svg:g")
	.attr("class", "ticks")
	.attr("opacity", 0.1)
	.selectAll("g")
	.data(chord.groups)
	.enter().append("svg:g")
	.selectAll("g")
	.data(groupTicks)
	.enter().append("svg:g")
	.attr("transform", function(d) {
            return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
		+ "translate(" + r1 + ",0)";
	});

    svg.selectAll(".ticks")
	.transition()
	.duration(700)
	.attr("opacity", 1)

    ticks.append("svg:line")
	.attr("x1", 1)
	.attr("y1", 0)
	.attr("x2", 5)
	.attr("y2", 0)
	.attr("stroke", '#000')

    ticks.append("svg:text")
	.attr("x", 8)
	.attr("dy", '.35em')
	.attr("text-anchor", function(d) {
            return d.angle > Math.PI ? "end" : null;
        })
	.attr("transform", function(d) {
            return d.angle > Math.PI ? "rotate(180)translate(-16)" : null;
        })
	.text(function(d) { return d.label; });

    return ticks;
}

var arc =  d3.svg.arc()
    .startAngle(function(d) { return d.startAngle })
    .endAngle(function(d) { return d.endAngle })
    .innerRadius(r0)
    .outerRadius(r1);

var chordl = d3.svg.chord().radius(r0);

function arcTween(chord) {
    return function(d,i) {
	var i = d3.interpolate(chord.groups()[i], d);

	return function(t) {
	    return arc(i(t));
	}
    }
}

function chordTween(chord) {
    return function(d,i) {
	var i = d3.interpolate(chord.chords()[i], d);

	return function(t) {
	    return chordl(i(t));
	}
    }
}

// Returns an array of tick angles and labels, given a group.
function groupTicks(d) {
    var k = (d.endAngle - d.startAngle) / d.value;
    return d3.range(0, d.value, 1000).map(function(v, i) {
	return {
	    angle: v * k + d.startAngle,
	    label: i % 5 ? null : v / 1000 + "k"
	};
    });
}

function showSegment(){
    return function(d) {
/*	$('div#metadata #meta #segment').removeClass('selected')
	var key = labels[d.source.index];
	$('div#metadata #meta #segment.' + key).addClass('selected')
*/    }
}

function toggleSelection() {
    return function(g, i) {
	svg.selectAll(".chord path")
	    .style('opacity','1')
	    .on("click", showSegment())
	    .attr('data-active','true')
	    .filter(function(d) { return d.source.index != i && d.target.index != i; })
	    .style('opacity','0.1')
	    .on("click", null)
	    .attr('data-active','false')

	var t = 'Sector: '
	var key = labels[g.index];
	var infot = _.template($('#metadatatitle').html(), {title: dataIndex.index[key].name, count: dataIndex.index[key].total})
	$('div#metadata #title').html(infot)

	$('div#metadata #meta').empty();
	labels.sort().forEach(function(e,i,v){

	    var code = e;
	    var name = dataIndex.index[code].name
	    var pos = parseInt(_.indexOf(v,key),10)
	    var count = dataIndex.data[pos][key][i]
	    var total = dataIndex.index[code].total
	    var percent = Math.round(((count / total)*100) * 100) / 100 + '%'

	    var infot = _.template($('#metadatapanel').html(), {segment_name: name, count: count, seg_code: code, percent: percent})
	    $('div#metadata #meta').append(infot)
	    $('#segment.'+ code + ' span.key').css('background-color', colArray[i])
	});

	links = $('a.segment_trigger')
	    .on('click', function(e){
		e.preventDefault()
		key = ($(e.target).parents('div#segment').data('segment'))
		svg.selectAll(".chord path")
		    .style('stroke-width','5')
		    .filter(function(d) { return (labels[d.target.index] != key && labels[d.source.index] != key)})
		    .style('stroke-width','1')
	    })
    };
}

var dataIndex;
processData = function(dataIndex){
    m = []
    l = []
    keys = []

    counter = dataIndex.data.length - 1;
    for (a in dataIndex.data){
	keys.push(a)
	for (b in dataIndex.data[a]){
	    l[a] = b;
	}
    }
    for (b in keys.sort()){ 
	sectorObj = dataIndex.data[b]
	for (c in sectorObj){
	    d = sectorObj[c]
	    /*d[counter] = 0;*/
	    m[b] = d;
	}
	//l.unshift(b)
	counter--
    }

    if (svg){
	// remove ticks and rerender
	svg.selectAll(".ticks")
	    .transition()
	    .each("end", function() { console.log(m,l,dataIndex); rerender(m,l,dataIndex); })
		.duration(200)
	    .attr("opacity", 0.1)
	    .remove();
    } else {
	svg = render(m,l,dataIndex)
	
    }
}

getData = function(f){
    $.ajax({
	url: f,
	cache: false,
	error: function(e){ console.log(e); },
	success: function(e){
	    processData(e)
	}
    })
}

buildMenu = function(d){
    
    if (d && d.datasets){

	for (a in d.datasets){
	    var refObj = d.datasets[a]
	    var loadLink = _.template($('#dataloader').html(), {chordfile: refObj.chord, handle: refObj.handle})
	    $('div#menu').append(loadLink)
	}

    }

    dfs = []
    $('div.refresh p a').each(function(){
	var df = $(this).data('file');
	dfs.push(df)
	$(this).bind('click', function(e){
	    e.preventDefault()
	    var df = getData($(this).data('file'));
	    console.log(df)
	});
    });
    if (dfs.length > 0){ getData(dfs[0]) }
}

$(document).ready(function(){

    loadSources = function(f){
	$.ajax({
	    url: f,
	    cache: false,
	    error: function(e){ console.log(e); },
	    success: function(e){
		buildMenu(e)
	    }
	})
    }

    loadSources('datasets.json')
    
});

