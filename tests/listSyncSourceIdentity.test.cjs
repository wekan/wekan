'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeSyncSource, syncSourceKey } = require('../models/lib/listSyncSourceIdentity');

const source = { type: 'jira', url: 'https://tracker.example/jira', projectKey: 'ONE' };
test('provider, server path and project each separate otherwise identical issue IDs', () => {
  const keys = [source, { ...source, type: 'gitea' },
    { ...source, url: 'https://other.example/jira' },
    { ...source, url: 'https://tracker.example/other' },
    { ...source, projectKey: 'TWO' }].map(syncSourceKey);
  assert.equal(new Set(keys).size, keys.length);
});
test('equivalent URL spelling and settings changes retain the same source', () => {
  assert.equal(syncSourceKey(source), syncSourceKey({ ...source,
    url: 'https://TRACKER.example:443/jira/', projectKey: ' ONE ',
    fields: [], enabled: false, token: 'never-in-the-key' }));
  assert.ok(!syncSourceKey({ ...source, token: 'secret' }).includes('secret'));
  assert.equal(syncSourceKey({ type: 'gitlab', projectKey: 'team/repo' }),
    syncSourceKey({ type: 'gitlab', url: 'https://gitlab.com/', projectKey: 'team/repo' }));
  // The GitHub fetcher always uses api.github.com, regardless of the URL input.
  assert.equal(syncSourceKey({ type: 'github', projectKey: 'team/repo' }),
    syncSourceKey({ type: 'github', url: 'https://ignored.example', projectKey: 'team/repo' }));
});
test('invalid server URLs and empty projects fail without exposing their contents', () => {
  for (const url of ['', 'broken', 'file:///tmp/example', 'https://user:secret@tracker.example',
    'https://tracker.example?token=secret', 'https://tracker.example/#secret']) {
    assert.throws(() => normalizeSyncSource({ ...source, url }), error => {
      assert.ok(!error.message.includes('secret')); return true;
    });
  }
  assert.throws(() => syncSourceKey({ ...source, projectKey: ' ' }), /project is required/);
});
