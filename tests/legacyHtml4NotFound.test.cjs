'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const pages = fs.readFileSync(path.join(root, 'server/lib/legacyHtml4Pages.js'), 'utf8');
const server = fs.readFileSync(path.join(root, 'server/legacyHtml4.js'), 'utf8');

assert.match(pages, /statusCode: 404/);
assert.match(pages, /tr\(translate, 'page-not-found', 'Page not found'\)/);
assert.doesNotMatch(pages, /More controls will appear/);
assert.match(server, /res\.writeHead\(page\?\.statusCode === 404 \? 404 : 200/);
assert.match(server, /WebApp\.handlers\.get\(CAPABILITY_SCRIPT_PATH[\s\S]*?res\.statusCode = 200/);
console.log('legacyHtml4NotFound: semantic localized HTTP 404 passed');
