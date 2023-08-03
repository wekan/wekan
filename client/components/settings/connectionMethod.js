Template.connectionMethod.onCreated(function() {
  this.authenticationMethods = new ReactiveVar([]);

  Meteor.call('getAuthenticationsEnabled', (_, result) => {
    if (result) {
      // Only enabled auth methods without OAuth2/OpenID which is a separate button
      const tmp = Object.keys(result).filter((k) => result[k]).filter((k) => k !== 'oauth2');

      // TODO : add a management of different languages
      // (ex {value: ldap, text: TAPi18n.__('ldap', {}, T9n.getLanguage() || 'en')})
      this.authenticationMethods.set([{ value: 'password' }].concat(tmp.map((k) => { return { value: k }; })));
    }

    // If only the default authentication available, hides the select boxe
    const content = $('.at-form-authentication');

    if (this.authenticationMethods.get().length > 1) {
      content.show();
    } else {
      content.hide();
    }
  });
});

Template.connectionMethod.onRendered(() => {
  // Moves the select boxe in the first place of the at-pwd-form div
  $('.at-form-authentication')
    .detach()
    .prependTo('.at-pwd-form');
});

Template.connectionMethod.helpers({
  authentications() {
    return Template.instance().authenticationMethods.get();
  },
  isSelected(match) {
    return Template.instance().data.authenticationMethod === match;
  },
});
