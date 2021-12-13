import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as chatbot from 'aws-cdk-lib/aws-chatbot';

interface Config {
  chatbotWorkSpaceId: string;
  slackChannelId: string;
}
const config: Config = require('../../secrets/ChatBotStack');

export class ChatBotStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // == const ========================================
    const snsTopicName = "cdksnippetTopic";
    const chatbotRoleName = "cdksnippetRole";
    const chatbotName = "cdksnippetChatbot";
    const chatbotWorkSpaceId = config.chatbotWorkSpaceId;
    const slackChannelId = config.slackChannelId;

    // == SNS ========================================
    const mytopic = new sns.Topic(this, snsTopicName, {
      displayName: snsTopicName,
      topicName: snsTopicName,
    });

    // == ChatBot ========================================
    const chatbotRole = new iam.Role(this, chatbotRoleName, {
      roleName: chatbotRoleName,
      assumedBy: new iam.ServicePrincipal("sns.amazonaws.com"),
    });
    chatbotRole.addToPolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: [
          "cloudwatch:Describe*",
          "cloudwatch:Get*",
          "cloudwatch:List*",
        ],
      })
    );

    new chatbot.CfnSlackChannelConfiguration(this, chatbotName, {
      configurationName: chatbotName,
      iamRoleArn: chatbotRole.roleArn,
      slackChannelId: slackChannelId,
      slackWorkspaceId: chatbotWorkSpaceId,
      snsTopicArns: [mytopic.topicArn],
    });
  }
}
