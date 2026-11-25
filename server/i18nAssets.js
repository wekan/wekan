// The browser's translations: /i18n/<hash>.json, the server's own copy.
//
// Every dictionary but English is one file in the bundle, a server asset named
// by its content (npm-packages/meteor-i18n-server-loader). The browser's module
// for a language is only that hash; imports/i18n/tap.js fetches the file here.
// It used to be a second, client copy of every dictionary - 140 MiB in every
// bundle, zip, snap and image.
//
// The name is the content's hash, so a file never changes under its URL: the
// browser keeps it for a year, immutable. Private, as every answer of WeKan's
// is (tests/fileCacheHeaders.test.cjs): no shared cache keeps it. Only a
// 20-hex-digit name is looked up, so no request can name another file; any
// other, and a hash with no file, is 404.
import { WebApp } from 'meteor/webapp';

const fs = require('fs');
const { i18nAssetPath } = require('/models/lib/i18nAsset');

function notFound(res) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Not found');
}

WebApp.handlers.get('/i18n/:file', (req, res) => {
  const asset = i18nAssetPath(req.params.file);
  if (!asset) return notFound(res);
  let file;
  try {
    // Assets is the server's own asset table, a global in Meteor's server code.
    // eslint-disable-next-line no-undef
    file = Assets.absoluteFilePath(asset);
  } catch (e) {
    file = null;
  }
  if (!file) return notFound(res);
  fs.stat(file, (statError, stat) => {
    if (statError || !stat.isFile()) return notFound(res);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Length', String(stat.size));
    res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const stream = fs.createReadStream(file);
    stream.on('error', () => { if (!res.headersSent) res.statusCode = 500; res.end(); });
    stream.pipe(res);
  });
});
