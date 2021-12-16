#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CodeCommitStack } from '../lib/PipelineToS3/codecommit-stack';
import { S3Stack } from '../lib/PipelineToS3/s3-stack';
import { PipelineStack } from '../lib/PipelineToS3/pipeline-stack';

const app = new cdk.App();
new CodeCommitStack(app, 'CodeCommitStack');
new S3Stack(app, 'S3Stack');
new PipelineStack(app, 'PipelineStack');