'use strict';

// #4653 "LDAP-sync: wekan-username not correctly generated if ldap-username
// has hyphen". When LDAP_UTF8_NAMES_SLUGIFY is enabled, sync.js slugifies the
// username with limax(text, { separator: '.' }) to transliterate UTF-8 names.
// limax replaces EVERY run of non-alphanumeric characters — including hyphens —
// with the separator, so an LDAP username like "p.parta-partb" was turned into
// "p.parta.partb" and the user could no longer log in (the generated Wekan
// username no longer matched).
//
// slugifyPreservingHyphens slugifies each hyphen-separated segment on its own
// and rejoins them with '-', so hyphens survive while UTF-8 characters in each
// segment are still transliterated. `transliterate` is injected (limax in
// production) so this stays Meteor/limax-free and unit testable.
//
// CommonJS module.exports so it can be `import`ed by the ecmascript package and
// `require`d directly by the plain-Node unit test.
function slugifyPreservingHyphens(text, transliterate) {
  const fn = typeof transliterate === 'function' ? transliterate : (s => s);
  return String(text)
    .split('-')
    .map(part => fn(part))
    .join('-')
    // Keep only the characters a Wekan username may contain. Hyphens are in the
    // allowlist, so the ones we re-joined with are preserved.
    .replace(/[^0-9a-z-_.]/g, '');
}

module.exports = { slugifyPreservingHyphens };
