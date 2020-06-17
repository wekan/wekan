/* global
  AccountsTemplates: false
*/
"use strict";

Meteor.methods({
  ATRemoveService: function(serviceName) {
    check(serviceName, String);

    var userId = this.userId;

    if (userId) {
      var user = Meteor.users.findOne(userId);
      var numServices = _.keys(user.services).length; // including "resume"
      var unset = {};

      if (numServices === 2) {
        throw new Meteor.Error(403, AccountsTemplates.texts.errors.cannotRemoveService, {});
      }

      unset["services." + serviceName] = "";
      Meteor.users.update(userId, {$unset: unset});
    }
  },
});
