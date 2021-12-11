import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { XOriginSSMParameterAccessor } from './xorigin-ssm-parameter-accessor';

export class WafForCloudFrontStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // == const ==
    const wafName = "cdksnippetwaf";
    const ssmParamsName = "/cdk-params/wafArn";

    // == WAF ==
    const myWaf = new wafv2.CfnWebACL(this, wafName, {
      defaultAction: { allow: {} },
      name: wafName,
      rules: [
        {
          priority: 1,
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `${wafName}-AWSManagedRulesAmazonIpReputationList`,
          },
          name: `${wafName}-AWSManagedRulesAmazonIpReputationList`,
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesAmazonIpReputationList"
            }
          }
        }
      ],
      scope: "CLOUDFRONT",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `${wafName}`,
        sampledRequestsEnabled: true
      }
    });

    // == export ==
    new ssm.StringParameter(this, 'Route53HostedZoneIdSSMParam', {
      parameterName: ssmParamsName,
      description: 'WAF arn for cdk',
      stringValue: myWaf.attrArn,
    });
    new XOriginSSMParameterAccessor(this, "XOriginSSMParameterAccessor", {
      action: "putParameter",
      parameters: {
        Name: ssmParamsName,
        Value: myWaf.attrArn,
        Description: 'WAF arn for cdk',
        Type: "String",
        Overwrite: true
      },
      region: 'ap-northeast-1',
    });
  }
}