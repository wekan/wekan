GetSub = function (name) {
  for(var id in Meteor.connection._subscriptions) {
    var sub = Meteor.connection._subscriptions[id];
    if(name === sub.name) {
      return sub;
    }
  }
};

FlowRouter.route('/');
