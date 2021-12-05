import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigw from 'aws-cdk-lib/aws-apigateway';

export class ApiLambdaWithBasicAuthStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // == const ========================================
    const funcName = "cdksnippetFunc";
    const authZLambdaName = "authorizer";
    const authZName = "cdksnippetauthz";
    const apiName = "cdksnippetApi";
    const apiStageName = "dev";
    const apiPathName = "test";
    const apiPath2Name = "test";

    // == Lambda ========================================
    // * AWSLambdaBasicExecutionRole is attatched by standard
    // Authorizer Lambda
    const authorizerLambda = new lambda.Function(this, authZLambdaName, {
      functionName: authZLambdaName,
      code: new lambda.AssetCode(`src/${authZLambdaName}`),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_14_X
    });
    authorizerLambda.addEnvironment("BASIC_AUTH_USER", "cdktest1234");
    authorizerLambda.addEnvironment("BASIC_AUTH_PASS", "qwerty");
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
    })
    // Authorizer
    const authorizer = new apigw.RequestAuthorizer(this, authZName, {
      handler: authorizerLambda,
      authorizerName: authZName,
      identitySources: [apigw.IdentitySource.header("Authorization")], // add required header for authorization.
      resultsCacheTtl: Duration.minutes(0)
    })
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
      authorizer: authorizer
    });
    myapiPath2.addMethod("GET", new apigw.LambdaIntegration(myfunc), {
      methodResponses: [
        {
          statusCode: "200",
        }
      ],
      authorizer: authorizer
    });
  }
}
