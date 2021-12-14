#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ApiLambdaBySwaggerStack } from '../lib/ApiLambdaBySwaggerStack/api-lambda-by-swagger-stack';

const app = new cdk.App();
new ApiLambdaBySwaggerStack(app, 'ApiLambdaBySwaggerStack');