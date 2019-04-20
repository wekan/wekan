AT.prototype.atSocialHelpers = {
    disabled: function() {
        if (AccountsTemplates.disabled())
            return "disabled";
        var user = Meteor.user();
        if (user){
            var numServices = 0;
            if (user.services)
                numServices = _.keys(user.services).length; // including "resume"
            if (numServices === 2 && user.services[this._id])
                return "disabled";
        }
    },
    name: function(){
        return this._id;
    },
    iconClass: function() {
        var ic = AccountsTemplates.texts.socialIcons[this._id];
        if (!ic)
            ic = "fa fa-" + this._id;
        return ic;
    },
    buttonText: function() {
        var service = this;
        var serviceName = this._id;
        if (serviceName === "meteor-developer")
            serviceName = "meteor";
        serviceName = capitalize(serviceName);
        if (!service.configured)
            return T9n.get(AccountsTemplates.texts.socialConfigure, markIfMissing=false) + " " + serviceName;
        var showAddRemove = AccountsTemplates.options.showAddRemoveServices;
        var user = Meteor.user();
        if (user && showAddRemove){
            if (user.services && user.services[this._id]){
                var numServices = _.keys(user.services).length; // including "resume"
                if (numServices === 2)
                    return serviceName;
                else
                    return T9n.get(AccountsTemplates.texts.socialRemove, markIfMissing=false) + " " + serviceName;
            } else
                    return T9n.get(AccountsTemplates.texts.socialAdd, markIfMissing=false) + " " + serviceName;
        }
        var parentData = Template.parentData();
        var state = (parentData && parentData.state) || AccountsTemplates.getState();
        var prefix = state === "signIn" ?
            T9n.get(AccountsTemplates.texts.socialSignIn, markIfMissing=false) :
            T9n.get(AccountsTemplates.texts.socialSignUp, markIfMissing=false);
        return prefix + " " + T9n.get(AccountsTemplates.texts.socialWith, markIfMissing=false) + " " + serviceName;
    },
};

AT.prototype.atSocialEvents = {
    "click button": function(event, t) {
        event.preventDefault();
        event.currentTarget.blur();
        if (AccountsTemplates.disabled())
            return;
        var user = Meteor.user();
        if (user && user.services && user.services[this._id]){
            var numServices = _.keys(user.services).length; // including "resume"
            if (numServices === 2)
                return;
            else{
                AccountsTemplates.setDisabled(true);
                Meteor.call("ATRemoveService", this._id, function(error){
                    AccountsTemplates.setDisabled(false);
                });
            }
        } else {
            AccountsTemplates.setDisabled(true);
            var parentData = Template.parentData();
            var state = (parentData && parentData.state) || AccountsTemplates.getState();
            var serviceName = this._id;
            var methodName;
            if (serviceName === 'meteor-developer')
                methodName = "loginWithMeteorDeveloperAccount";
            else
                methodName = "loginWith" + capitalize(serviceName);
            var loginWithService = Meteor[methodName];
            options = {
                loginStyle: AccountsTemplates.options.socialLoginStyle,
            };
            if (Accounts.ui) {
                if (Accounts.ui._options.requestPermissions[serviceName]) {
                    options.requestPermissions = Accounts.ui._options.requestPermissions[serviceName];
                }
                if (Accounts.ui._options.requestOfflineToken[serviceName]) {
                    options.requestOfflineToken = Accounts.ui._options.requestOfflineToken[serviceName];
                }
            }
            loginWithService(options, function(err) {
                AccountsTemplates.setDisabled(false);
                if (err && err instanceof Accounts.LoginCancelledError) {
                    // do nothing
                }
                else if (err && err instanceof ServiceConfiguration.ConfigError) {
                    if (Accounts._loginButtonsSession)
                        return Accounts._loginButtonsSession.configureService(serviceName);
                }
                else
                    AccountsTemplates.submitCallback(err, state);
            });
        }
    },
};
