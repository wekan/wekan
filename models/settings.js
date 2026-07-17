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
    productName: {
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
    // #6116: when true, a user may only be added to a board if they share at
    // least one Organization OR one Team with the user performing the add.
    // Default false preserves the current unrestricted behaviour.
    boardMembersFromSameOrgOrTeamOnly: {
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    supportTitle: {
      type: String,
      optional: true,
    },
    supportPageText: {
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
