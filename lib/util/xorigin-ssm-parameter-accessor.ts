import { Construct } from 'constructs';
import { AwsCustomResource, AwsCustomResourcePolicy, AwsSdkCall, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
interface SSMParameterReaderProps {
  action: "getParameter" | "putParameter" | "deleteParameter";
  parameters: {
    Name: string;
    Value?: string;
    Description?: string;
    Type?: string;
    Overwrite?: boolean;
  }
  region: string;
}

export class XOriginSSMParameterAccessor extends AwsCustomResource {
  constructor(scope: Construct, name: string, props: SSMParameterReaderProps) {
    const {action, parameters, region} = props;

    const ssmAwsSdkCall: AwsSdkCall = {
      service: "SSM",
      action,
      parameters,
      region,
      physicalResourceId: PhysicalResourceId.of(Date.now().toString()),
    };
    super(scope, name, { 
      onUpdate: ssmAwsSdkCall,
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: AwsCustomResourcePolicy.ANY_RESOURCE
      })
    });
  }

  public getParameterValue(): string {
    return this.getResponseField("Parameter.Value").toString();
  }
}