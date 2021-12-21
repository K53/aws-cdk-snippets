#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CodeCommitStack } from '../samples/WebApp/codecommit-stack';
import { ApiLambdaWithCognitoStack } from '../samples/WebApp/api-lambda-with-cognito-stack';
import { CloudFrontS3HostingStack } from '../samples/WebApp/cloudfront-s3-hosting-stack';
import { PipelineStack } from '../samples/WebApp/pipeline-stack';
import { ApiLambdaWithKeyStack } from '../lib/ApiLambdaWithKey/api-lambda-with-key-stack';

const app = new cdk.App();
// new CodeCommitStack(app, 'CodeCommitStack');
// new CloudFrontS3HostingStack(app, 'CloudFrontS3HostingStack')
// new ApiLambdaWithCognitoStack(app, 'ApiLambdaWithCognitoStack');
// new PipelineStack(app, 'PipelineStack');
new ApiLambdaWithKeyStack(app, 'ApiLambdaWithKeyStack');