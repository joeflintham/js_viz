 
var color = d3.scale.category20c();
 
var processData = function(root){

    $('div#metadata #sector').empty();
    $('div#metadata #meta').empty();

    var treeMapDim = {
	width: 500,
	height: 500,
	margin: {
	    left: 0,
	    right: 40,
	    top: 10,
	    bottom: 10
	}
    }

    var treemap = d3.layout.treemap()
	.size([treeMapDim.width,treeMapDim.height])
	.sticky(true)
	.value(function(d) { return d.size; });
    
    $('#treemap').empty()

    var div = d3.select("div#treemap")
	.style("position", "relative")
	.style("width", (treeMapDim.width + treeMapDim.margin.left + treeMapDim.margin.right) + "px")
	.style("height", (treeMapDim.height + treeMapDim.margin.top + treeMapDim.margin.bottom) + "px")
	.style("left", treeMapDim.margin.left + "px")
	.style("top", treeMapDim.margin.top + "px");
    
    var node = div.datum(root).selectAll(".node")
	.data(treemap.nodes)
	.enter().append("div")
	.attr("class", function(d) { console.log(d.code); c = (d.children) ? ' parent' : ' child'; return "node " + d.code + c })
	.call(position)
	.style("background", function(d) { return d.children ? color(d.name) : null; })
	.text(function(d) { return d.children ? null : d.name; })

    d3.selectAll('div.node')
	.on('click', function(d){ toggleSelection(d, treemap) })
    
}

function position() {
  this.style("left", function(d) { return d.x + "px"; })
      .style("top", function(d) { return d.y + "px"; })
      .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
      .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
}

var currentCode;
var toggleSelection = function(d, treemap){

    var currentCode = d.parent.code
    var name = d.parent.name
    var total = d.parent.value
    var infot = _.template($('#metadatatitle').html(), {title: name, count: total})
    $('div#treemap div.node.parent')
	.removeClass('selected') 
	.css('opacity', '0.3')
    $('div#treemap div.parent.' + currentCode)
	.addClass('selected')
	.css('opacity', '1')


    $('div#metadata #title').html(infot)
    
    $('div#metadata #meta').empty();

    var parent = d.children ? d : d.parent;
    
    parent.children.forEach(function(e,i,v){
	
	var code = e.code
	var name = e.name
	var col = color(name)
	var count = e.value
	var total = e.parent.value
	var percent = Math.round(((count / total)*100) * 100) / 100 + '%'
	
	var infot = _.template($('#metadatapanel').html(), {segment_name: name, count: count, seg_code: code, percent: percent})
	$('div#metadata #meta').append(infot)
	
	$('#segment.'+ code + ' span.key').css('background-color', col)
    });
    
    links = $('a.segment_trigger')
	.on('click', function(e){
	    e.preventDefault()
	    key = ($(e.target).parents('div#segment').data('segment'))

	    $('div#treemap div.child.node')
		.removeClass('selected')
		.css('opacity', '0.3')
	    
	    $('div#treemap div.child.' + key)
		.addClass('selected')
		.css('opacity', '1')
	})

}

var index
var getData = function(f){
    $.ajax({
	url: f,
	cache: false,
	error: function(e){ console.log(e); },
	success: function(e){
	    index = e.index
	    if (e && e.data) processData(e.data)
	}
    })
}

var buildMenu = function(d){
    if (d && d.datasets){

	for (a in d.datasets){
	    var refObj = d.datasets[a]
	    var loadLink = _.template($('#dataloader').html(), {treefile: refObj.tree, handle: refObj.handle})
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

