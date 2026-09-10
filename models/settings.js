// NO import statements — they are hoisted and trigger circular dependency:
// settings.js → ReactiveCache → i18n/tap → translation.js → ReactiveCache → settings.js
// All dependencies use require() so Settings collection is defined first.

const Meteor = Package.meteor.Meteor;
const Mongo = Package.mongo.Mongo;
const Settings = new Mongo.Collection('settings');
const FlowRouter = Package['ostrio:flow-router-extra'].FlowRouter;
// Lazy getter — avoids circular dependency (reactiveCache imports settings)
const getReactiveCache = () => require('/imports/reactiveCache').ReactiveCache;
// Lazy getter — avoids circular dependency (i18n/tap → reactiveCache → settings)
const getTAPi18n = () => require('/imports/i18n').TAPi18n;
const { SimpleSchema } = require('/imports/simpleSchema');
const InvitationCodes = require('/models/invitationCodes').default;
//var nodemailer = require('nodemailer');

// Sandstorm context is detected using the METEOR_SETTINGS environment variable
// in the package definition.
const isSandstorm =
  Meteor.settings && Meteor.settings.public && Meteor.settings.public.sandstorm;

Settings.attachSchema(
  new SimpleSchema({
    disableRegistration: {
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    disableForgotPassword: {
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    // Admin Panel / Features: when true, all links (markdown [label](url) and raw
    // HTML <a href> tags) are rendered as plain, non-clickable text in every rich
    // text field. Default false keeps links clickable.
    renderLinksAsPlainText: {
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    // Admin Panel / Features: when true, rich text is never rendered as markdown or
    // HTML — the entire raw source is shown as escaped plain text, so hidden links,
    // HTML comments (<!-- -->), JavaScript and any other code are always visible,
    // not clickable, and not running. Default false renders markdown normally.
    alwaysShowCodeAsText: {
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    // Admin Panel / Features (issue #3069): autolink bare `<prefix>NNNN` tokens
    // (e.g. "#1234") found in card descriptions/comments to an external issue
    // tracker. externalLinkPatternPrefix is the literal token prefix (commonly
    // "#"); externalLinkPatternUrl is the URL template containing "{number}",
    // which is replaced with the digits that followed the prefix. Either left
    // empty disables the feature (no-op). See models/lib/externalLinkAutolink.js
    // for the pure matching/URL-building function this setting drives.
    externalLinkPatternPrefix: {
      type: String,
      optional: true,
    },
    externalLinkPatternUrl: {
      type: String,
      optional: true,
    },
    // Admin Panel / Features / Notifications (issue #5820).
    // disableActivities: stop recording AND showing all activity-feed entries.
    // disableNotifications: never send watch notifications.
    // disableWatch: turn off the watch feature (users can still track via activities
    //   if activities are enabled, but cannot subscribe to watch notifications).
    // All default false (current behaviour).
    disableActivities: {
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    disableNotifications: {
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    disableWatch: {
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    // Admin Panel / Features / Delete (soft delete, docs/Features/Undo/Undo.md).
    // When true, a Global Admin may PERMANENTLY (physically) delete soft-deleted
    // content from the Delete panel's category table. Off by default — ordinary
    // deletes are always soft/restorable, and GDPR/account erasure is separate.
    enablePermanentDelete: {
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    // Admin Panel / Features: master switches that disable ALL export / ALL import
    // features (every format and endpoint). Default false (enabled).
    disableAllExport: {
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    disableAllImport: {
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    // Admin Panel / Features: when true, avatars (user profile pictures) are never
    // included when EXPORTING a board (WeKan JSON / CSV export). Default false.
    disableExportAvatars: {
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    // Admin Panel / Features: when true, avatars are never imported — from WeKan
    // JSON import, Trello import, or external identity providers (LDAP/OIDC/OAuth2
    // login avatar sync). Default false.
    disableImportAvatars: {
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    // Admin Panel / Features: when true, user identity fields (username, fullname,
    // initials) are replaced with counter placeholders (user1, user2, ...) as a
    // board is EXPORTED, so exported data carries no real user identities. Default
    // false exports real user data.
    anonymizeExportUsers: {
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    // Admin Panel / Features: when true, user identity fields (username, fullname,
    // initials) are replaced with counter placeholders (user1, user2, ...) as a
    // board is IMPORTED, so the imported board carries no real user identities.
    // Default false imports real user data.
    anonymizeImportUsers: {
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    mailServer: {
      type: Object,
      optional: true,
    },
    'mailServer.username': {
      type: String,
      optional: true,
    },
    'mailServer.password': {
      type: String,
      optional: true,
    },
    'mailServer.host': {
      type: String,
      optional: true,
    },
    'mailServer.port': {
      type: String,
      optional: true,
    },
    'mailServer.enableTLS': {
      type: Boolean,
      optional: true,
    },
    'mailServer.from': {
      type: String,
      optional: true,
    },
    'mailServer.enabled': {
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    'mailServer.service': {
      type: String,
      optional: true,
      defaultValue: 'SMTP',
    },
    // Keys are Nodemailer service names (dots are stored as U+FF0E). Keeping
    // these maps black-boxed lets the bundled service catalogue evolve without
    // widening the browser publication: passwords live in their own unpublished
    // map, while configurations contain only non-secret form values.
    'mailServer.configurations': {
      type: Object,
      optional: true,
      blackbox: true,
    },
    'mailServer.passwords': {
      type: Object,
      optional: true,
      blackbox: true,
    },
    'mailServer.passwordSet': {
      type: Object,
      optional: true,
      blackbox: true,
    },
    productName: {
      type: String,
      optional: true,
    },
    themeColor: {
      /**
       * The site theme, set in Admin Panel / Settings / Visibility / Change color.
       * It is the layer between WeKan's default theme and a user's own override
       * (docs/Theme/Theme.md): whoever has not picked a theme of their own sees
       * this one. On a multitenancy host the Organization's own value replaces it
       * (models/lib/tenants.js BRANDING_FIELDS).
       */
      type: String,
      optional: true,
    },
    themeCustomColors: {
      /**
       * The custom colours of that theme: one for a flat theme, two for a clear
       * (gradient) one.
       */
      type: Array,
      optional: true,
    },
    'themeCustomColors.$': {
      type: String,
      optional: true,
    },
    displayAuthenticationMethod: {
      type: Boolean,
      optional: true,
    },
    defaultAuthenticationMethod: {
      type: String,
      optional: false,
    },
    spinnerName: {
      type: String,
      optional: true,
    },
    hideLogo: {
      type: Boolean,
      optional: true,
    },
    hideCardCounterList: {
      type: Boolean,
      optional: true,
    },
    // How a board loads its cards: 'all' (default — every card into minimongo)
    // or 'lazy' (only the visible per-list window, via a windowed publication).
    // Seeded from the CARDS_LOADING env var; changeable in Admin Panel.
    cardsLoading: {
      type: String,
      optional: true,
      allowedValues: ['all', 'lazy'],
    },
    hideBoardMemberList: {
      type: Boolean,
      optional: true,
    },
    // Hide the activity feed on EVERY board, instance-wide. Read once from this
    // global setting instead of being written into every board document: the old
    // implementation bulk-updated showActivities:false on all boards, which could
    // not be undone (the previous per-board values were gone) and did nothing for
    // boards created afterwards.
    hideBoardActivitiesOnAllBoards: {
      type: Boolean,
      optional: true,
    },
    customLoginLogoImageUrl: {
      type: String,
      optional: true,
    },
    customLoginLogoLinkUrl: {
      type: String,
      optional: true,
    },
    customHelpLinkUrl: {
      type: String,
      optional: true,
    },
    textBelowCustomLoginLogo: {
      type: String,
      optional: true,
    },
    automaticLinkedUrlSchemes: {
      type: String,
      optional: true,
    },
    customTopLeftCornerLogoImageUrl: {
      type: String,
      optional: true,
    },
    customTopLeftCornerLogoLinkUrl: {
      type: String,
      optional: true,
    },
    customTopLeftCornerLogoHeight: {
      type: String,
      optional: true,
    },
    oidcBtnText: {
      type: String,
      optional: true,
    },
    mailDomainName: {
      type: String,
      optional: true,
    },
    legalNotice: {
      type: String,
      optional: true,
    },
    // Board visibility popup / create-board popup: the sub-name text shown under
    // "Private" and "Public". Empty (the default) falls back to the i18n
    // 'private-desc' / 'public-desc' strings unchanged - see
    // imports/i18n/lib/visibilityDesc.js. Set by an admin who wants "Public" to
    // mean something else on their instance, e.g. "public within our
    // organization" rather than public on the internet (issue #4421).
    customPrivateBoardDesc: {
      type: String,
      optional: true,
    },
    customPublicBoardDesc: {
      type: String,
      optional: true,
    },
    customHeadEnabled: {
      type: Boolean,
      optional: true,
    },
    customHeadMetaTags: {
      type: String,
      optional: true,
    },
    customHeadLinkTags: {
      type: String,
      optional: true,
    },
    customManifestEnabled: {
      type: Boolean,
      optional: true,
    },
    customManifestContent: {
      type: String,
      optional: true,
    },
    customAssetLinksEnabled: {
      type: Boolean,
      optional: true,
    },
    customAssetLinksContent: {
      type: String,
      optional: true,
    },
    accessibilityPageEnabled: {
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    accessibilityTitle: {
      type: String,
      optional: true,
    },
    accessibilityContent: {
      type: String,
      optional: true,
    },
    supportPopupText: {
      type: String,
      optional: true,
    },
    supportPageEnabled: {
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    supportPagePublic: {
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    // #6116, split in two so each restriction sits with the thing it is about -
    // Admin Panel / People / Organizations and / Teams. A candidate may be added to
    // a board when they share at least one of the ENABLED kinds with the user doing
    // the adding: an Organization when the first is on, a Team when the second is.
    // With both on that is "an Organization OR a Team", which is exactly what the
    // single `boardMembersFromSameOrgOrTeamOnly` meant - and is what an existing
    // install is migrated to (see server/models/settings.js). Both false is the
    // unrestricted default.
    boardMembersFromSameOrgOnly: {
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    boardMembersFromSameTeamOnly: {
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    // The setting the two above replace. Kept in the schema so an install that
    // still has it stored is valid, and so the migration can read it; nothing
    // writes it any more.
    boardMembersFromSameOrgOrTeamOnly: {
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    // Admin-level default for the 3-tier Notification Settings system (see
    // models/lib/notificationSettings.js): the base decision used when neither a
    // board nor a member has overridden a given notification service. Follows
    // the same nullable-override precedence used by the board/member allowsX
    // toggles elsewhere in this schema — see resolveNotificationSetting().
    notifyDefaultTray: {
      type: Boolean,
      optional: true,
      defaultValue: true,
    },
    notifyDefaultEmail: {
      type: Boolean,
      optional: true,
      defaultValue: true,
    },
    // #2022: admin-customizable templates for WeKan's transactional emails.
    // Each is OPTIONAL and unset by default, so an install that has never
    // touched Admin Panel -> Email Templates sends the exact hardcoded/i18n
    // content it always has (server/models/settings.js's sendInvitationEmail,
    // server/notifications/email.js's activity-notification buffer). Only
    // when an admin fills one of these in is it used, with
    // models/lib/ruleVarsSubstitute.js's substituteVars() - the same
    // `{token}` substitution the #3304 rule "send email" action uses -
    // filling in the tokens documented next to each field below. Deliberately
    // NOT included: password-reset / account-verification emails, which stay
    // hardcoded (see docs/Security note in server/models/settings.js).
    // Tokens: {email} {inviter} {user} {icode} {url}
    inviteEmailSubjectTemplate: {
      type: String,
      optional: true,
    },
    inviteEmailBodyTemplate: {
      type: String,
      optional: true,
    },
    // Tokens: {board} {card} {list} {username} {url} {comment} {action}
    activityEmailSubjectTemplate: {
      type: String,
      optional: true,
    },
    activityEmailBodyTemplate: {
      type: String,
      optional: true,
    },
    supportTitle: {
      type: String,
      optional: true,
    },
    supportPageText: {
      type: String,
      optional: true,
    },
    // Admin Panel override of the LDAP_* environment variables (maintainer
    // request: "Add all settings from environment variables to Admin Panel
    // where appropriate ... as possibility to override"). Every field here is
    // OPTIONAL and unset by default, so an install that has never touched
    // Admin Panel -> LDAP keeps its current env-var-only behaviour unchanged -
    // see models/lib/configResolver.js's resolveConfigValue()/hasConfigValue(),
    // which an unset/empty admin field falls through to the LDAP_* env var for.
    // `ldap.bindPassword` is the ONE field in this group that is never
    // published to the client (see server/publications/settings.js) - only
    // `ldap.bindPasswordSet` (a boolean) is, so the Admin Panel can show "a
    // password is configured" without ever sending the password itself.
    ldap: {
      type: Object,
      optional: true,
    },
    'ldap.enabled': {
      type: Boolean,
      optional: true,
    },
    'ldap.host': {
      type: String,
      optional: true,
    },
    'ldap.port': {
      type: String,
      optional: true,
    },
    'ldap.baseDN': {
      type: String,
      optional: true,
    },
    'ldap.authentificationUserDN': {
      type: String,
      optional: true,
    },
    'ldap.bindPassword': {
      type: String,
      optional: true,
    },
    'ldap.bindPasswordSet': {
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    'ldap.userSearchFilter': {
      type: String,
      optional: true,
    },
    'ldap.userSearchField': {
      type: String,
      optional: true,
    },
    'ldap.encryption': {
      type: String,
      optional: true,
    },
    createdAt: {
      type: Date,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert) {
          return new Date();
        } else if (this.isUpsert) {
          return { $setOnInsert: new Date() };
        } else {
          this.unset();
        }
      },
    },
    modifiedAt: {
      type: Date,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert || this.isUpsert || this.isUpdate) {
          return new Date();
        } else {
          this.unset();
        }
      },
    },
  }),
);
Settings.helpers({
  mailUrl() {
    if (!this.mailServer.host) {
      return null;
    }
    const protocol = this.mailServer.enableTLS ? 'smtps://' : 'smtp://';
    if (!this.mailServer.username && !this.mailServer.password) {
      return `${protocol}${this.mailServer.host}:${this.mailServer.port}/`;
    }
    return `${protocol}${this.mailServer.username}:${encodeURIComponent(
      this.mailServer.password,
    )}@${this.mailServer.host}:${this.mailServer.port}/`;
  },
});

export default Settings;
