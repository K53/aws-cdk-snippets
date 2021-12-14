'use strict';
exports.handler = main;
async function main(event, context) {
    console.log("-- start function --");
    console.log(`event: ${JSON.stringify(event)}`);
    const headers = event.headers;
    const policy = {
        principalId: "",
        policyDocument: {
            Version: "2012-10-17",
            Statement: [
                {
                    Action: "execute-api:Invoke",
                    Effect: "Deny",
                    Resource: "*"
                }
            ]
        }
    };
    const authString = "Basic " + Buffer.from(`${process.env.BASIC_AUTH_USER}:${process.env.BASIC_AUTH_PASS}`).toString("base64");
    /*
     * If you want to send message to resource lambda behind APIGW, 
     * add any key (eg. additionalInfo) to context object in responce.
     * the context object value have to be string. now encoded the message with base64.
     * ref) https://dev.classmethod.jp/articles/lambda-authorizer/
     */
    // const mycontext = {hoge: "hoge"};
    // policy.context = {
    //     additionalInfo: Buffer.from(JSON.stringify(mycontext)).toString("base64")
    // };

    // console.debug(`authString: ${authString}`);
    if (typeof headers.Authorization !== "undefined" && headers.Authorization === authString) {
        policy.policyDocument.Statement[0].Effect = "Allow";
        console.log(`response policy: ${JSON.stringify(policy)}`);
        return policy;
    }
    policy.policyDocument.Statement[0].Effect = "Deny";
        console.log(`response policy: ${JSON.stringify(policy)}`);
    return policy;
}
  
