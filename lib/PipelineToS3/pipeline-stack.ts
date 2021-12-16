import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

interface Config {
  approvalEmailAddress: string;
}
const config: Config = require('../../secrets/PipelineToS3');

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // == const ==
    const codecommitRepName = "cdksnippet";
    const hostingBucketName = "cdksnippethostingbucket";
    const snsTopicName = "cdksnippetTopicForApproval";
    const approvalEmailAddress = config.approvalEmailAddress;
    const buildProjectName = "cdksnippetBuildProj";
    const pipelineName = "cdksnippetPipeline";

    // == S3 ==
    const dist_bucket = s3.Bucket.fromBucketAttributes(this, hostingBucketName, {
      bucketName: hostingBucketName,
    });
  
    // == Artifact ==
    const sourceOutput = new codepipeline.Artifact('sourceOutput');
    const buildOutput = new codepipeline.Artifact("buildOutput");
  
    // == SNS ==
    const snsTopic = new sns.Topic(this, snsTopicName, {
      topicName: snsTopicName,
    })

    snsTopic.addSubscription(new subscriptions.EmailSubscription(approvalEmailAddress))

    // == CodeCommit ==
    const repository = codecommit.Repository.fromRepositoryName(this, codecommitRepName, codecommitRepName);

    // == CodeBuild ==
    const buildProject = new codebuild.PipelineProject(this, buildProjectName, {
        projectName: buildProjectName,
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        },
        buildSpec: codebuild.BuildSpec.fromSourceFilename("buildspec.yml"),
    });

    // == CodePipeline ==
    const pipeline = new codepipeline.Pipeline(this, pipelineName, {
        pipelineName: pipelineName,
    });

    // == CodePipeline Actions == 
    const sourceAction = new codepipeline_actions.CodeCommitSourceAction({
      actionName: "Suorce",
      repository: repository,
      branch: "master",
      trigger: codepipeline_actions.CodeCommitTrigger.EVENTS,
      output: sourceOutput,
    });
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: "Build",
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
    });
    const approvalAction = new codepipeline_actions.ManualApprovalAction({
      actionName: "Approval",
      notificationTopic: snsTopic,
    })
    const deployAction = new codepipeline_actions.S3DeployAction({
      actionName: "Deploy",
      bucket: dist_bucket,
      input: buildOutput,
      extract: true,
    })

    pipeline.addStage({
      stageName: "Source",
      actions: [sourceAction]
    });
    pipeline.addStage({
      stageName: "Build",
      actions: [buildAction]
    });
    pipeline.addStage({
      stageName: "Approval",
      actions: [approvalAction]
    })
    pipeline.addStage({
      stageName: "Deploy",
      actions: [deployAction]
    });
  }
}
