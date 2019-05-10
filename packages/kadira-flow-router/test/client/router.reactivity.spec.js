Tinytest.addAsync(
'Client - Router - Reactivity - detectChange only once', 
function (test, done) {
  var route = "/" + Random.id();
  var name = Random.id();
  FlowRouter.route(route, {name: name});
  
  var ranCount = 0;
  var pickedId = null;
  var c = Tracker.autorun(function() {
    ranCount++;
    pickedId = FlowRouter.getQueryParam("id");
    if(pickedId) {
      test.equal(pickedId, "hello");
      test.equal(ranCount, 2);
      c.stop();
      Meteor.defer(done);
    }
  });

  setTimeout(function() {
    FlowRouter.go(name, {}, {id: "hello"});
  }, 2);
});

Tinytest.addAsync(
'Client - Router - Reactivity - detectChange in the action', 
function (test, done) {
  var route = "/" + Random.id();
  var name = Random.id();
  FlowRouter.route(route, {
    name: name,
    action: function() {
      var id = FlowRouter.getQueryParam("id");
      test.equal(id, "hello");
      Meteor.defer(done);
    }
  });

  setTimeout(function() {
    FlowRouter.go(name, {}, {id: "hello"});
  }, 2);
});

Tinytest.addAsync(
'Client - Router - Reactivity - detect prev routeChange after new action', 
function (test, done) {
  var route1 = "/" + Random.id();
  var name1 = Random.id();
  var pickedName1 = null;

  var route2 = "/" + Random.id();
  var name2 = Random.id();
  var pickedName2 = Random.id();

  FlowRouter.route(route1, {
    name: name1,
    action: function() {
      Tracker.autorun(function(c) {
        pickedName1 = FlowRouter.getRouteName();
        if(pickedName1 == name2) {
          test.equal(pickedName1, pickedName2);
          c.stop();
          Meteor.defer(done);
        }
      });
    }
  });

  FlowRouter.route(route2, {
    name: name2,
    action: function() {
      pickedName2 = FlowRouter.getRouteName();
      test.equal(pickedName1, name1);
      test.equal(pickedName2, name2);
    }
  });

  FlowRouter.go(name1);
  Meteor.setTimeout(function() {
    FlowRouter.go(name2);
  }, 10);
});

Tinytest.addAsync(
'Client - Router - Reactivity - defer watchPathChange until new route rendered',
function(test, done) {
  var route1 = "/" + Random.id();
  var name1 = Random.id();
  var pickedName1 = null;

  var route2 = "/" + Random.id();
  var name2 = Random.id();
  var pickedName2 = Random.id();

  FlowRouter.route(route1, {
    name: name1,
    action: function() {
      Tracker.autorun(function(c) {
        FlowRouter.watchPathChange();
        pickedName1 = FlowRouter.current().route.name;
        if(pickedName1 == name2) {
          test.equal(pickedName1, pickedName2);
          c.stop();
          Meteor.defer(done);
        }
      });
    }
  });

  FlowRouter.route(route2, {
    name: name2,
    action: function() {
      pickedName2 = FlowRouter.current().route.name;
      test.equal(pickedName1, name1);
      test.equal(pickedName2, name2);
    }
  });

  FlowRouter.go(name1);
  Meteor.setTimeout(function() {
    FlowRouter.go(name2);
  }, 10);
});

Tinytest.addAsync(
'Client - Router - Reactivity - reactive changes and trigger redirects',
function(test, done) {
  var name1 = Random.id();
  var route1 = "/" + name1;
  FlowRouter.route(route1, {
    name: name1
  });

  var name2 = Random.id();
  var route2 = "/" + name2;
  FlowRouter.route(route2, {
    name: name2,
    triggersEnter: [function(context, redirect) {
      redirect(name3);
    }]
  });


  var name3 = Random.id();
  var route3 = "/" + name3;
  FlowRouter.route(route3, {
    name: name3
  });

  var routeNamesFired = [];
  FlowRouter.go(name1);

  var c = null;
  setTimeout(function() {
    c = Tracker.autorun(function(c) {
      routeNamesFired.push(FlowRouter.getRouteName());
    });
    FlowRouter.go(name2);
  }, 50);

  setTimeout(function() {
    c.stop();
    test.equal(routeNamesFired, [name1, name3]);
    Meteor.defer(done);
  }, 250);
});

Tinytest.addAsync(
'Client - Router - Reactivity - watchPathChange for every route change',
function(test, done) {
  var route1 = "/" + Random.id();
  var name1 = Random.id();
  var pickedName1 = null;

  var route2 = "/" + Random.id();
  var name2 = Random.id();
  var pickedName2 = Random.id();

  FlowRouter.route(route1, {
    name: name1
  });

  FlowRouter.route(route2, {
    name: name2
  });

  var ids = [];
  var c = Tracker.autorun(function() {
    FlowRouter.watchPathChange();
    ids.push(FlowRouter.current().queryParams['id']);
  });

  FlowRouter.go(name1, {}, {id: "one"});
  Meteor.setTimeout(function() {
    FlowRouter.go(name1, {}, {id: "two"});
  }, 10);

  Meteor.setTimeout(function() {
    FlowRouter.go(name2, {}, {id: "three"});
  }, 20);

  Meteor.setTimeout(function() {
    test.equal(ids, [undefined, "one", "two", "three"]);
    c.stop();
    done();
  }, 40);
});