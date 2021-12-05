import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cwlogs from 'aws-cdk-lib/aws-logs';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Tragts from 'aws-cdk-lib/aws-route53-targets';

interface Config {
  apigwCustomDomainName: string,
  apigwCertificateId: string,
  hostzoneId: string
}

const config: Config = require('../secrets/api-lambda-custom-domain-stack.json');

export class ApiLambdaCustomDomainStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // == const ========================================
    const funcName = "cdksnippetFunc";
    const apiName = "cdksnippetApi";
    const apiStageName = "dev";
    const apiPathName = "test";
    const apiPath2Name = "test";
    const apigwCustomDomainName = config.apigwCustomDomainName;
    const apigwCertificateId = config.apigwCertificateId;
    const apigwCertificateArn = `arn:aws:acm:${this.region}:${this.account}:certificate/${apigwCertificateId}`;
    const funcNameLogGroupName = `/aws/lambda/${funcName}`;
    const hostzoneId = config.hostzoneId;

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
      endpointTypes: [
        apigw.EndpointType.REGIONAL
      ],
      domainName: {
        domainName: apigwCustomDomainName,
        certificate: acm.Certificate.fromCertificateArn(this, "Certificate", apigwCertificateArn),
        securityPolicy: apigw.SecurityPolicy.TLS_1_2,
        endpointType: apigw.EndpointType.REGIONAL,
      }
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
    new cwlogs.LogGroup(this, funcNameLogGroupName, {
      logGroupName: funcNameLogGroupName,
      retention: cwlogs.RetentionDays.ONE_DAY, // when you use for production, you should set longer value or clear this property
      removalPolicy: RemovalPolicy.DESTROY // when you use for production, you should remove this property
    });

    // == Route53 ========================================
    const hostZone = route53.PublicHostedZone.fromHostedZoneAttributes(this, hostzoneId, {
      hostedZoneId: hostzoneId,
      zoneName: apigwCustomDomainName,
    });
    new route53.ARecord(this, `${hostzoneId}_ARecord`, {
      zone: hostZone,
      recordName: apigwCustomDomainName,
      target: route53.RecordTarget.fromAlias(
          new route53Tragts.ApiGateway(myapi),
      ),
    });
  }
}
