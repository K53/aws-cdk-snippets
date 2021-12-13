import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cwlogs from 'aws-cdk-lib/aws-logs';
import * as sns from "aws-cdk-lib/aws-sns";
import * as cwactions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";

export class LambdaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // == const ========================================
    const funcName = "cdksnippetFunc";
    const funcLogGroupName = `/aws/lambda/${funcName}`;
    const notifyToSlackMetricNameSpaceName = "notifyToSlack";
    const funcMetricFilterName = `${funcName}Metric`;
    const filterPatternString = "ERROR";
    const notifyToSlackAlarmName = "notifyToSlackAlarm";
    const snsTopicName = "cdksnippetTopic";

    // == import ========================================
    const notifyTopic = sns.Topic.fromTopicArn(this, snsTopicName, `arn:aws:sns:${this.region}:${this.account}:${snsTopicName}`);

    // == Lambda ========================================
    // * AWSLambdaBasicExecutionRole is attatched by standard
    // Resource Lambda
    const myFunc = new lambda.Function(this, funcName, {
      functionName: funcName,
      code: new lambda.AssetCode(`src/ChatBotStack/lambda/${funcName}`),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_14_X,
    });

    // == CloudWatch Logs ========================================
    const myFuncLogGroup = new cwlogs.LogGroup(this, funcLogGroupName, {
      logGroupName: funcLogGroupName,
      retention: cwlogs.RetentionDays.ONE_DAY, // when you use for production, you should set longer value or clear this property
      removalPolicy: RemovalPolicy.DESTROY // when you use for production, you should remove this property
    });
    const metricFilter = myFuncLogGroup.addMetricFilter(funcMetricFilterName, {
      metricNamespace: notifyToSlackMetricNameSpaceName,
      metricName: funcMetricFilterName,
      filterPattern: { logPatternString: filterPatternString },
    });

    // == CloudWatch Alarm ========================================
    const myAlarm = new cloudwatch.Alarm(this, notifyToSlackAlarmName, {
      alarmName: notifyToSlackAlarmName,
      metric: metricFilter.metric(),
      actionsEnabled: true,
      threshold: 0,
      evaluationPeriods: 5,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });
    const notifyAction = new cwactions.SnsAction(notifyTopic);
    myAlarm.addAlarmAction(notifyAction);
  }
}