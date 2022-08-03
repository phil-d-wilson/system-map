import * as d3 from "https://cdn.skypack.dev/d3@7";
import axios from 'https://cdn.skypack.dev/axios';

async function getProcessedData()
{
    console.log("Getting processed data")
    return await axios.get('/api/data');
}

async function drawChart() {
    const data = await getProcessedData();
    const width = 800;
    const height = 765;
    const margin = ({ top: 10, right: 10, bottom: 5, left: 5 }); 
    const colorScale = d3.scaleOrdinal() 
        .domain(["mission", "assumption", "goal", "approach", "saga", "improvement", "pattern"])
        .range(['#b53737', '#86cbff', '#c2e5a0', '#fff686', '#9e79db', '#ff9e6d', '#E91E63'])
    
    const simulation = d3.forceSimulation()
        .force("link", d3.forceLink() // This force provides links between nodes
            .id(d => d.id) // This sets the node id accessor to the specified function. If not specified, will default to the index of a node.
            .distance(120)
        )
        .force("charge", d3.forceManyBody().strength(-700)) // This adds repulsion (if it's negative) between nodes. 
        .force("center", d3.forceCenter(width / 2, height / 2)); // This force attracts nodes to the center of the svg area

    let svg = d3.select("svg")
        .attr("viewBox", [100, -10, width, height]);

    const box = svg.append("g");

    //Add some data
    const dataset = data.data;

    const link = box.selectAll(".links")
        .data(dataset.links)
        .enter()
        .append("line")
        .attr("class", "links")
        .attr("stroke", "#999")
        .attr("stroke-width", d => 2 + d.weight + "px")
        .style("opacity", 0.8)
        .attr("id", d => "line" + d.source + d.target)
        .attr("class", "links")
        .attr('marker-end', 'url(#arrowhead)') //The marker-end attribute defines the arrowhead or polymarker that will be drawn at the final vertex of the given shape.

    link.append("title")
        .text(d => d.weight);

    // Initialize the nodes
    const node = box.selectAll(".nodes")
        .data(dataset.nodes)
        .enter()
        .append("g")
        .attr("class", "nodes")

    node.append("circle")
        .attr("r", d => 20 + (d.weight))
        .attr("id", d => "circle" + d.id)
        .style("stroke", "grey")
        .style("stroke-opacity", 0.3)
        .style("stroke-width", d => d.weight)
        .style("fill", d => colorScale(d.group))
        .on("mouseout", function (e, d)
        {
            d3.select(this)
                .style("stroke", "grey")
                .style("stroke-width", d.weight)
                .style("stroke-opacity", 0.3)
        })
        .on("mouseover", function (e, d) {
            if (d.Link) {
                d3.select(this)
                    .style("stroke", "pink")
                    .style("stroke-width", 30)
                    .style("stroke-opacity", 1)
            }
        })
        .on("click", function (e, d) {
            if (d.Link) {
                window.open(d.Link, '_blank').focus();
            }
        });

    node.append("title")
        .text(d => d.group + ": " + d.name);

    node.append("text")
        .attr("dy", 4)
        .attr("dx", 20)
        .text(d => d.id);

    console.log(box.selectAll("g"))

    svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([-100, 8])
        .on("zoom", zoomed));

    function zoomed() {
        box.attr("transform", d3.zoomTransform(this));
    }

    // node.call(d3.drag() //sets the event listener for the specified typenames and returns the drag behavior.
    //     .on("start", dragstarted) //start - after a new pointer becomes active (on mousedown or touchstart).
    //     .on("drag", dragged)      //drag - after an active pointer moves (on mousemove or touchmove).
    // );

    // This function is run at each iteration of the force algorithm, updating the nodes position (the nodes data array is directly manipulated).
    function ticked() {
        link.attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("transform", d => `translate(${d.x},${d.y})`);
    }

    simulation
        .nodes(dataset.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(dataset.links);

    //drawing the legend
    const legend_g = svg.selectAll(".legend")
        .data(colorScale.domain())
        .enter().append("g")
        .attr("transform", (d, i) => `translate(${width},${i * 20})`);

    legend_g.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 5)
        .attr("fill", colorScale);

    legend_g.append("text")
        .attr("x", 10)
        .attr("y", 5)
        .text(d => d);

    //When the drag gesture starts, the targeted node is fixed to the pointer
    //The simulation is temporarily “heated” during interaction by setting the target alpha to a non-zero value.
    function dragstarted(d) {
        if (!d.active) simulation.alphaTarget(0.3).restart();//sets the current target alpha to the specified number in the range [0,1].
        d.fy = d.y; //fx - the node’s fixed x-position. Original is null.
        d.fx = d.x; //fy - the node’s fixed y-position. Original is null.
    }

    //When the drag gesture starts, the targeted node is fixed to the pointer
    function dragged(d) {
        d.fx = d.sourceEvent.pageX;
        d.fy = d.sourceEvent.pageY;
    }

    return svg.node();

}





console.log("above draw chart")
drawChart();