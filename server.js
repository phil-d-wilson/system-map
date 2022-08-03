const express = require('express');
const { engine } = require('express-handlebars');
const { getSdk } = require('@balena/jellyfish-client-sdk')
const app = express();
app.use(express.static('public'));
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

let jsonData = require('./data/data.json');

async function GetData() {

    console.log("Getting data" + jsonData)
    return jsonData;
}


app.get('/', (req, res) => {
    res.render('home');
});

app.get('/api/data', async (req, res) => {
    res.json(await GetData());
});

app.listen(8080);
console.log("Server listening on port 8080");