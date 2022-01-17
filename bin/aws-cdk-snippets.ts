#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CodeCommitECRStack } from '../lib/AlbFargateRollingPipleine/codecommit-ecr-stack';
import { PipelineStack } from '../lib/AlbFargateRollingPipleine/pipeline-stack';
import { NetworkStack } from '../lib/AlbFargateRollingPipleine/network-stack';
import { AlbFargateStack } from '../lib/AlbFargateRollingPipleine/alb-fargate-stack';
type Environments = "dev" | "stag" | "prod"

const app = new cdk.App();
const env: Environments = app.node.tryGetContext("env");
if (!env || !["dev", "stag", "prod"].includes(env)) throw new Error("Invalid Parameter");
interface Accounts {
  account: string;
  dev: string;
  stag: string;
  prod: string;
}
const accounts: Accounts = require('../secrets/accountInfo');

new CodeCommitECRStack(app, 'CodeCommitECRStack', env, {
  env: {
    account: accounts[env],
    region: "us-east-1"
  }
});
new NetworkStack(app, 'NetworkStack', {
  env: {
    account: accounts[env],
    region: "us-east-1"
  }
})
new AlbFargateStack(app, 'AlbFargateStack', {
  env: {
    account: accounts[env],
    region: "us-east-1"
  }
});
new PipelineStack(app, 'PipelineStack', env, {
  env: {
    account: accounts[env],
    region: "us-east-1"
  }
});



