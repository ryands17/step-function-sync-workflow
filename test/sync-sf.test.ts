import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as SyncSf from '../lib/sync-sf-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new SyncSf.SyncSfStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
