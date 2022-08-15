const { getSdk } = require('@balena/jellyfish-client-sdk')
const fs = require('fs');
const sheet = require('./SheetData.js');

// Create a new SDK instance, providing the API url and prefix
const sdk = getSdk({
    apiUrl: "https://api.ly.fish",
    apiPrefix: "api/v2/",

});

let data = [];
let nodesAdded = [];

async function GetData() {

    // Authorise the SDK using an auth token
    let token = process.env.JF_TOKEN
    if (!token)
    {
        console.error("Jellyfish token not set. Set JF_TOKEN in enVars")
        process.exit()
    }
    sdk.setAuthToken(token);

    try {
        data = await sheet.getSheetsData();
        nodesAdded = data.nodes.map(d => d.id);
        console.log("Got Google Sheets data");
    }
    catch (error) {
        console.log(error);
    }

    try{
        console.log("Creating Sagas first")
        let sagas = await sdk.card.getAllByType("saga@1.0.0");
        for (let saga of sagas) {
            AddNodeOrIgnoreDuplicate(saga)
        }
    }
    catch (error)
    {
        console.log(error);
    }

    try {
        console.log("Getting all improvements")
        let improvements = await sdk.card.getAllByType("improvement@1.0.0");
        for (let improvement of (improvements.filter(c => (c.data.status === "implementation")))) {
            AddNodeOrIgnoreDuplicate(improvement)

            await sdk.card.getWithLinks(improvement.slug, ['is attached to'])
                .then((improvementCard) => {
                    if (improvementCard) {
                        if (improvementCard.links) {
                            for (link of (improvementCard.links['is attached to'].filter(l => (['saga@1.0.0', 'pattern@1.0.0'].includes(l.type))))) {
                                AddNodeOrIgnoreDuplicate(link)
                                AddLink(improvement, link);
                            }
                        }
                    }
                })
        }

        return data
    }
    catch (error)
    {
        console.log(error);
    }

}

function AddLink(source, target)
{
    data.links.push({
        "source": source.slug,
        "target": target.slug,
        "weight": (source.data.weight || 0) + (target.data.weight || 0)
    })
}

function AddNodeOrIgnoreDuplicate(card) {
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
    else {
        console.log("Ignoring duplicate: " + card.slug)
    }
}


console.log("Generating data file")
GetData().then(result => { fs.writeFileSync('./data/data.json', JSON.stringify(result)) });
