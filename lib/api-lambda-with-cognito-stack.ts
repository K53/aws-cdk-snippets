import { Stack, StackProps, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cwlogs from 'aws-cdk-lib/aws-logs';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export class ApiLambdaWithCognitoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // == const ========================================
    const funcName = "cdksnippetFunc";
    const apiName = "cdksnippetApi";
    const authZName = "cdksnippetauth";
    const apiStageName = "dev";
    const apiPathName = "test";
    const apiPath2Name = "test";
    const funcNameLogGroupName = `/aws/lambda/${funcName}`;
    const userPoolName = "cdksnippetuserpool";
    const userPoolAppClientName = "cdksnippetappclient";

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

    // == Cognito ========================================
    const userpool = new cognito.UserPool(this, userPoolName, {
      userPoolName: userPoolName,
      standardAttributes: {
        email: {required: true, mutable: true},
      },
      selfSignUpEnabled: true,
      signInCaseSensitive: false,
      autoVerify: {email: true},
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.DESTROY, // when you use for production, you should remove this property
    })
    userpool.addClient(userPoolAppClientName, {
      oAuth: {
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        flows: {
          authorizationCodeGrant: true,
        },
      },
      authFlows: {
        adminUserPassword: true, // ALLOW_ADMIN_USER_PASSWORD_AUTH
        custom: true, // ALLOW_CUSTOM_AUTH
        userPassword: false, // ALLOW_USER_PASSWORD_AUTH
        userSrp: true, // ALLOW_USER_SRP_AUTH
      }
    });

    // == API Gateway ========================================
    const myapi = new apigw.RestApi(this, apiName, {
      restApiName: apiName,
      deployOptions: {
        stageName: apiStageName,
      },
    })
    // Authorizer
    const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, authZName, {
      authorizerName: authZName,
      cognitoUserPools: [userpool],
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

    // == CloudWatch Logs ========================================
    new cwlogs.LogGroup(this, funcNameLogGroupName, {
      logGroupName: funcNameLogGroupName,
      retention: cwlogs.RetentionDays.ONE_DAY, // when you use for production, you should set longer value or clear this property
      removalPolicy: RemovalPolicy.DESTROY // when you use for production, you should remove this property
    })
  }
}
