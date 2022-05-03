if (Meteor.isClient) {
  var Info = new Mongo.Collection("info");
  var Counter = new Mongo.Collection("counter");
  
  Template.hello.onCreated(function () {
    Meteor.subscribe("info");
    Meteor.subscribe("counter");
  });

  Template.hello.helpers({
    counter: function () {
      if (!Template.instance().subscriptionsReady()) return "not ready";
      return Counter.findOne("counter").counter;
    },
    
    serverInfo: function () {
      var obj = Info.findOne("info");
      console.log("server", Meteor.loggingIn && Meteor.loggingIn(), obj);
      return JSON.stringify(obj, null, 2);
    },
    
    clientInfo: function () {
      var obj = Meteor.sandstormUser();
      console.log("client", Meteor.loggingIn && Meteor.loggingIn(), obj);
      return JSON.stringify(obj, null, 2);
    },
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
  
  Meteor.publish("info", function () {
    var user = Meteor.users && this.userId && Meteor.users.findOne(this.userId);
    this.added("info", "info", {userId: this.userId, user: user, sandstormUser: this.connection.sandstormUser(),
                                sessionId: this.connection.sandstormSessionId(),
                                tabId: this.connection.sandstormTabId()});
    this.ready();
  });
  
  var counter = 0;
  Meteor.publish("counter", function () {
    this.added("counter", "counter", {counter: counter++});
    this.ready();
  });
}
