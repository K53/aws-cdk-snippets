#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
// import { ApiLambdaStack } from '../lib/CloudFrontApigwStack/api-lambda-stack';
import { ApiLambdaBySwaggerStack } from '../lib/CloudFrontApigwStack/api-lambda-by-swagger-stack'; // if you use swagger.yaml, use this stack
import { CloudFrontS3HostingWithAPiStack } from '../lib/CloudFrontApigwStack/cloudfront-s3-hosting-with-api-stack';

const app = new cdk.App();
// new ApiLambdaStack(app, 'ApiLambdaStack');
new ApiLambdaBySwaggerStack(app, 'ApiLambdaBySwaggerStack'); // if you use swagger.yaml, use this stack
new CloudFrontS3HostingWithAPiStack(app, 'CloudFrontS3HostingWithAPiStack');
