#!/usr/bin/env node
// Live tests against real services, with your own accounts - human-run from
// build.sh / build.bat → Tests → Live tests:
//
//   node releases/live-tests/run.mjs [name ...]
//
// Every other .mjs file in this directory is one test: its default export runs
// it and returns 'passed' or 'skipped' (no login for that service here), or
// throws. They write only to scratch items they create and remove, but they DO
// write to those services - which is why they are never part of the automatic
// test runs. Logs go to .tools/log/<datetime>/live-tests.log.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../..');
const wanted = process.argv.slice(2);
const tests = fs.readdirSync(DIR).filter(file => file.endsWith('.mjs') && file !== 'run.mjs').sort()
  .filter(file => !wanted.length || wanted.includes(file.replace(/\.mjs$/, '')));

const stamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').slice(0, 19);
const logDir = path.join(ROOT, '.tools', 'log', stamp);
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'live-tests.log');
const log = line => { console.log(line); fs.appendFileSync(logFile, `${line}\n`); };

const results = { passed: [], skipped: [], failed: [] };
for (const file of tests) {
  const name = file.replace(/\.mjs$/, '');
  log(`===== ${name}`);
  try {
    const { default: run } = await import(pathToFileURL(path.join(DIR, file)).href);
    const result = await run({ log });
    results[result === 'skipped' ? 'skipped' : 'passed'].push(name);
  } catch (error) {
    log(`FAIL ${name}: ${(error && error.message) || error}`);
    results.failed.push(name);
  }
}
log(`===== live tests: ${results.passed.length} passed, ${results.skipped.length} skipped, ${results.failed.length} failed`);
for (const name of results.skipped) log(`  skipped ${name}`);
for (const name of results.failed) log(`  x ${name}`);
log(`Log: ${logFile}`);
process.exit(results.failed.length ? 1 : 0);
