import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

export class AlbStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // == VPC ==
    const myVpc = ec2.Vpc.fromLookup(this, "myVpc", {
      vpcId: "vpc-065748836bae0e0e4",
    })
    const defaultVpc = ec2.Vpc.fromLookup(this, "defaultVpc", {
      vpcId: "vpc-a1a78bc5",
    })

    // == const ========================================
    const thisClassName = this.constructor.name;
    const albSecurityGroupName = "alb_security_group";
    const albName = "myloadbalancer";
    
    // == Security Group ==
    const albSecurityGroup = new ec2.SecurityGroup(this, albSecurityGroupName, {
      securityGroupName: albSecurityGroupName,
      vpc: myVpc,
    })
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));
    
    // == ALB ==
    const alb = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
      loadBalancerName: albName,
      internetFacing: true,
      vpc: myVpc,
      vpcSubnets: { subnets: myVpc.publicSubnets },
      securityGroup: ec2.SecurityGroup.fromLookupByName(this, "default", "default", defaultVpc),
    });
    alb.addSecurityGroup(albSecurityGroup);

  }
}
