#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
// import { ApiLambdaWithBasicAuthStack } from '../lib/api-lambda-with-basic-auth-stack';
// import { ApiLambdaWithCognitoStack } from '../lib/api-lambda-with-cognito-stack';
// import { ApiLambdaStack } from '../lib/api-lambda-stack';
// import { ApiLambdaCustomDomainStack } from '../lib/api-lambda-custom-domain-stack';
// import { SqsLambdaTriggerStack } from '../lib/sqs-lambda-trigger-stack';
// import { LambdaWithLayerStack } from '../lib/lambda-with-layer-stack';
// import { DynamodbCRUDLambdaStack } from '../lib/dynamodb-crud-lambda-stack';
// import { CloudFrontS3HostingStack } from '../lib/cloudfront-s3-hosting-stack';
import { CloudFrontLambdaEdgeS3WithWafStack } from '../lib/cloudfront-lambdaedge-s3-with-waf-stack';
import { WafForCloudFrontStack } from '../lib/waf-for-cloudfront-stack';
const accountInfo = require("../secrets/account-info");

const app = new cdk.App();
new WafForCloudFrontStack(app, 'WafForCloudFrontStack', {
    env: {
        account: accountInfo.account,
        region: "us-east-1",
    }
})
new CloudFrontLambdaEdgeS3WithWafStack(app, 'CloudFrontLambdaEdgeS3WithWafStack', {
    env: {
        account: accountInfo.account,
        region: "ap-northeast-1",
    }
});