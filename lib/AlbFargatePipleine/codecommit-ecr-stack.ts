import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as ecr from 'aws-cdk-lib/aws-ecr';

export class CodeCommitECRStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // == const ==
    const codecommitRepName = "cdksnippetcode";
    const ecrRepositoryName = "cdksnippetecr";

    // == CodeCommit ==
    const myRepository = new codecommit.Repository(this, codecommitRepName, {
      repositoryName: codecommitRepName,
    })
    myRepository.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // == ECR == 
    // now ECR do not support to delete image automatically.
    const myEcr = new ecr.Repository(this, ecrRepositoryName, {
      repositoryName: ecrRepositoryName,
      removalPolicy: RemovalPolicy.DESTROY,
    })
  }
}