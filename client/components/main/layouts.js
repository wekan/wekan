BlazeLayout.setRoot('body');

const i18nTagToT9n = i18nTag => {
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

Template.userFormsLayout.onCreated(function() {
  const templateInstance = this;
  templateInstance.currentSetting = new ReactiveVar();
  templateInstance.isLoading = new ReactiveVar(false);

  Meteor.subscribe('setting', {
    onReady() {
      templateInstance.currentSetting.set(Settings.findOne());
      return this.stop();
    },
  });
  Meteor.call('isPasswordLoginDisabled', (_, result) => {
    if (result) {
      $('.at-pwd-form').hide();
    }
  });
});

Template.userFormsLayout.onRendered(() => {
  AccountsTemplates.state.form.keys = new Proxy(
    AccountsTemplates.state.form.keys,
    validator,
  );

  const i18nTag = navigator.language;
  if (i18nTag) {
    T9n.setLanguage(i18nTagToT9n(i18nTag));
  }
  EscapeActions.executeAll();
});

Template.userFormsLayout.helpers({
  currentSetting() {
    return Template.instance().currentSetting.get();
  },

  isLoading() {
    return Template.instance().isLoading.get();
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
      } else if (lang.name === 'Español') {
        name = 'español';
      } else if (lang.name === 'Español de Argentina') {
        name = 'español de Argentina';
      } else if (lang.name === 'Español de Chile') {
        name = 'español de Chile';
      } else if (lang.name === 'Español de Colombia') {
        name = 'español de Colombia';
      } else if (lang.name === 'Español de México') {
        name = 'español de México';
      } else if (lang.name === 'Español de Puerto Rico') {
        name = 'español de Puerto Rico';
      } else if (lang.name === 'fr-BE') {
        name = 'Français (Belgique)';
      } else if (lang.name === 'fr-CA') {
        name = 'Français (Canada)';
      } else if (lang.name === 'fr-CA') {
        name = 'Français (Canada)';
      } else if (lang.name === 'ig') {
        name = 'Igbo';
      } else if (lang.name === 'lv') {
        name = 'Latviešu';
      } else if (lang.name === 'latviešu valoda') {
        name = 'Latviešu';
      } else if (lang.name === 'oc') {
        name = 'Occitan';
      } else if (lang.name === 'st') {
        name = 'Sãotomense';
      } else if (lang.name === '繁体中文（台湾）') {
        name = '繁體中文（台灣）';
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
  'change .js-userform-set-language'(event) {
    const i18nTag = $(event.currentTarget).val();
    T9n.setLanguage(i18nTagToT9n(i18nTag));
    event.preventDefault();
  },
  'click #at-btn'(event, templateInstance) {
    if (FlowRouter.getRouteName() === 'atSignIn') {
      templateInstance.isLoading.set(true);
      authentication(event, templateInstance).then(() => {
        templateInstance.isLoading.set(false);
      });
    }
  },
});

Template.defaultLayout.events({
  'click .js-close-modal': () => {
    Modal.close();
  },
});

async function authentication(event, templateInstance) {
  const match = $('#at-field-username_and_email').val();
  const password = $('#at-field-password').val();

  if (!match || !password) return undefined;

  const result = await getAuthenticationMethod(
    templateInstance.currentSetting.get(),
    match,
  );

  if (result === 'password') return undefined;

  // Stop submit #at-pwd-form
  event.preventDefault();
  event.stopImmediatePropagation();

  switch (result) {
    case 'ldap':
      return new Promise(resolve => {
        Meteor.loginWithLDAP(match, password, function() {
          resolve(FlowRouter.go('/'));
        });
      });

    case 'saml':
      return new Promise(resolve => {
        const provider = Meteor.settings.public.SAML_PROVIDER;
        Meteor.loginWithSaml(
          {
            provider,
          },
          function() {
            resolve(FlowRouter.go('/'));
          },
        );
      });

    case 'cas':
      return new Promise(resolve => {
        Meteor.loginWithCas(match, password, function() {
          resolve(FlowRouter.go('/'));
        });
      });

    default:
      return undefined;
  }
}

function getAuthenticationMethod(
  { displayAuthenticationMethod, defaultAuthenticationMethod },
  match,
) {
  if (displayAuthenticationMethod) {
    return $('.select-authentication').val();
  }
  return getUserAuthenticationMethod(defaultAuthenticationMethod, match);
}

function getUserAuthenticationMethod(defaultAuthenticationMethod, match) {
  return new Promise(resolve => {
    try {
      Meteor.subscribe('user-authenticationMethod', match, {
        onReady() {
          const user = Users.findOne();

          const authenticationMethod = user
            ? user.authenticationMethod
            : defaultAuthenticationMethod;

          resolve(authenticationMethod);
        },
      });
    } catch (error) {
      resolve(defaultAuthenticationMethod);
    }
  });
}
