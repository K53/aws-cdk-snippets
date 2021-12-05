import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cwlogs from 'aws-cdk-lib/aws-logs';

export class ApiLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // == const ========================================
    const funcName = "cdksnippetFunc";
    const authZLambdaName = "authorizer";
    const apiName = "cdksnippetApi";
    const apiStageName = "dev";
    const apiPathName = "test";
    const apiPath2Name = "test";
    const funcNameLogGroupName = `/aws/lambda/${funcName}`;
    const authZLambdaNameLogGroupName = `/aws/lambda/${authZLambdaName}`;

    // == Lambda ========================================
    // * AWSLambdaBasicExecutionRole is attatched by standard
    // Resource Lambda
    const myfunc = new lambda.Function(this, funcName, {
      functionName: funcName,
      code: new lambda.AssetCode(`src/${funcName}`),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_14_X
    });
    // IAM Managed Policy
    myfunc.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["cloudfront:CreateInvalidation"], // Managed Policy
      resources: ["*"]
    }));

    // == API Gateway ========================================
    const myapi = new apigw.RestApi(this, apiName, {
      restApiName: apiName,
      deployOptions: {
        stageName: apiStageName,
      },
    });
    // Path
    const myapiPath = myapi.root.addResource(apiPathName);
    const myapiPath2 = myapiPath.addResource(apiPath2Name);
    // Method
    myapiPath.addMethod("GET", new apigw.LambdaIntegration(myfunc), {
      methodResponses: [
        {
          statusCode: "200",
        }
      ],
    });
    myapiPath2.addMethod("GET", new apigw.LambdaIntegration(myfunc), {
      methodResponses: [
        {
          statusCode: "200",
        }
      ],
    });

    // == CloudWatch Logs ========================================
    new cwlogs.LogGroup(this, authZLambdaNameLogGroupName, {
      logGroupName: authZLambdaNameLogGroupName,
      retention: cwlogs.RetentionDays.ONE_DAY, // when you use for production, you should set longer value or remove this property
      removalPolicy: RemovalPolicy.DESTROY // when you use for production, you should remove this property
    });
    new cwlogs.LogGroup(this, funcNameLogGroupName, {
      logGroupName: funcNameLogGroupName,
      retention: cwlogs.RetentionDays.ONE_DAY, // when you use for production, you should set longer value or clear this property
      removalPolicy: RemovalPolicy.DESTROY // when you use for production, you should remove this property
    });
  }
}
