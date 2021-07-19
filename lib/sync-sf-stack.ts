import * as cdk from '@aws-cdk/core'
import * as ddb from '@aws-cdk/aws-dynamodb'
import * as sfn from '@aws-cdk/aws-stepfunctions'
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks'
import * as iam from '@aws-cdk/aws-iam'
import * as logs from '@aws-cdk/aws-logs'
import { createFn } from './helpers'

export class SyncSfStack extends cdk.Stack {
  readonly sentimentAnalysis: sfn.StateMachine

  constructor(scope: cdk.Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props)

    // Table for storing requests
    const formData = new ddb.Table(this, 'formData', {
      partitionKey: { name: 'formId', type: ddb.AttributeType.STRING },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    const detectSentimentFn = createFn(this, 'detectSentimentFn')
    detectSentimentFn.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['comprehend:DetectSentiment'],
        resources: ['*'],
      })
    )

    const notifyOfNegativeSentimentFn = createFn(
      this,
      'notifyOfNegativeSentimentFn'
    )
      .addEnvironment('SENDER', process.env.SENDER)
      .addEnvironment('RECEIVER', process.env.RECEIVER)
    notifyOfNegativeSentimentFn.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ses:SendEmail'],
        resources: ['*'],
      })
    )

    const detectSentiment = new tasks.LambdaInvoke(this, 'detectSentiment', {
      lambdaFunction: detectSentimentFn,
      resultPath: '$.sentimentResult',
    })
    const generateReferenceNumber = new tasks.LambdaInvoke(
      this,
      'generateReferenceNumber',
      {
        lambdaFunction: createFn(this, 'generateReferenceNumberFn'),
        resultPath: '$.ticketId',
      }
    )
    const saveCustomerMessage = new tasks.DynamoPutItem(
      this,
      'saveCustomerMessage',
      {
        table: formData,
        item: {
          formId: tasks.DynamoAttributeValue.fromString(
            sfn.JsonPath.stringAt('$.ticketId.Payload')
          ),
          customerMessage: tasks.DynamoAttributeValue.fromString(
            sfn.JsonPath.stringAt('$.message')
          ),
          sentiment: tasks.DynamoAttributeValue.fromString(
            sfn.JsonPath.stringAt('$.sentimentResult.Payload.Sentiment')
          ),
        },
        resultPath: '$.formDataRecord',
      }
    )
    const checkSentiment = new sfn.Choice(this, 'checkSentiment')
      .when(
        sfn.Condition.stringEquals(
          '$.sentimentResult.Payload.Sentiment',
          'NEGATIVE'
        ),
        new tasks.LambdaInvoke(this, 'notifyOfNegativeSentiment', {
          lambdaFunction: notifyOfNegativeSentimentFn,
          resultPath: '$.notifyViaEmail',
        })
      )
      .otherwise(new sfn.Succeed(this, 'positiveSentiment'))

    const definition = detectSentiment
      .next(generateReferenceNumber)
      .next(saveCustomerMessage)
      .next(checkSentiment)

    this.sentimentAnalysis = new sfn.StateMachine(this, 'sentimentAnalysis', {
      definition,
      stateMachineType: sfn.StateMachineType.EXPRESS,
      timeout: cdk.Duration.seconds(30),
      logs: {
        destination: new logs.LogGroup(this, 'sentimentAnalysisLogs', {
          retention: logs.RetentionDays.ONE_WEEK,
        }),
      },
    })

    formData.grantWriteData(this.sentimentAnalysis)
  }
}
