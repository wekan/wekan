FastRenderColl = new Mongo.Collection('fast-render-coll');

FlowRouter.route('/the-fast-render-route', {
  subscriptions: function() {
    this.register('data', Meteor.subscribe('fast-render-data'));
  }
});

FlowRouter.route('/the-fast-render-route-params/:id', {
  subscriptions: function(params, queryParams) {
    this.register('data', Meteor.subscribe('fast-render-data-params', params, queryParams));
  }
});

FlowRouter.route('/no-fast-render', {
  subscriptions: function() {
    if(Meteor.isClient) {
      this.register('data', Meteor.subscribe('fast-render-data'));
    }
  }
});

var frGroup = FlowRouter.group({
  prefix: "/fr"
});

frGroup.route("/have-fr", {
  subscriptions: function() {
    this.register('data', Meteor.subscribe('fast-render-data'));
  }
});

if(Meteor.isServer) {
  if(!FastRenderColl.findOne()) {
    FastRenderColl.insert({_id: "one", aa: 10});
    FastRenderColl.insert({_id: "two", aa: 20});
  }

  Meteor.publish('fast-render-data', function() {
    return FastRenderColl.find({}, {sort: {aa: -1}});
  });

  Meteor.publish('fast-render-data-params', function(params, queryParams) {
    var fields = {params: params, queryParams: queryParams};
    this.added('fast-render-coll', 'one', fields);
    this.ready();
  });
}