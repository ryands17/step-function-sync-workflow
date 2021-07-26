import { TemplateAssertions } from '@aws-cdk/assertions'
import * as cdk from '@aws-cdk/core'
import { ApiStack, responseTemplate } from '../lib/api-gw-stack'
import { SyncSfStack } from '../lib/sync-sf-stack'
import './helpers'

const testStack = () => {
  const app = new cdk.App()
  const env = { region: process.env.CDK_REGION || 'us-east-1' }

  const sfn = new SyncSfStack(app, 'SyncSfStack', { env })
  const stack = new ApiStack(app, 'ApiGwStack', {
    env,
    sfn: sfn.sentimentAnalysis,
  })

  return TemplateAssertions.fromStack(stack)
}

test('API Gateway integration has the correct role', () => {
  const assert = testStack()

  assert.hasResourceProperties('AWS::IAM::Role', {
    AssumeRolePolicyDocument: {
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'apigateway.amazonaws.com',
          },
        },
      ],
      Version: '2012-10-17',
    },
  })
})

test('API Gateway has the correct method mapped', () => {
  const assert = testStack()

  assert.hasResourceProperties('AWS::ApiGateway::Method', {
    HttpMethod: 'POST',
    AuthorizationType: 'NONE',
    MethodResponses: [
      {
        StatusCode: '200',
      },
    ],
    OperationName: 'Submit Feedback Form',
    Integration: {
      IntegrationHttpMethod: 'POST',
      IntegrationResponses: [
        {
          ResponseTemplates: {
            'application/json': responseTemplate,
          },
          StatusCode: '200',
        },
      ],
      PassthroughBehavior: 'NEVER',
      RequestParameters: {
        'integration.request.header.Content-Type': "'application/json'",
      },
      Type: 'AWS',
    },
  })
})

test('API Gateway validates request body and has the appropriate model', () => {
  const assert = testStack()

  assert.hasResourceProperties('AWS::ApiGateway::RequestValidator', {
    ValidateRequestBody: true,
  })

  assert.hasResourceProperties('AWS::ApiGateway::Model', {
    ContentType: 'application/json',
    Schema: {
      $schema: 'http://json-schema.org/draft-04/schema#',
      title: 'Feedback Form Payload',
      type: 'object',
      required: ['message'],
      properties: {
        message: {
          type: 'string',
          minLength: 1,
        },
      },
    },
  })
})
