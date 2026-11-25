'use strict';
// Azure Blob attachment storage on @azure/storage-blob alone
// (server/lib/azureBlobAdapter.js), in place of @tweedegolf/sab-adapter-azure-blob,
// which loaded @azure/identity and MSAL - 36 MiB in every bundle - for a sign-in
// WeKan never used. Run: node tests/azureBlobAdapter.test.cjs
//
// Against Azurite, Microsoft's Azure Storage emulator, when it is installed
// (.tools/azurite, or AZURITE_BLOB to its azurite-blob): a file goes up from a
// path and from a stream, comes back whole and as a byte range, is listed with
// its size, and is removed - and a missing one removed again is not an error.
// Always: the configuration that cannot work is a configError, not a throw,
// and cloudStorage.js loads this adapter for Azure.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const { AdapterAzureBlob } = require('../server/lib/azureBlobAdapter');
const azuriteBin = process.env.AZURITE_BLOB || path.join(root, '.tools/azurite/node_modules/.bin/azurite-blob');
// Azurite's well-known development account (published in Microsoft's docs).
const DEV_ACCOUNT = 'devstoreaccount1';
const DEV_KEY = 'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==';

test('a configuration that cannot work is a configError, not a throw', () => {
  for (const config of [{}, { accountName: 'acct' }, { accountKey: 'k' }, null]) {
    const a = new AdapterAzureBlob(config);
    assert.match(a.configError, /^\[configError\] /, JSON.stringify(config));
  }
  assert.match(new AdapterAzureBlob({ connectionString: 'not a connection string' }).configError, /^\[configError\] /);
  assert.equal(new AdapterAzureBlob({ accountName: 'acct', accountKey: DEV_KEY, bucketName: 'b' }).configError, null);
  assert.equal(new AdapterAzureBlob({ connectionString: `DefaultEndpointsProtocol=https;AccountName=acct;AccountKey=${DEV_KEY};EndpointSuffix=core.windows.net` }).configError, null);
});

test('cloudStorage.js loads it for Azure, and nothing loads the package adapter', () => {
  const src = fs.readFileSync(path.join(root, 'models/lib/cloudStorage.js'), 'utf8');
  assert.match(src, /case STORAGE_NAME_AZURE:[\s\S]*?mod = require\('\/server\/lib\/azureBlobAdapter'\);/);
  assert.doesNotMatch(src, /sab-adapter-azure-blob/);
  // Its code, not its comment that says why: no Entra sign-in, so no MSAL.
  const code = fs.readFileSync(path.join(root, 'server/lib/azureBlobAdapter.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(code, /@azure\/identity|DefaultAzureCredential|msal/);
  assert.match(code, /require\('@azure\/storage-blob'\)/);
});

const freePort = () => new Promise(resolve => {
  const s = net.createServer().listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
});

test('against Azurite: up, down, a range, listed, removed', { skip: !fs.existsSync(azuriteBin) && 'Azurite is not installed' }, async t => {
  const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'azurite-'));
  const port = await freePort();
  const server = spawn(azuriteBin, ['--silent', '--skipApiVersionCheck', '--location', dir, '--blobHost', '127.0.0.1', '--blobPort', String(port)], { stdio: 'ignore' });
  t.after(() => { server.kill(); fs.rmSync(dir, { recursive: true, force: true }); });
  const connectionString = `DefaultEndpointsProtocol=http;AccountName=${DEV_ACCOUNT};AccountKey=${DEV_KEY};BlobEndpoint=http://127.0.0.1:${port}/${DEV_ACCOUNT};`;
  const { BlobServiceClient } = require('@azure/storage-blob');
  const service = BlobServiceClient.fromConnectionString(connectionString);
  for (let i = 0; ; i++) {
    try { await service.getContainerClient('wekan').createIfNotExists(); break; } catch (e) {
      if (i > 50) throw e;
      await new Promise(r => setTimeout(r, 200));
    }
  }
  const a = new AdapterAzureBlob({ connectionString, bucketName: 'wekan' });
  assert.equal(a.configError, null);
  const read = async result => {
    assert.equal(result.error, null);
    const chunks = [];
    for await (const c of result.value) chunks.push(c);
    return Buffer.concat(chunks).toString();
  };

  const file = path.join(dir, 'up.txt');
  fs.writeFileSync(file, '0123456789abcdef');
  assert.deepEqual(await a.addFileFromPath({ origPath: file, bucketName: 'wekan', targetPath: 'cards/a.txt', options: { ContentLength: 16 } }),
    { value: 'ok', error: null });
  assert.deepEqual(await a.addFileFromStream({ stream: fs.createReadStream(file), bucketName: 'wekan', targetPath: 'backup/b.txt' }),
    { value: 'ok', error: null });
  assert.equal(await read(await a.getFileAsStream('wekan', 'cards/a.txt')), '0123456789abcdef');
  // #6745: a byte range with an inclusive end.
  assert.equal(await read(await a.getFileAsStream('wekan', 'cards/a.txt', { start: 2, end: 5 })), '2345');
  assert.equal(await read(await a.getFileAsStream('wekan', 'cards/a.txt', { start: 10 })), 'abcdef');

  assert.deepEqual((await a.listFiles('wekan')).value.sort(), [['backup/b.txt', 16], ['cards/a.txt', 16]]);
  assert.deepEqual((await a.listFiles('wekan/backup')).value, [['backup/b.txt', 16]], 'container/prefix lists the prefix');
  assert.equal((await a.listFiles('wekan', 1)).value.length, 1, 'and no more than asked for');

  assert.deepEqual(await a.removeFile('wekan', 'cards/a.txt'), { value: 'ok', error: null });
  // Negative: what is gone is not there, and removing it again is no error.
  const gone = await a.getFileAsStream('wekan', 'cards/a.txt');
  assert.equal(gone.value, null);
  assert.ok(gone.error, 'reading a removed file is an error');
  assert.deepEqual(await a.removeFile('wekan', 'cards/a.txt'), { value: 'ok', error: null });
  // Negative: a missing local file and a missing container are errors, not throws.
  assert.ok((await a.addFileFromPath({ origPath: path.join(dir, 'nope'), bucketName: 'wekan', targetPath: 'x' })).error);
  assert.ok((await a.listFiles('no-such-container')).error);
  assert.ok((await a.addFileFromStream({ bucketName: 'wekan', targetPath: 'x' })).error);
});
