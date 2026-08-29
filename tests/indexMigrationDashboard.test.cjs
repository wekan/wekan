const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const reservePort = () => new Promise((resolve, reject) => {
  const server = net.createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const { port } = server.address();
    server.close(error => error ? reject(error) : resolve(port));
  });
});

const fetchPage = port => new Promise((resolve, reject) => {
  const request = http.get({ host: '127.0.0.1', port, path: '/' }, response => {
    let body = '';
    response.setEncoding('utf8');
    response.on('data', chunk => { body += chunk; });
    response.on('end', () => resolve({ status: response.statusCode, body }));
  });
  request.once('error', reject);
});

(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-migration-dashboard-'));
  const statusFile = path.join(temp, 'progress.json');
  fs.writeFileSync(statusFile, JSON.stringify({
    phase: 'running', database: 'wekan', collection: 'cards', index: 'listId_1',
    step: 1, total: 20, startedAt: new Date(Date.now() - 10_000).toISOString(),
  }));
  const port = await reservePort();
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'releases/ferretdb/recovery-bridge.mjs')], {
    env: { ...process.env, PORT: String(port), PRODUCT_NAME: 'Example Boards',
      WEKAN_BRIDGE_REASON: 'migration', MIGRATION_STATUS_FILE: statusFile },
    stdio: 'ignore',
  });
  try {
    let page;
    for (let attempt = 0; attempt < 30; attempt++) {
      try {
        page = await fetchPage(port);
        break;
      } catch {
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    }
    assert.ok(page, 'migration dashboard starts');
    assert.equal(page.status, 503);
    assert.match(page.body, /Example Boards Migration Progress/);
    assert.match(page.body, /Step 2\/20/);
    assert.match(page.body, /5%/);
    assert.match(page.body, /Spent <strong>/);
    assert.match(page.body, /ETA <strong>/);
    assert.match(page.body, /wekan \/ cards \/ listId_1/);
    assert.doesNotMatch(page.body, />[^<]*(?:WeKan|FerretDB)[^<]*</,
      'a custom Product name replaces both application names on the page');
  } finally {
    child.kill('SIGTERM');
    fs.rmSync(temp, { recursive: true, force: true });
  }
  console.log('indexMigrationDashboard: live progress and Product branding verified');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
