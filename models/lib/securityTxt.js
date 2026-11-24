'use strict';

// /.well-known/security.txt ([RFC9116]; docs/Compliance/README.md WP-9, row
// 7.5): where to report a vulnerability in THIS WeKan, from the security
// contact an administrator sets in Admin Panel / Settings / Legal pages.
// Nothing is served while no contact is set - a security.txt that points
// nowhere is worse than none.
//
// RFC 9116 requires Contact (a URI, one per line) and Expires (less than a
// year ahead, 2.5.5); the file is made on every request, so Expires is always
// EXPIRES_DAYS from now. Canonical names this file's own address.
//
// Pure: tests/securityTxt.test.cjs.

const EXPIRES_DAYS = 180;
const DAY_MS = 24 * 60 * 60 * 1000;

// One contact as an RFC 9116 URI: an e-mail address becomes mailto:, an
// https: (or mailto:/tel:) URI is kept, anything else is dropped.
function contactUri(value) {
  const v = String(value || '').trim();
  if (/^(https:\/\/|mailto:|tel:)[^\s<>"]+$/i.test(v)) return v;
  if (/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(v)) return `mailto:${v}`;
  return '';
}

// The contacts in the field: several may be given, separated by commas,
// semicolons, spaces or new lines.
function contactUris(field) {
  return [...new Set(String(field || '').split(/[\s,;]+/).map(contactUri).filter(Boolean))];
}

function securityTxt({ securityContact, rootUrl, now = Date.now() } = {}) {
  const contacts = contactUris(securityContact);
  if (contacts.length === 0) return null;
  const lines = contacts.map(c => `Contact: ${c}`);
  lines.push(`Expires: ${new Date(now + EXPIRES_DAYS * DAY_MS).toISOString().replace(/\.\d{3}Z$/, 'Z')}`);
  const root = String(rootUrl || '').replace(/\/+$/, '');
  if (/^https:\/\//i.test(root)) lines.push(`Canonical: ${root}/.well-known/security.txt`);
  lines.push('Preferred-Languages: en');
  return `${lines.join('\n')}\n`;
}

module.exports = { EXPIRES_DAYS, contactUri, contactUris, securityTxt };

// The release's SBOM (WP-9), attached to its GitHub Release by
// .github/workflows/release-all.yml as wekan-<version>-sbom.cdx.json; the
// version is package.json's, "v13.30.0" for the release v13.30.
function sbomUrl(version) {
  const m = /^v?(\d+\.\d+)(?:\.0)?$/.exec(String(version || '').trim());
  if (!m) return '';
  return `https://github.com/wekan/wekan/releases/download/v${m[1]}/wekan-${m[1]}-sbom.cdx.json`;
}

module.exports.sbomUrl = sbomUrl;
