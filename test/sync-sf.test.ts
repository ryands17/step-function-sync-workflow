import { TemplateAssertions } from '@aws-cdk/assertions'
import * as cdk from '@aws-cdk/core'
import { SyncSfStack } from '../lib/sync-sf-stack'
import { Code, CodeConfig } from '@aws-cdk/aws-lambda'

let fromAssetMock: jest.SpyInstance

beforeAll(() => {
  fromAssetMock = jest.spyOn(Code, 'fromAsset').mockReturnValue({
    isInline: false,
    bind: (): CodeConfig => {
      return {
        s3Location: {
          bucketName: 'my-bucket',
          objectKey: 'my-key',
        },
      }
    },
    bindToResource: () => {
      return
    },
  } as any)
})

const testStack = () => {
  const app = new cdk.App()
  const stack = new SyncSfStack(app, 'SyncStepFunctions', {
    env: { region: process.env.AWS_REGION || 'us-east-1' },
  })
  return TemplateAssertions.fromStack(stack)
}

test('DynamoDB table is created', () => {
  const assert = testStack()

  assert.hasResourceProperties('AWS::DynamoDB::Table', {
    KeySchema: [
      {
        AttributeName: 'formId',
        KeyType: 'HASH',
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'formId',
        AttributeType: 'S',
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  })
})

test('Check if Lambda functions are created', () => {
  const assert = testStack()

  assert.resourceCountIs('AWS::Lambda::Function', 4)
})

test('Only sentiment detection permission is allowed', () => {
  const assert = testStack()

  assert.hasResourceProperties('AWS::IAM::Policy', {
    PolicyDocument: {
      Statement: [
        {
          Action: 'comprehend:DetectSentiment',
          Effect: 'Allow',
          Resource: '*',
        },
      ],
      Version: '2012-10-17',
    },
  })
})

test('Only SES send email permission is allowed', () => {
  const assert = testStack()

  assert.hasResourceProperties('AWS::IAM::Policy', {
    PolicyDocument: {
      Statement: [
        {
          Action: 'ses:SendEmail',
          Effect: 'Allow',
          Resource: '*',
        },
      ],
      Version: '2012-10-17',
    },
  })
})

test('Express Step function workflow is created', () => {
  const assert = testStack()

  assert.hasResourceProperties('AWS::StepFunctions::StateMachine', {
    DefinitionString: {},
    LoggingConfiguration: {
      Level: 'ERROR',
    },
    StateMachineType: 'EXPRESS',
  })
})

afterAll(() => {
  fromAssetMock?.mockRestore()
})
