AT.prototype.atPwdFormHelpers = {
    disabled: function() {
        return AccountsTemplates.disabled();
    },
    fields: function() {
        var parentData = Template.currentData();
        var state = (parentData && parentData.state) || AccountsTemplates.getState();
        return _.filter(AccountsTemplates.getFields(), function(s) {
            return _.contains(s.visible, state);
        });
    },
    showForgotPasswordLink: function() {
        var parentData = Template.currentData();
        var state = (parentData && parentData.state) || AccountsTemplates.getState();
        return state === "signIn" && AccountsTemplates.options.showForgotPasswordLink;
    },
    showReCaptcha: function() {
      var parentData = Template.currentData();
      var state = (parentData && parentData.state) || AccountsTemplates.getState();
      return state === "signUp" && AccountsTemplates.options.showReCaptcha;
    },
};


var toLowercaseUsername = function(value){
  return value.toLowerCase().replace(/\s+/gm, '');
};

AT.prototype.atPwdFormEvents = {
    // Form submit
    "submit #at-pwd-form": function(event, t) {
        event.preventDefault();
        t.$("#at-btn").blur();

        AccountsTemplates.setDisabled(true);

        var parentData = Template.currentData();
        var state = (parentData && parentData.state) || AccountsTemplates.getState();
        var preValidation = (state !== "signIn");

        // Client-side pre-validation
        // Validates fields values
        // NOTE: This is the only place where password validation can be enforced!
        var formData = {};
        var someError = false;
        var errList = [];
        _.each(AccountsTemplates.getFields(), function(field){
            // Considers only visible fields...
            if (!_.contains(field.visible, state))
                return;

            var fieldId = field._id;

            var rawValue = field.getValue(t);
            var value = field.fixValue(rawValue);
            // Possibly updates the input value
            if (value !== rawValue) {
                field.setValue(t, value);
            }
            if (value !== undefined && value !== "") {
                formData[fieldId] = value;
            }

            // Validates the field value only if current state is not "signIn"
            if (preValidation && field.getStatus() !== false){
                var validationErr = field.validate(value, "strict");
                if (validationErr) {
                    if (field.negativeValidation)
                        field.setError(validationErr);
                    else{
                        var fId = T9n.get(field.getDisplayName(), markIfMissing=false);
                        //errList.push(fId + ": " + err);
                        errList.push({
                            field: field.getDisplayName(),
                            err: validationErr
                        });
                    }
                    someError = true;
                }
                else
                    field.setSuccess();
            }
        });

        // Clears error and result
        AccountsTemplates.clearError();
        AccountsTemplates.clearResult();
        AccountsTemplates.clearMessage();
        // Possibly sets errors
        if (someError){
            if (errList.length)
                AccountsTemplates.state.form.set("error", errList);
            AccountsTemplates.setDisabled(false);
            //reset reCaptcha form
            if (state === "signUp" && AccountsTemplates.options.showReCaptcha) {
                grecaptcha.reset();
            }
            return;
        }

        // Extracts username, email, and pwds
        var current_password = formData.current_password;
        var email = formData.email;
        var password = formData.password;
        var password_again = formData.password_again;
        var username = formData.username;
        var username_and_email = formData.username_and_email;
        // Clears profile data removing username, email, and pwd
        delete formData.current_password;
        delete formData.email;
        delete formData.password;
        delete formData.password_again;
        delete formData.username;
        delete formData.username_and_email;

        if (AccountsTemplates.options.confirmPassword){
            // Checks passwords for correct match
            if (password_again && password !== password_again){
                var pwd_again = AccountsTemplates.getField("password_again");
                if (pwd_again.negativeValidation)
                    pwd_again.setError(AccountsTemplates.texts.errors.pwdMismatch);
                else
                    AccountsTemplates.state.form.set("error", [{
                        field: pwd_again.getDisplayName(),
                        err: AccountsTemplates.texts.errors.pwdMismatch
                    }]);
                AccountsTemplates.setDisabled(false);
                //reset reCaptcha form
                if (state === "signUp" && AccountsTemplates.options.showReCaptcha) {
                  grecaptcha.reset();
                }
                return;
            }
        }

        // -------
        // Sign In
        // -------
        if (state === "signIn") {
            var pwdOk = !!password;
            var userOk = true;
            var loginSelector;
            if (email) {
                if (AccountsTemplates.options.lowercaseUsername) {
                  email = toLowercaseUsername(email);
                }

                loginSelector = {email: email};
            }
            else if (username) {
                if (AccountsTemplates.options.lowercaseUsername) {
                  username = toLowercaseUsername(username);
                }
                loginSelector = {username: username};
            }
            else if (username_and_email) {
                if (AccountsTemplates.options.lowercaseUsername) {
                  username_and_email = toLowercaseUsername(username_and_email);
                }
                loginSelector = username_and_email;
            }
            else
                userOk = false;

            // Possibly exits if not both 'password' and 'username' are non-empty...
            if (!pwdOk || !userOk){
                AccountsTemplates.state.form.set("error", [AccountsTemplates.texts.errors.loginForbidden]);
                AccountsTemplates.setDisabled(false);
                return;
            }


            return Meteor.loginWithPassword(loginSelector, password, function(error) {
                AccountsTemplates.submitCallback(error, state);
            });
        }

        // -------
        // Sign Up
        // -------
        if (state === "signUp") {
            // Possibly gets reCaptcha response
            if (AccountsTemplates.options.showReCaptcha) {
              var response = grecaptcha.getResponse();
              if (response === "") {
                // recaptcha verification has not completed yet (or has expired)...
                // ...simply ignore submit event!
                AccountsTemplates.setDisabled(false);
                return;
              } else {
                formData.reCaptchaResponse = response;
              }
            }

            var hash = Accounts._hashPassword(password);
            var options = {
                username: username,
                email: email,
                password: hash,
                profile: formData,
            };

            // Call preSignUpHook, if any...
            var preSignUpHook = AccountsTemplates.options.preSignUpHook;
            if (preSignUpHook) {
              preSignUpHook(password, options);
            }

            return Meteor.call("ATCreateUserServer", options, function(error){
                if (error && error.reason === 'Email already exists.') {
                    if (AccountsTemplates.options.showReCaptcha) {
                      grecaptcha.reset();
                    }
                }
                AccountsTemplates.submitCallback(error, undefined, function(){
                    if (AccountsTemplates.options.sendVerificationEmail && AccountsTemplates.options.enforceEmailVerification){
                        AccountsTemplates.submitCallback(error, state, function () {
                            AccountsTemplates.state.form.set("result", AccountsTemplates.texts.info.signUpVerifyEmail);
                            // Cleans up input fields' content
                            _.each(AccountsTemplates.getFields(), function(field){
                                // Considers only visible fields...
                                if (!_.contains(field.visible, state))
                                    return;

                                var elem = t.$("#at-field-" + field._id);

                                // Naïve reset
                                if (field.type === "checkbox") elem.prop('checked', false);
                                else elem.val("");

                            });
                            AccountsTemplates.setDisabled(false);
                            AccountsTemplates.avoidRedirect = true;
                        });
                    }
                    else {
                        var loginSelector;

                        if (email) {
                            if (AccountsTemplates.options.lowercaseUsername) {
                              email = toLowercaseUsername(email);
                            }

                            loginSelector = {email: email};
                        }
                        else if (username) {
                            if (AccountsTemplates.options.lowercaseUsername) {
                              username = toLowercaseUsername(username);
                            }
                            loginSelector = {username: username};
                        }
                        else {
                            if (AccountsTemplates.options.lowercaseUsername) {
                              username_and_email = toLowercaseUsername(username_and_email);
                            }
                            loginSelector = username_and_email;
                        }

                        Meteor.loginWithPassword(loginSelector, password, function(error) {
                            AccountsTemplates.submitCallback(error, state, function(){
                                AccountsTemplates.setState("signIn");
                            });
                        });
                    }
                });
            });
        }

        //----------------
        // Forgot Password
        //----------------
        if (state === "forgotPwd"){
            return Accounts.forgotPassword({
                email: email
            }, function(error) {
                AccountsTemplates.submitCallback(error, state, function(){
                    AccountsTemplates.state.form.set("result", AccountsTemplates.texts.info.emailSent);
                    t.$("#at-field-email").val("");
                });
            });
        }

        //--------------------------------
        // Reset Password / Enroll Account
        //--------------------------------
        if (state === "resetPwd" || state === "enrollAccount") {
            var paramToken = AccountsTemplates.getparamToken();
            return Accounts.resetPassword(paramToken, password, function(error) {
                AccountsTemplates.submitCallback(error, state, function(){
                    var pwd_field_id;
                    if (state === "resetPwd")
                        AccountsTemplates.state.form.set("result", AccountsTemplates.texts.info.pwdReset);
                    else // Enroll Account
                        AccountsTemplates.state.form.set("result", AccountsTemplates.texts.info.pwdSet);
                    t.$("#at-field-password").val("");
                    if (AccountsTemplates.options.confirmPassword)
                        t.$("#at-field-password_again").val("");
                });
            });
        }

        //----------------
        // Change Password
        //----------------
        if (state === "changePwd"){
            return Accounts.changePassword(current_password, password, function(error) {
                AccountsTemplates.submitCallback(error, state, function(){
                    AccountsTemplates.state.form.set("result", AccountsTemplates.texts.info.pwdChanged);
                    t.$("#at-field-current_password").val("");
                    t.$("#at-field-password").val("");
                    if (AccountsTemplates.options.confirmPassword)
                        t.$("#at-field-password_again").val("");
                });
            });
        }

        //----------------
        // Resend Verification E-mail
        //----------------
        if (state === "resendVerificationEmail"){
            return Meteor.call("ATResendVerificationEmail", email, function (error) {
                AccountsTemplates.submitCallback(error, state, function(){
                    AccountsTemplates.state.form.set("result", AccountsTemplates.texts.info.verificationEmailSent);
                    t.$("#at-field-email").val("");

                    AccountsTemplates.avoidRedirect = true;
                });
            });
        }
    },
};
