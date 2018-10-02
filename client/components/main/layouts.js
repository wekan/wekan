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
  'submit form'(event) {
    const connectionMethod = $('.select-connection').val();

    // Local account
    if (connectionMethod === 'default') {
      return;
    }

    // TODO : find a way to block "submit #at-pwd-form" of the at_pwd_form.js

    const inputs = event.target.getElementsByTagName('input');

    const email = inputs.namedItem('at-field-username_and_email').value;
    const password = inputs.namedItem('at-field-password').value;

    // Ldap account
    if (connectionMethod === 'ldap') {
      // Check if the user can use the ldap connection
      Meteor.subscribe('user-connection-method', email, {
        onReady() {
          const ldap = Users.findOne();
          
          if (ldap) {
            // Use the ldap connection package
            Meteor.loginWithLDAP(email, password, function(error) {
              if (!error) {
                // Connection
                return FlowRouter.go('/');
              }
              
              // TODO : add a gestion of the different cases of exceptions
              console.log(error);
            });
          }
          return this.stop();
        }
      });
    }
  },
});

Template.defaultLayout.events({
  'click .js-close-modal': () => {
    Modal.close();
  },
});
