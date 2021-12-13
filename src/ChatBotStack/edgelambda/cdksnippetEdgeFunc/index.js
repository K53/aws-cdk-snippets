'use strict';
exports.handler = main;
async function main(event) {
    console.log("start function");
    const request = event.Records[0].cf.request;
    console.log(JSON.stringify(request));
    console.error("failed");
    return {
        status: "500",
        statusDescription: "InternalServerError",
        body: "<b>InternalServerError</b>"
    };
};