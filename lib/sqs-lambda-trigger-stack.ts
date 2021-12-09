import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEvents from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cwlogs from 'aws-cdk-lib/aws-logs';
import * as sqs from 'aws-cdk-lib/aws-sqs';

interface Config {
  slackUrl: string
}

const config: Config = require('../secrets/sqs-lambda-trigger-stack.json');

export class SqsLambdaTriggerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // == const ========================================
    const thisClassName = this.constructor.name;
    const funcName = "cdksnippetFunc";
    const funcNameLogGroupName = `/aws/lambda/${funcName}`;
    const notifyFuncName = "notifyToSlackByDLQ";
    const notifyFuncNameLogGroupName = `/aws/lambda/${notifyFuncName}`;
    const layerName = "myLayer";
    const sqsQueueName = "cdksnippetQueue";
    const sqsDLQName = "cdksnippetDLQ";
    const slackUrl = config.slackUrl;
  
    // == SQS ========================================
    const dlq = new sqs.Queue(this, sqsDLQName, {
      queueName: sqsDLQName,
    });
    
    const queue = new sqs.Queue(this, sqsQueueName, {
      queueName: sqsQueueName,
      deadLetterQueue: {
        maxReceiveCount: 1,
        queue: dlq,
      }
    });

    // == Layer ========================================
    const myLayer = new lambda.LayerVersion(this, layerName, {
      layerVersionName: layerName,
      code: lambda.AssetCode.fromAsset(`src/${thisClassName}/layer/${layerName}`),
      compatibleRuntimes: [lambda.Runtime.NODEJS_14_X],
    });

    // == Lambda ========================================
    // * AWSLambdaBasicExecutionRole is attatched by standard
    // Resource Lambda
    const myfunc = new lambda.Function(this, funcName, {
      functionName: funcName,
      code: new lambda.AssetCode(`src/${thisClassName}/lambda/${funcName}`),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_14_X,
    });
    // IAM Managed Policy
    // myfunc.addToRolePolicy(new iam.PolicyStatement({
    //   effect: iam.Effect.ALLOW,
    //   actions: ["cloudfront:CreateInvalidation"], // Managed Policy
    //   resources: ["*"]
    // }));
    // Add SQS Trigger
    myfunc.addEventSource(new lambdaEvents.SqsEventSource(queue, {
      batchSize: 1,
    }));

    const dlqNotifyFunc = new lambda.Function(this, notifyFuncName, {
      functionName: notifyFuncName,
      code: new lambda.AssetCode(`src/${thisClassName}/lambda/${notifyFuncName}`),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_14_X,
      layers: [myLayer],
    });
    dlqNotifyFunc.addEnvironment("SLACK_URL", slackUrl);
    // Add SQS Trigger
    dlqNotifyFunc.addEventSource(new lambdaEvents.SqsEventSource(dlq));

    // == CloudWatch Logs ========================================
    new cwlogs.LogGroup(this, funcNameLogGroupName, {
      logGroupName: funcNameLogGroupName,
      retention: cwlogs.RetentionDays.ONE_DAY, // when you use for production, you should set longer value or clear this property
      removalPolicy: RemovalPolicy.DESTROY // when you use for production, you should remove this property
    });
    new cwlogs.LogGroup(this, notifyFuncNameLogGroupName, {
      logGroupName: notifyFuncNameLogGroupName,
      retention: cwlogs.RetentionDays.ONE_DAY, // when you use for production, you should set longer value or clear this property
      removalPolicy: RemovalPolicy.DESTROY // when you use for production, you should remove this property
    });
  }
}
