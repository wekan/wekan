Tinytest.addAsync('Client - Triggers - global enter triggers', function(test, next) {
  var rand = Random.id(), rand2 = Random.id();
  var log = [];
  var paths = ['/' + rand2, '/' + rand];
  var done = false;

  FlowRouter.route('/' + rand, {
    action: function(_params) {
      log.push(1);
    }
  });

  FlowRouter.route('/' + rand2, {
    action: function(_params) {
      log.push(2);
    }
  });

  FlowRouter.triggers.enter([function(context) {
    if(done) return;
    test.equal(context.path, paths.pop());
    log.push(0);
  }]);

  FlowRouter.go('/' + rand);

  setTimeout(function() {
    FlowRouter.go('/' + rand2);

    setTimeout(function() {
      test.equal(log, [0, 1, 0, 2]);
      done = true;
      setTimeout(next, 100);
    }, 100);
  }, 100);
});

Tinytest.addAsync('Client - Triggers - global enter triggers with "only"', function (test, next) {
  var rand = Random.id(), rand2 = Random.id();
  var log = [];
  var done = false;

  FlowRouter.route('/' + rand, {
    action: function(_params) {
      log.push(1);
    }
  });

  FlowRouter.route('/' + rand2, {
    name: 'foo',
    action: function(_params) {
      log.push(2);
    }
  });

  FlowRouter.triggers.enter([function(context) {
    if(done) return;
    test.equal(context.path, '/' + rand2);
    log.push(8);
  }], {only: ['foo']});

  FlowRouter.go('/' + rand);

  setTimeout(function() {
    FlowRouter.go('/' + rand2);

    setTimeout(function() {
      test.equal(log, [1, 8, 2]);
      done = true;
      setTimeout(next, 100);
    }, 100);
  }, 100);
});

Tinytest.addAsync('Client - Triggers - global enter triggers with "except"', function (test, next) {
  var rand = Random.id(), rand2 = Random.id();
  var log = [];
  var done = false;

  FlowRouter.route('/' + rand, {
    action: function(_params) {
      log.push(1);
    }
  });

  FlowRouter.route('/' + rand2, {
    name: 'foo',
    action: function(_params) {
      log.push(2);
    }
  });

  FlowRouter.triggers.enter([function(context) {
    if(done) return;
    test.equal(context.path, '/' + rand);
    log.push(8);
  }], {except: ['foo']});

  FlowRouter.go('/' + rand);

  setTimeout(function() {
    FlowRouter.go('/' + rand2);

    setTimeout(function() {
      test.equal(log, [8, 1, 2]);
      done = true;
      setTimeout(next, 100);
    }, 100);
  }, 100);
});

Tinytest.addAsync('Client - Triggers - global exit triggers', function (test, next) {
  var rand = Random.id(), rand2 = Random.id();
  var log = [];
  var done =false;

  FlowRouter.route('/' + rand, {
    action: function(_params) {
      log.push(1);
    }
  });

  FlowRouter.route('/' + rand2, {
    action: function(_params) {
      log.push(2);
    }
  });

  FlowRouter.go('/' + rand);

  FlowRouter.triggers.exit([function(context) {
    if(done) return;
    test.equal(context.path, '/' + rand);
    log.push(0);
  }]);

  setTimeout(function() {
    FlowRouter.go('/' + rand2);

    setTimeout(function() {
      test.equal(log, [1, 0, 2]);
      done = true;
      setTimeout(next, 100);
    }, 100);
  }, 100);
});

Tinytest.addAsync('Client - Triggers - global exit triggers with "only"', function (test, next) {
  var rand = Random.id(), rand2 = Random.id();
  var log = [];
  var done = false;

  FlowRouter.route('/' + rand, {
    action: function(_params) {
      log.push(1);
    }
  });

  FlowRouter.route('/' + rand2, {
    name: 'foo',
    action: function(_params) {
      log.push(2);
    }
  });

  FlowRouter.triggers.exit([function(context) {
    if(done) return;
    test.equal(context.path, '/' + rand2);
    log.push(8);
  }], {only: ['foo']});

  FlowRouter.go('/' + rand);

  setTimeout(function() {
    FlowRouter.go('/' + rand2);

    setTimeout(function() {
      FlowRouter.go('/' + rand);

      setTimeout(function() {
        test.equal(log, [1, 2, 8, 1]);
        done = true;
        setTimeout(next, 100);
      }, 100);
    }, 100);
  }, 100);
});

Tinytest.addAsync('Client - Triggers - global exit triggers with "except"', function (test, next) {
  var rand = Random.id(), rand2 = Random.id();
  var log = [];
  var done = false;

  FlowRouter.route('/' + rand, {
    action: function(_params) {
      log.push(1);
    }
  });

  FlowRouter.route('/' + rand2, {
    name: 'foo',
    action: function(_params) {
      log.push(2);
    }
  });

  FlowRouter.go('/' + rand);

  FlowRouter.triggers.exit([function(context) {
    if(done) return;
    test.equal(context.path, '/' + rand);
    log.push(9);
  }], {except: ['foo']});


  setTimeout(function() {
    FlowRouter.go('/' + rand2);

    setTimeout(function() {
      FlowRouter.go('/' + rand);

      setTimeout(function() {
        test.equal(log, [1, 9, 2, 1]);
        done = true;
        setTimeout(next, 100);
      }, 100);
    }, 100);
  }, 100);
});

Tinytest.addAsync('Client - Triggers - route enter triggers', function (test, next) {
  var rand = Random.id();
  var log = [];

  var triggerFn = function (context) {
    test.equal(context.path, '/' + rand);
    log.push(5);
  };

  FlowRouter.route('/' + rand, {
    triggersEnter: [triggerFn],
    action: function(_params) {
      log.push(1);
    }
  });

  FlowRouter.go('/' + rand);

  setTimeout(function() {
    test.equal(log, [5, 1]);
    setTimeout(next, 100);
  }, 100);
});

Tinytest.addAsync('Client - Triggers - router exit triggers', function (test, next) {
  var rand = Random.id();
  var log = [];

  var triggerFn = function (context) {
    test.equal(context.path, '/' + rand);
    log.push(6);
  };

  FlowRouter.route('/' + rand, {
    triggersExit: [triggerFn],
    action: function(_params) {
      log.push(1);
    }
  });

  FlowRouter.go('/' + rand);

  setTimeout(function() {
    FlowRouter.go('/' + Random.id());

    setTimeout(function() {
      test.equal(log, [1, 6]);
      setTimeout(next, 100);
    }, 100);
  }, 100);
});

Tinytest.addAsync('Client - Triggers - group enter triggers', function (test, next) {
  var rand = Random.id(), rand2 = Random.id();
  var log = [];
  var paths = ['/' + rand2, '/' + rand];

  var triggerFn = function (context) {
    test.equal(context.path, paths.pop());
    log.push(3);
  };

  var group = FlowRouter.group({
    triggersEnter: [triggerFn]
  });

  group.route('/' + rand, {
    action: function(_params) {
      log.push(1);
    }
  });

  group.route('/' + rand2, {
    action: function(_params) {
      log.push(2);
    }
  });

  FlowRouter.go('/' + rand);

  setTimeout(function() {
    FlowRouter.go('/' + rand2);

    setTimeout(function() {
      test.equal(log, [3, 1, 3, 2]);
      setTimeout(next, 100);
    }, 100);
  }, 100);
});

Tinytest.addAsync('Client - Triggers - group exit triggers', function (test, next) {
  var rand = Random.id(), rand2 = Random.id();
  var log = [];

  var triggerFn = function (context) {
    log.push(4);
  };

  var group = FlowRouter.group({
    triggersExit: [triggerFn]
  });

  group.route('/' + rand, {
    action: function(_params) {
      log.push(1);
    }
  });

  group.route('/' + rand2, {
    action: function(_params) {
      log.push(2);
    }
  });

  FlowRouter.go('/' + rand);

  setTimeout(function() {
    FlowRouter.go('/' + rand2);

    setTimeout(function() {
      test.equal(log, [1, 4, 2]);
      setTimeout(next, 100);
    }, 100);
  }, 100);
});

Tinytest.addAsync('Client - Triggers - redirect from enter', function(test, next) {
  var rand = Random.id(), rand2 = Random.id();
  var log = [];

  FlowRouter.route('/' + rand, {
    triggersEnter: [function(context, redirect) {
      redirect("/" + rand2);
    }, function() {
      throw new Error("should not execute this trigger");
    }],
    action: function(_params) {
      log.push(1);
    },
    name: rand
  });

  FlowRouter.route('/' + rand2, {
    action: function(_params) {
      log.push(2);
    },
    name: rand2
  });

  FlowRouter.go('/');
  FlowRouter.go('/' + rand);

  setTimeout(function() {
    test.equal(log, [2]);
    next();
  }, 300);
});

Tinytest.addAsync('Client - Triggers - redirect by routeName', function(test, next) {
  var rand = Random.id(), rand2 = Random.id();
  var log = [];

  FlowRouter.route('/' + rand, {
    name: rand,
    triggersEnter: [function(context, redirect) {
      redirect(rand2, null, {aa: "bb"});
    }, function() {
      throw new Error("should not execute this trigger");
    }],
    action: function(_params) {
      log.push(1);
    },
    name: rand
  });

  FlowRouter.route('/' + rand2, {
    name: rand2,
    action: function(_params, queryParams) {
      log.push(2);
      test.equal(queryParams, {aa: "bb"});
    },
    name: rand2
  });

  FlowRouter.go('/');
  FlowRouter.go('/' + rand);

  setTimeout(function() {
    test.equal(log, [2]);
    next();
  }, 300);
});

Tinytest.addAsync('Client - Triggers - redirect from exit', function(test, next) {
  var rand = Random.id(), rand2 = Random.id(), rand3 = Random.id();
  var log = [];

  FlowRouter.route('/' + rand, {
    action: function() {
      log.push(1);
    },
    triggersExit: [
      function(context, redirect) {
        redirect('/' + rand3);
      },
      function() {
        throw new Error("should not call this trigger");
      }
    ]
  });

  FlowRouter.route('/' + rand2, {
    action: function() {
      log.push(2);
    }
  });

  FlowRouter.route('/' + rand3, {
    action: function() {
      log.push(3);
    }
  });

  FlowRouter.go('/' + rand);

  setTimeout(function() {
    FlowRouter.go('/' + rand2);
    
    setTimeout(function() {
      test.equal(log, [1, 3]);
      next();
    }, 100);
  }, 100);
});

Tinytest.addAsync('Client - Triggers - redirect to external URL fails', function(test, next) {
  var rand = Random.id(), rand2 = Random.id();
  var log = [];

  // testing "http://" URLs
  FlowRouter.route('/' + rand, {
    triggersEnter: [function(context, redirect) {
      test.throws(function() {
          redirect("http://example.com/")
      }, "Redirects to URLs outside of the app are not supported")
    }],
    action: function(_params) {
      log.push(1);
    },
    name: rand
  });

  // testing "https://" URLs
  FlowRouter.route('/' + rand2, {
    triggersEnter: [function(context, redirect) {
      test.throws(function() {
          redirect("https://example.com/")
      })
    }],
    action: function(_params) {
      log.push(2);
    },
    name: rand2
  });

  FlowRouter.go('/');
  FlowRouter.go('/' + rand);
  FlowRouter.go('/' + rand2);

  setTimeout(function() {
    test.equal(log, []);
    next();
  }, 300);
});

Tinytest.addAsync('Client - Triggers - stop callback from enter', function(test, next) {
  var rand = Random.id();
  var log = [];

  FlowRouter.route('/' + rand, {
    triggersEnter: [function(context, redirect, stop) {
      log.push(10);
      stop();
    }, function() {
      throw new Error("should not execute this trigger");
    }],
    action: function(_params) {
      throw new Error("should not execute the action");
    }
  });

  FlowRouter.go('/');
  FlowRouter.go('/' + rand);

  setTimeout(function() {
    test.equal(log, [10]);
    next();
  }, 100);
});

Tinytest.addAsync(
'Client - Triggers - invalidate inside an autorun', 
function(test, next) {
  var rand = Random.id(), rand2 = Random.id();
  var log = [];
  var paths = ['/' + rand2, '/' + rand];
  var done = false;

  FlowRouter.route('/' + rand, {
    action: function(_params) {
      log.push(1);
    }
  });

  FlowRouter.route('/' + rand2, {
    action: function(_params) {
      log.push(2);
    }
  });

  FlowRouter.triggers.enter([function(context) {
    if(done) return;
    test.equal(context.path, paths.pop());
    log.push(0);
  }]);

  Tracker.autorun(function(c) {
    FlowRouter.go('/' + rand);
  });

  setTimeout(function() {
    FlowRouter.go('/' + rand2);

    setTimeout(function() {
      test.equal(log, [0, 1, 0, 2]);
      done = true;
      setTimeout(next, 100);
    }, 100);
  }, 100);
});
