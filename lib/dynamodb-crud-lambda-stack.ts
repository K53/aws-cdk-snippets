import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cwlogs from 'aws-cdk-lib/aws-logs';

export class DynamodbCRUDLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // == const ========================================
    const thisClassName = this.constructor.name;
    const funcName = "dynamodbcrud";
    const funcNameLogGroupName = `/aws/lambda/${funcName}`;
    const dynamodbTableName = "cdksnippetTable";
    const dynamodbPartitionKey = "testId";
    const ttlKey = "expiration";
    const recordLifetime = String(60 * 60) // = 1hr
  
    // == DynamoDB ========================================
    const table = new dynamodb.Table(this, dynamodbTableName, {
        tableName: dynamodbTableName,
        partitionKey: {
            type: dynamodb.AttributeType.STRING,
            name: dynamodbPartitionKey,
        },
        removalPolicy: RemovalPolicy.DESTROY,
        timeToLiveAttribute: ttlKey,
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
    myfunc.addEnvironment("TABLE_NAME", table.tableName);
    myfunc.addEnvironment("RECORD_LIFETIME", recordLifetime);
    table.grantReadWriteData(myfunc);

    // == CloudWatch Logs ========================================
    new cwlogs.LogGroup(this, funcNameLogGroupName, {
      logGroupName: funcNameLogGroupName,
      retention: cwlogs.RetentionDays.ONE_DAY, // when you use for production, you should set longer value or clear this property
      removalPolicy: RemovalPolicy.DESTROY // when you use for production, you should remove this property
    });
  }
}
