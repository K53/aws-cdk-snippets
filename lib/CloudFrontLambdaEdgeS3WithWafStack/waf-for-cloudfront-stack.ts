import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as ssm from 'aws-cdk-lib/aws-ssm';
// if you put the parameter (waf acl arn) to ssm parameter store in other region, uncomment here.
// import { XOriginSSMParameterAccessor } from '../util/xorigin-ssm-parameter-accessor';

interface Config {
  allowIpList: string[];
}

const config: Config = require('../../secrets/CloudFrontLambdaEdgeS3WithWafStack');

export class WafForCloudFrontStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // == const ==
    const wafName = "cdksnippetwaf";
    const wafIpsetName = "WhiteIPList";
    const ssmParamsName = "/cdk-params/wafArn";

    // == WAF ==
    const myIpSet = new wafv2.CfnIPSet(this, wafIpsetName, {
      name: wafIpsetName,
      addresses: config.allowIpList,
      ipAddressVersion: "IPV4",
      scope: "CLOUDFRONT",
    });

    const myWaf = new wafv2.CfnWebACL(this, wafName, {
      defaultAction: { block: {} },
      name: wafName,
      rules: [
        // the case using aws managed rule (cancel bad input request)
        {
          priority: 1,
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `${wafName}-AWSManagedRulesKnownBadInputsRuleSet`,
          },
          name: `${wafName}-AWSManagedRulesKnownBadInputsRuleSet`,
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesKnownBadInputsRuleSet"
            }
          }
        },
        // the case using custom rule (white IP list)
        {
          priority: 2,
          action: { allow: {} },
          name: `${wafName}-CustomAllowIpSetRule`,
          statement: {
            ipSetReferenceStatement: {
              arn: myIpSet.attrArn
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `${wafName}-CustomAllowIpSetRule`,
          },
        },
      ],
      scope: "CLOUDFRONT",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `${wafName}`,
        sampledRequestsEnabled: true
      }
    });

    // == export ==
    new ssm.StringParameter(this, 'SSMParamWafArn', {
      parameterName: ssmParamsName,
      description: 'WAF arn for cdk',
      stringValue: myWaf.attrArn,
    });
    // new XOriginSSMParameterAccessor(this, "XOriginSSMParameterAccessor", {
    //   action: "putParameter",
    //   parameters: {
    //     Name: ssmParamsName,
    //     Value: myWaf.attrArn,
    //     Description: 'WAF arn for cdk',
    //     Type: "String",
    //     Overwrite: true
    //   },
    //   region: 'ap-northeast-1',
    // });
  }
}