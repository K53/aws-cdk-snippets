import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
type Environments = "dev" | "stag" | "prod"

interface Accounts {
  account: string;
  dev: string;
  stag: string;
  prod: string;
}

interface Config {
  approvalEmailAddress: string;
}
const config: Config = require('../../secrets/AlbFargateRollingPipleine');
const accounts: Accounts = require('../../secrets/accountInfo');

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, env: Environments, props?: StackProps) {
    super(scope, id, props);

    // == const ========================================
    // const envParams = this.node.tryGetContext(env);
    // const commonParams = this.node.tryGetContext("common");
    const devAccount = accounts.dev;
    const stagAccount = accounts.stag;
    // const prodAccount = accounts.prod;
    const codecommitRepName = "cdksnippetcode";
    const snsTopicName = "cdksnippetTopicForApproval";
    const approvalEmailAddress = config.approvalEmailAddress;
    const buildProjectName = "cdksnippetBuildProj";
    const pipelineName = "cdksnippetPipeline";
    const vpcName = "cdksnippetVpc";
    const containerSecurityGroupName = "container_security_group";
    const vpcIdSsmParamsName = "/cdk-params/vpcId";
    const ecrRepositoryName = "cdksnippetecr";
    const clusterName = "cdksnippetCluster";
    const fargateServiceName = "cdksnippetService";
    const xaccountAccessRoleAssumedByStagName = "xaccountAccessRoleAssumedByStag";
    const xaccountAccessRoleAssumedByProdName = "xaccountAccessRoleAssumedByProd";
    const commitTriggerEventRuleNameForStag = "commitTriggerRuleForStag";
    const commitTriggerEventRuleNameForProd = "commitTriggerRuleForProd";
    const commitTriggerEventBusName = "commitTriggerEventBus";
    const commitTriggerReceiverRuleName = "commitTriggerReceiveRuleName";
    const triggerBranch = env === "dev" ? "master": env === "stag" ? "staging" : "production"; // Recommend: use cdk.json

    // == import ==
    const vpcId = ssm.StringParameter.valueFromLookup(this, vpcIdSsmParamsName);

    // == VPC ==
    const myVpc = ec2.Vpc.fromLookup(this, vpcName, {
      vpcId: vpcId,
    })
    const containerSecurityGroup = ec2.SecurityGroup.fromLookupByName(this, containerSecurityGroupName, containerSecurityGroupName, myVpc);

    // == CodeCommit ==
    const repository = codecommit.Repository.fromRepositoryName(this, codecommitRepName, codecommitRepName);
    
    // == IAM to access CodeCommit ==
    // this is only Dev environment
    if (env == "dev") {
      // for stag
      const roleAssumedByStag = new iam.Role(this, xaccountAccessRoleAssumedByStagName, {
        roleName: xaccountAccessRoleAssumedByStagName,
        assumedBy: new iam.AccountPrincipal(stagAccount),
      });
      roleAssumedByStag.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "s3:PutObject",
          "s3:PutObjectAcl",
        ],
        resources: ["*"]
      }));
      roleAssumedByStag.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "kms:DescribeKey",
          "kms:GenerateDataKey*",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:Decrypt",
        ],
        resources: ["*"]
      }));
      roleAssumedByStag.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "codecommit:GetBranch",
          "codecommit:GetCommit",
          "codecommit:UploadArchive",
          "codecommit:GetUploadArchiveStatus",
          "codecommit:CancelUploadArchive",
        ],
        resources: [
          repository.repositoryArn,
        ]
      }));
      // For Prod
      // const roleAssumedByProd = new iam.Role(this, xaccountAccessRoleAssumedByProdName, {
      //   roleName: xaccountAccessRoleAssumedByProdName,
      //   assumedBy: new iam.AccountPrincipal(prodAccount),
      // });
      // roleAssumedByProd.addToPolicy(new iam.PolicyStatement({
      //   effect: iam.Effect.ALLOW,
      //   actions: [
      //     "s3:PutObject",
      //     "s3:PutObjectAcl",
      //   ],
      //   resources: ["*"]
      // }));
      // roleAssumedByProd.addToPolicy(new iam.PolicyStatement({
      //   effect: iam.Effect.ALLOW,
      //   actions: [
      //     "kms:DescribeKey",
      //     "kms:GenerateDataKey*",
      //     "kms:Encrypt",
      //     "kms:ReEncrypt*",
      //     "kms:Decrypt",
      //   ],
      //   resources: ["*"]
      // }));
      // roleAssumedByProd.addToPolicy(new iam.PolicyStatement({
      //   effect: iam.Effect.ALLOW,
      //   actions: [
      //     "codecommit:GetBranch",
      //     "codecommit:GetCommit",
      //     "codecommit:UploadArchive",
      //     "codecommit:GetUploadArchiveStatus",
      //     "codecommit:CancelUploadArchive",
      //   ],
      //   resources: [
      //     repository.repositoryArn,
      //   ]
      // }));
    } else {
      // Role to CodeCommit
    }

    // == Artifact ==
    const sourceOutput = new codepipeline.Artifact('sourceOutput');
    const buildOutput = new codepipeline.Artifact("buildOutput");
    let artifactBucket;
    if (env !== "dev") {
      // == KMS ==
      const artifactKey = new kms.Key(this, "ArtifactKey", {
        enableKeyRotation: true,
      });
      // == Artifact (from repository) ==
      artifactBucket = new s3.Bucket(this, "ArtifactBucket", {
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: artifactKey,
      });
      artifactBucket.grantReadWrite(new iam.ArnPrincipal(`arn:aws:iam::${devAccount}:role/${xaccountAccessRoleAssumedByStagName}`));
    }

    // == CodeBuild ==
    const buildProject = new codebuild.PipelineProject(this, buildProjectName, {
      projectName: buildProjectName,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        privileged: true,
      },
      cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER),
      vpc: myVpc,
      subnetSelection: { subnets: myVpc.privateSubnets },
      securityGroups: [containerSecurityGroup],
      buildSpec: codebuild.BuildSpec.fromSourceFilename("buildspec.yml"),
      environmentVariables: {
        ECR_REPOSITORY_NAME: {
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
          value: ecrRepositoryName,
        },
      }
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

    // == CodePipeline ==
    const pipeline = new codepipeline.Pipeline(this, pipelineName, {
      artifactBucket: env === "dev" ? undefined : artifactBucket,
      pipelineName: pipelineName,
    });
    if (env !== "dev") {
      pipeline.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["sts:AssumeRole"],
        resources: [`arn:aws:iam::${devAccount}:role/*`],
      }))
    }

    // == CodePipeline Actions == 
    const sourceAction = new codepipeline_actions.CodeCommitSourceAction({
      actionName: "Suorce",
      repository: repository,
      branch: triggerBranch,
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
    const deployAction = new codepipeline_actions.EcsDeployAction({
      actionName: "Deploy",
      service: ecs.FargateService.fromFargateServiceAttributes(this, "distinationService", {
        serviceArn: `arn:aws:ecs:${this.region}:${this.account}:cluster/${clusterName}/${fargateServiceName}`,
        cluster: ecs.Cluster.fromClusterAttributes(this, "distinationCluster", {
          clusterName: clusterName,
          vpc: myVpc,
          securityGroups: [],
        })
      }),
      input: buildOutput
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
    pipeline.addStage({
      stageName: "Deploy",
      actions: [deployAction]
    });

    // == EventBus ==

    if (env === "dev") {
      const commitTriggerEventRuleForStag = new events.Rule(this, commitTriggerEventRuleNameForStag, {
        eventPattern: {
          source: [
            "aws.codecommit"
          ],
          resources: [
            `arn:aws:codecommit:us-east-1:${devAccount}:${codecommitRepName}`
          ],
          detailType: [
            "CodeCommit Repository State Change"
          ],
          detail: {
            "event": ["referenceCreated", "referenceUpdated"],
            "referenceName": [
              "staging"
            ]
          }
        },
        targets: [new events_targets.EventBus(
          events.EventBus.fromEventBusArn(
            this,
            `${commitTriggerEventBusName}Stag`,
            `arn:aws:events:us-east-1:${stagAccount}:event-bus/${commitTriggerEventBusName}`,
          ),
        )]
      });
      // const commitTriggerEventRuleForProd = new events.Rule(this, commitTriggerEventRuleNameForProd, {
      //   eventPattern: {
      //     source: [
      //       "aws.codecommit"
      //     ],
      //     resources: [
      //       `arn:aws:codecommit:us-east-1:${devAccount}:${codecommitRepName}`
      //     ],
      //     detailType: [
      //       "CodeCommit Repository State Change"
      //     ],
      //     detail: {
      //       "event": ["referenceCreated", "referenceUpdated"],
      //       "referenceName": [
      //         "production"
      //       ]
      //     }
      //   },
      //   targets: [new events_targets.EventBus(
      //     events.EventBus.fromEventBusArn(
      //       this,
      //       `${commitTriggerEventBusName}Prod`,
      //       `arn:aws:events:us-east-1:${prodAccount}:event-bus/${commitTriggerEventBusName}`,
      //     ),
      //   )]
      // });
    } else {
      // Stag & Prod
      const commitTriggerEventBus = new events.EventBus(this, commitTriggerEventBusName, {
        eventBusName: commitTriggerEventBusName
      });
      new events.CfnEventBusPolicy(this, `${commitTriggerEventBusName}Policy`, {
        action: "events:PutEvents",
        eventBusName: commitTriggerEventBus.eventBusName,
        principal: devAccount,
        statementId: `AcceptEventFrom${devAccount}`,
      })
      const commitTriggerReceiverRule = new events.Rule(this, commitTriggerReceiverRuleName, {
        eventBus: commitTriggerEventBus,
        eventPattern: {
          source: [
            "aws.codecommit"
          ],
          resources: [
            `arn:aws:codecommit:us-east-1:${devAccount}:${codecommitRepName}`
          ],
          detailType: [
            "CodeCommit Repository State Change"
          ],
          detail: {
            "event": ["referenceCreated", "referenceUpdated"],
            "referenceName": [
              triggerBranch
            ]
          }
        } ,
        targets: [new events_targets.CodePipeline(
          pipeline
        )]
      });
    }
  }
}