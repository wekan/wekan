BlazeLayout.setRoot('body');

const i18nTagToT9n = (i18nTag) => {
  // t9n/i18n tags are same now, see: https://github.com/softwarerero/meteor-accounts-t9n/pull/129
  // but we keep this conversion function here, to be aware that that they are different system.
  return i18nTag;
};

Template.userFormsLayout.onRendered(() => {
  const i18nTag = navigator.language;
  if (i18nTag) {
    T9n.setLanguage(i18nTagToT9n(i18nTag));
  }
  EscapeActions.executeAll();
});

Template.userFormsLayout.helpers({
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
    if (FlowRouter.getRouteName() !== 'atSignIn') {
      return;
    }

    const email = $('#at-field-username_and_email').val();

    Meteor.subscribe('user-authenticationMethod', email, {
      onReady() {
        const user = Users.findOne();

        if (user && user.authenticationMethod === 'password') {
          return this.stop();
        }

        // Stop submit #at-pwd-form
        event.preventDefault();
        event.stopImmediatePropagation();

        const password = $('#at-field-password').val();

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
  },
});

Template.defaultLayout.events({
  'click .js-close-modal': () => {
    Modal.close();
  },
});
