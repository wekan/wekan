'use strict';

// #1040: LibreJS (https://www.gnu.org/software/librejs/) runs a page's
// JavaScript only when it can tell the code is free. A Meteor bundle is
// generated, minified and named by hash, so it cannot carry the per-file
// `@license` comments by hand; LibreJS's other way is a JS Web Labels page -
// a table of every script with its licenses and its source - linked from the
// page with rel="jslicense". WeKan serves one at /jslicense.html, built from
// the bundle it is actually serving (server/jsWebLabels.js).
//
// The bundle combines WeKan (MIT, which LibreJS calls Expat) with Meteor and
// npm packages under MIT, Apache-2.0, BSD and ISC licenses, so each script is
// labelled with those, and its source is WeKan's repository at the running
// version, which is where every one of them comes from.
// Pure: tests/jsWebLabels.test.cjs.

// LibreJS's names and addresses for the licenses in the client bundle.
const LICENSES = [
  { name: 'Expat', url: 'http://www.jclark.com/xml/copying.txt' },
  { name: 'Apache-2.0', url: 'http://www.apache.org/licenses/LICENSE-2.0' },
  { name: 'Modified BSD', url: 'http://www.xfree86.org/current/LICENSE4.html' },
  { name: 'FreeBSD', url: 'http://www.freebsd.org/copyright/freebsd-license.html' },
  { name: 'ISC', url: 'https://www.isc.org/downloads/software-support-policy/isc-license/' },
];

function esc(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

// The client scripts of a Meteor client program's manifest, as page-relative
// addresses under the ROOT_URL path prefix.
function bundleScripts(manifest, prefix = '') {
  const base = String(prefix || '').replace(/\/+$/, '');
  return (Array.isArray(manifest) ? manifest : [])
    .filter(item => item && item.type === 'js' && typeof item.url === 'string' && item.where !== 'internal')
    .map(item => `${base}${item.url.startsWith('/') ? '' : '/'}${item.url}`);
}

function renderJsWebLabels({ scripts, version, sourceUrl = 'https://github.com/wekan/wekan' } = {}) {
  const source = version ? `${sourceUrl}/tree/v${version}` : sourceUrl;
  const licenses = LICENSES.map(l => `<a href="${esc(l.url)}">${esc(l.name)}</a>`).join('<br>');
  const rows = (Array.isArray(scripts) ? scripts : []).map(url => {
    const name = url.split('?')[0].split('/').pop() || url;
    return `<tr><td><a href="${esc(url)}">${esc(name)}</a></td><td>${licenses}</td><td><a href="${esc(source)}">${esc(source)}</a></td></tr>`;
  }).join('\n');
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>JavaScript license information</title></head>
<body>
<h1>JavaScript license information</h1>
<p>WeKan is free software under the MIT (Expat) license, built with free software. The scripts of this page and their source code:</p>
<table id="jslicense-labels1">
${rows}
</table>
</body></html>
`;
}

// The link LibreJS looks for in the page itself.
function jsLicenseLink(prefix = '') {
  return `<link rel="jslicense" href="${esc(String(prefix || '').replace(/\/+$/, ''))}/jslicense.html">`;
}

module.exports = { LICENSES, bundleScripts, renderJsWebLabels, jsLicenseLink };
