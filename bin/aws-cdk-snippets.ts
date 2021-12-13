#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ChatBotStack } from '../lib/ChatBotStack/chatbot-stack';
import { LambdaStack } from '../lib/ChatBotStack/lambda-stack';
import { EdgeLambdaStack } from '../lib/ChatBotStack/edgelambda-stack';
interface Config {
  account: string;
}
const config : Config = require("../secrets/accountInfo");

const app = new cdk.App();
new ChatBotStack(app, 'ChatBotStack');
new LambdaStack(app, 'LambdaStack');
new EdgeLambdaStack(app, 'EdgeLambdaStack', {
  env: {
    account: config.account,
    region: "ap-northeast-1",
  }
})