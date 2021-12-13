#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ChatBotStack } from '../lib/ChatBotStack/chatbot-stack';
import { LambdaStack } from '../lib/ChatBotStack/lambda-stack';

const app = new cdk.App();
new ChatBotStack(app, 'ChatBotStack');
new LambdaStack(app, 'LambdaStack');