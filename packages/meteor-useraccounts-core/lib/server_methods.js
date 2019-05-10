/* global
  AccountsTemplates
*/
"use strict";

Meteor.methods({
  ATCreateUserServer: function(options) {
    if (AccountsTemplates.options.forbidClientAccountCreation) {
      throw new Meteor.Error(403, AccountsTemplates.texts.errors.accountsCreationDisabled);
    }

    // createUser() does more checking.
    check(options, Object);
    var allFieldIds = AccountsTemplates.getFieldIds();

    // Picks-up whitelisted fields for profile
    var profile = options.profile;
    profile = _.pick(profile, allFieldIds);
    profile = _.omit(profile, "username", "email", "password");

    // Validates fields" value
    var signupInfo = _.clone(profile);
    if (options.username) {
      signupInfo.username = options.username;

      if (AccountsTemplates.options.lowercaseUsername) {
        signupInfo.username = signupInfo.username.trim().replace(/\s+/gm, ' ');
        options.profile.name = signupInfo.username;
        signupInfo.username = signupInfo.username.toLowerCase().replace(/\s+/gm, '');
        options.username = signupInfo.username;
      }
    }

    if (options.email) {
      signupInfo.email = options.email;

      if (AccountsTemplates.options.lowercaseUsername) {
        signupInfo.email = signupInfo.email.toLowerCase().replace(/\s+/gm, '');
        options.email = signupInfo.email;
      }
    }

    if (options.password) {
      signupInfo.password = options.password;
    }

    var validationErrors = {};
    var someError = false;

    // Validates fields values
    _.each(AccountsTemplates.getFields(), function(field) {
      var fieldId = field._id;
      var value = signupInfo[fieldId];

      if (fieldId === "password") {
        // Can"t Pick-up password here
        // NOTE: at this stage the password is already encripted,
        //       so there is no way to validate it!!!
        check(value, Object);
        return;
      }

      var validationErr = field.validate(value, "strict");
      if (validationErr) {
        validationErrors[fieldId] = validationErr;
        someError = true;
      }
    });

    if (AccountsTemplates.options.showReCaptcha) {
      var secretKey = null;

      if (AccountsTemplates.options.reCaptcha && AccountsTemplates.options.reCaptcha.secretKey) {
        secretKey = AccountsTemplates.options.reCaptcha.secretKey;
      } else {
        secretKey = Meteor.settings.reCaptcha.secretKey;
      }

      var apiResponse = HTTP.post("https://www.google.com/recaptcha/api/siteverify", {
        params: {
          secret: secretKey,
          response: options.profile.reCaptchaResponse,
          remoteip: this.connection.clientAddress,
        }
      }).data;

      if (!apiResponse.success) {
        throw new Meteor.Error(403, AccountsTemplates.texts.errors.captchaVerification,
          apiResponse['error-codes'] ? apiResponse['error-codes'].join(", ") : "Unknown Error.");
      }
    }

    if (someError) {
      throw new Meteor.Error(403, AccountsTemplates.texts.errors.validationErrors, validationErrors);
    }

    // Possibly removes the profile field
    if (_.isEmpty(options.profile)) {
      delete options.profile;
    }

    // Create user. result contains id and token.
    var userId = Accounts.createUser(options);
    // safety belt. createUser is supposed to throw on error. send 500 error
    // instead of sending a verification email with empty userid.
    if (! userId) {
      throw new Error("createUser failed to insert new user");
    }

    // Call postSignUpHook, if any...
    var postSignUpHook = AccountsTemplates.options.postSignUpHook;
    if (postSignUpHook) {
      postSignUpHook(userId, options);
    }

    // Send a email address verification email in case the context permits it
    // and the specific configuration flag was set to true
    if (options.email && AccountsTemplates.options.sendVerificationEmail) {
      Accounts.sendVerificationEmail(userId, options.email);
    }
  },

  // Resend a user's verification e-mail
  ATResendVerificationEmail: function (email) {
    check(email, String);

    var user = Meteor.users.findOne({ "emails.address": email });

    // Send the standard error back to the client if no user exist with this e-mail
    if (!user) {
      throw new Meteor.Error(403, "User not found");
    }

    try {
      Accounts.sendVerificationEmail(user._id);
    } catch (error) {
      // Handle error when email already verified
      // https://github.com/dwinston/send-verification-email-bug
      throw new Meteor.Error(403, "Already verified");
    }
  },
});
