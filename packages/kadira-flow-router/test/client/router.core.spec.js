Router = FlowRouter.Router;

Tinytest.addAsync('Client - Router - define and go to route', function (test, next) {
  var rand = Random.id();
  var rendered = 0;

  FlowRouter.route('/' + rand, {
    action: function(_params) {
      rendered++;
    }
  });

  FlowRouter.go('/' + rand);

  setTimeout(function() {
    test.equal(rendered, 1);
    setTimeout(next, 100);
  }, 100);
});

Tinytest.addAsync('Client - Router - define and go to route with fields',
function (test, next) {
  var rand = Random.id();
  var pathDef = "/" + rand + "/:key";
  var rendered = 0;

  FlowRouter.route(pathDef, {
    action: function(params) {
      test.equal(params.key, "abc +@%");
      rendered++;
    }
  });

  FlowRouter.go(pathDef, {key: "abc +@%"});

  setTimeout(function() {
    test.equal(rendered, 1);
    setTimeout(next, 100);
  }, 100);
});

Tinytest.addAsync('Client - Router - parse params and query', function (test, next) {
  var rand = Random.id();
  var rendered = 0;
  var params = null;

  FlowRouter.route('/' + rand + '/:foo', {
    action: function(_params) {
      rendered++;
      params = _params;
    }
  });

  FlowRouter.go('/' + rand + '/bar');

  setTimeout(function() {
    test.equal(rendered, 1);
    test.equal(params.foo, 'bar');
    setTimeout(next, 100);
  }, 100);
});

Tinytest.addAsync('Client - Router - redirect using FlowRouter.go', function (test, next) {
  var rand = Random.id(), rand2 = Random.id();
  var log = [];
  var paths = ['/' + rand2, '/' + rand];
  var done = false;

  FlowRouter.route(paths[0], {
    action: function(_params) {
      log.push(1);
      FlowRouter.go(paths[1]);
    }
  });

  FlowRouter.route(paths[1], {
    action: function(_params) {
      log.push(2);
    }
  });

  FlowRouter.go(paths[0]);

  setTimeout(function() {
    test.equal(log, [1, 2]);
    done = true;
    next();
  }, 100);
});

Tinytest.addAsync('Client - Router - get current route path', function (test, next) {
  var value = Random.id();
  var randomValue = Random.id();
  var pathDef = "/" + randomValue + '/:_id';
  var path = "/" + randomValue + "/" + value;

  var detectedValue = null;

  FlowRouter.route(pathDef, {
    action: function(params) {
      detectedValue = params._id;
    }
  });

  FlowRouter.go(path);

  Meteor.setTimeout(function() {
    test.equal(detectedValue, value);
    test.equal(FlowRouter.current().path, path);
    next();
  }, 50);
});

Tinytest.addAsync('Client - Router - subscribe to global subs', function (test, next) {
  var rand = Random.id();
  FlowRouter.route('/' + rand);

  FlowRouter.subscriptions = function (path) {
    test.equal(path, '/' + rand);
    this.register('baz', Meteor.subscribe('baz'));
  };

  FlowRouter.go('/' + rand);
  setTimeout(function() {
    test.isTrue(!!GetSub('baz'));
    FlowRouter.subscriptions = Function.prototype;
    next();
  }, 100);
});

Tinytest.addAsync('Client - Router - setParams - generic', function (test, done) {
  var randomKey = Random.id();
  var pathDef = "/" + randomKey + "/:cat/:id";
  var paramsList = [];
  FlowRouter.route(pathDef, {
    action: function(params) {
      paramsList.push(params);
    }
  });

  FlowRouter.go(pathDef, {cat: "meteor", id: "200"});
  setTimeout(function() {
    // return done();
    var success = FlowRouter.setParams({id: "700"});
    test.isTrue(success);
    setTimeout(validate, 50);
  }, 50);

  function validate() {
    test.equal(paramsList.length, 2);
    test.equal(_.pick(paramsList[0], "id", "cat"), {cat: "meteor", id: "200"});
    test.equal(_.pick(paramsList[1], "id", "cat"), {cat: "meteor", id: "700"});
    done();
  }
});

Tinytest.addAsync('Client - Router - setParams - preserve query strings', function (test, done) {
  var randomKey = Random.id();
  var pathDef = "/" + randomKey + "/:cat/:id";
  var paramsList = [];
  var queryParamsList = [];

  FlowRouter.route(pathDef, {
    action: function(params, queryParams) {
      paramsList.push(params);
      queryParamsList.push(queryParams);
    }
  });

  FlowRouter.go(pathDef, {cat: "meteor", id: "200 +% / ad"}, {aa: "20 +%"});
  setTimeout(function() {
    // return done();
    var success = FlowRouter.setParams({id: "700 +% / ad"});
    test.isTrue(success);
    setTimeout(validate, 50);
  }, 50);

  function validate() {
    test.equal(paramsList.length, 2);
    test.equal(queryParamsList.length, 2);

    test.equal(_.pick(paramsList[0], "id", "cat"), {cat: "meteor", id: "200 +% / ad"});
    test.equal(_.pick(paramsList[1], "id", "cat"), {cat: "meteor", id: "700 +% / ad"});
    test.equal(queryParamsList, [{aa: "20 +%"}, {aa: "20 +%"}]);
    done();
  }
});

Tinytest.add('Client - Router - setParams - no route selected', function (test) {
  var originalRoute = FlowRouter._current.route;
  FlowRouter._current.route = undefined;
  var success = FlowRouter.setParams({id: "800"});
  test.isFalse(success);
  FlowRouter._current.route = originalRoute;
});

Tinytest.addAsync('Client - Router - setQueryParams - using check', function (test, done) {
  var randomKey = Random.id();
  var pathDef = "/" + randomKey + "";
  var queryParamsList = [];
  FlowRouter.route(pathDef, {
    action: function(params, queryParams) {
      queryParamsList.push(queryParams);
    }
  });

  FlowRouter.go(pathDef, {}, {cat: "meteor", id: "200"});
  setTimeout(function() {
    check(FlowRouter.current().queryParams, {cat: String, id: String});
    done();
  }, 50);
});

Tinytest.addAsync('Client - Router - setQueryParams - generic', function (test, done) {
  var randomKey = Random.id();
  var pathDef = "/" + randomKey + "";
  var queryParamsList = [];
  FlowRouter.route(pathDef, {
    action: function(params, queryParams) {
      queryParamsList.push(queryParams);
    }
  });

  FlowRouter.go(pathDef, {}, {cat: "meteor", id: "200"});
  setTimeout(function() {
    // return done();
    var success = FlowRouter.setQueryParams({id: "700"});
    test.isTrue(success);
    setTimeout(validate, 50);
  }, 50);

  function validate() {
    test.equal(queryParamsList.length, 2);
    test.equal(_.pick(queryParamsList[0], "id", "cat"), {cat: "meteor", id: "200"});
    test.equal(_.pick(queryParamsList[1], "id", "cat"), {cat: "meteor", id: "700"});
    done();
  }
});

Tinytest.addAsync('Client - Router - setQueryParams - remove query param null', function (test, done) {
  var randomKey = Random.id();
  var pathDef = "/" + randomKey + "";
  var queryParamsList = [];
  FlowRouter.route(pathDef, {
    action: function(params, queryParams) {
      queryParamsList.push(queryParams);
    }
  });

  FlowRouter.go(pathDef, {}, {cat: "meteor", id: "200"});
  setTimeout(function() {
    var success = FlowRouter.setQueryParams({id: "700", cat: null});
    test.isTrue(success);
    setTimeout(validate, 50);
  }, 50);

  function validate() {
    test.equal(queryParamsList.length, 2);
    test.equal(_.pick(queryParamsList[0], "id", "cat"), {cat: "meteor", id: "200"});
    test.equal(queryParamsList[1], {id: "700"});
    done();
  }
});

Tinytest.addAsync('Client - Router - setQueryParams - remove query param undefined', function (test, done) {
  var randomKey = Random.id();
  var pathDef = "/" + randomKey + "";
  var queryParamsList = [];
  FlowRouter.route(pathDef, {
    action: function(params, queryParams) {
      queryParamsList.push(queryParams);
    }
  });

  FlowRouter.go(pathDef, {}, {cat: "meteor", id: "200"});
  setTimeout(function() {
    var success = FlowRouter.setQueryParams({id: "700", cat: undefined});
    test.isTrue(success);
    setTimeout(validate, 50);
  }, 50);

  function validate() {
    test.equal(queryParamsList.length, 2);
    test.equal(_.pick(queryParamsList[0], "id", "cat"), {cat: "meteor", id: "200"});
    test.equal(queryParamsList[1], {id: "700"});
    done();
  }
});

Tinytest.addAsync('Client - Router - setQueryParams - preserve params', function (test, done) {
  var randomKey = Random.id();
  var pathDef = "/" + randomKey + "/:abc";
  var queryParamsList = [];
  var paramsList = [];
  FlowRouter.route(pathDef, {
    action: function(params, queryParams) {
      paramsList.push(params);
      queryParamsList.push(queryParams);
    }
  });

  FlowRouter.go(pathDef, {abc: "20"}, {cat: "meteor", id: "200"});
  setTimeout(function() {
    // return done();
    var success = FlowRouter.setQueryParams({id: "700"});
    test.isTrue(success);
    setTimeout(validate, 50);
  }, 50);

  function validate() {
    test.equal(queryParamsList.length, 2);
    test.equal(queryParamsList, [
      {cat: "meteor", id: "200"}, {cat: "meteor", id: "700"}
    ]);

    test.equal(paramsList.length, 2);
    test.equal(_.pick(paramsList[0], "abc"), {abc: "20"});
    test.equal(_.pick(paramsList[1], "abc"), {abc: "20"});
    done();
  }
});

Tinytest.add('Client - Router - setQueryParams - no route selected', function (test) {
  var originalRoute = FlowRouter._current.route;
  FlowRouter._current.route = undefined;
  var success = FlowRouter.setQueryParams({id: "800"});
  test.isFalse(success);
  FlowRouter._current.route = originalRoute;
});

Tinytest.addAsync('Client - Router - notFound', function (test, done) {
  var data = [];
  FlowRouter.notFound = {
    subscriptions: function() {
      data.push("subscriptions");
    },
    action: function() {
      data.push("action");
    }
  };

  FlowRouter.go("/" + Random.id());
  setTimeout(function() {
    test.equal(data, ["subscriptions", "action"]);
    done();
  }, 50);
});

Tinytest.addAsync('Client - Router - withReplaceState - enabled',
function (test, done) {
  var pathDef = "/" + Random.id() + "/:id";
  var originalRedirect = FlowRouter._page.replace;
  var callCount = 0;
  FlowRouter._page.replace = function(path) {
    callCount++;
    originalRedirect.call(FlowRouter._page, path);
  };

  FlowRouter.route(pathDef, {
    name: name,
    action: function(params) {
      test.equal(params.id, "awesome");
      test.equal(callCount, 1);
      FlowRouter._page.replace = originalRedirect;
      // We don't use Meteor.defer here since it carries
      // Meteor.Environment vars too
      // Which breaks our test below
      setTimeout(done, 0);
    }
  });

  FlowRouter.withReplaceState(function() {
    FlowRouter.go(pathDef, {id: "awesome"});
  });
});

Tinytest.addAsync('Client - Router - withReplaceState - disabled',
function (test, done) {
  var pathDef = "/" + Random.id() + "/:id";
  var originalRedirect = FlowRouter._page.replace;
  var callCount = 0;
  FlowRouter._page.replace = function(path) {
    callCount++;
    originalRedirect.call(FlowRouter._page, path);
  };

  FlowRouter.route(pathDef, {
    name: name,
    action: function(params) {
      test.equal(params.id, "awesome");
      test.equal(callCount, 0);
      FlowRouter._page.replace = originalRedirect;
      Meteor.defer(done);
    }
  });

  FlowRouter.go(pathDef, {id: "awesome"});
});

Tinytest.addAsync('Client - Router - withTrailingSlash - enabled', function (test, next) {
  var rand = Random.id();
  var rendered = 0;

  FlowRouter.route('/' + rand, {
    action: function(_params) {
      rendered++;
    }
  });

  FlowRouter.withTrailingSlash(function() {
    FlowRouter.go('/' + rand);
  });

  setTimeout(function() {
    test.equal(rendered, 1);
    test.equal(_.last(location.href), '/');
    setTimeout(next, 100);
  }, 100);
});

Tinytest.addAsync('Client - Router - idempotent routing - action',
function (test, done) {
  var rand = Random.id();
  var pathDef = "/" + rand;
  var rendered = 0;

  FlowRouter.route(pathDef, {
    action: function(params) {
      rendered++;
    }
  });

  FlowRouter.go(pathDef);

  Meteor.defer(function() {
    FlowRouter.go(pathDef);

    Meteor.defer(function() {
      test.equal(rendered, 1);
      done();
    });
  });
});

Tinytest.addAsync('Client - Router - idempotent routing - triggers',
function (test, next) {
  var rand = Random.id();
  var pathDef = "/" + rand;
  var runnedTriggers = 0;
  var done = false;

  var triggerFns = [function(params) {
    if (done) return;

    runnedTriggers++;
  }];

  FlowRouter.triggers.enter(triggerFns);

  FlowRouter.route(pathDef, {
    triggersEnter: triggerFns,
    triggersExit: triggerFns
  });

  FlowRouter.go(pathDef);

  FlowRouter.triggers.exit(triggerFns);

  Meteor.defer(function() {
    FlowRouter.go(pathDef);

    Meteor.defer(function() {
      test.equal(runnedTriggers, 2);
      done = true;
      next();
    });
  });
});

Tinytest.addAsync('Client - Router - reload - action',
function (test, done) {
  var rand = Random.id();
  var pathDef = "/" + rand;
  var rendered = 0;

  FlowRouter.route(pathDef, {
    action: function(params) {
      rendered++;
    }
  });

  FlowRouter.go(pathDef);

  Meteor.defer(function() {
    FlowRouter.reload();

    Meteor.defer(function() {
      test.equal(rendered, 2);
      done();
    });
  });
});

Tinytest.addAsync('Client - Router - reload - triggers',
function (test, next) {
  var rand = Random.id();
  var pathDef = "/" + rand;
  var runnedTriggers = 0;
  var done = false;

  var triggerFns = [function(params) {
    if (done) return;

    runnedTriggers++;
  }];

  FlowRouter.triggers.enter(triggerFns);

  FlowRouter.route(pathDef, {
    triggersEnter: triggerFns,
    triggersExit: triggerFns
  });

  FlowRouter.go(pathDef);

  FlowRouter.triggers.exit(triggerFns);

  Meteor.defer(function() {
    FlowRouter.reload();

    Meteor.defer(function() {
      test.equal(runnedTriggers, 6);
      done = true;
      next();
    });
  });
});

Tinytest.addAsync(
'Client - Router - wait - before initialize',
function(test, done) {
  FlowRouter._initialized = false;
  FlowRouter.wait();
  test.equal(FlowRouter._askedToWait, true);

  FlowRouter._initialized = true;
  FlowRouter._askedToWait = false;
  done();
});

Tinytest.addAsync(
'Client - Router - wait - after initialized',
function(test, done) {
  try {
    FlowRouter.wait();
  } catch(ex) {
    test.isTrue(/can't wait/.test(ex.message));
    done();
  }
});

Tinytest.addAsync(
'Client - Router - initialize - after initialized',
function(test, done) {
  try {
    FlowRouter.initialize();
  } catch(ex) {
    test.isTrue(/already initialized/.test(ex.message));
    done();
  }
});

Tinytest.addAsync(
'Client - Router - base path - url updated',
function(test, done) {
  var simulatedBasePath = '/flow';
  var rand = Random.id();
  FlowRouter.route('/' + rand, { action: function() {} });

  setBasePath(simulatedBasePath);
  FlowRouter.go('/' + rand);
  setTimeout(function() {
    test.equal(location.pathname, simulatedBasePath + '/' + rand);
    resetBasePath();
    done();
  }, 100);
});

Tinytest.addAsync(
'Client - Router - base path - route action called',
function(test, done) {
  var simulatedBasePath = '/flow';
  var rand = Random.id();
  FlowRouter.route('/' + rand, {
    action: function() {
      resetBasePath();
      done();
    }
  });

  setBasePath(simulatedBasePath);
  FlowRouter.go('/' + rand);
});

Tinytest.add(
'Client - Router - base path - path generation',
function(test, done) {
  _.each(['/flow', '/flow/', 'flow/', 'flow'], function(simulatedBasePath) {
    var rand = Random.id();
    setBasePath(simulatedBasePath);
    test.equal(FlowRouter.path('/' + rand), '/flow/' + rand);
  });
  resetBasePath();
});


function setBasePath(path) {
  FlowRouter._initialized = false;
  FlowRouter._basePath = path;
  FlowRouter.initialize();
}

var defaultBasePath = FlowRouter._basePath;
function resetBasePath() {
  setBasePath(defaultBasePath);
}

function bind(obj, method) {
  return function() {
    obj[method].apply(obj, arguments);
  };
}
