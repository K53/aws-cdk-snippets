import { Stack, StackProps, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class NetworkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // == const ========================================
    const albSecurityGroupName = "alb_security_group";
    const containerSecurityGroupName = "container_security_group";
    const vpcName = "cdksnippetVpc";

    // == VPC ==
    const myVpc = ec2.Vpc.fromLookup(this, vpcName, {
      vpcId: "vpc-047670359e58b2237",
    })
    
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
  }
}