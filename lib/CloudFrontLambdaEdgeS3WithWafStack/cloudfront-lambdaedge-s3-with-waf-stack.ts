import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { XOriginSSMParameterAccessor } from '../util/xorigin-ssm-parameter-accessor';

export class CloudFrontLambdaEdgeS3WithWafStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // == const ==
    const thisClassName = this.constructor.name;
    const viewerReqEdgefuncName = "basicAuth";
    const originResEdgefuncName = "responseOverwrite";
    const hostingBucketName = "cdksnippethostingbucket";
    const oaiName = "cdksnippet";
    const cloudfrontDistributionName = "cdksnippetDistribution";
    const ssmParamsName = "/cdk-params/wafArn";

    // == import ==
    const wafAttrArnReader = new XOriginSSMParameterAccessor(this, `SSMParameterReader`, {
      action: "getParameter",
      parameters: {
        Name: ssmParamsName,
      },
      region: 'us-east-1',
    });

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

    // Bucket Contents Upload
    new s3deploy.BucketDeployment(this, "deployToS3", {
      destinationBucket: hostingBucket,
      sources: [s3deploy.Source.asset(`src/${thisClassName}/s3Contents`)],
    })

    // == Lambda@Edge ==
    const viewerReqEdgefunc = new cloudfront.experimental.EdgeFunction(this, viewerReqEdgefuncName, {
      functionName: viewerReqEdgefuncName,
      code: new lambda.AssetCode(`src/${thisClassName}/edgelambda/${viewerReqEdgefuncName}`),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_14_X,
    });
    const originResEdgefunc = new cloudfront.experimental.EdgeFunction(this, originResEdgefuncName, {
      functionName: originResEdgefuncName,
      code: new lambda.AssetCode(`src/${thisClassName}/edgelambda/${originResEdgefuncName}`),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_14_X,
    });

    // == CloudFront ==
    const oai = new cloudfront.OriginAccessIdentity(this, oaiName, {
      comment: `s3-bucket-${hostingBucketName}`
    });

    const cloudfrontDistribution = new cloudfront.Distribution(this, cloudfrontDistributionName, {
      enabled: true,
      defaultRootObject: "index.html",
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      defaultBehavior: {
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        origin: new cloudfront_origins.S3Origin(
          hostingBucket, {
            originAccessIdentity: oai
          },
        ),
        // originRequestPolicy: cloudfront.OriginRequestPolicy.
        edgeLambdas: [{
          functionVersion: viewerReqEdgefunc.currentVersion,
          eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
        }, {
          functionVersion: originResEdgefunc.currentVersion,
          eventType: cloudfront.LambdaEdgeEventType.ORIGIN_RESPONSE,
        }],
      },
      webAclId: wafAttrArnReader.getParameterValue(),
    });

    hostingBucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["s3:GetObject"],
      principals: [
        new iam.CanonicalUserPrincipal(oai.cloudFrontOriginAccessIdentityS3CanonicalUserId)
      ],
      resources: [
        `${hostingBucket.bucketArn}/*`
      ],
    }));
  }
}