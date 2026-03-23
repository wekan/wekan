import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

Meteor.startup(() => {
  Accounts.config({
    loginExpirationInDays: process.env.ACCOUNTS_COMMON_LOGIN_EXPIRATION_IN_DAYS || 90,
  });
});
