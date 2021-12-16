import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class S3Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // == const ==
    const hostingBucketName = "cdksnippethostingbucket";

    // == S3 ==
    const hostingBucket = new s3.Bucket(this, hostingBucketName, {
      bucketName: hostingBucketName,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false
      }),
      publicReadAccess: true,
      websiteIndexDocument: 'index.html',
      versioned: false,
      removalPolicy: RemovalPolicy.DESTROY, 
      autoDeleteObjects: true,
    });
  }
}