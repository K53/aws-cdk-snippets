import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cwlogs from 'aws-cdk-lib/aws-logs';

export class ApiLambdaBySwaggerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // == const ========================================
    const thisClassName = this.constructor.name;
    const funcName = "cdksnippetFunc";
    const authZLambdaName = "authorizer";
    const apiName = "cdksnippetApi";
    const apiStageName = "dev";
    const funcNameLogGroupName = `/aws/lambda/${funcName}`;
    const authZLambdaNameLogGroupName = `/aws/lambda/${authZLambdaName}`;

    // == Lambda ========================================
    // * AWSLambdaBasicExecutionRole is attatched by standard
    // Authorizer Lambda
    const authorizerLambda = new lambda.Function(this, authZLambdaName, {
      functionName: authZLambdaName,
      code: new lambda.AssetCode(`src/${thisClassName}/lambda/${authZLambdaName}`),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_14_X
    });
    authorizerLambda.addEnvironment("BASIC_AUTH_USER", "cdktest1234");
    authorizerLambda.addEnvironment("BASIC_AUTH_PASS", "qwerty");
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
    // swagger.yaml have to contain "x-amazon-apigateway-integration" key because Lambda integration is defined in swagger.
    // when define path or lambda integration in cdk stack, it will be error.
    new apigw.SpecRestApi(this, apiName, {
        restApiName: apiName,
        deployOptions: {
            stageName: apiStageName,
        },
        apiDefinition: apigw.ApiDefinition.fromAsset(`src/${thisClassName}/apigateway/swagger.yaml`),
    })

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
