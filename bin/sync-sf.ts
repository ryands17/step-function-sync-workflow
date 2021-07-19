#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import { SyncSfStack } from '../lib/sync-sf-stack'
import { ApiStack } from '../lib/api-gw-stack'

const app = new cdk.App()
const env = { region: process.env.CDK_REGION || 'us-east-1' }

const sfn = new SyncSfStack(app, 'SyncSfStack', { env })
new ApiStack(app, 'ApiGwStack', { env, sfn: sfn.sentimentAnalysis })
