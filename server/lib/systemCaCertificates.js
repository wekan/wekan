'use strict';
// #6762: trust the operating system's certificate authorities, not only the
// Mozilla list compiled into Node.js.
//
// Node.js verifies TLS against its own bundled list unless it is started with
// --use-system-ca. A company root CA installed on the server - copied to
// /usr/local/share/ca-certificates and `update-ca-certificates` run, the way
// every other program on the machine is taught it - was therefore unknown to
// WeKan, and once LDAP certificates were verified by default (v12.15) an LDAPS
// login failed with UNABLE_TO_VERIFY_LEAF_SIGNATURE. Verification is not
// relaxed here: a server is still refused unless a trusted CA signed it. The
// list of trusted CAs is what changes - Node's own, plus the system's.
//
// The system's CAs are read two ways, because neither alone is enough:
//   - tls.getCACertificates('system'): Node's own reading of the OS store -
//     the Windows store and the macOS keychain, and OpenSSL's certificate
//     directory (/etc/ssl/certs) elsewhere;
//   - the CA bundle FILES of the Linux and BSD distributions, the list Go's
//     crypto/x509 reads. Inside the snap, /etc/ssl is the host's, but the
//     /etc/ssl/certs/<name>.pem links update-ca-certificates makes point into
//     /usr/local/share/ca-certificates, which the snap sees from its base and
//     not from the host. ca-certificates.crt is a regular file holding them all.
//
// Started with --use-bundled-ca (on the command line or in NODE_OPTIONS),
// Node's own list alone is used, as Node documents for that option.

const nodeFs = require('node:fs');
const crypto = require('node:crypto');

const CA_BUNDLE_FILES = [
  '/etc/ssl/certs/ca-certificates.crt', // Debian, Ubuntu, Gentoo, Arch
  '/etc/pki/tls/certs/ca-bundle.crt', // Fedora, RHEL 6
  '/etc/ssl/ca-bundle.pem', // openSUSE
  '/etc/pki/tls/cacert.pem', // OpenELEC
  '/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem', // CentOS, RHEL 7
  '/etc/ssl/cert.pem', // Alpine, OpenBSD
  '/usr/local/etc/ssl/cert.pem', // FreeBSD
  '/usr/local/share/certs/ca-root-nss.crt', // FreeBSD
];
const PEM_BLOCK = /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g;

function bundledCaOnly(env, execArgv) {
  return (execArgv || []).includes('--use-bundled-ca')
    || /(^|\s)--use-bundled-ca(\s|$)/.test((env && env.NODE_OPTIONS) || '');
}

function systemCaCertificates({ tls, fs, env, platform }) {
  const found = [];
  // On Linux, Node asks OpenSSL, which prints a warning for a certificate
  // directory that does not exist: only ask where there is one to read.
  const dir = env.SSL_CERT_DIR || '/etc/ssl/certs';
  if (platform === 'win32' || platform === 'darwin' || fs.existsSync(dir)) {
    try { found.push(...tls.getCACertificates('system')); } catch (e) { /* no OS store */ }
  }
  for (const file of [env.SSL_CERT_FILE, ...CA_BUNDLE_FILES]) {
    if (!file) continue;
    let text;
    try { text = fs.readFileSync(file, 'utf8'); } catch (e) { continue; }
    found.push(...(text.match(PEM_BLOCK) || []));
  }
  return found;
}

// Adds the system's CAs to Node's default list. Returns what it did, for the
// startup log: { applied, added, total } or { applied: false, reason }.
function trustSystemCaCertificates({
  tls = require('node:tls'),
  fs = nodeFs,
  env = process.env,
  execArgv = process.execArgv,
  platform = process.platform,
} = {}) {
  if (typeof tls.setDefaultCACertificates !== 'function' || typeof tls.getCACertificates !== 'function') {
    return { applied: false, reason: 'this Node.js cannot change its certificate authorities' };
  }
  if (bundledCaOnly(env, execArgv)) {
    return { applied: false, reason: '--use-bundled-ca' };
  }
  const seen = new Set();
  const keep = [];
  const add = (pem) => {
    let fingerprint;
    try { fingerprint = new crypto.X509Certificate(pem).fingerprint256; } catch (e) { return false; }
    if (seen.has(fingerprint)) return false;
    seen.add(fingerprint);
    keep.push(pem);
    return true;
  };
  for (const pem of tls.getCACertificates('default')) add(pem);
  let added = 0;
  for (const pem of systemCaCertificates({ tls, fs, env, platform })) {
    if (add(pem)) added += 1;
  }
  if (added > 0) tls.setDefaultCACertificates(keep);
  return { applied: added > 0, added, total: keep.length };
}

module.exports = { trustSystemCaCertificates, systemCaCertificates, bundledCaOnly, CA_BUNDLE_FILES };
