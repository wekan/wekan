'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const tracer = path.join(__dirname, '../tools/build-command-output.cjs');
const run = script => spawnSync(process.execPath, ['--require', tracer, '-e', script], {encoding:'utf8',env:{...process.env,TMPDIR:path.join(__dirname,'../.tools/tmp')}});
test('captured synchronous resolver output is visible and exit/return values are preserved', () => {
  const result=run(`const c=require('node:child_process').spawnSync(process.execPath,['-e','console.log("RESOLVER_STDOUT");console.error("RESOLVER_STDERR");process.exit(7)'],{encoding:'utf8'});console.log('CHILD_STATUS='+c.status);if(!c.stdout.includes('RESOLVER_STDOUT')||!c.stderr.includes('RESOLVER_STDERR'))process.exit(1);`);
  assert.equal(result.status,0);assert.match(result.stdout,/RESOLVER_STDOUT/);assert.match(result.stderr,/RESOLVER_STDERR/);assert.match(result.stdout,/CHILD_STATUS=7/);assert.match(result.stderr,/spawnSync:/);
});
test('asynchronous captured resolver output and callbacks remain available', () => {
  const result=run(`require('node:child_process').execFile(process.execPath,['-e','console.log("ASYNC_STDOUT");console.error("ASYNC_STDERR")'],(error,stdout,stderr)=>{if(error||!stdout.includes('ASYNC_STDOUT')||!stderr.includes('ASYNC_STDERR'))process.exitCode=1;});`);
  assert.equal(result.status,0);assert.match(result.stdout,/ASYNC_STDOUT/);assert.match(result.stderr,/ASYNC_STDERR/);assert.match(result.stderr,/execFile:/);
});
test('credentials in command arguments are redacted and environment contents are never dumped', () => {
  const result=run(`require('node:child_process').spawnSync('nonexistent-build-fixture',['--token','SECRET_FIXTURE_VALUE','https://user:password@example.com/path?token=PRIVATE_QUERY','--password=PRIVATE_FLAG'],{env:{PRIVATE_ENV:'PRIVATE_ENV_VALUE'}});`);
  assert.match(result.stderr,/\[redacted\]/);assert.doesNotMatch(result.stderr,/SECRET_FIXTURE_VALUE|PRIVATE_QUERY|PRIVATE_FLAG|PRIVATE_ENV_VALUE|user:password/);
});
test('Node module resolution tracing emits actual resolver activity', () => {
  const result=spawnSync(process.execPath,['-e','require("node:path")'],{encoding:'utf8',env:{...process.env,NODE_DEBUG:'module'}});
  assert.equal(result.status,0);assert.match(result.stderr,/MODULE \d+:/);assert.match(result.stderr,/node:path/);
});
