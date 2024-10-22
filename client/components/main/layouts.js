import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';

BlazeLayout.setRoot('body');

let alreadyCheck = 1;
let isCheckDone = false;
let counter = 0;
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

Template.userFormsLayout.onCreated(function () {
  const templateInstance = this;
  templateInstance.currentSetting = new ReactiveVar();
  templateInstance.isLoading = new ReactiveVar(false);

  if (!ReactiveCache.getCurrentUser()?.profile) {
    Meteor.call('isOidcRedirectionEnabled', (_, result) => {
      if (result) {
        AccountsTemplates.options.socialLoginStyle = 'redirect';
        options = {
          loginStyle: AccountsTemplates.options.socialLoginStyle,
        };
        Meteor.loginWithOidc(options);
      }
    });

    Meteor.subscribe('setting', {
      onReady() {
        templateInstance.currentSetting.set(ReactiveCache.getCurrentSetting());
        return this.stop();
      },
    });
  }
});

Template.userFormsLayout.onRendered(() => {
  Meteor.call('getAuthenticationsEnabled', (_, result) => {
    let enabledAuthenticationMethods = [ 'password' ]; // we show/hide this based on isPasswordLoginEnabled

    if (result) {
      Object.keys(result).forEach((m) => {
        if (result[m]) enabledAuthenticationMethods.push(m);
      });
    }

    Meteor.call('isPasswordLoginEnabled', (_, result) => {
      if (result) {
        $('.at-pwd-form').show();
      }
    });

    Meteor.call('isDisableRegistration', (_, result) => {
      if (result) {
        $('.at-signup-link').hide();
      }
    });

    Meteor.call('isDisableForgotPassword', (_, result) => {
      if (result) {
        $('.at-pwd-link').hide();
      }
    });

    if (enabledAuthenticationMethods.indexOf('oauth2') !== -1) {
      // TODO find better way to run this code once the oauth2 UI is injected in the DOM
      (function waitForElementAndShow() {
        if (!$('.at-oauth')[0]) return setTimeout(waitForElementAndShow, 100);
        $('.at-oauth').show();
      })();
    }

    AccountsTemplates.state.form.keys = new Proxy(
      AccountsTemplates.state.form.keys,
      validator,
    );
    EscapeActions.executeAll();
  });
});

Template.userFormsLayout.helpers({
  isLegalNoticeLinkExist() {
    const currSet = Template.instance().currentSetting.get();
    if (currSet && currSet !== undefined && currSet != null) {
      return currSet.legalNotice !== undefined && currSet.legalNotice.trim() != "";
    }
    else
      return false;
  },

  getLegalNoticeWithWritTraduction() {
    let spanLegalNoticeElt = $("#legalNoticeSpan");
    if (spanLegalNoticeElt != null && spanLegalNoticeElt != undefined) {
      spanLegalNoticeElt.html(TAPi18n.__('acceptance_of_our_legalNotice', {}));
    }
    let atLinkLegalNoticeElt = $("#legalNoticeAtLink");
    if (atLinkLegalNoticeElt != null && atLinkLegalNoticeElt != undefined) {
      atLinkLegalNoticeElt.html(TAPi18n.__('legalNotice', {}));
    }
    return true;
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
    return TAPi18n.getSupportedLanguages()
      .map(({ tag, name }) => ({ tag: tag, name }))
      .sort((a, b) => {
        if (a.name === b.name) {
          return 0;
        } else {
          return a.name > b.name ? 1 : -1;
        }
      });
  },

  isCurrentLanguage() {
    const curLang = TAPi18n.getLanguage();
    return this.tag === curLang;
  },
});

Template.userFormsLayout.events({
  'change .js-userform-set-language'(event) {
    const tag = $(event.currentTarget).val();
    TAPi18n.setLanguage(tag);
    event.preventDefault();
  },
  'click #at-btn'(event, templateInstance) {
    if (FlowRouter.getRouteName() === 'atSignIn') {
      templateInstance.isLoading.set(true);
      authentication(event, templateInstance).then(() => {
        templateInstance.isLoading.set(false);
      });
    }
    isCheckDone = false;
  },
  'click #at-signUp'(event, templateInstance) {
    isCheckDone = false;
  },
  'DOMSubtreeModified #at-oidc'(event) {
    if (alreadyCheck <= 2) {
      let currSetting = ReactiveCache.getCurrentSetting();
      let oidcBtnElt = $("#at-oidc");
      if (currSetting && currSetting !== undefined && currSetting.oidcBtnText !== undefined && oidcBtnElt != null && oidcBtnElt != undefined) {
        let htmlvalue = "<i class='fa fa-oidc'></i>" + currSetting.oidcBtnText;
        if (alreadyCheck == 1) {
          alreadyCheck++;
          oidcBtnElt.html("");
        }
        else {
          alreadyCheck++;
          oidcBtnElt.html(htmlvalue);
        }
      }
    }
    else {
      alreadyCheck = 1;
    }
  },
  'DOMSubtreeModified .at-form'(event) {
    if (alreadyCheck <= 2 && !isCheckDone) {
      if (document.getElementById("at-oidc") != null) {
        let currSetting = ReactiveCache.getCurrentSetting();
        let oidcBtnElt = $("#at-oidc");
        if (currSetting && currSetting !== undefined && currSetting.oidcBtnText !== undefined && oidcBtnElt != null && oidcBtnElt != undefined) {
          let htmlvalue = "<i class='fa fa-oidc'></i>" + currSetting.oidcBtnText;
          if (alreadyCheck == 1) {
            alreadyCheck++;
            oidcBtnElt.html("");
          }
          else {
            alreadyCheck++;
            isCheckDone = true;
            oidcBtnElt.html(htmlvalue);
          }
        }
      }
    }
    else {
      alreadyCheck = 1;
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
        Meteor.loginWithLDAP(match, password, function () {
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
          function () {
            resolve(FlowRouter.go('/'));
          },
        );
      });

    case 'cas':
      return new Promise(resolve => {
        Meteor.loginWithCas(match, password, function () {
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
