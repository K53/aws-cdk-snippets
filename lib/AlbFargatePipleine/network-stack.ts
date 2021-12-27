import { Stack, StackProps, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export class NetworkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // == const ========================================
    const albSecurityGroupName = "alb_security_group";
    const containerSecurityGroupName = "container_security_group";
    const vpcName = "cdksnippetVpc";
    const vpcIdSsmParamsName = "/cdk-params/vpcId";

    // == VPC ==
    const myVpc = new ec2.Vpc(this, vpcName, {
      cidr: "10.2.0.0/16",
      vpcName: vpcName,
      enableDnsSupport: true,
      enableDnsHostnames: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        },
      ],
      maxAzs: 2,
    });

    // == Security Group ==
    const albSecurityGroup = new ec2.SecurityGroup(this, albSecurityGroupName, {
      securityGroupName: albSecurityGroupName,
      vpc: myVpc,
    })
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));

    const containerSecurityGroup = new ec2.SecurityGroup(this, containerSecurityGroupName, {
      securityGroupName: containerSecurityGroupName,
      vpc: myVpc,
    });
    containerSecurityGroup.addIngressRule(albSecurityGroup, ec2.Port.allTcp());

    // == export ==
    new ssm.StringParameter(this, vpcIdSsmParamsName, {
      parameterName: vpcIdSsmParamsName,
      description: `VPC ID`,
      stringValue: myVpc.vpcId,
    });
  }
}