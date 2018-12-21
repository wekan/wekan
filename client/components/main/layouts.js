BlazeLayout.setRoot('body');

const i18nTagToT9n = (i18nTag) => {
  // t9n/i18n tags are same now, see: https://github.com/softwarerero/meteor-accounts-t9n/pull/129
  // but we keep this conversion function here, to be aware that that they are different system.
  return i18nTag;
};

Template.userFormsLayout.onCreated(function() {
  Meteor.call('getDefaultAuthenticationMethod', (error, result) => {
    this.data.defaultAuthenticationMethod = new ReactiveVar(error ? undefined : result);
  });
  Meteor.subscribe('setting');
});

Template.userFormsLayout.onRendered(() => {
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
  'click #at-btn'(event, instance) {
    const email = $('#at-field-username_and_email').val();
    const password = $('#at-field-password').val();

    if (FlowRouter.getRouteName() !== 'atSignIn' || password === '' || email === '') {
      return;
    }

    // Stop submit #at-pwd-form
    event.preventDefault();
    event.stopImmediatePropagation();

    Meteor.subscribe('user-authenticationMethod', email, {
      onReady() {
        return authentication.call(this, instance, email, password);
      },
    });
  },
});

Template.defaultLayout.events({
  'click .js-close-modal': () => {
    Modal.close();
  },
});

function authentication(instance, email, password) {
  const user = Users.findOne();

  // Authentication with password
  if (user && user.authenticationMethod === 'password') {
    $('#at-pwd-form').submit();
    return this.stop();
  }

  const authenticationMethod = user
    ? user.authenticationMethod
    : instance.data.defaultAuthenticationMethod.get();

  switch (authenticationMethod) {
  case 'ldap':
    // Use the ldap connection package
    Meteor.loginWithLDAP(email, password, function(error) {
      if (error) {
        displayError('error-ldap-login');
        return this.stop();
      } else {
        return FlowRouter.go('/');
      }
    });
    break;

  default:
    displayError('error-undefined');
  }

  return this.stop();
}

function displayError(code) {
  const translated = TAPi18n.__(code);

  if (translated === code) {
    return;
  }

  if(!$('.at-error').length) {
    $('.at-pwd-form').before('<div class="at-error"><p></p></div>');
  }
  $('.at-error p').text(translated);
}
