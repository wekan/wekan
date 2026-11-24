'use strict';

// Legal pages and privacy contacts (docs/Compliance/README.md WP-6, rows 7.1,
// 7.3, 7.4 and 7.5): the privacy notice ([GDPR] Art. 13, [CCPA] § 1798.100(a)),
// terms, the cookie notice ([EPD] Art. 5(3), [TDDDG25] § 25, [PECR6] reg. 6) and
// the imprint ([DDG5] § 5 DDG, [ECG5] § 5 ECG, [MedienG] §§ 24-25, [ECD] Art. 5,
// [UKECR6] reg. 6), and who to contact about privacy ([GDPR] Art. 13(1)(b), 27,
// 37).
//
// Each page is a document of the legalPages collection with _id the page's
// name; the contacts are the document _id 'contacts'. The operator of the
// instance writes them in Admin Panel / Settings / Privacy; everybody, signed
// in or not, reads the published ones at /privacy, /terms, /cookies and
// /imprint, linked from the login page and from Member Settings.
//
// Pure, no Meteor: tests/legalPages.test.cjs.

const PAGES = Object.freeze(['privacy', 'terms', 'cookies', 'imprint']);

// The imprint's structured fields, in the order they are shown: name and
// legal form, who represents it, how to reach it, the register, the VAT id,
// the supervisory authority and professional rules, and the Austrian media
// disclosure. Each is shown only when it is filled.
const IMPRINT_FIELDS = Object.freeze([
  'name', 'legalForm', 'representative', 'address', 'email', 'phoneOrForm',
  'register', 'registerNumber', 'vatId', 'supervisoryAuthority', 'professionalRules', 'mediaDisclosure',
]);

const CONTACT_FIELDS = Object.freeze(['privacyContact', 'dpoContact', 'euRepresentative', 'securityContact']);

// The pages an account can be asked to accept (models/lib/legalAcceptance.js).
const ACCEPTANCE_PAGES = Object.freeze(['terms', 'privacy']);

const MAX_TEXT = 100000;
const MAX_FIELD = 2000;

function text(value, max = MAX_FIELD) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

// An external page instead of WeKan's own: only http(s), so a javascript:
// URL can never become a link.
function safeUrl(value) {
  const v = text(value).trim();
  return /^https?:\/\/[^\s"'<>]+$/i.test(v) ? v : '';
}

// What anybody may read of a page: nothing when it is not published, and of
// the imprint only the fields that are filled.
function publicPage(doc) {
  if (!doc || !PAGES.includes(doc._id) || doc.enabled !== true) return null;
  const out = {
    _id: doc._id,
    title: text(doc.title, 200),
    body: text(doc.body, MAX_TEXT),
    url: safeUrl(doc.url),
    version: Number.isSafeInteger(doc.version) ? doc.version : 1,
    modifiedAt: doc.modifiedAt || null,
    requireAcceptance: ACCEPTANCE_PAGES.includes(doc._id) && doc.requireAcceptance === true,
  };
  if (doc._id === 'imprint') {
    out.fields = IMPRINT_FIELDS.filter(f => text(doc[f]).trim()).map(f => ({ key: f, value: text(doc[f]).trim() }));
  }
  return out;
}

// The contacts anybody may read: the filled ones.
function publicContacts(doc) {
  return CONTACT_FIELDS.filter(f => doc && text(doc[f]).trim()).map(f => ({ key: f, value: text(doc[f]).trim() }));
}

// The $set an administrator's save becomes, from what the form sent. Unknown
// fields are dropped. The version goes up when the text a reader sees changes
// - title, body, external link or an imprint field - so an acceptance of the
// terms (WP-8) can tell which version somebody accepted.
function pageUpdate(current, form) {
  const id = current && current._id;
  if (!PAGES.includes(id)) throw new Error('legal-page-unknown');
  const next = {
    enabled: form.enabled === true,
    title: text(form.title, 200),
    body: text(form.body, MAX_TEXT),
    url: safeUrl(form.url),
    // Requiring acceptance is not a new version of the text (WP-8).
    requireAcceptance: ACCEPTANCE_PAGES.includes(id) && form.requireAcceptance === true,
  };
  if (id === 'imprint') for (const f of IMPRINT_FIELDS) next[f] = text(form[f]);
  const visible = ['title', 'body', 'url', ...(id === 'imprint' ? IMPRINT_FIELDS : [])];
  const changed = visible.some(k => (next[k] || '') !== ((current && current[k]) || ''));
  const version = Number.isSafeInteger(current && current.version) ? current.version : 0;
  next.version = changed || version === 0 ? version + 1 : version;
  return next;
}

function contactsUpdate(form) {
  return Object.fromEntries(CONTACT_FIELDS.map(f => [f, text(form && form[f])]));
}

module.exports = {
  PAGES, ACCEPTANCE_PAGES, IMPRINT_FIELDS, CONTACT_FIELDS, publicPage, publicContacts, pageUpdate, contactsUpdate, safeUrl,
};
