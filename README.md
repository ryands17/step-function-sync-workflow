# Synchronous Express Workflows for AWS Step Functions

[Blog Post](https://dev.to/ryands17/sentiment-analysis-with-step-functions-using-the-cdk-4n1h).

[![Build Status](https://github.com/ryands17/step-function-sync-workflow/actions/workflows/main.yml/badge.svg)](https://github.com/ryands17/step-function-sync-workflow/actions/workflows/main.yml)

This project contains a Step Function Express workflow which will be called synchronously via an API endpoint defined in API Gateway.

This example is taken from the [docs](https://aws.amazon.com/blogs/compute/new-synchronous-express-workflows-for-aws-step-functions/) which detects the sentiment of the user that filled a feedback form and notifies via Email in case of a negative sentiment.

This deployment **might incur some costs** if not in the Free Tier so it's best to destroy after you've played with it.

## Steps

1. Run `yarn` (recommended) or `npm install`

2. Rename `.example.env` to `.env` and replace the values with your configuration. The emails are mandatory and need to be [verified in SES](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/verify-email-addresses.html) as you wouldn't be able to send emails.

3. Run `yarn cdk deploy --all` to deploy the stack.

4. Run `yarn cdk destroy --all` to delete all resources

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `yarn build` compile typescript to js
- `yarn watch` watch for changes and compile
- `yarn test` perform the jest unit tests
- `yarn cdk deploy` deploy this stack to your default AWS account/region
- `yarn cdk diff` compare deployed stack with current state
- `yarn cdk synth` emits the synthesized CloudFormation template
