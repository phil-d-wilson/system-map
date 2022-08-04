const request = require("request");
const XLSX = require("xlsx");

module.exports = {
    getSheetsData: async function () {
        let fileURL = process.env.SHEET_URL;
        if (!fileURL) {
            console.error("Google sheet URL not set. Set SHEET_URL in enVars")
            process.exit()
        }

        return new Promise(function (resolve, reject) {
            request.get(fileURL, { encoding: null }, function (err, res, data) {
                if (err || res.statusCode != 200) {
                    console.log(res.statusCode);
                    reject(err);
                }
                const buf = Buffer.from(data);
                const workbook = XLSX.read(buf);
                let nodeSheet = workbook.Sheets['Nodes'];
                let linkSheet = workbook.Sheets['Links'];
                let nodes = XLSX.utils.sheet_to_json(nodeSheet);
                let links = XLSX.utils.sheet_to_json(linkSheet);

                let output = new Object();
                output.links = links;
                output.nodes = nodes;

                resolve(output);
            });
        });
    }
}
