#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/AlbFargatePipleine/network-stack';
import { AlbFargateStack } from '../lib/AlbFargatePipleine/alb-fargate-stack';
import { CodeCommitECRStack } from '../lib/AlbFargatePipleine/codecommit-ecr-stack';
import { PipelineStack } from '../lib/AlbFargatePipleine/pipeline-stack';
interface Config {
  account: string;
}
const config : Config = require("../secrets/accountInfo");

const app = new cdk.App();

new NetworkStack(app, 'NetworkStack', {
  env: {
    account: config.account,
    region: "us-east-1",
  }
});
new CodeCommitECRStack(app, 'CodeCommitECRStack', {
  env: {
    account: config.account,
    region: "us-east-1",
  }
});
new AlbFargateStack(app, 'AlbFargateStack', {
  env: {
    account: config.account,
    region: "us-east-1",
  }
});
new PipelineStack(app, 'PipelineStack', {
  env: {
    account: config.account,
    region: "us-east-1",
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