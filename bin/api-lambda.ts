#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
// import { ApiLambdaWithBasicAuthStack } from '../lib/api-lambda-with-basic-auth-stack';
import { ApiLambdaWithCognitoStack } from '../lib/api-lambda-with-cognito-stack';

const app = new cdk.App();
new ApiLambdaWithCognitoStack(app, 'ApiLambdaWithBasicAuthStack');