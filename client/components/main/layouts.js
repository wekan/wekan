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

  isCas() {
    return Meteor.settings.public &&
      Meteor.settings.public.cas &&
      Meteor.settings.public.cas.loginUrl;
  },

  casSignInLabel() {
    return TAPi18n.__('casSignIn', {}, T9n.getLanguage() || 'en');
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
});

Template.defaultLayout.events({
  'click .js-close-modal': () => {
    Modal.close();
  },
});

Template.defaultLayout.onRendered(function() {
  // Matomo integration
  if (!document.getElementById('scriptMatomo')){
    Meteor.call('getMatomoConf', (err, data) => {
      if (err){
        console.error(err.message);
        return;
      }
      window._paq = window._paq || [];
      window._paq.push(['setDoNotTrack', data.doNotTrack]);
      window._paq.push(['setUserId', data.userName]);
      window._paq.push(['trackPageView']);
      window._paq.push(['enableLinkTracking']);
      (function() {
        window._paq.push(['setTrackerUrl', `${data.address}piwik.php`]);
        window._paq.push(['setSiteId', data.siteId]);

        const script = document.createElement('script');
        Object.assign(script, {
          id: 'scriptMatomo',
          type: 'text/javascript',
          async: 'true',
          defer: 'true',
          src: `${data.address}piwik.js`,
        });
        const s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(script, s);
      })();
    });
  } else {
    window._paq.push(['trackPageView']);
  }
});
