'use strict';

// WeKan builds one Meteor server bundle on Linux and repacks it for Windows.
// PDFKit 0.20's Node ESM entry calls createRequire(import.meta.url); Rspack
// resolves that URL while building and the resulting Linux file URL is invalid
// when Node starts the bundle on Windows. PDFKit publishes an equivalent
// CommonJS Node entry which computes the URL from the deployed __filename.
// Select that entry for both import and require. This runs after every npm
// install and fails loudly if PDFKit changes shape, because an unpatched install
// would produce a release that cannot start on Windows.

const fs = require('node:fs');
const path = require('node:path');

const manifest = path.join(__dirname, '..', 'node_modules', 'pdfkit', 'package.json');
const pkg = JSON.parse(fs.readFileSync(manifest, 'utf8'));
const nodeEntry = pkg.exports && pkg.exports['.'] && pkg.exports['.'].node;

if (!nodeEntry || nodeEntry.require !== './js/pdfkit.js') {
  throw new Error('PDFKit no longer exposes the expected CommonJS Node entry');
}

if (nodeEntry.import !== nodeEntry.require) {
  nodeEntry.import = nodeEntry.require;
  fs.writeFileSync(manifest, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log('patch-pdfkit-entry: Node imports now use the portable CommonJS entry');
}
