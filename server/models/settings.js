import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { Email } from 'meteor/email';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { ServiceConfiguration } from 'meteor/service-configuration';
import Settings from '/models/settings';
import InvitationCodes from '/models/invitationCodes';
import EmailLocalization from '/server/lib/emailLocalization';

const getReactiveCache = () => require('/imports/reactiveCache').ReactiveCache;
const getTAPi18n = () => require('/imports/i18n').TAPi18n;
const { SimpleSchema } = require('/imports/simpleSchema');

const isSandstorm =
  Meteor.settings && Meteor.settings.public && Meteor.settings.public.sandstorm;

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

function loadOidcConfig(service) {
  check(service, String);
  return ServiceConfiguration.configurations.findOneAsync({ service });
}

async function sendInvitationEmail(_id) {
  const icode = await getReactiveCache().getInvitationCode(_id);
  const author = await getReactiveCache().getCurrentUser();
  try {
    const authorUser = await getReactiveCache().getUser(icode.authorId);
    const fullName = authorUser?.profile?.fullname || '';

    const params = {
      email: icode.email,
      inviter:
        fullName !== ''
          ? `${fullName} (${authorUser.username} )`
          : authorUser.username,
      user: icode.email.split('@')[0],
      icode: icode.code,
      url: FlowRouter.url('sign-up'),
    };
    const lang = author.getLanguage();
    await EmailLocalization.sendEmail({
      to: icode.email,
      from: Accounts.emailTemplates.from,
      subject: 'email-invite-register-subject',
      text: 'email-invite-register-text',
      params,
      language: lang,
    });
  } catch (e) {
    await InvitationCodes.removeAsync(_id);
    throw new Meteor.Error('email-fail', e.message);
  }
}

async function isNonAdminAllowedToSendMail(currentUser) {
  const currSett = await getReactiveCache().getCurrentSetting();
  let isAllowed = false;
  if (
    currSett &&
    currSett.disableRegistration &&
    currSett.mailDomainName !== undefined &&
    currSett.mailDomainName !== ''
  ) {
    for (let i = 0; i < currentUser.emails.length; i++) {
      if (currentUser.emails[i].address.endsWith(currSett.mailDomainName)) {
        isAllowed = true;
        break;
      }
    }
  }
  return isAllowed;
}

function isLdapEnabled() {
  return process.env.LDAP_ENABLE === 'true' || process.env.LDAP_ENABLE === true;
}

function isOauth2Enabled() {
  return (
    process.env.OAUTH2_ENABLED === 'true' ||
    process.env.OAUTH2_ENABLED === true
  );
}

function isCasEnabled() {
  return process.env.CAS_ENABLED === 'true' || process.env.CAS_ENABLED === true;
}

function isApiEnabled() {
  return process.env.WITH_API === 'true' || process.env.WITH_API === true;
}

Meteor.startup(async () => {
  await Settings._collection.createIndexAsync({ modifiedAt: -1 });
  const setting = await getReactiveCache().getCurrentSetting();
  if (!setting) {
    const now = new Date();
    const domain = process.env.ROOT_URL.match(/\/\/(?:www\.)?(.*)?(?:\/)?/)[1];
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
    await Settings.insertAsync(defaultSetting);
  }
  if (isSandstorm) {
    const newSetting = await getReactiveCache().getCurrentSetting();
    if (!process.env.MAIL_URL && newSetting.mailUrl()) {
      process.env.MAIL_URL = newSetting.mailUrl();
    }
    Accounts.emailTemplates.from = process.env.MAIL_FROM
      ? process.env.MAIL_FROM
      : newSetting.mailServer.from;
  } else {
    Accounts.emailTemplates.from = process.env.MAIL_FROM;
  }
});

if (isSandstorm) {
  Settings.after.update((userId, doc, fieldNames) => {
    if (fieldNames.includes('mailServer') && doc.mailServer.host) {
      const protocol = doc.mailServer.enableTLS ? 'smtps://' : 'smtp://';
      if (!doc.mailServer.username && !doc.mailServer.password) {
        process.env.MAIL_URL = `${protocol}${doc.mailServer.host}:${doc.mailServer.port}/`;
      } else {
        process.env.MAIL_URL = `${protocol}${doc.mailServer.username}:${encodeURIComponent(
          doc.mailServer.password,
        )}@${doc.mailServer.host}:${doc.mailServer.port}/`;
      }
      Accounts.emailTemplates.from = doc.mailServer.from;
    }
  });
}

Meteor.methods({
  async sendInvitation(emails, boards) {
    let rc = 0;
    check(emails, [String]);
    check(boards, [String]);

    const user = await getReactiveCache().getCurrentUser();
    if (!user.isAdmin && !(await isNonAdminAllowedToSendMail(user))) {
      rc = -1;
      throw new Meteor.Error('not-allowed');
    }

    for (const email of emails) {
      if (email && SimpleSchema.RegEx.Email.test(email)) {
        const userExist = await getReactiveCache().getUser({ email });
        if (userExist) {
          rc = -1;
          throw new Meteor.Error(
            'user-exist',
            `The user with the email ${email} has already an account.`,
          );
        }

        const invitation = await getReactiveCache().getInvitationCode({ email });
        if (invitation) {
          await InvitationCodes.updateAsync(invitation, {
            $set: { boardsToBeInvited: boards },
          });
          await sendInvitationEmail(invitation._id);
        } else {
          const code = getRandomNum(100000, 999999);
          const _id = await InvitationCodes.insertAsync({
            code,
            email,
            boardsToBeInvited: boards,
            createdAt: new Date(),
            authorId: this.userId,
          });
          if (_id) {
            await sendInvitationEmail(_id);
          } else {
            rc = -1;
            throw new Meteor.Error(
              'invitation-generated-fail',
              'Failed to create invitation code',
            );
          }
        }
      }
    }
    return rc;
  },

  async sendSMTPTestEmail() {
    if (!this.userId) {
      throw new Meteor.Error('invalid-user');
    }
    const user = await getReactiveCache().getCurrentUser();
    if (!user.emails || !user.emails[0] || !user.emails[0].address) {
      throw new Meteor.Error('email-invalid');
    }
    this.unblock();
    const lang = user.getLanguage();
    try {
      await Email.sendAsync({
        to: user.emails[0].address,
        from: Accounts.emailTemplates.from,
        subject: getTAPi18n().__('email-smtp-test-subject', { lng: lang }),
        text: getTAPi18n().__('email-smtp-test-text', { lng: lang }),
      });
    } catch ({ message }) {
      throw new Meteor.Error(
        'email-fail',
        `${getTAPi18n().__('email-fail-text', { lng: lang })}: ${message}`,
        message,
      );
    }
    return {
      message: 'email-sent',
      email: user.emails[0].address,
    };
  },

  async getCustomUI() {
    const setting = await getReactiveCache().getCurrentSetting();
    if (!setting.productName) {
      return {
        productName: '',
      };
    }
    return {
      productName: `${setting.productName}`,
    };
  },

  async isDisableRegistration() {
    const setting = await getReactiveCache().getCurrentSetting();
    return setting.disableRegistration === true;
  },

  async isDisableForgotPassword() {
    const setting = await getReactiveCache().getCurrentSetting();
    return setting.disableForgotPassword === true;
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

  getAuthenticationsEnabled() {
    return {
      ldap: isLdapEnabled(),
      oauth2: isOauth2Enabled(),
      cas: isCasEnabled(),
    };
  },

  getOauthServerUrl() {
    return process.env.OAUTH2_SERVER_URL;
  },

  getOauthDashboardUrl() {
    return process.env.DASHBOARD_URL;
  },

  getDefaultAuthenticationMethod() {
    return process.env.DEFAULT_AUTHENTICATION_METHOD;
  },

  isPasswordLoginEnabled() {
    return !(process.env.PASSWORD_LOGIN_ENABLED === 'false');
  },

  isOidcRedirectionEnabled() {
    return (
      process.env.OIDC_REDIRECTION_ENABLED === 'true' &&
      Object.keys(loadOidcConfig('oidc')).length > 0
    );
  },

  getServiceConfiguration(service) {
    return loadOidcConfig(service);
  },
});
