import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cwlogs from 'aws-cdk-lib/aws-logs';

interface Config {
  slackUrl: string
}

const config: Config = require('../secrets/lambda-with-layer-stack.json');

export class lambdaWithLayerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // == const ========================================
    const thisClassName = this.constructor.name;
    const funcName = "useLayer";
    const funcNameLogGroupName = `/aws/lambda/${funcName}`;
    const layerName = "myLayer";
    const slackUrl = config.slackUrl;
  
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
      layers: [myLayer],
    });
    myfunc.addEnvironment("API_URL", slackUrl);

    // == CloudWatch Logs ========================================
    new cwlogs.LogGroup(this, funcNameLogGroupName, {
      logGroupName: funcNameLogGroupName,
      retention: cwlogs.RetentionDays.ONE_DAY, // when you use for production, you should set longer value or clear this property
      removalPolicy: RemovalPolicy.DESTROY // when you use for production, you should remove this property
    });
  }
}
