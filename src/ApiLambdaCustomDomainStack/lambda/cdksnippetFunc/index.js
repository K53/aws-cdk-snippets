'use strict';
exports.handler = main;
async function main(event) {
    console.log("-- start function --")
    console.log(`event: ${JSON.stringify(event)}`);
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};
