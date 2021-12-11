'use strict';
// ref.) https://docs.aws.amazon.com/ja_jp/AmazonCloudFront/latest/DeveloperGuide/lambda-examples.html

exports.handler = main;
async function main(event) {
    console.log("start function");
    console.log(`event: ${JSON.stringify(event)}`);
    const response = event.Records[0].cf.response;
    const request = event.Records[0].cf.request;
    if (Number(response.status) === 403 || Number(response.status) === 404) {
        const redirect_path = "/";
        response.status = "302";
        response.statusDescription = "Found";
        response.body = ""; // Drop the body, as it is not required for redirects
        response.headers["location"] = [{ key: "Location", value: redirect_path }];
    }
    return response;
};