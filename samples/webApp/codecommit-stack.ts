import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';

export class CodeCommitStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // == const ==
    const codecommitRepName = "cdksnippet";

    // == CodeCommit ==
    const myRepository = new codecommit.Repository(this, codecommitRepName, {
        repositoryName: codecommitRepName,
    })
    myRepository.applyRemovalPolicy(RemovalPolicy.DESTROY);
  }
}