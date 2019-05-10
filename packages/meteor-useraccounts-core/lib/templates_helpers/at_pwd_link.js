AT.prototype.atPwdLinkHelpers = {
    disabled: function() {
        return AccountsTemplates.disabled();
    },
    forgotPwdLink: function(){
        return AccountsTemplates.getRoutePath("forgotPwd");
    },
    preText: function(){
        return T9n.get(AccountsTemplates.texts.pwdLink_pre, markIfMissing=false);
    },
    linkText: function(){
        return T9n.get(AccountsTemplates.texts.pwdLink_link, markIfMissing=false);
    },
    suffText: function(){
        return T9n.get(AccountsTemplates.texts.pwdLink_suff, markIfMissing=false);
    },
};

AT.prototype.atPwdLinkEvents = {
    "click #at-forgotPwd": function(event, t) {
        event.preventDefault();
        AccountsTemplates.linkClick("forgotPwd");
    },
};