'use strict';

// Shared security category ↔ hall-of-fame *Bleed catalog
// (design: docs/Security/Remediation/WeKan.md §6).
//
// Maps a short guard key to { category (general name), bleed (hall-of-fame name),
// severity, cwe }. Guards pass a `key`; the logger fills the rest. Kept as one
// table so the general category and the *Bleed name never drift apart. CommonJS
// so both the server ESM code and the tests/*.test.cjs guards can load it.

const CATALOG = {
  'authz.card-copy-overrides': { category: 'authz', bleed: 'CopyIdentityBleed', severity: 'high', cwe: 'CWE-915' },
  'authz.board-copy-overrides': { category: 'authz', bleed: 'CopyIdentityBleed', severity: 'high', cwe: 'CWE-915' },
  'authz.admin-only-field': { category: 'authz', bleed: 'AdminFieldBleed', severity: 'high', cwe: 'CWE-863' },
  'authn.saml-replay': { category: 'authn', bleed: 'SamlReplayBleed', severity: 'high', cwe: 'CWE-294' },
  // ProxyBleed hardening: header login settings are environment-only, so a
  // site administrator's session alone cannot make a proxy sign in as anyone.
  'authn.header-login-env-only': { category: 'authn', bleed: 'ProxyBleed', severity: 'high', cwe: 'CWE-290' },
  'authn.ldap-empty': { category: 'authn', bleed: 'LdapBindBleed', severity: 'critical', cwe: 'CWE-287' },
  'authn.ldap-group': { category: 'authn', bleed: 'DirectoryGroupBleed', severity: 'high', cwe: 'CWE-863' },
  'authn.cas-group': { category: 'authn', bleed: 'DirectoryGroupBleed', severity: 'high', cwe: 'CWE-863' },
  'authn.inactive': { category: 'authn', bleed: 'InactiveBleed', severity: 'critical', cwe: 'CWE-613' },
  'authz.subtask-deposit': { category: 'authz', bleed: 'SubtaskDepositBleed', severity: 'high', cwe: 'CWE-639' },
  'authz.linked-write': { category: 'authz', bleed: 'LinkedWriteBleed', severity: 'high', cwe: 'CWE-863' },
  'authz.invitation-boards': { category: 'authz', bleed: 'InvitationBoardBleed', severity: 'high', cwe: 'CWE-639' },
  'authz.invitation-profile': { category: 'authz', bleed: 'InviteProfileBleed', severity: 'high', cwe: 'CWE-863' },
  'authz.rule-button': { category: 'authz', bleed: 'RuleButtonBleed', severity: 'high', cwe: 'CWE-639' },
  'authz.manage-board': { category: 'authz', bleed: 'ManageBoardBleed', severity: 'high', cwe: 'CWE-863' },
  'authz.comment-card': { category: 'authz', bleed: 'CommentBoundaryBleed', severity: 'high', cwe: 'CWE-639' },
  'authz.mutation': { category: 'authz', bleed: 'MutationBleed', severity: 'high', cwe: 'CWE-863' },
  'authz.board-visibility': { category: 'authz', bleed: 'VisibilityBleed', severity: 'medium', cwe: 'CWE-863' },
  // blocksAccount: false on the next two - the URL comes from data the user did
  // not write (an identity provider's avatar, an imported Trello board's link
  // attachment), so the user who triggered the fetch is not the attacker.
  'ssrf.redirect':   { category: 'ssrf', bleed: 'RedirectBleed', severity: 'high', cwe: 'CWE-918', blocksAccount: false },
  'ssrf.attachment': { category: 'ssrf', bleed: 'LiveBleed', severity: 'high', cwe: 'CWE-918', blocksAccount: false },
  'ssrf.fetch':      { category: 'ssrf', bleed: 'DnsBleed', severity: 'high', cwe: 'CWE-918' },
  'ssrf.webhook':    { category: 'ssrf', bleed: 'IntegrationBleed', severity: 'high', cwe: 'CWE-918' },
  // RepointBleed: a rule trigger, action, rule or webhook integration moved to
  // another board (or '*') by an update; see server/lib/boardRepointGuard.js.
  'authz.repoint':   { category: 'authz', bleed: 'RepointBleed', severity: 'high', cwe: 'CWE-863' },
  // PrototypeBleed: a '__proto__' (or '.', '$') map key sent to the per-user
  // layout methods; see models/lib/safeMapKey.js. No client sends one.
  // BackgroundBleed: a board background pointed at another board's attachment
  // (models/lib/boardBackgroundOwnership.js). The UI only offers the board's own.
  // OwnerBleed: a client board insert naming members other than its creator.
  // BypassBleed's DoS part: a rule chain deeper than MAX_RULE_DEPTH, usually two
  // rules undoing each other. Often an honest mistake, so only detected.
  'dos.rule-loop': { category: 'dos', bleed: 'BypassBleed', severity: 'medium', cwe: 'CWE-674' },
  // HookBleed: a client asking the server to send something other than the
  // card-opened notification through a board's webhook (the UI never does).
  'ssrf.webhook-forge': { category: 'ssrf', bleed: 'HookBleed', severity: 'high', cwe: 'CWE-345' },
  'authz.board-owner': { category: 'authz', bleed: 'OwnerBleed', severity: 'high', cwe: 'CWE-639' },
  'authz.background': { category: 'authz', bleed: 'BackgroundBleed', severity: 'high', cwe: 'CWE-639' },
  'injection.prototype': { category: 'injection', bleed: 'PrototypeBleed', severity: 'high', cwe: 'CWE-1321' },
  'authz.notification-tray': { category: 'authz', bleed: 'TrayBleed', severity: 'high', cwe: 'CWE-639' },
  'authn.cas-state': { category: 'authn', bleed: 'CasTokenBleed', severity: 'high', cwe: 'CWE-352' },
  // SyncBleed (GHSA-5q84-p3vr-f3xv): a List Sync server address on a private,
  // loopback or link-local network, refused when saved and on every fetch.
  'ssrf.list-sync':  { category: 'ssrf', bleed: 'SyncBleed', severity: 'medium', cwe: 'CWE-918' },
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
  'authn.cas-link':  { category: 'authn', bleed: 'CasAccountMergeBleed', severity: 'medium', cwe: 'CWE-287' },
  // A SAML login that would take over an existing non-SAML account of the same
  // username while SAML_MERGE_EXISTING_USERS is off - the SAML counterpart of
  // CasAccountMergeBleed (packages/wekan-accounts-saml/saml_server.js).
  'authn.saml-subject': { category: 'authn', bleed: 'SamlSubjectBleed', severity: 'high', cwe: 'CWE-287' },
  'authn.saml-link': { category: 'authn', bleed: 'SamlAccountMergeBleed', severity: 'medium', cwe: 'CWE-287' },
  // A Google/GitHub/Facebook/… login whose email matches an account made by
  // another method, while OAUTH_PROVIDERS_MERGE_EXISTING_USERS is off: the same
  // takeover shape as CasBleed and OIDC's GHSA-mp7g-hj5q-gxhq, refused and recorded.
  'authn.oauth-link': { category: 'authn', bleed: 'CasBleed', severity: 'medium', cwe: 'CWE-287' },
  'auth-race.oidc':  { category: 'auth-race', bleed: 'OIDCBleed', severity: 'high', cwe: 'CWE-362' },
  'brute.invite':    { category: 'brute-force', bleed: 'InviteBleed', severity: 'high', cwe: 'CWE-307' },
  'brute.login':     { category: 'brute-force', bleed: 'BruteBleed', severity: 'medium', cwe: 'CWE-307' },
  'brute.account-recovery': { category: 'brute-force', bleed: 'ResetBleed', severity: 'high', cwe: 'CWE-307' },
  // Repeated one-time-code requests can flood mail or probe a passwordless
  // login. Keep their report distinct from password recovery's ResetBleed.
  'brute.passwordless-request': { category: 'brute-force', bleed: 'Passwordless', severity: 'high', cwe: 'CWE-307' },
  // GHSA-rf3w-rj48-jxcc: the known-user lockout counted every failure against
  // the USER, so anyone who knew a username could lock its owner out from every
  // address - and a correct password was refused while the lock held. The
  // counter is per (user, source address) now. What is worth recording is a
  // lockout FIRING: on a per-address counter that means somebody guessed three
  // passwords wrong from one place, which is the attempt this is meant to see.
  // The account a lockout names is the one being guessed - the victim - so this
  // key never disables an account (blocksAccount: false); see
  // server/lib/lockoutReporter.js.
  'brute.lockout':   { category: 'brute-force', bleed: 'JamBleed', severity: 'high', cwe: 'CWE-307', blocksAccount: false },
  'injection.shell': { category: 'injection', bleed: 'ScannerBleed', severity: 'high', cwe: 'CWE-78' },
  'file.mime':       { category: 'file', bleed: 'MimeStorageBleed', severity: 'high', cwe: 'CWE-434' },
  'file.name':       { category: 'file', bleed: 'FileNameBleed', severity: 'medium', cwe: 'CWE-79' },
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
  'authz.attachment-file-path': { category: 'authz', bleed: 'FilePathBleed', severity: 'high', cwe: 'CWE-22' },
  // Unauthenticated DDP Methods Allow Instance-Wide Deletion of Attachments
  // and Avatars: ostrio:files registers its OWN _FilesCollectionRemove_<name>
  // method, gated only by allowClientCode, which never went through
  // Attachments.allow/Avatars.allow - so any anonymous caller could wipe
  // every attachment or avatar with selector {}.
  'authz.file-remove': { category: 'authz', bleed: 'WipeBleed', severity: 'critical', cwe: 'CWE-862' },
  // Unauthenticated Arbitrary File Write via Path Traversal in Attachment
  // Upload namingFunction: fileId was used verbatim as the on-disk file name
  // and sanitize() was neutered to an identity function. A distinct name
  // from PathBleed (GHSA-4mxf-m8pq-xc9p, avatar versions.path/board export) -
  // same CWE, different bug, different fix.
  // blocksAccount: false - the upload proceeds with a fresh id, and an older
  // cached client that sends an unexpected file id is not an attacker.
  'authz.upload-path': { category: 'authz', bleed: 'UploadPathBleed', severity: 'critical', cwe: 'CWE-22', blocksAccount: false },
  // Avatars Collection Lacks a protected Callback: ostrio:files' own
  // library-native download route served every avatar to anyone because
  // Avatars never set `protected` (unlike Attachments).
  'authz.avatar-protected': { category: 'authz', bleed: 'PortraitBleed', severity: 'high', cwe: 'CWE-862' },
  // serveLegacyAvatar Serves Legacy CollectionFS Avatars Without Any
  // Authentication: the legacy-avatar fallback routes streamed a migrated-in
  // avatar to anyone who knew its old filerecord id.
  'authz.legacy-avatar': { category: 'authz', bleed: 'RelicAvatarBleed', severity: 'high', cwe: 'CWE-862' },
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
  'integrity.history': { category: 'integrity', bleed: 'HistoryIntegrity', severity: 'critical', cwe: 'CWE-345' },
  'integrity.file': { category: 'integrity', bleed: 'StorageBleed', severity: 'high', cwe: 'CWE-353' },
  // Reply-by-email (#2414): a mail provider, not a logged-in user, calls
  // /api/inbound-email, so the signed reply address is what authorizes a
  // comment. Since ReplyBleed (GHSA-mc7c-cv99-64h7) it names the card and the
  // one recipient, and the author is that recipient. Logged: a forged token, a
  // From address that is not the recipient's, a wrong provider secret - none
  // of which a real reply produces. NOT logged: an expired or pre-fix token, a
  // disabled user or one who lost comment access - real people reach those.
  'authn.inbound-email': { category: 'authn', bleed: 'ReplyBleed', severity: 'medium', cwe: 'CWE-346' },
};

const DEFAULT = { category: 'unknown', bleed: 'Generic', severity: 'info', cwe: '' };

// Resolve a short guard key to its { category, bleed, severity, cwe }. Unknown
// keys fall back to a generic entry so the log/report is never blank.
function categoryFor(key) {
  return Object.assign({}, DEFAULT, CATALOG[key] || {});
}

export { CATALOG, categoryFor };
