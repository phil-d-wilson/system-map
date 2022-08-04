const { getSdk } = require('@balena/jellyfish-client-sdk')
const fs = require('fs');
const sheet = require('./SheetData.js');

// Create a new SDK instance, providing the API url and prefix
const sdk = getSdk({
    apiUrl: "https://api.ly.fish",
    apiPrefix: "api/v2/",

});

async function GetData() {

    // Authorise the SDK using an auth token
    let token = process.env.JF_TOKEN
    if (!token)
    {
        console.error("Jellyfish token not set. Set JF_TOKEN in enVars")
        process.exit()
    }
    sdk.setAuthToken(token);

    let data = await sheet.getSheetsData();
    let nodesAdded = data.nodes.map(d => d.id);
    console.log("Got Google Sheets data");

    console.log("Creating Sagas first")
    let sagas = await sdk.card.getAllByType("saga@1.0.0");
    for (let saga of sagas) {
        data.nodes.push({
            "id": saga.slug,
            "name": saga.name,
            "group": saga.type.substring(0, saga.type.indexOf('@')),
            "weight": saga.data.weight || 0,
            "Link": "https://jel.ly.fish/" + saga.slug
        })

        nodesAdded.push(saga.slug);
    }

    console.log("Getting all improvements")
    let cards = await sdk.card.getAllByType("improvement@1.0.0");
    for (let card of (cards.filter(c => (c.data.status === "implementation")))) {
        data.nodes.push({
            "id": card.slug,
            "name": card.name,
            "group": card.type.substring(0, card.type.indexOf('@')),
            "weight": card.data.weight || 0,
            "Link": "https://jel.ly.fish/" + card.slug
        })
        nodesAdded.push(card.slug);

        await sdk.card.getWithLinks(card.slug, ['is attached to'])
            .then((linkedCard) => {
                if (linkedCard) {
                    if (linkedCard.links) {
                        for (l of (linkedCard.links['is attached to'].filter(link => (['saga@1.0.0', 'pattern@1.0.0'].includes(link.type))))) {
                            if (!nodesAdded.includes(card.slug)) {
                                data.nodes.push({
                                    "id": card.slug,
                                    "name": card.name,
                                    "group": card.type.substring(0, card.type.indexOf('@')),
                                    "weight": card.data.weight || 0,
                                    "Link": "https://jel.ly.fish/" + card.slug
                                })

                                nodesAdded.push(card.slug);
                            }
                            else
                            {
                                console.log("Ignoring duplicate: " + card.slug)
                            }

                            if (!nodesAdded.includes(l.slug)) {
                                data.nodes.push({
                                    "id": l.slug,
                                    "name": l.name,
                                    "group": l.type.substring(0, l.type.indexOf('@')),
                                    "weight": l.data.weight || 0,
                                    "Link": "https://jel.ly.fish/" + l.slug
                                })
                                nodesAdded.push(l.slug);
                            } else {
                                console.log("Ignoring duplicate: " + l.slug)
                            }

                            data.links.push({
                                "source": card.slug,
                                "target": l.slug,
                                "weight": (card.data.weight || 0) + (l.data.weight || 0) 
                            })
                        }
                    }
                }
            })
    }

    return data

}


console.log("Generating data file")
GetData().then(result => { fs.writeFileSync('./data/data.json', JSON.stringify(result)) });
