'use strict';

// Admin Panel / Problems / Security showed a sign-in from "DinkelsbÃ¼hl":
// Cloudflare sends cf-ipcity as raw UTF-8 bytes and Node hands header values
// over as Latin-1, one character per byte. models/lib/geoHeaders.js reads such
// a value as UTF-8 when it is valid UTF-8, and leaves anything else alone.
// Run: node tests/geoHeadersUtf8.test.cjs

const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const { locationFromHeaders } = require(path.join(__dirname, '..', 'models', 'lib', 'geoHeaders.js'));

// The header exactly as Node delivers it: UTF-8 bytes, each read as a Latin-1 character.
const asNodeSees = text => Buffer.from(text, 'utf8').toString('latin1');
let passed = 0;
const test = async (name, fn) => { await fn(); passed += 1; console.log('  ok -', name); };

(async () => {
  await test('a UTF-8 city from Cloudflare reads as written', () => {
    const loc = locationFromHeaders({ 'cf-ipcountry': 'DE', 'cf-ipcity': asNodeSees('Dinkelsbühl') });
    assert.equal(loc.city, 'Dinkelsbühl');
    for (const city of ['Zürich', 'Helsinki', 'Malmö', 'Kraków', 'São Paulo', 'Москва', '東京']) {
      assert.equal(locationFromHeaders({ 'cf-ipcountry': 'XY', 'cf-ipcity': asNodeSees(city) }).city, city, city);
    }
  });

  await test('negative: plain ASCII, a percent-encoded city and real Latin-1 are left as they are', () => {
    assert.equal(locationFromHeaders({ 'cf-ipcountry': 'GB', 'cf-ipcity': 'London' }).city, 'London');
    assert.equal(locationFromHeaders({ 'x-vercel-ip-country': 'US', 'x-vercel-ip-city': 'New%20York' }).city, 'New York');
    // "Malmö" sent as Latin-1 (one byte 0xF6) is not valid UTF-8: kept.
    assert.equal(locationFromHeaders({ 'cf-ipcountry': 'SE', 'cf-ipcity': 'Malmö' }).city, 'Malmö');
  });

  await test('end to end: a real HTTP request carrying UTF-8 header bytes', async () => {
    const seen = await new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => { resolve(locationFromHeaders(req.headers)); res.end(); server.close(); });
      server.listen(0, '127.0.0.1', () => {
        const req = http.request({ port: server.address().port, host: '127.0.0.1', path: '/',
          headers: { 'cf-ipcountry': 'DE', 'cf-ipcity': asNodeSees('Dinkelsbühl') } }, res => res.resume());
        req.on('error', reject); req.end();
      });
    });
    assert.equal(seen.city, 'Dinkelsbühl');
  });

  console.log(`geoHeadersUtf8: ${passed} tests passed`);
})().catch(err => { console.error(err); process.exit(1); });
