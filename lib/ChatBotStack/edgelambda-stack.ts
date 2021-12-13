import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cwlogs from 'aws-cdk-lib/aws-logs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from "aws-cdk-lib/aws-sns";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cwactions from "aws-cdk-lib/aws-cloudwatch-actions";

export class EdgeLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // == const ==
    const funcName = "cdksnippetEdgeFunc";
    const funcLogGroupName = `/aws/lambda/us-east-1.${funcName}`;
    const notifyToSlackMetricNameSpaceName = "notifyToSlack";
    const funcMetricFilterName = `${funcName}Metric`;
    const filterPatternString = "ERROR";
    const notifyToSlackAlarmName = `${funcName}NotifyToSlackAlarm`;
    const snsTopicName = "cdksnippetTopic";

    // == import ========================================
    const notifyTopic = sns.Topic.fromTopicArn(this, snsTopicName, `arn:aws:sns:${this.region}:${this.account}:${snsTopicName}`);

    const hostingBucketName = "cdksnippethostingbucket";
    const cloudfrontDistributionName = "cdksnippetDistribution";

    // == S3 ==
    // Hosting Bucket
    const hostingBucket = new s3.Bucket(this, hostingBucketName, {
      bucketName: hostingBucketName,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false
      }),
      versioned: false,
      removalPolicy: RemovalPolicy.DESTROY, // when you use for production, you should remove this property
      autoDeleteObjects: true,  // when you use for production, you should remove this property
    });

    // == Lambda@Edge ==
    const myEdgefunc = new cloudfront.experimental.EdgeFunction(this, funcName, {
      functionName: funcName,
      code: new lambda.AssetCode(`src/ChatBotStack/edgelambda/${funcName}`),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_14_X,
    });

    // == CloudFront ==
    const cloudfrontDistribution = new cloudfront.Distribution(this, cloudfrontDistributionName, {
      enabled: true,
      defaultRootObject: "index.html",
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      defaultBehavior: {
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        origin: new cloudfront_origins.S3Origin(hostingBucket),
        edgeLambdas: [{
          functionVersion: myEdgefunc.currentVersion,
          eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
        }],
      },
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