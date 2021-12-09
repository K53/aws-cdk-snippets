'use strict';
const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient();
const dynamoTable = process.env.TABLE_NAME;
const recordLifetime = Number(process.env.RECORD_LIFETIME); // sec

// ToDo retry process

const putRecord = async (params) => {
    console.log(`insertRecord - params : ${JSON.stringify(params)}`);
    const res = await docClient.put(params).promise();
    console.log(res);
    return res;
};

const getRecord = async (params) => {
    console.log(`getRecord - params : ${JSON.stringify(params)}`);
    const res = await docClient.get(params).promise();
    console.log(res);
    return res;
};

const updateRecord = async (params) => {
    console.log(`updateRecord - params : ${JSON.stringify(params)}`);
    const res = await docClient.update(params).promise();
    console.log(res);
    return res;
};

const deleteRecord = async (params) => {
    console.log(`deleteRecord - params : ${JSON.stringify(params)}`);
    const res = await docClient.delete(params).promise();
    console.log(res);
    return res;
};

// ToDo
// query method

exports.handler = main;
async function main(event) {
    try {
        console.log("-- start function --");
        console.log(`event: ${JSON.stringify(event)}`);

        // Put
        const putParams = {
            TableName: dynamoTable,
            Item: {
                testId: "hoge",
                testkey: 123,
                expiration: Math.floor(Date.now() / 1000) + recordLifetime,
            }
        };
        await putRecord(putParams);

        // Get
        // const getParams = {
        //     TableName: dynamoTable,
        //     Key: {testId: "hoge"}
        // };
        // await getRecord(getParams);

        // Update
        // const updateParams = {
        //     TableName: dynamoTable,
        //     Key: {testId: "hoge"},
        //     UpdateExpression: "set testkey = :t, newKey = :s",
        //     ExpressionAttributeValues: {
        //         ":t": 0,
        //         ":s": "new",
        //     }
        // };
        // await updateRecord(updateParams);

        // Delete
        // const deleteParams = {
        //     TableName: dynamoTable,
        //     Key: {testId: "piyo"}
        // };
        // await deleteRecord(deleteParams);

        return {
            statusCode: 200,
            body: JSON.stringify("Hello from Lambda!"),
        };
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify("Internal Server Error"),
        };
    }
}