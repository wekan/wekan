AT.prototype.atResendVerificationEmailLinkHelpers = {
    disabled: function () {
        return AccountsTemplates.disabled();
    },
    resendVerificationEmailLink: function () {
        return AccountsTemplates.getRoutePath("resendVerificationEmail");
    },
    preText: function(){
        return T9n.get(AccountsTemplates.texts.resendVerificationEmailLink_pre, markIfMissing=false);
    },
    linkText: function(){
        return T9n.get(AccountsTemplates.texts.resendVerificationEmailLink_link, markIfMissing=false);
    },
    suffText: function(){
        return T9n.get(AccountsTemplates.texts.resendVerificationEmailLink_suff, markIfMissing=false);
    },
};

AT.prototype.atResendVerificationEmailLinkEvents = {
    "click #at-resend-verification-email": function(event, t) {
        event.preventDefault();
        AccountsTemplates.linkClick('resendVerificationEmail');
    },
};