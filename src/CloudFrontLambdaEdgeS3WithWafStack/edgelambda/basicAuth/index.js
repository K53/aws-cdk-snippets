'use strict';

exports.handler = main;
async function main(event) {
    try {
        console.log("start function");
        const request = event.Records[0].cf.request;
        console.log(JSON.stringify(request));
        const headers = request.headers;

        // config
        const BASIC_AUTH_USER = "testuser1211";
        const BASIC_AUTH_PASS = "testpass1211";
        const authString = `Basic ${Buffer.from(BASIC_AUTH_USER + ':' + BASIC_AUTH_PASS).toString("base64")}`;
        console.log(`authString: ${authString}`);
        if (typeof headers.authorization !== "undefined" && headers.authorization[0].value === authString)  {
            console.log(JSON.stringify(request));
            return request;
        }
        const response = {
            status: "401",
            statusDescription: "Unauthorized",
            body: "<b>Unauthorized</b>",
            headers: {
                'www-authenticate': [{key: 'WWW-Authenticate', value:'Basic'}]
            }
        };
        console.log(JSON.stringify(response));
        return response;
    } catch (err) {
        console.error(JSON.stringify(err));
        const response = {
            status: "500",
            statusDescription: "InternalServerError",
            body: "<b>InternalServerError</b>"
        };
        console.log(JSON.stringify(response));
        return response;
    }
};