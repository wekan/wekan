#!/usr/bin/env node
'use strict';
const path = require('node:path');
const fs = require('node:fs');
const { createRequire } = require('node:module');
async function verify(bundle) {
  const server = fs.realpathSync(path.resolve(bundle, 'programs/server'));
  const runtime = createRequire(path.join(server, 'npm/package.json'));
  const entry = fs.realpathSync(runtime.resolve('wasmagic'));
  if (!entry.startsWith(server + path.sep)) throw Error('Portable libmagic is missing from the bundle (checkout fallback is not allowed).');
  const { WASMagic } = runtime('wasmagic');
  const engine = await WASMagic.create();
  const html = engine.detect(Buffer.from('<!doctype html><html><body>WeKan MIME check</body></html>'));
  if (html !== 'text/html') throw Error(`Portable libmagic failed its HTML smoke check: ${html}`);
  console.log('Portable libmagic and its embedded magic database verified.');
}
if (require.main === module) verify(process.argv[2] || '.build/bundle').catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { verify };
