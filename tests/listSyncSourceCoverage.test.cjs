'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { describeSyncSourceCoverage: report } = require('../server/lib/listSyncSourceCoverage');
const row = (result, path, reason) => result.rows.find(item => item.path === path && item.reason === reason);

test('Jira source paths expose discarded fields, rich-text conversion and time fallbacks without values', async () => {
  const { parseJira } = await import('../models/lib/externalParsers.js');
  const raw = { total: 1, startAt: 0, maxResults: 50, issues: [{ key: 'KEY-1', fields: {
    summary: 'Source title', description: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'private-rich-text' }] }] },
    timetracking: { timeSpentSeconds: 0, originalEstimateSeconds: 7200 }, timespent: 3600,
    attachment: [{ filename: 'private-file' }], comment: { comments: [{ body: 'private-comment' }] },
    customfield_12345: { private: 'private-extension' }, status: { name: 'Done' },
  } }] };
  const before = JSON.stringify(raw);
  assert.equal(parseJira(raw).tasks[0].spentTime, 0);
  assert.equal(parseJira(raw).tasks[0].description, 'private-rich-text');
  const result = report('jira', raw, ['title','description','spentTime']);
  for (const path of ['attachment','comment','customfield_12345','timetracking/originalEstimateSeconds','status']) {
    assert.equal(row(result, `/issues/*/fields/${path}`, 'unmapped').count, 1);
  }
  assert.ok(row(result, '/issues/*/fields/description', 'converted'));
  assert.ok(row(result, '/issues/*/fields/timetracking/timeSpentSeconds', 'converted'));
  assert.ok(row(result, '/issues/*/fields/timespent', 'fallback'));
  assert.ok(!result.rows.some(item => item.path === '/total'));
  assert.doesNotMatch(JSON.stringify(result), /private-|7200|3600|KEY-1/);
  assert.equal(JSON.stringify(raw), before);
  assert.ok(row(report('jira', raw, ['title']), '/issues/*/fields/description', 'excluded'));
});

test('all issue parser variants report unknown data and excluded items using their actual parser choices', async () => {
  const { parseGithub, parseGitlab, parseGitea } = await import('../models/lib/externalParsers.js');
  for (const [type, parser] of [['github',parseGithub],['gitea',parseGitea],['forgejo',parseGitea]]) {
    const raw = [{ number: 5, id: 99, title: 'Issue', body: 'Body', description: 'unused-body',
      html_url: 'https://example.org/5', url: 'unused-url',
      comments_data: [{ user: { login: 'private-user' }, body: 'private-comment' }],
      future_data: { nested: { value: 'private-extension' } } },
    { number: 6, title: 'Excluded PR', pull_request: { url: 'private-pr' } }];
    assert.equal(parser(raw).tasks.length,1);
    const result = report(type, raw);
    assert.equal(result.sourceItems,2);assert.equal(result.excludedItems,1);
    assert.ok(row(result,'/*','excluded-item'));
    assert.ok(row(result,'/*/id','fallback'));
    assert.ok(row(result,'/*/description','fallback'));
    assert.ok(row(result,'/*/url','fallback'));
    assert.ok(row(result,'/*/comments_data','converted'));
    assert.ok(row(result,'/*/future_data','unmapped'));
    assert.doesNotMatch(JSON.stringify(result),/private-|unused-|Excluded PR/);
  }
  const raw = [{ iid: 5, id: 99, title: 'Issue', description: 'Body', confidential: true,
    weight: 0, epic: { id: 1, title: 'private-epic' } }];
  assert.equal(parseGitlab(raw).tasks[0].externalId,'5');
  const result=report('gitlab',raw);
  for(const path of ['weight','epic','confidential'])assert.ok(row(result,`/*/${path}`,'unmapped'));
  assert.ok(row(result,'/*/id','fallback'));
  assert.doesNotMatch(JSON.stringify(result),/private-epic/);
  assert.throws(()=>report('unknown',raw),/Unsupported/);
});

test('source report bounds paths and memory while counting additional occurrences', () => {
  const fields = Object.fromEntries(Array.from({length:120},(_,i)=>[`customfield_${i}`,'private-value']));
  const result = report('jira',{issues:[{key:'ONE',fields},{key:'TWO',fields}]});
  assert.equal(result.rows.length,100);assert.equal(result.occurrences,240);
  assert.equal(result.omittedOccurrences,40);assert.equal(result.truncated,true);
  assert.ok(result.rows.every(item=>item.count===2));
  const weird = JSON.parse('{"key":"ONE","fields":{"a/b~c":true,"__proto__":{"value":"private"}}}');
  const escaped = report('jira',[weird]);
  assert.ok(row(escaped,'/*/fields/a~1b~0c','unmapped'));
  assert.ok(row(escaped,'/*/fields/__proto__','unmapped'));
  const huge=report('jira',[{key:'ONE',fields:{['x'.repeat(10000)]:true}}]);
  assert.equal(huge.truncated,true);assert.ok(huge.rows[0].path.length<200);
  assert.doesNotMatch(JSON.stringify(result),/private-value/);
});
