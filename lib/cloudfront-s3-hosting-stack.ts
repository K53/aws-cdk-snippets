import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';

export class CloudFrontS3HostingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // == const ==
    const thisClassName = this.constructor.name;
    const hostingBucketName = "cdksnippethostingbucket";
    const oaiName = "cdksnippet";
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

    // Bucket Contents Upload
    new s3deploy.BucketDeployment(this, "deployToS3", {
      destinationBucket: hostingBucket,
      sources: [s3deploy.Source.asset(`src/${thisClassName}`)],
    })

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
          }
        )
      }
    });

    hostingBucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["s3:GetObject"],
      principals: [
        new iam.CanonicalUserPrincipal(oai.cloudFrontOriginAccessIdentityS3CanonicalUserId)
      ],
      resources: [
        `${hostingBucket.bucketArn}/*`
      ]
    }));
  }
}