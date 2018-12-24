BlazeLayout.setRoot('body');

const i18nTagToT9n = (i18nTag) => {
  // t9n/i18n tags are same now, see: https://github.com/softwarerero/meteor-accounts-t9n/pull/129
  // but we keep this conversion function here, to be aware that that they are different system.
  return i18nTag;
};

const validator = {
  set(obj, prop, value) {
    if (prop === 'state' && value !== 'signIn') {
      $('.at-form-authentication').hide();
    } else if (prop === 'state' && value === 'signIn') {
      $('.at-form-authentication').show();
    }
    // The default behavior to store the value
    obj[prop] = value;
    // Indicate success
    return true;
  },
};

Template.userFormsLayout.onCreated(() => {
  Meteor.subscribe('setting');

});

Template.userFormsLayout.onRendered(() => {

  AccountsTemplates.state.form.keys = new Proxy(AccountsTemplates.state.form.keys, validator);

  const i18nTag = navigator.language;
  if (i18nTag) {
    T9n.setLanguage(i18nTagToT9n(i18nTag));
  }
  EscapeActions.executeAll();
});

Template.userFormsLayout.helpers({

  currentSetting() {
    return Settings.findOne();
  },


  afterBodyStart() {
    return currentSetting.customHTMLafterBodyStart;
  },

  beforeBodyEnd() {
    return currentSetting.customHTMLbeforeBodyEnd;
  },

  languages() {
    return _.map(TAPi18n.getLanguages(), (lang, code) => {
      const tag = code;
      let name = lang.name;
      if (lang.name === 'br') {
        name = 'Brezhoneg';
      } else if (lang.name === 'ig') {
        name = 'Igbo';
      }
      return { tag, name };
    }).sort(function(a, b) {
      if (a.name === b.name) {
        return 0;
      } else {
        return a.name > b.name ? 1 : -1;
      }
    });
  },

  isCurrentLanguage() {
    const t9nTag = i18nTagToT9n(this.tag);
    const curLang = T9n.getLanguage() || 'en';
    return t9nTag === curLang;
  },
/*
  isCas() {
    return Meteor.settings.public &&
      Meteor.settings.public.cas &&
      Meteor.settings.public.cas.loginUrl;
  },

  casSignInLabel() {
    return TAPi18n.__('casSignIn', {}, T9n.getLanguage() || 'en');
  },
*/
});

Template.userFormsLayout.events({
  'change .js-userform-set-language'(evt) {
    const i18nTag = $(evt.currentTarget).val();
    T9n.setLanguage(i18nTagToT9n(i18nTag));
    evt.preventDefault();
  },
  'click button#cas'() {
    Meteor.loginWithCas(function() {
      if (FlowRouter.getRouteName() === 'atSignIn') {
        FlowRouter.go('/');
      }
    });
  },
  'click #at-btn'(event) {
    /* All authentication method can be managed/called here.
       !! DON'T FORGET to correctly fill the fields of the user during its creation if necessary authenticationMethod : String !!
    */
    const authenticationMethodSelected = $('.select-authentication').val();
    // Local account
    if (authenticationMethodSelected === 'password') {
      return;
    }

    // Stop submit #at-pwd-form
    event.preventDefault();
    event.stopImmediatePropagation();

    const email = $('#at-field-username_and_email').val();
    const password = $('#at-field-password').val();

    // Ldap account
    if (authenticationMethodSelected === 'ldap') {
      // Check if the user can use the ldap connection
      Meteor.subscribe('user-authenticationMethod', email, {
        onReady() {
          const user = Users.findOne();
          if (user === undefined || user.authenticationMethod === 'ldap') {
            // Use the ldap connection package
            Meteor.loginWithLDAP(email, password, function(error) {
              if (!error) {
                // Connection
                return FlowRouter.go('/');
              }
              return error;
            });
          }
          return this.stop();
        },
      });
    }
  },
});

Template.defaultLayout.events({
  'click .js-close-modal': () => {
    Modal.close();
  },
});
