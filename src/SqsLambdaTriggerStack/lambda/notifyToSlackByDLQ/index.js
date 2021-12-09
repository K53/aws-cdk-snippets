'use strict';
const axios = require("axios");
const slackUrl = process.env.SLACK_URL;

exports.handler = main;
async function main(event) {
    try {
        console.log("-- start function --")
        console.log(`event: ${JSON.stringify(event)}`); // Attention: Batch size is 10 (default)
        const options = {
            url: slackUrl,
            method: "POST",
            headers: {"Content-type": "application/json"},
            data: {"text": "Dead Letter Queue received error request."}
        }
        const res = await axios.request(options);
        if (res.status !== 200) {throw new Error(res.data);}
        return 0;
    } catch(err) {
        console.error(err.stack);
        console.error("[ERROR] failed to send message.");
        return 0; // Lambda triggered by DLQ must not throw Exception.
    }
};