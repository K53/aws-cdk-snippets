import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';

interface Config {
  approvalEmailAddress: string;
}
const config: Config = require('../../secrets/AlbFargatePipleine');

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // == const ========================================
    const codecommitRepName = "cdksnippetcode";
    const snsTopicName = "cdksnippetTopicForApproval";
    const approvalEmailAddress = config.approvalEmailAddress;
    const buildProjectName = "cdksnippetBuildProj";
    const pipelineName = "cdksnippetPipeline";
    const vpcName = "cdksnippetVpc";
    const containerSecurityGroupName = "container_security_group";
    const deployRoleName = "cdksnippetRoleForDeployToECS";
    const codedeployApplicationName = "cdksnippetApp";

    // import
    // == VPC ==
    const myVpc = ec2.Vpc.fromLookup(this, vpcName, {
      vpcId: "vpc-047670359e58b2237",
    })
    const containerSecurityGroup = ec2.SecurityGroup.fromLookupByName(this, containerSecurityGroupName, containerSecurityGroupName, myVpc);

    // == IAM Role ==
    const deployRole = new iam.Role(this, deployRoleName, {
      roleName: deployRoleName,
      assumedBy: new iam.ServicePrincipal("codedeploy.amazonaws.com"),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("AWSCodeDeployRoleForECS")]
    })

    // == Artifact ==
    const sourceOutput = new codepipeline.Artifact('sourceOutput');
    const buildOutput = new codepipeline.Artifact("buildOutput");
  
    // == CodeCommit ==
    const repository = codecommit.Repository.fromRepositoryName(this, codecommitRepName, codecommitRepName);

    // == CodeBuild ==
    const buildProject = new codebuild.PipelineProject(this, buildProjectName, {
      projectName: buildProjectName,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        privileged: true,
      },
      vpc: myVpc,
      subnetSelection: { subnets: myVpc.privateSubnets },
      securityGroups: [containerSecurityGroup],
      buildSpec: codebuild.BuildSpec.fromSourceFilename("buildspec.yml"),
    });
    // this is AmazonEC2ContainerRegistryPowerUser policy.
    buildProject.addToRolePolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:GetRepositoryPolicy",
          "ecr:DescribeRepositories",
          "ecr:ListImages",
          "ecr:DescribeImages",
          "ecr:BatchGetImage",
          "ecr:GetLifecyclePolicy",
          "ecr:GetLifecyclePolicyPreview",
          "ecr:ListTagsForResource",
          "ecr:DescribeImageScanFindings",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage",
        ],
      })
    )

    // == SNS ==
    const snsTopic = new sns.Topic(this, snsTopicName, {
      topicName: snsTopicName,
    })
    snsTopic.addSubscription(new subscriptions.EmailSubscription(approvalEmailAddress))

    // == CodeDeploy Application ==
    const app = new codedeploy.EcsApplication(this, codedeployApplicationName);

    // == CodeDeploy DeploymentGroup ==
    /*
     * this function has not been supported by CFn and CDK yet. 
     * So, You have to set up manually. detail is in README.md.
     */
    // const deploymentGroup = new codedeploy.CfnDeploymentGroup(this, deploymentGroupName, {
    //   applicationName: deploymentGroupName,
    //   serviceRoleArn: deployRole.roleArn,
    // });

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
    });

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
    });
  }
}