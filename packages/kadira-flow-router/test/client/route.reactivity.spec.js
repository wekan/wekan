Route = FlowRouter.Route;


Tinytest.addAsync('Client - Route - Reactivity - getParam', function (test, done) {
  var r = new Route();
  Tracker.autorun(function(c) {
    var param = r.getParam("id");
    if(param) {
      test.equal(param, "hello");
      c.stop();
      Meteor.defer(done);
    }
  });
  
  setTimeout(function() {
    var context = {
      params: {id: "hello"},
      queryParams: {}
    };
    r.registerRouteChange(context);
  }, 10);
});

Tinytest.addAsync('Client - Route - Reactivity - getParam on route close', function (test, done) {
  var r = new Route();
  var closeTriggered = false;
  Tracker.autorun(function(c) {
    var param = r.getParam("id");
    if(closeTriggered) {
      test.equal(param, undefined);
      c.stop();
      Meteor.defer(done);
    }
  });
  
  setTimeout(function() {
    closeTriggered = true;
    r.registerRouteClose();
  }, 10);
});

Tinytest.addAsync('Client - Route - Reactivity - getQueryParam', function (test, done) {
  var r = new Route();
  Tracker.autorun(function(c) {
    var param = r.getQueryParam("id");
    if(param) {
      test.equal(param, "hello");
      c.stop();
      Meteor.defer(done);
    }
  });
  
  setTimeout(function() {
    var context = {
      params: {},
      queryParams: {id: "hello"}
    };
    r.registerRouteChange(context);
  }, 10);
});

Tinytest.addAsync('Client - Route - Reactivity - getQueryParam on route close', function (test, done) {
  var r = new Route();
  var closeTriggered = false;
  Tracker.autorun(function(c) {
    var param = r.getQueryParam("id");
    if(closeTriggered) {
      test.equal(param, undefined);
      c.stop();
      Meteor.defer(done);
    }
  });
  
  setTimeout(function() {
    closeTriggered = true;
    r.registerRouteClose();
  }, 10);
});

Tinytest.addAsync('Client - Route - Reactivity - getRouteName rerun when route closed', function (test, done) {
  var r = new Route();
  r.name = "my-route";
  var closeTriggered = false;

  Tracker.autorun(function(c) {
    var name = r.getRouteName();
    test.equal(name, r.name);

    if(closeTriggered) {
      c.stop();
      Meteor.defer(done);
    }
  });
  
  setTimeout(function() {
    closeTriggered = true;
    r.registerRouteClose();
  }, 10);
});

Tinytest.addAsync('Client - Route - Reactivity - watchPathChange when routeChange', function (test, done) {
  var r = new Route();
  var pathChangeCounts = 0;

  var c = Tracker.autorun(function() {
    r.watchPathChange();
    pathChangeCounts++;
  });

  var context = {
    params: {},
    queryParams: {}
  };

  setTimeout(function() {
    r.registerRouteChange(context);
    setTimeout(checkAfterNormalRouteChange, 50);
  }, 10);

  function checkAfterNormalRouteChange() {
    test.equal(pathChangeCounts, 2);
    var lastRouteChange = true;
    r.registerRouteChange(context, lastRouteChange);
    setTimeout(checkAfterLastRouteChange, 10);
  }

  function checkAfterLastRouteChange() {
    test.equal(pathChangeCounts, 2);
    c.stop();
    Meteor.defer(done);
  }
});

Tinytest.addAsync('Client - Route - Reactivity - watchPathChange when routeClose', function (test, done) {
  var r = new Route();
  var pathChangeCounts = 0;

  var c = Tracker.autorun(function() {
    r.watchPathChange();
    pathChangeCounts++;
  });

  var context = {
    params: {},
    queryParams: {}
  };
  
  setTimeout(function() {
    r.registerRouteClose();
    setTimeout(checkAfterRouteClose, 10);
  }, 10);

  function checkAfterRouteClose() {
    test.equal(pathChangeCounts, 2);
    c.stop();
    Meteor.defer(done);
  }
});