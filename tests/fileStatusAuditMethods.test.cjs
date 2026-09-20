'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { transformSync } = require('@swc/core');
let methods, admin = false, resolveScan, starts = 0;
const meteor = { Error: class extends Error { constructor(code, message) { super(message || code); this.error = code; } }, methods(value) { methods = value; } };
const code = transformSync(fs.readFileSync('server/methods/fileStatusAudit.js', 'utf8') + '\nmodule.exports.test = { detect, remoteRead };', { module: { type: 'commonjs' } }).code;
const moduleUnderTest = { exports: {} };
vm.runInNewContext(code, { module: moduleUnderTest, exports: {}, process, Buffer, console, setTimeout, clearTimeout,
 require(name) {
  if (name === 'meteor/meteor') return { Meteor: meteor };
  if (name === 'meteor/check') return { check(value) { if (typeof value !== 'string') throw Error('type'); } };
  if (name === 'meteor/mongo') return { MongoInternals: { defaultRemoteCollectionDriver: () => ({ mongo: { db: {} } }) } };
  if (name === '/imports/reactiveCache') return { ReactiveCache: { getCurrentUser: async () => admin ? { isAdmin: true } : null } };
  if (name.endsWith('.server')) return { fileStoreStrategyFactory: { storagePath: '/configured/files' } };
  if (name === '/models/lib/mimeDetection') return require('../models/lib/mimeDetection');
  if (name === '/models/lib/cloudStorage') return { isCloudConfigured: () => false };
  if (name === '/models/lib/attachmentStoragePath') return { computeStoragePaths: () => ({ writablePath: '/configured' }) };
  if (name === '/server/lib/fileStatusAudit') return { auditFiles: options => { starts++; return new Promise(resolve => { resolveScan = () => { options.report.state = 'completed'; resolve(); }; }); } };
  return require(name);
 },
});
(async () => {
 for (const [name, args] of [['startFileStatusAudit', ['all']], ['getFileStatusAudit', []], ['cancelFileStatusAudit', []]]) await assert.rejects(methods[name](...args), error => error.error === 'not-authorized');
 assert.equal(starts, 0);
 const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=', 'base64');
 const type = await moduleUnderTest.exports.test.detect(png);
 assert.equal(type.mime, 'image/png'); assert.equal(type.ext, 'png');
 assert.throws(() => moduleUnderTest.exports.test.remoteRead('attachments', {}, 'original', 's3'), error => error.code === 'STORAGE_NOT_CONFIGURED');
 assert.throws(() => moduleUnderTest.exports.test.remoteRead('attachments', {}, 'original', 'unexpected'), error => error.code === 'UNSUPPORTED_STORAGE');
 admin = true;
 await assert.rejects(methods.startFileStatusAudit('../etc'), error => error.error === 'invalid-mode');
 await assert.rejects(methods.startFileStatusAudit({ path: '/etc' }));
 const a = await methods.startFileStatusAudit('all');
 const b = await methods.startFileStatusAudit('types');
 assert.equal(a.id, b.id); assert.equal(b.reused, true); assert.equal(starts, 1);
 assert.equal((await methods.getFileStatusAudit()).state, 'running');
 assert.equal(await methods.cancelFileStatusAudit(), true);
 resolveScan();
 await assert.rejects(methods.startFileStatusAudit('all'), error => error.error === 'scan-cooldown');
 const jade = fs.readFileSync('client/components/settings/adminProblems.jade', 'utf8');
 assert.ok(jade.indexOf('+fileStatusAudit') < jade.indexOf('if loading.get'));
 assert.ok(!jade.includes('{{{'), 'audit findings must be escaped by Blaze');
 assert.match(fs.readFileSync('server/imports.js', 'utf8'), /import '\/server\/methods\/fileStatusAudit'/);
 console.log('File audit methods: administrator authorization, input validation, one active scan, cooldown and UI registration pass.');
})().catch(error => { console.error(error); process.exitCode = 1; });
