import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs'
import { Duration } from '@aws-cdk/core'
import { Runtime } from '@aws-cdk/aws-lambda'
import { RetentionDays } from '@aws-cdk/aws-logs'

export const createFn = (
  ...[scope, id, props]: ConstructorParameters<typeof NodejsFunction>
) => {
  return new NodejsFunction(scope, id, {
    timeout: Duration.seconds(10),
    memorySize: 256,
    entry: `./functions/${id}.ts`,
    runtime: Runtime.NODEJS_14_X,
    logRetention: RetentionDays.ONE_WEEK,
    bundling: {
      nodeModules: ['aws-sdk', 'ulid'],
      externalModules: [],
    },
    ...props,
  })
}
