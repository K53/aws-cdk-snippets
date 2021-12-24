#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AlbStack } from '../lib/AlbFargatePipleine/loadbalancer-stack';
interface Config {
  account: string;
}
const config : Config = require("../secrets/accountInfo");

const app = new cdk.App();
new AlbStack(app, 'AlbStack', {
  env: {
    account: config.account,
    region: "ap-northeast-1",
  }
});
// import 'source-map-support/register';
// import * as cdk from 'aws-cdk-lib';
// import { CodeCommitStack } from '../samples/WebApp/codecommit-stack';
// import { ApiLambdaWithCognitoStack } from '../samples/WebApp/api-lambda-with-cognito-stack';
// import { CloudFrontS3HostingStack } from '../samples/WebApp/cloudfront-s3-hosting-stack';
// import { PipelineStack } from '../samples/WebApp/pipeline-stack';

// const app = new cdk.App();
// new CodeCommitStack(app, 'CodeCommitStack');
// new CloudFrontS3HostingStack(app, 'CloudFrontS3HostingStack')
// new ApiLambdaWithCognitoStack(app, 'ApiLambdaWithCognitoStack');
// new PipelineStack(app, 'PipelineStack');