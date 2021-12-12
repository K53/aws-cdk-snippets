'use strict';
const AWS = require("aws-sdk");
const SQS = new AWS.SQS();
const queueUrl = process.env.QUEUE_URL;

const sendMessage = async (params) => {
    console.log(`insertRecord - params : ${JSON.stringify(params)}`);
    const res = await SQS.sendMessage(params).promise();
    console.log(res);
    return res;
};

exports.handler = main;
async function main(event) {
    console.log("-- start function --");
    console.log(`event: ${JSON.stringify(event)}`);
    const params = {
        QueueUrl: queueUrl,
        MessageBody: "aaa",
    };
    await sendMessage(params);
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
}
