#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
// import { ApiLambdaWithBasicAuthStack } from '../lib/api-lambda-with-basic-auth-stack';
// import { ApiLambdaWithCognitoStack } from '../lib/api-lambda-with-cognito-stack';
// import { ApiLambdaStack } from '../lib/api-lambda-stack';
// import { ApiLambdaCustomDomainStack } from '../lib/api-lambda-custom-domain-stack';
import { SqsLambdaTriggerStack } from '../lib/sqs-lambda-trigger-stack';

const app = new cdk.App();
new SqsLambdaTriggerStack(app, 'SqsLambdaTriggerStack');