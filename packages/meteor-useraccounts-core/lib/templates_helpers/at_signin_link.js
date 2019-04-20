AT.prototype.atSigninLinkHelpers = {
    disabled: function() {
        return AccountsTemplates.disabled();
    },
    signInLink: function(){
        return AccountsTemplates.getRoutePath("signIn");
    },
    preText: function(){
        return T9n.get(AccountsTemplates.texts.signInLink_pre, markIfMissing=false);
    },
    linkText: function(){
        return T9n.get(AccountsTemplates.texts.signInLink_link, markIfMissing=false);
    },
    suffText: function(){
        return T9n.get(AccountsTemplates.texts.signInLink_suff, markIfMissing=false);
    },
};

AT.prototype.atSigninLinkEvents = {
    "click #at-signIn": function(event, t) {
        event.preventDefault();
        AccountsTemplates.linkClick("signIn");
    },
};
