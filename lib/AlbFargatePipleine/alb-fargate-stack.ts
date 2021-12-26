import { Stack, StackProps, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

export class AlbFargateStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // == const ========================================
    const albSecurityGroupName = "alb_security_group";
    const containerSecurityGroupName = "container_security_group";
    const albName = "cdksnippetAlb";
    const albListenerName = `${albName}Listener`;
    const albTargetGroupName = `${albName}Target`;
    const vpcName = "cdksnippetVpc";
    const clusterName = "cdksnippetCluster";
    const taskDefinitionName = "cdksnippetTaskDef";
    const containerName = "cdksnippetContainer";
    const ecrRepositoryName = "cdksnippetecr";
    const fargateServiceName = "cdksnippetService";

    // == VPC ==
    const myVpc = ec2.Vpc.fromLookup(this, vpcName, {
      vpcId: "vpc-047670359e58b2237",
    })
    // == Security Group ==
    const albSecurityGroup = ec2.SecurityGroup.fromLookupByName(this, albSecurityGroupName, albSecurityGroupName, myVpc);
    const containerSecurityGroup = ec2.SecurityGroup.fromLookupByName(this, containerSecurityGroupName, containerSecurityGroupName, myVpc);

    // == ALB ==
    const alb = new elbv2.ApplicationLoadBalancer(this, albName, {
      loadBalancerName: albName,
      internetFacing: true,
      vpc: myVpc,
      vpcSubnets: { subnets: myVpc.publicSubnets },
      securityGroup: albSecurityGroup,
    });

    // == ECS Cluster ==
    const cluster = new ecs.Cluster(this, clusterName, {
      clusterName: clusterName,
    })

    // == Task definitions ==
    const taskdef = new ecs.FargateTaskDefinition(this, taskDefinitionName, {
      memoryLimitMiB: 512,
      cpu: 256,
    })
    taskdef.addContainer(containerName, {
      containerName: containerName,
      image: ecs.ContainerImage.fromEcrRepository(ecr.Repository.fromRepositoryName(this, ecrRepositoryName, ecrRepositoryName)),
      portMappings: [{containerPort: 80}],
      cpu: 128,
    })

    // == Service ==
    const service = new ecs.FargateService(this, fargateServiceName, {
      cluster: cluster,
      taskDefinition: taskdef,
      desiredCount: 1,
      deploymentController: {
        type: ecs.DeploymentControllerType.CODE_DEPLOY,
      },
      enableECSManagedTags: true,
      vpcSubnets: { subnets: myVpc.privateSubnets },
      securityGroups: [containerSecurityGroup],
      assignPublicIp: false,
      healthCheckGracePeriod: Duration.minutes(0),
    });

    const listener = new elbv2.ApplicationListener(this, albListenerName, {
      loadBalancer: alb,
      port: 80,
    });

    const tg1 = new elbv2.ApplicationTargetGroup(this, 'TargetGroup1', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      targets: [service],
      vpc: myVpc,
      healthCheck: {
        path: "/index.php",
      },
    });
    const tg2 = new elbv2.ApplicationTargetGroup(this, 'TargetGroup2', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      vpc: myVpc,
      healthCheck: {
        path: "/index.php",
      },
    });

    listener.addTargetGroups(albTargetGroupName, {
      targetGroups: [tg1],
    })
  }
}
