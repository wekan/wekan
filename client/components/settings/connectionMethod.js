Template.connectionMethod.onCreated(function() {
  this.connectionMethods = new ReactiveVar([]);

  Meteor.call('getConnectionsEnabled', (_, result) => {
    if (result) {
      // TODO : add a management of different languages
      // (ex {value: ldap, text: TAPi18n.__('ldap', {}, T9n.getLanguage() || 'en')})
      this.connectionMethods.set([
        {value: 'default'},
        // Gets only the connection methods availables
        ...Object.entries(result).filter((e) => e[1]).map((e) => ({value: e[0]})),
      ]);
    }

    // If only the default authentication available, hides the select boxe
    const content = $('.at-form-connection');
    if (!(this.connectionMethods.get().length > 1)) {
      content.hide();
    } else {
      content.show();
    }
  });
});

Template.connectionMethod.onRendered(() => {
  // Moves the select boxe in the first place of the at-pwd-form div
  $('.at-form-connection').detach().prependTo('.at-pwd-form');
});

Template.connectionMethod.helpers({
  connections() {
    return Template.instance().connectionMethods.get();
  },
});
