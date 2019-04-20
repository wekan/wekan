AT.prototype.atFormHelpers = {
    hide: function(){
        var state = this.state || AccountsTemplates.getState();
        return state === "hide";
    },
    showTitle: function(next_state){
        var state = next_state || this.state || AccountsTemplates.getState();
        if (Meteor.userId() && state === "signIn")
          return false;
        return !!AccountsTemplates.texts.title[state];
    },
    showOauthServices: function(next_state){
        var state = next_state || this.state || AccountsTemplates.getState();
        if (!(state === "signIn" || state === "signUp"))
            return false;
        var services = AccountsTemplates.oauthServices();
        if (!services.length)
            return false;
        if (Meteor.userId())
            return AccountsTemplates.options.showAddRemoveServices;
        return true;
    },
    showServicesSeparator: function(next_state){
        var pwdService = Package["accounts-password"] !== undefined;
        var state = next_state || this.state || AccountsTemplates.getState();
        var rightState = (state === "signIn" || state === "signUp");
        return rightState && !Meteor.userId() && pwdService && AccountsTemplates.oauthServices().length;
    },
    showError: function(next_state) {
        return !!AccountsTemplates.state.form.get("error");
    },
    showResult: function(next_state) {
        return !!AccountsTemplates.state.form.get("result");
    },
    showMessage: function(next_state) {
        return !!AccountsTemplates.state.form.get("message");
    },
    showPwdForm: function(next_state) {
        if (Package["accounts-password"] === undefined)
            return false;
        var state = next_state || this.state || AccountsTemplates.getState();
        if ((state === "verifyEmail") || (state === "signIn" && Meteor.userId()))
            return false;
        return true;
    },
    showSignInLink: function(next_state){
        if (AccountsTemplates.options.hideSignInLink)
            return false;
        var state = next_state || this.state || AccountsTemplates.getState();
        if (AccountsTemplates.options.forbidClientAccountCreation && state === "forgotPwd")
            return true;
        return state === "signUp";
    },
    showSignUpLink: function(next_state){
        if  (AccountsTemplates.options.hideSignUpLink)
            return false;
        var state = next_state || this.state || AccountsTemplates.getState();
        return ((state === "signIn" && !Meteor.userId()) || state === "forgotPwd") && !AccountsTemplates.options.forbidClientAccountCreation;
    },
    showTermsLink: function(next_state){
        //TODO: Add privacyRoute and termsRoute as alternatives (the point of named routes is
        // being able to change the url in one place only)
        if (!!AccountsTemplates.options.privacyUrl || !!AccountsTemplates.options.termsUrl) {
            var state = next_state || this.state || AccountsTemplates.getState();
            if (state === "signUp" || state === "enrollAccount" ) {
              return true;
            }
        }
        /*
        if (state === "signIn"){
            var pwdService = Package["accounts-password"] !== undefined;
            if (!pwdService)
                return true;
        }
        */
        return false;
    },
    showResendVerificationEmailLink: function(){
        var parentData = Template.currentData();
        var state = (parentData && parentData.state) || AccountsTemplates.getState();
        return (state === "signIn" || state === "forgotPwd") && AccountsTemplates.options.showResendVerificationEmailLink;
    },
};
