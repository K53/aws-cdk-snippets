# API Gateway - Lambda

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk destroy`     destroy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

## APIGW - Lambda Only

### deploy

```ts:bin/aws-cdk-snippets.ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ApiLambdaStack } from '../lib/api-lambda-stack';

const app = new cdk.App();
new ApiLambdaStack(app, 'ApiLambdaStack');
```

```
$ cdk deploy
```

## APIGW - Lambda with Basic Authorizer Lambda

### deploy

```ts:bin/aws-cdk-snippets.ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ApiLambdaWithBasicAuthStack } from '../lib/api-lambda-with-basic-auth-stack';

const app = new cdk.App();
new ApiLambdaWithBasicAuthStack(app, 'ApiLambdaWithBasicAuthStack');
```

```
$ cdk deploy
```

## APIGW - Lambda with Cognito Authorizer

### deploy

```ts:bin/aws-cdk-snippets.ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ApiLambdaWithCognitoStack } from '../lib/api-lambda-with-cognito-stack';

const app = new cdk.App();
new ApiLambdaWithCognitoStack(app, 'ApiLambdaWithCognitoStack');
```

```
$ cdk deploy
```

### verify

for test this stacks, you have to create user to call API with idToken.

```sh
# create new user (status FORCE_CHANGE_PASSWORD)
$ aws cognito-idp admin-create-user --user-pool-id <USER_POOL_ID> --username testets --user-attributes Name=email,Value=<E_MAIL_ADDRESS> Name=email_verified,Value=true --temporary-password <PASSWORD>

# change user password (status CONFIRMED)
# https://dev.classmethod.jp/articles/cognito-admin-set-user-password/
$ aws cognito-idp admin-set-user-password --user-pool-id <USER_POOL_ID> --username <USER_NAME> --password <PASSWORD> --permanent 

# get IdToken
# https://dev.classmethod.jp/articles/obtain-access-tokens-for-cognito-users-using-aws-cli/
$ aws cognito-idp admin-initiate-auth --user-pool-id <USER_POOL_ID> --client-id <CLIENT_ID> --auth-flow "ADMIN_USER_PASSWORD_AUTH" --auth-parameters USERNAME=<USERNAME>,PASSWORD=<PASSWORD>
{
    "ChallengeParameters": {},
    "AuthenticationResult": {
        "AccessToken": "***",
        "ExpiresIn": 3600,
        "TokenType": "Bearer",
        "RefreshToken": "***",
        "IdToken": "***"
    }
}
```

## APIGW - Lambda with custom domain

### deploy

this architecture is including manual process.

```ts:bin/aws-cdk-snippets.ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ApiLambdaCustomDomainStack } from '../lib/api-lambda-custom-domain-stack';

const app = new cdk.App();
new ApiLambdaCustomDomainStack(app, 'ApiLambdaCustomDomainStack');
```

step1) create route53 hosted zone

```sh
# create route53 hosted zone
$ aws route53 create-hosted-zone --name <DOMAIN> --caller-reference `date +%Y-%m-%d_%H-%M-%S`
{
    "Location": "https://route53.amazonaws.com/2013-04-01/hostedzone/<HostedZoneID>",
    "HostedZone": {
        "Id": "/hostedzone/<HostedZoneID>",
        "Name": "<DOMAIN>",
        "CallerReference": "2021-12-05_19-09-33",
        "Config": {
            "PrivateZone": false
        },
        "ResourceRecordSetCount": 2
    },
    "ChangeInfo": {
        "Id": "/change/********",
        "Status": "PENDING",
        "SubmittedAt": "2021-12-05T10:09:35.354000+00:00"
    },
    "DelegationSet": {
        "NameServers": [
            "<NS_RECORD>",
            "<NS_RECORD>",
            "<NS_RECORD>",
            "<NS_RECORD>"
        ]
    }
}
```

step2) register NameServers value in response to domain management page. (now Freenom)

```sh
$ aws acm request-certificate --domain-name <DOMAIN> --validation-method DNS
{
    "CertificateArn": "arn:aws:acm:ap-northeast-1:************:certificate/************"
}
```

step3) open console and register CNAME record to route53 host zone manually.

step4) set secret information 

```
$ mkdir secrets
$ touch sqs-lambda-trigger-stack.json
```

```json:sqs-lambda-trigger-stack.json
{
    "apigwCustomDomainName": "<DOMAIN>",
    "hostzoneId": "<ID>",
    "apigwCertificateId": "<ID>"
}
```

step5) deploy

```
$ cdk deploy
```


<!-- ## memo

```
$ aws ssm put-parameter --name "/cdk-params/hostzoneId" --value "<HostZoneID>" --type String
{
    "Version": 1,
    "Tier": "Standard"
}
$ aws ssm put-parameter --name "/cdk-params/apigwCustomDomainName" --value "<DOMAIN>" --type String
$ aws ssm put-parameter --name "/cdk-params/apigwCertificateArn" --value "<CertificationARN>" --type String
``` -->

# SQS - Lambda

// Todo

```
$ cdk deploy
```

## SQS Lambda Trigger

### deploy

```ts:bin/aws-cdk-snippets.ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SqsLambdaTriggerStack } from '../lib/sqs-lambda-trigger-stack';

const app = new cdk.App();
new SqsLambdaTriggerStack(app, 'SqsLambdaTriggerStack');
```

step0) create slack app to your slack workspace.

if you will not create lambda to notify to slack, this step can be skipped.

https://zenn.dev/hotaka_noda/articles/4a6f0ccee73a18#slack%E3%81%B8%E9%80%9A%E7%9F%A5

step1) set secret

set slack URL for notification.

```
$ mkdir secrets
$ touch sqs-lambda-trigger-stack.json
```

```json:sqs-lambda-trigger-stack.json
{
    "slackUrl": "***"
}
```

step2) deploy

```
$ cdk deploy
```

## Lambda with Layer

if you have node_modules or custom functions common to some lambda functions, use Lambda Layer.
this example take axios module.

### deploy

step1) create Layer

All files and modules you want to put on layer have to be in `/nodejs/node_modules/` path.

```
$ cd src/lambdaWithLayerStack/layer
$ mkdir <LAYER_NAME>
$ mkdir nodejs
$ npm init -y
$ npm install --save axios
```

step2) set secret

set target URL (eg. slack)

```
$ mkdir secrets
$ touch lambda-with-layer-stack.json
```

```json:lambda-with-layer-stack.json
{
    "apiUrl": "***"
}
```

```ts:bin/aws-cdk-snippets.ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LambdaWithLayerStack } from '../lib/lambda-with-layer-stack';

const app = new cdk.App();
new LambdaWithLayerStack(app, 'LambdaWithLayerStack');
```

```
$ cdk deploy
```

# DynamoDB - Lambda

## Lambda -> DynamoDB (CRUD / TTL)

### deploy

```ts:bin/aws-cdk-snippets.ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DynamodbCRUDLambdaStack } from '../lib/dynamodb-crud-lambda-stack';

const app = new cdk.App();
new DynamodbCRUDLambdaStack(app, 'DynamodbCRUDLambdaStack');
```

```
$ cdk deploy
```

## DynamoDB Streams -> Lambda

// to do