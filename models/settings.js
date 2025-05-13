import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
//var nodemailer = require('nodemailer');

// Sandstorm context is detected using the METEOR_SETTINGS environment variable
// in the package definition.
const isSandstorm =
  Meteor.settings && Meteor.settings.public && Meteor.settings.public.sandstorm;

Settings = new Mongo.Collection('settings');

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
    createdAt: {
      type: Date,
      denyUpdate: true,
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
Settings.allow({
  update(userId) {
    const user = ReactiveCache.getUser(userId);
    return user && user.isAdmin;
  },
});

if (Meteor.isServer) {
  Meteor.startup(() => {
    Settings._collection.createIndex({ modifiedAt: -1 });
    const setting = ReactiveCache.getCurrentSetting();
    if (!setting) {
      const now = new Date();
      const domain = process.env.ROOT_URL.match(
        /\/\/(?:www\.)?(.*)?(?:\/)?/,
      )[1];
      const from = `Boards Support <support@${domain}>`;
      const defaultSetting = {
        disableRegistration: false,
        mailServer: {
          username: '',
          password: '',
          host: '',
          port: '',
          enableTLS: false,
          from,
        },
        createdAt: now,
        modifiedAt: now,
        displayAuthenticationMethod: true,
        defaultAuthenticationMethod: 'password',
      };
      Settings.insert(defaultSetting);
    }
    if (isSandstorm) {
      // At Sandstorm, Admin Panel has SMTP settings
      const newSetting = ReactiveCache.getCurrentSetting();
      if (!process.env.MAIL_URL && newSetting.mailUrl())
        process.env.MAIL_URL = newSetting.mailUrl();
      Accounts.emailTemplates.from = process.env.MAIL_FROM
        ? process.env.MAIL_FROM
        : newSetting.mailServer.from;
    } else {
      // Not running on Sandstorm, so using environment variables
      Accounts.emailTemplates.from = process.env.MAIL_FROM;
    }
  });
  if (isSandstorm) {
    // At Sandstorm Wekan Admin Panel, save SMTP settings.
    Settings.after.update((userId, doc, fieldNames) => {
      // assign new values to mail-from & MAIL_URL in environment
      if (_.contains(fieldNames, 'mailServer') && doc.mailServer.host) {
        const protocol = doc.mailServer.enableTLS ? 'smtps://' : 'smtp://';
        if (!doc.mailServer.username && !doc.mailServer.password) {
          process.env.MAIL_URL = `${protocol}${doc.mailServer.host}:${doc.mailServer.port}/`;
        } else {
          process.env.MAIL_URL = `${protocol}${
            doc.mailServer.username
          }:${encodeURIComponent(doc.mailServer.password)}@${
            doc.mailServer.host
          }:${doc.mailServer.port}/`;
        }
        Accounts.emailTemplates.from = doc.mailServer.from;
      }
    });
  }

  function getRandomNum(min, max) {
    const range = max - min;
    const rand = Math.random();
    return min + Math.round(rand * range);
  }

  function getEnvVar(name) {
    const value = process.env[name];
    if (value) {
      return value;
    }
    throw new Meteor.Error([
      'var-not-exist',
      `The environment variable ${name} does not exist`,
    ]);
  }

  function loadOidcConfig(service){
    check(service, String);
    var config = ServiceConfiguration.configurations.findOne({service: service});
    return config;
  }

  function sendInvitationEmail(_id) {
    const icode = ReactiveCache.getInvitationCode(_id);
    const author = ReactiveCache.getCurrentUser();
    try {
      const fullName = ReactiveCache.getUser(icode.authorId)?.profile?.fullname || "";

      const params = {
        email: icode.email,
        inviter: fullName != "" ? fullName + " (" + ReactiveCache.getUser(icode.authorId).username + " )" : ReactiveCache.getUser(icode.authorId).username,
        user: icode.email.split('@')[0],
        icode: icode.code,
        url: FlowRouter.url('sign-up'),
      };
      const lang = author.getLanguage();
      // Use EmailLocalization utility to handle email in the proper language
      if (typeof EmailLocalization !== 'undefined') {
        EmailLocalization.sendEmail({
          to: icode.email,
          from: Accounts.emailTemplates.from,
          subject: 'email-invite-register-subject',
          text: 'email-invite-register-text',
          params: params,
          language: lang
        });
      } else {
        // Fallback if EmailLocalization is not available
        Email.send({
          to: icode.email,
          from: Accounts.emailTemplates.from,
          subject: TAPi18n.__('email-invite-register-subject', params, lang),
          text: TAPi18n.__('email-invite-register-text', params, lang),
        });
      }
    } catch (e) {
      InvitationCodes.remove(_id);
      throw new Meteor.Error('email-fail', e.message);
    }
  }

  function isNonAdminAllowedToSendMail(currentUser){
    const currSett = ReactiveCache.getCurrentSetting();
    let isAllowed = false;
    if(currSett && currSett != undefined && currSett.disableRegistration && currSett.mailDomainName !== undefined && currSett.mailDomainName != ""){
      for(let i = 0; i < currentUser.emails.length; i++) {
        if(currentUser.emails[i].address.endsWith(currSett.mailDomainName)){
          isAllowed = true;
          break;
        }
      }
    }
    return isAllowed;
  }

  function isLdapEnabled() {
    return (
      process.env.LDAP_ENABLE === 'true' || process.env.LDAP_ENABLE === true
    );
  }

  function isOauth2Enabled() {
    return (
      process.env.OAUTH2_ENABLED === 'true' ||
      process.env.OAUTH2_ENABLED === true
    );
  }

  function isCasEnabled() {
    return (
      process.env.CAS_ENABLED === 'true' || process.env.CAS_ENABLED === true
    );
  }

  function isApiEnabled() {
    return process.env.WITH_API === 'true' || process.env.WITH_API === true;
  }

  Meteor.methods({
    sendInvitation(emails, boards) {
      let rc = 0;
      check(emails, [String]);
      check(boards, [String]);

      const user = ReactiveCache.getCurrentUser();
      if (!user.isAdmin && !isNonAdminAllowedToSendMail(user)) {
        rc = -1;
        throw new Meteor.Error('not-allowed');
      }
      emails.forEach(email => {
        if (email && SimpleSchema.RegEx.Email.test(email)) {
          // Checks if the email is already link to an account.
          const userExist = ReactiveCache.getUser({ email });
          if (userExist) {
            rc = -1;
            throw new Meteor.Error(
              'user-exist',
              `The user with the email ${email} has already an account.`,
            );
          }
          // Checks if the email is already link to an invitation.
          const invitation = ReactiveCache.getInvitationCode({ email });
          if (invitation) {
            InvitationCodes.update(invitation, {
              $set: { boardsToBeInvited: boards },
            });
            sendInvitationEmail(invitation._id);
          } else {
            const code = getRandomNum(100000, 999999);
            InvitationCodes.insert(
              {
                code,
                email,
                boardsToBeInvited: boards,
                createdAt: new Date(),
                authorId: Meteor.userId(),
              },
              function(err, _id) {
                if (!err && _id) {
                  sendInvitationEmail(_id);
                } else {
                  rc = -1;
                  throw new Meteor.Error(
                    'invitation-generated-fail',
                    err.message,
                  );
                }
              },
            );
          }
        }
      });
      return rc;
    },

    sendSMTPTestEmail() {
      if (!Meteor.userId()) {
        throw new Meteor.Error('invalid-user');
      }
      const user = ReactiveCache.getCurrentUser();
      if (!user.emails || !user.emails[0] || !user.emails[0].address) {
        throw new Meteor.Error('email-invalid');
      }
      this.unblock();
      const lang = user.getLanguage();
      try {
/*
        if (process.env.MAIL_SERVICE !== '') {
          let transporter = nodemailer.createTransport({
            service: process.env.MAIL_SERVICE,
            auth: {
              user: process.env.MAIL_SERVICE_USER,
              pass: process.env.MAIL_SERVICE_PASSWORD
            },
          })
          let info = transporter.sendMail({
            to: user.emails[0].address,
            from: Accounts.emailTemplates.from,
            subject: TAPi18n.__('email-smtp-test-subject', { lng: lang }),
            text: TAPi18n.__('email-smtp-test-text', { lng: lang }),
          })
        } else {
          Email.send({
            to: user.emails[0].address,
            from: Accounts.emailTemplates.from,
            subject: TAPi18n.__('email-smtp-test-subject', { lng: lang }),
            text: TAPi18n.__('email-smtp-test-text', { lng: lang }),
          });
        }
*/
        Email.send({
          to: user.emails[0].address,
          from: Accounts.emailTemplates.from,
          subject: TAPi18n.__('email-smtp-test-subject', { lng: lang }),
          text: TAPi18n.__('email-smtp-test-text', { lng: lang }),
        });
      } catch ({ message }) {
        throw new Meteor.Error(
          'email-fail',
          `${TAPi18n.__('email-fail-text', { lng: lang })}: ${message}`,
          message,
        );
      }
      return {
        message: 'email-sent',
        email: user.emails[0].address,
      };
    },

    getCustomUI() {
      const setting = ReactiveCache.getCurrentSetting();
      if (!setting.productName) {
        return {
          productName: '',
        };
      } else {
        return {
          productName: `${setting.productName}`,
        };
      }
    },

    isDisableRegistration() {
      const setting = ReactiveCache.getCurrentSetting();
      if (setting.disableRegistration === true) {
        return true;
      } else {
        return false;
      }
    },

   isDisableForgotPassword() {
      const setting = ReactiveCache.getCurrentSetting();
      if (setting.disableForgotPassword === true) {
        return true;
      } else {
        return false;
      }
    },

    getMatomoConf() {
      return {
        address: getEnvVar('MATOMO_ADDRESS'),
        siteId: getEnvVar('MATOMO_SITE_ID'),
        doNotTrack: process.env.MATOMO_DO_NOT_TRACK || false,
        withUserName: process.env.MATOMO_WITH_USERNAME || false,
      };
    },

    _isLdapEnabled() {
      return isLdapEnabled();
    },

    _isOauth2Enabled() {
      return isOauth2Enabled();
    },

    _isCasEnabled() {
      return isCasEnabled();
    },

    _isApiEnabled() {
      return isApiEnabled();
    },

    // Gets all connection methods to use it in the Template
    getAuthenticationsEnabled() {
      return {
        ldap: isLdapEnabled(),
        oauth2: isOauth2Enabled(),
        cas: isCasEnabled(),
      };
    },

    getOauthServerUrl(){
      return process.env.OAUTH2_SERVER_URL;
    },
    getOauthDashboardUrl(){
      return process.env.DASHBOARD_URL;
    },
    getDefaultAuthenticationMethod() {
      return process.env.DEFAULT_AUTHENTICATION_METHOD;
    },

    isPasswordLoginEnabled() {
      return !(process.env.PASSWORD_LOGIN_ENABLED === 'false');
    },
    isOidcRedirectionEnabled(){
      return process.env.OIDC_REDIRECTION_ENABLED === 'true' && Object.keys(loadOidcConfig("oidc")).length > 0;
    },
    getServiceConfiguration(service){
      return loadOidcConfig(service);
      }
  });
}

export default Settings;
