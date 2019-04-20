Tinytest.addAsync('Client - Router - subsReady - with no args - all subscriptions ready', function (test, next) {
  var rand = Random.id();
  FlowRouter.route('/' + rand, {
    subscriptions: function(params) {
      this.register('bar', Meteor.subscribe('bar'));
      this.register('foo', Meteor.subscribe('foo'));
    }
  });

  FlowRouter.subscriptions = function () {
    this.register('baz', Meteor.subscribe('baz'));
  };

  FlowRouter.go('/' + rand);

  Tracker.autorun(function(c) {
    if(FlowRouter.subsReady()) {
      FlowRouter.subscriptions = Function.prototype;
      next();
      c.stop();
    }
  });
});

Tinytest.addAsync('Client - Router - subsReady - with no args - all subscriptions does not ready', function (test, next) {
  var rand = Random.id();
  FlowRouter.route('/' + rand, {
    subscriptions: function(params) {
      this.register('fooNotReady', Meteor.subscribe('fooNotReady'));
    }
  });

  FlowRouter.subscriptions = function () {
    this.register('bazNotReady', Meteor.subscribe('bazNotReady'));
  };

  FlowRouter.go('/' + rand);
  setTimeout(function() {
    test.isTrue(!FlowRouter.subsReady());
    FlowRouter.subscriptions = Function.prototype;
    next();
  }, 100);
});

Tinytest.addAsync('Client - Router - subsReady - with no args - global subscriptions does not ready', function (test, next) {
  var rand = Random.id();
  FlowRouter.route('/' + rand, {
    subscriptions: function(params) {
      this.register('bar', Meteor.subscribe('bar'));
      this.register('foo', Meteor.subscribe('foo'));
    }
  });

  FlowRouter.subscriptions = function () {
    this.register('bazNotReady', Meteor.subscribe('bazNotReady'));
  };

  FlowRouter.go('/' + rand);
  setTimeout(function() {
    test.isTrue(!FlowRouter.subsReady());
    FlowRouter.subscriptions = Function.prototype;
    next();
  }, 100);
});

Tinytest.addAsync('Client - Router - subsReady - with no args - current subscriptions does not ready', function (test, next) {
  var rand = Random.id();
  FlowRouter.route('/' + rand, {
    subscriptions: function(params) {
      this.register('bar', Meteor.subscribe('bar'));
      this.register('fooNotReady', Meteor.subscribe('fooNotReady'));
    }
  });

  FlowRouter.subscriptions = function () {
    this.register('baz', Meteor.subscribe('baz'));
  };

  FlowRouter.go('/' + rand);
  setTimeout(function() {
    test.isTrue(!FlowRouter.subsReady());
    FlowRouter.subscriptions = Function.prototype;
    next();
  }, 100);
});

Tinytest.addAsync('Client - Router - subsReady - with args - all subscriptions ready', function (test, next) {
  var rand = Random.id();
  FlowRouter.route('/' + rand, {
    subscriptions: function(params) {
      this.register('bar', Meteor.subscribe('bar'));
      this.register('foo', Meteor.subscribe('foo'));
    }
  });

  FlowRouter.subscriptions = function () {
    this.register('baz', Meteor.subscribe('baz'));
  };

  FlowRouter.go('/' + rand);
  Tracker.autorun(function(c) {
    if(FlowRouter.subsReady('foo', 'baz')) {
      FlowRouter.subscriptions = Function.prototype;
      next();
      c.stop();
    }
  });
});

Tinytest.addAsync('Client - Router - subsReady - with args - all subscriptions does not ready', function (test, next) {
  var rand = Random.id();
  FlowRouter.route('/' + rand, {
    subscriptions: function(params) {
      this.register('fooNotReady', Meteor.subscribe('fooNotReady'));
    }
  });

  FlowRouter.subscriptions = function () {
    this.register('bazNotReady', Meteor.subscribe('bazNotReady'));
  };

  FlowRouter.go('/' + rand);
  setTimeout(function() {
    test.isTrue(!FlowRouter.subsReady('fooNotReady', 'bazNotReady'));
    FlowRouter.subscriptions = Function.prototype;
    next();
  }, 100);
});

Tinytest.addAsync('Client - Router - subsReady - with args - global subscriptions does not ready', function (test, next) {
  var rand = Random.id();
  FlowRouter.route('/' + rand, {
    subscriptions: function(params) {
      this.register('bar', Meteor.subscribe('bar'));
      this.register('foo', Meteor.subscribe('foo'));
    }
  });

  FlowRouter.subscriptions = function () {
    this.register('bazNotReady', Meteor.subscribe('bazNotReady'));
  };

  FlowRouter.go('/' + rand);
  setTimeout(function() {
    test.isTrue(!FlowRouter.subsReady('foo', 'bazNotReady'));
    FlowRouter.subscriptions = Function.prototype;
    next();
  }, 100);
});

Tinytest.addAsync('Client - Router - subsReady - with args - current subscriptions does not ready', function (test, next) {
  var rand = Random.id();
  FlowRouter.route('/' + rand, {
    subscriptions: function(params) {
      this.register('bar', Meteor.subscribe('bar'));
      this.register('fooNotReady', Meteor.subscribe('fooNotReady'));
    }
  });

  FlowRouter.subscriptions = function () {
    this.register('baz', Meteor.subscribe('baz'));
  };

  FlowRouter.go('/' + rand);
  setTimeout(function() {
    test.isTrue(!FlowRouter.subsReady('fooNotReady', 'baz'));
    FlowRouter.subscriptions = Function.prototype;
    next();
  }, 100);
});

Tinytest.addAsync('Client - Router - subsReady - with args - subscribe with wrong name', function (test, next) {
  var rand = Random.id();
  FlowRouter.route('/' + rand, {
    subscriptions: function(params) {
      this.register('bar', Meteor.subscribe('bar'));
    }
  });

  FlowRouter.subscriptions = function () {
    this.register('baz', Meteor.subscribe('baz'));
  };

  FlowRouter.go('/' + rand);
  setTimeout(function() {
    test.isTrue(!FlowRouter.subsReady('baz', 'xxx', 'baz'));
    FlowRouter.subscriptions = Function.prototype;
    next();
  }, 100);
});

Tinytest.addAsync('Client - Router - subsReady - with args - same route two different subs', function (test, next) {
  var rand = Random.id();
  var count = 0;
  FlowRouter.route('/' + rand, {
    subscriptions: function(params) {
      if(++count == 1) {
        this.register('not-exisitng', Meteor.subscribe('not-exisitng'));
      }
    }
  });

  FlowRouter.subscriptions = Function.prototype;
  FlowRouter.go('/' + rand);
  setTimeout(function() {
    test.isFalse(FlowRouter.subsReady());
    FlowRouter.go('/' + rand, {}, {param: "111"});
    setTimeout(function() {
      test.isTrue(FlowRouter.subsReady());
      next();
    }, 100)
  }, 100);
});

Tinytest.addAsync('Client - Router - subsReady - no subscriptions - simple', function (test, next) {
  var rand = Random.id();
  FlowRouter.route('/' + rand, {});
  FlowRouter.subscriptions = Function.prototype;

  FlowRouter.go('/' + rand);
  setTimeout(function() {
    test.isTrue(FlowRouter.subsReady());
    next();
  }, 100);
});