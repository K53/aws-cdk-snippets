'use strict';
const axios = require("axios");
const apiUrl = process.env.API_URL;

exports.handler = main;
async function main(event) {
    try {
        console.log("-- start function --")
        console.log(`event: ${JSON.stringify(event)}`);
        const options = {
            url: apiUrl,
            method: "POST",
            headers: {"Content-type": "application/json"},
            data: {"text": "Error Occured"}
        }
        const res = await axios.request(options);
        if (res.status !== 200) {throw new Error(res.data);}
        return 0;
    } catch(err) {
        console.error(err.stack);
        console.error("[ERROR] failed to call API.");
        throw err;
    }
};