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
