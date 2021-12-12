#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LambdaToSqsStack } from '../lib/LambdaToSqsStack/lambda-to-sqs-stack';

const app = new cdk.App();
new LambdaToSqsStack(app, 'LambdaToSqsStack');