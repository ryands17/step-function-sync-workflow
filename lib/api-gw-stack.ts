import * as cdk from '@aws-cdk/core'
import * as apiGw from '@aws-cdk/aws-apigateway'
import * as iam from '@aws-cdk/aws-iam'
import * as logs from '@aws-cdk/aws-logs'
import { StateMachine } from '@aws-cdk/aws-stepfunctions'

interface StackProps extends cdk.StackProps {
  sfn: StateMachine
}

export const responseTemplate = `
  #set($output = $input.path('$.output'))
  #set($root = $util.parseJson($output))
  {
    "ticketId": "$root.ticketId.Payload",
    "message": "Feedback submitted successfully!"
  }
`.trim()

export class ApiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: StackProps) {
    super(scope, id, props)

    // Allow permissions to execute the step function
    const sfIntegrationRole = new iam.Role(this, 'asyncApiApigRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    })
    sfIntegrationRole.addToPolicy(
      new iam.PolicyStatement({
        resources: [props.sfn.stateMachineArn],
        actions: ['states:StartSyncExecution'],
      })
    )

    // Step Functions integration
    const sfIntegration = new apiGw.AwsIntegration({
      service: 'states',
      action: 'StartSyncExecution',
      options: {
        credentialsRole: sfIntegrationRole,
        passthroughBehavior: apiGw.PassthroughBehavior.NEVER,
        requestParameters: {
          'integration.request.header.Content-Type': `'application/json'`,
        },
        requestTemplates: {
          'application/json': JSON.stringify({
            input: `$util.escapeJavaScript($input.json('$'))`,
            stateMachineArn: props.sfn.stateMachineArn,
          }),
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': responseTemplate,
            },
          },
        ],
      },
    })

    // Configure Log stream
    const apiLogs = new logs.LogGroup(this, 'myApiLogs', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.ONE_WEEK,
    })

    // REST API
    const api = new apiGw.RestApi(this, 'myApi', {
      endpointTypes: [apiGw.EndpointType.REGIONAL],
      deployOptions: {
        stageName: 'dev',
        loggingLevel: apiGw.MethodLoggingLevel.ERROR,
        accessLogDestination: new apiGw.LogGroupLogDestination(apiLogs),
      },
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
      },
    })

    api.root.addMethod('POST', sfIntegration, {
      operationName: 'Submit Feedback Form',
      requestValidatorOptions: { validateRequestBody: true },
      requestModels: {
        'application/json': new apiGw.Model(this, 'feedbackFormPayload', {
          restApi: api,
          schema: {
            schema: apiGw.JsonSchemaVersion.DRAFT4,
            title: 'Feedback Form Payload',
            type: apiGw.JsonSchemaType.OBJECT,
            required: ['message'],
            properties: {
              message: {
                type: apiGw.JsonSchemaType.STRING,
                minLength: 1,
              },
            },
          },
        }),
      },
      methodResponses: [{ statusCode: '200' }],
    })
  }
}
