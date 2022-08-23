import axios from 'https://cdn.skypack.dev/axios';
import cytoscape from 'https://cdn.skypack.dev/cytoscape';
import dagre from 'https://cdn.skypack.dev/cytoscape-dagre';

async function getProcessedData() {
    console.log("Getting processed data")
    return await axios.get('/api/data');
}

(async () => {

    cytoscape.use(dagre);
    let data = await getProcessedData();
    var cy = window.cy = cytoscape({
        container: document.getElementById('cy'),

        boxSelectionEnabled: false,

        style: [
            {
                selector: 'node',
                css: {
                    'content': 'data(id)',
                    'text-valign': 'center',
                    'text-halign': 'center'
                }
            },
            {
                selector: ':parent',
                css: {
                    'text-valign': 'top',
                    'text-halign': 'center',
                }
            },
            {
                selector: 'edge',
                css: {
                    'curve-style': 'bezier',
                    'target-arrow-shape': 'triangle'
                }
            }
        ],

        elements: {
            nodes:
                data.data.nodes.map(function (node) {
                    return {
                        data: {
                            id: node.id,
                            NodeType: node.group
                        }
                    };
                }),
            edges:
                data.data.links.map(function (link) {
                    return { data: { id: (Math.random() + 1).toString(36).substring(7), source: link.source, target: link.target } };
                }),
        },

        style: [
            {
                'active-bg-color': '#fff',
                'active-bg-opacity': 0.333,
            },
            {
                selector: 'node',
                style: {
                    'width': 40,
                    'height': 40,
                    'font-size': 9,
                    'font-weight': 'bold',
                    'min-zoomed-font-size': 4,
                    'label': 'data(name)',
                    'text-wrap': 'wrap',
                    'text-max-width': 50,
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'text-events': 'yes',
                    'color': '#000',
                    'text-outline-width': 1,
                    'text-outline-color': '#fff',
                    'text-outline-opacity': 1,
                    'overlay-color': '#fff'
                }
            },

            {
                selector: 'edge',
                style: {
                    'width': 300,
                    'line-color': '#ccc',
                    'curve-style': 'bezier'
                }
            }]

        layout: {
            name: 'dagre',
            animate: 'end',
            avoidOverlap: true,
            padding: 30,
            fit: false,
            rankDir: 'TB',
            nodeSep: 500,
            // edgeSep: 100,
            rankSep: 200,
        }
    });
})();