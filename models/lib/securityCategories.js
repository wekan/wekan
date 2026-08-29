'use strict';

// Shared security category ↔ hall-of-fame *Bleed catalog
// (design: docs/Security/Remediation/WeKan.md §6).
//
// Maps a short guard key to { category (general name), bleed (hall-of-fame name),
// severity, cwe }. Guards pass a `key`; the logger fills the rest. Kept as one
// table so the general category and the *Bleed name never drift apart. CommonJS
// so both the server ESM code and the tests/*.test.cjs guards can load it.

const CATALOG = {
  'ssrf.redirect':   { category: 'ssrf', bleed: 'RedirectBleed', severity: 'high', cwe: 'CWE-918' },
  'ssrf.attachment': { category: 'ssrf', bleed: 'LiveBleed', severity: 'high', cwe: 'CWE-918' },
  'ssrf.fetch':      { category: 'ssrf', bleed: 'DnsBleed', severity: 'high', cwe: 'CWE-918' },
  'ssrf.webhook':    { category: 'ssrf', bleed: 'IntegrationBleed', severity: 'high', cwe: 'CWE-918' },
  'xss.source':      { category: 'xss', bleed: 'SourceBleed', severity: 'high', cwe: 'CWE-79' },
  'xss.mime':        { category: 'xss', bleed: 'MimeBleed', severity: 'high', cwe: 'CWE-79' },
  'xss.input':       { category: 'xss', bleed: 'InputBleed', severity: 'medium', cwe: 'CWE-79' },
  'spoofing.xff':    { category: 'spoofing', bleed: 'MetricsBleed', severity: 'medium', cwe: 'CWE-290' },
  'authz.export':    { category: 'authz', bleed: 'ImpersonateBleed', severity: 'high', cwe: 'CWE-863' },
  'authn.import':    { category: 'authn', bleed: 'ImportBleed', severity: 'critical', cwe: 'CWE-306' },
  'authn.miniprofile': { category: 'authn', bleed: 'MiniProfileBleed', severity: 'medium', cwe: 'CWE-306' },
  'authz.board':     { category: 'authz', bleed: 'BoardBleed', severity: 'high', cwe: 'CWE-863' },
  'authz.position-history': { category: 'authz', bleed: 'PositionHistoryBleed', severity: 'high', cwe: 'CWE-639' },
  'auth-race.cas':   { category: 'auth-race', bleed: 'CasBleed', severity: 'high', cwe: 'CWE-362' },
  'authn.cas-link':  { category: 'authn', bleed: 'CasBleed', severity: 'medium', cwe: 'CWE-287' },
  'auth-race.oidc':  { category: 'auth-race', bleed: 'OIDCBleed', severity: 'high', cwe: 'CWE-362' },
  'brute.invite':    { category: 'brute-force', bleed: 'InviteBleed', severity: 'high', cwe: 'CWE-307' },
  'brute.login':     { category: 'brute-force', bleed: 'BruteBleed', severity: 'medium', cwe: 'CWE-307' },
  'brute.account-recovery': { category: 'brute-force', bleed: 'ResetBleed', severity: 'high', cwe: 'CWE-307' },
  // GHSA-rf3w-rj48-jxcc: the known-user lockout counted every failure against
  // the USER, so anyone who knew a username could lock its owner out from every
  // address - and a correct password was refused while the lock held. The
  // counter is per (user, source address) now. What is worth recording is a
  // lockout FIRING: on a per-address counter that means somebody guessed three
  // passwords wrong from one place, which is the attempt this is meant to see.
  'brute.lockout':   { category: 'brute-force', bleed: 'JamBleed', severity: 'high', cwe: 'CWE-307' },
  'injection.shell': { category: 'injection', bleed: 'ScannerBleed', severity: 'high', cwe: 'CWE-78' },
  'file.mime':       { category: 'file', bleed: 'MimeBleed', severity: 'high', cwe: 'CWE-434' },
  'file.name':       { category: 'file', bleed: 'FileBleed', severity: 'medium', cwe: 'CWE-73' },
  'file.sanitize':   { category: 'file', bleed: 'FileBleed', severity: 'info', cwe: 'CWE-73' },
  'file.content':    { category: 'file', bleed: 'FileBleed', severity: 'medium', cwe: 'CWE-79' },
  'file.malware':    { category: 'file', bleed: 'MalwareBleed', severity: 'high', cwe: 'CWE-509' },
  'file.size':       { category: 'file', bleed: 'SpaceBleed', severity: 'low', cwe: 'CWE-400' },
  'file.disk':       { category: 'file', bleed: 'FloppyBleed', severity: 'low', cwe: 'CWE-400' },
  'file.avatar-url': { category: 'ssrf', bleed: 'RedirectBleed', severity: 'high', cwe: 'CWE-918' },
  'file.policy':     { category: 'file', bleed: 'PolicyBleed', severity: 'info', cwe: '' },

  // Canary tokens (docs/Security/Remediation/WeKan.md §12). A canary sits where
  // somebody could TRY to override permissions, so every one of these is an
  // ATTEMPT that the rules already refused - the event is the attribution, not
  // the defence. They resolve through this same catalog so a canary's category
  // and *Bleed name cannot drift from the guard it sits next to.
  'authz.canary':    { category: 'authz', bleed: 'CanaryBleed', severity: 'medium', cwe: 'CWE-863' },
  'authz.checklist': { category: 'authz', bleed: 'ChecklistBleed', severity: 'high', cwe: 'CWE-863' },
  'authz.comment':   { category: 'authz', bleed: 'CommentBleed', severity: 'medium', cwe: 'CWE-639' },
  'authz.file-path': { category: 'authz', bleed: 'PathBleed', severity: 'high', cwe: 'CWE-22' },
  'authz.parent':    { category: 'authz', bleed: 'ParentBleed', severity: 'high', cwe: 'CWE-862' },
  'authz.share':     { category: 'authz', bleed: 'RevokeBleed', severity: 'high', cwe: 'CWE-863' },
  'authz.readonly':  { category: 'authz', bleed: 'ReadOnlyBleed', severity: 'medium', cwe: 'CWE-863' },
  'authz.calendar':  { category: 'authz', bleed: 'CalendarBleed', severity: 'medium', cwe: 'CWE-863' },
  'authz.assigned':  { category: 'authz', bleed: 'AssignedBleed', severity: 'medium', cwe: 'CWE-863' },
  'authz.tenant':    { category: 'authz', bleed: 'TenantBleed', severity: 'medium', cwe: 'CWE-862' },
  'authz.search-session': { category: 'authz', bleed: 'SessionBleed', severity: 'medium', cwe: 'CWE-639' },
  'authz.database':  { category: 'authz', bleed: 'DatabaseBleed', severity: 'high', cwe: 'CWE-863' },
  'authz.swimlane-create': { category: 'authz', bleed: 'SwimlaneBleed', severity: 'medium', cwe: 'CWE-862' },
  'authz.rule-destination': { category: 'authz', bleed: 'RuleBleed', severity: 'high', cwe: 'CWE-862' },
  // The five ybsun0215 REST API findings. Four of them have an ATTEMPT that can
  // be told apart from ordinary use, so the refusal is recorded and shows in
  // Admin Panel / Problems. HashBleed (GHSA-6qpx-x7vr-p9w6) deliberately has no
  // key: every call to that endpoint is a legitimate admin call, the fault was
  // in what the answer CARRIED, so a log line there would fire on normal use and
  // say nothing about an attacker.
  'authz.card-delete': { category: 'authz', bleed: 'PurgeBleed', severity: 'critical', cwe: 'CWE-639' },
  'authz.card-member': { category: 'authz', bleed: 'GuestBleed', severity: 'high', cwe: 'CWE-639' },
  'authz.board-list':  { category: 'authz', bleed: 'StaleBleed', severity: 'medium', cwe: 'CWE-863' },
  'spoofing.author':   { category: 'spoofing', bleed: 'AuthorBleed', severity: 'medium', cwe: 'CWE-345' },
  // Registration disabled in the Admin Panel, and POST /users/register created
  // accounts anyway, because its guard read a Meteor option WeKan never sets.
  // Every call that reaches the refusal is an attempt: the admin has turned
  // registration off, so there is no legitimate caller.
  'authz.register':    { category: 'authz', bleed: 'SignupBleed', severity: 'critical', cwe: 'CWE-862' },
  'authn.authentication-method': { category: 'authn', bleed: 'MembershipBleed', severity: 'high', cwe: 'CWE-200' },
  'injection.nosql': { category: 'injection', bleed: 'SelectorBleed', severity: 'high', cwe: 'CWE-943' },
  'injection.sql':   { category: 'injection', bleed: 'EscapeBleed', severity: 'critical', cwe: 'CWE-89' },
};

const DEFAULT = { category: 'unknown', bleed: 'Generic', severity: 'info', cwe: '' };

// Resolve a short guard key to its { category, bleed, severity, cwe }. Unknown
// keys fall back to a generic entry so the log/report is never blank.
function categoryFor(key) {
  return Object.assign({}, DEFAULT, CATALOG[key] || {});
}

export { CATALOG, categoryFor };
