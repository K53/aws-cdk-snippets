# API Gateway - Lambda

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk destroy`     destroy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

## APIGW - Lambda Only

// todo

## APIGW - Lambda with Basic Authorizer Lambda

// todo

## APIGW - Lambda with Cognito Authorizer

for test this stacks, you have to create user to call API with idToken.

```sh
# create new user (status FORCE_CHANGE_PASSWORD)
$ aws cognito-idp admin-create-user --user-pool-id ap-northeast-1_eg5RS2zGp --username testets --user-attributes Name=email,Value=<E_MAIL_ADDRESS> Name=email_verified,Value=true --temporary-password <PASSWORD>

# change user password (status CONFIRMED)
# https://dev.classmethod.jp/articles/cognito-admin-set-user-password/
$ aws cognito-idp admin-set-user-password --user-pool-id ap-northeast-1_eg5RS2zGp --username <USER_NAME> --password <PASSWORD> --permanent 

# get IdToken
# https://dev.classmethod.jp/articles/obtain-access-tokens-for-cognito-users-using-aws-cli/
$ aws cognito-idp admin-initiate-auth --user-pool-id <USER_POOL_ID> --client-id <CLIENT_ID> --auth-flow "ADMIN_USER_PASSWORD_AUTH" --auth-parameters USERNAME=<USERNAME >,PASSWORD=<PASSWORD>
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

step1) this architecture is including manual process.

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

step2) register NameServers in response to domain management page. (now Freenom)

```sh
$ aws acm request-certificate --domain-name <DOMAIN> --validation-method DNS
{
    "CertificateArn": "arn:aws:acm:ap-northeast-1:************:certificate/************"
}
```

step3) you have to open console and register CNAME record to route53 host zone manually.

step4) set secret

set secret information 

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

## SQS Lambda Trigger

### deploy

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

# DynamoDB - Lambda

## Lambda -> DynamoDB (CRUD)

// to do

## DynamoDB Streams -> Lambda

// to do