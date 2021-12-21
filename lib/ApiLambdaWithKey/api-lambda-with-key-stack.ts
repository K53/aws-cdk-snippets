import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cwlogs from 'aws-cdk-lib/aws-logs';

export class ApiLambdaWithKeyStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // == const ========================================
    const thisClassName = this.constructor.name;
    const funcName = "cdksnippetFunc2";
    const apiName = "cdksnippetApi";
    const apiStageName = "dev";
    const apiPathName = "test";
    const apiPath2Name = "test";
    const apiKeyName = "cdksnippetKey";
    const apiKeyUsagePalnName = "cdksnippetApiUsage";
    const funcNameLogGroupName = `/aws/lambda/${funcName}`;

    // == Lambda ========================================
    // * AWSLambdaBasicExecutionRole is attatched by standard
    // Resource Lambda
    const myfunc = new lambda.Function(this, funcName, {
      functionName: funcName,
      code: new lambda.AssetCode(`src/${thisClassName}/lambda/${funcName}`),
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
      apiKeyRequired: true,
    });

    // Usage Plan & API Key
    const apiUsagePlan = myapi.addUsagePlan(apiKeyUsagePalnName, {
      name: apiKeyUsagePalnName,
      throttle: {
        rateLimit: 10,
        burstLimit: 2,
      },
    });

    apiUsagePlan.addApiStage({
      stage: myapi.deploymentStage
    })

    const apiKey = myapi.addApiKey(apiKeyName, {
      apiKeyName: apiKeyName,
    });
    apiUsagePlan.addApiKey(apiKey);

    // == CloudWatch Logs ========================================
    new cwlogs.LogGroup(this, funcNameLogGroupName, {
      logGroupName: funcNameLogGroupName,
      retention: cwlogs.RetentionDays.ONE_DAY, // when you use for production, you should set longer value or clear this property
      removalPolicy: RemovalPolicy.DESTROY // when you use for production, you should remove this property
    });
  }
}
