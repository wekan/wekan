Tinytest.addAsync(
'Triggers - runTriggers - run all and after',
function(test, done) {
  var store = [];
  var triggers = MakeTriggers(2, store);
  Triggers.runTriggers(triggers, null, null, function() {
    test.equal(store, [0, 1]);
    done();
  });
});

Tinytest.addAsync(
'Triggers - runTriggers - redirect with url',
function(test, done) {
  var store = [];
  var url = "http://google.com";
  var triggers = MakeTriggers(2, store);
  triggers.splice(1, 0, function(context, redirect) {
    redirect(url); 
  });

  Triggers.runTriggers(triggers, null, function(u) {
    test.equal(store, [0]);
    test.equal(u, url);
    done();
  }, null);
});

Tinytest.addAsync(
'Triggers - runTriggers - redirect without url',
function(test, done) {
  var store = [];
  var url = "http://google.com";
  var triggers = MakeTriggers(2, store);
  triggers.splice(1, 0, function(context, redirect) {
    try {
      redirect(); 
    } catch(ex) {
      test.isTrue(/requires an URL/.test(ex.message));
      test.equal(store, [0]);
      done();
    }
  });

  Triggers.runTriggers(triggers, null, null, null);
});

Tinytest.addAsync(
'Triggers - runTriggers - redirect in a different event loop',
function(test, done) {
  var store = [];
  var url = "http://google.com";
  var triggers = MakeTriggers(2, store);
  var doneCalled = false;

  triggers.splice(1, 0, function(context, redirect) {
    setTimeout(function() {
      try {
        redirect(url); 
      } catch(ex) {
        test.isTrue(/sync/.test(ex.message));
        test.equal(store, [0, 1]);
        test.isTrue(doneCalled);
        done();
      }
    }, 0);
  });

  Triggers.runTriggers(triggers, null, null, function() {
    doneCalled = true;
  });
});

Tinytest.addAsync(
'Triggers - runTriggers - redirect called multiple times',
function(test, done) {
  var store = [];
  var url = "http://google.com";
  var triggers = MakeTriggers(2, store);
  var redirectCalled = false;

  triggers.splice(1, 0, function(context, redirect) {
    redirect(url); 
    try {
      redirect(url);
    } catch(ex) {
      test.isTrue(/already redirected/.test(ex.message));
      test.equal(store, [0]);
      test.isTrue(redirectCalled);
      done();
    }
  });

  Triggers.runTriggers(triggers, null, function() {
    redirectCalled = true;
  }, null);
});

Tinytest.addAsync(
'Triggers - runTriggers - stop callback',
function(test, done) {
  var store = [];
  var triggers = MakeTriggers(2, store);
  triggers.splice(1, 0, function(context, redirect, stop) {
    stop();
  });

  Triggers.runTriggers(triggers, null, null, function() {
    store.push(2);
  });

  test.equal(store, [0]);
  done();
});


Tinytest.addAsync(
'Triggers - runTriggers - get context',
function(test, done) {
  var context = {};
  var trigger = function(c) {
    test.equal(c, context);
    done();
  };

  Triggers.runTriggers([trigger], context, function() {}, function() {});
});

Tinytest.addAsync(
'Triggers - createRouteBoundTriggers - matching trigger',
function(test, done) {
  var context = {route: {name: "abc"}};
  var redirect = function() {};

  var trigger = function(c, r) {
    test.equal(c, context);
    test.equal(r, redirect);
    done();
  };

  var triggers = Triggers.createRouteBoundTriggers([trigger], ["abc"]);
  triggers[0](context, redirect);
});

Tinytest.addAsync(
'Triggers - createRouteBoundTriggers - multiple matching triggers',
function(test, done) {
  var context = {route: {name: "abc"}};
  var redirect = function() {};
  var doneCount = 0;

  var trigger = function(c, r) {
    test.equal(c, context);
    test.equal(r, redirect);
    doneCount++;
  };

  var triggers = Triggers.createRouteBoundTriggers([trigger, trigger], ["abc"]);
  triggers[0](context, redirect);
  triggers[1](context, redirect);

  test.equal(doneCount, 2);
  done();
});

Tinytest.addAsync(
'Triggers - createRouteBoundTriggers - no matching trigger',
function(test, done) {
  var context = {route: {name: "some-other-route"}};
  var redirect = function() {};
  var doneCount = 0;

  var trigger = function(c, r) {
    test.equal(c, context);
    test.equal(r, redirect);
    doneCount++;
  };

  var triggers = Triggers.createRouteBoundTriggers([trigger], ["abc"]);
  triggers[0](context, redirect);

  test.equal(doneCount, 0);
  done();
});

Tinytest.addAsync(
'Triggers - createRouteBoundTriggers - negate logic',
function(test, done) {
  var context = {route: {name: "some-other-route"}};
  var redirect = function() {};
  var doneCount = 0;

  var trigger = function(c, r) {
    test.equal(c, context);
    test.equal(r, redirect);
    doneCount++;
  };

  var triggers = Triggers.createRouteBoundTriggers([trigger], ["abc"], true);
  triggers[0](context, redirect);

  test.equal(doneCount, 1);
  done();
});

Tinytest.addAsync(
'Triggers - applyFilters - no filters',
function(test, done) {
  var original = [];
  test.equal(Triggers.applyFilters(original), original);
  done();
});

Tinytest.addAsync(
'Triggers - applyFilters - single trigger to array',
function(test, done) {
  var original = function() {};
  test.equal(Triggers.applyFilters(original)[0], original);
  done();
});

Tinytest.addAsync(
'Triggers - applyFilters - only and except both',
function(test, done) {
  var original = [];
  try {
    Triggers.applyFilters(original, {only: [], except: []});
  } catch(ex) {
    test.isTrue(/only and except/.test(ex.message));
    done();
  }
});

Tinytest.addAsync(
'Triggers - applyFilters - only is not an array',
function(test, done) {
  var original = [];
  try {
    Triggers.applyFilters(original, {only: "name"});
  } catch(ex) {
    test.isTrue(/to be an array/.test(ex.message));
    done();
  }
});

Tinytest.addAsync(
'Triggers - applyFilters - except is not an array',
function(test, done) {
  var original = [];
  try {
    Triggers.applyFilters(original, {except: "name"});
  } catch(ex) {
    test.isTrue(/to be an array/.test(ex.message));
    done();
  }
});

Tinytest.addAsync(
'Triggers - applyFilters - unsupported filter',
function(test, done) {
  var original = [];
  try {
    Triggers.applyFilters(original, {wowFilter: []});
  } catch(ex) {
    test.isTrue(/not supported/.test(ex.message));
    done();
  }
});

Tinytest.addAsync(
'Triggers - applyFilters - just only filter',
function(test, done) {
  var bounded = Triggers.applyFilters(done, {only: ["abc"]});
  bounded[0]({route: {name: "abc"}});
});

Tinytest.addAsync(
'Triggers - applyFilters - just except filter',
function(test, done) {
  var bounded = Triggers.applyFilters(done, {except: ["abc"]});
  bounded[0]({route: {name: "some-other"}});
});

function MakeTriggers(count, store) {
  var triggers = [];

  function addTrigger(no) {
    triggers.push(function() {
      store.push(no);
    });
  }

  for(var lc=0; lc<count; lc++) {
    addTrigger(lc);
  }
  return triggers;
}