import axios from 'https://cdn.skypack.dev/axios';

async function getProcessedData() {
    console.log("Getting processed data")
    return await axios.get('/api/data');
}

function getLayout(dag)
{
    const { width, height } = d3.grid().lane(d3.laneGreedy().topDown(false))(dag);
    for (const node of dag) {
        console.log(node)
        [node.x, node.y] = [node.y, node.x];
    }
    for (const { points } of dag.ilinks()) {
        for (const point of points) {
            [point.x, point.y] = [point.y, point.x];
        }
    }
    return { width: height, height: width };
}

(async () => {
  // fetch data and render
    let data = await getProcessedData();
    let processedData = data.data.links.map(function (item) {
        return [item.source, item.target]
    })
    const dag = d3.dagConnect()(processedData);
    const { width, height } = getLayout(dag);
    // console.log("x", [...new Set([...dag].map((n) => n.x))][0]);
    // for (const { points } of dag.ilinks()) {
    //     if (points.length > 2) console.log(points.slice(1, -1));
    // }
    const steps = dag.size();
    const interp = d3.interpolateRainbow;
    const colorMap = {};
    for (const [i, node] of [...dag].entries()) {
        colorMap[node.data.id] = interp(i / steps);
    }

    let svg = d3.select("svg")
        .attr("viewBox", [width, height, width, height]);
    const svgSelection = svg.append("g");
    const defs = svgSelection.append("defs");

    const line = d3
        .line()
        .curve(d3.curveBasis)
        .x((d) => d.x)
        .y((d) => d.y);

    // Plot edges
    svgSelection
        .append("g")
        .selectAll("path")
        .data(dag.links())
        .enter()
        .append("path")
        .attr("d", ({ points }) => line(points))
        .attr("fill", "none")
        .attr("stroke-width", 3)
        .attr("stroke", ({ source, target }) => {
            // encode URI component to handle special characters
            const gradId = encodeURIComponent(`${source.data.id}-${target.data.id}`);
            const grad = defs
                .append("linearGradient")
                .attr("id", gradId)
                .attr("gradientUnits", "userSpaceOnUse")
                .attr("x1", source.x)
                .attr("x2", target.x)
                .attr("y1", source.y)
                .attr("y2", target.y);
            grad
                .append("stop")
                .attr("offset", "0%")
                .attr("stop-color", colorMap[source.data.id]);
            grad
                .append("stop")
                .attr("offset", "100%")
                .attr("stop-color", colorMap[target.data.id]);
            return `url(#${gradId})`;
        });

    // Select nodes
    const nodes = svgSelection
        .append("g")
        .selectAll("g")
        .data(dag.descendants())
        .enter()
        .append("g")
        .attr("transform", ({ x, y }) => `translate(${x}, ${y})`);

    // Plot node circles
    nodes
        .append("circle")
        .attr("r", 8)
        .attr("fill", (n) => colorMap[n.data.id]);

    // Add text to nodes
    nodes
        .append("text")
        .text((d) => d.data.id)
        .attr("font-size", 6)
        .attr("font-weight", "bold")
        .attr("font-family", "sans-serif")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("fill", "blue");
   
    return svg;
   
})();