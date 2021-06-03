"use strict";

function equals(a, b) {
  return !!(JSON.stringify(a) === JSON.stringify(b));
}

Tinytest.add('PowerQueue - scope', function(test) {

  test.isTrue(typeof PowerQueue !== 'undefined', 'The PowerQueue scope is missing, please add the power-queue package');


});


// We run 5 tasks in serial mode
Tinytest.addAsync('PowerQueue - test serial run', function (test, onComplete) {
  var queue = new PowerQueue({
    name: 'test queue 1',
    autostart: false,
    maxProcessing: 1,
    debug: true,
    // When this task is released we do our tests
    onEnded: function() {
      console.log('It ended');
      // Check that we ran the expected number of tasks
      test.equal(counter, 5, 'counter did not match number of tasks');
      // Check that the result was correct
      test.equal(result, expectedResult, 'result was unexpected');
      // We are done testing
      onComplete();
    }
  });

  var result = '';
  var expectedResult = '12345';
  var counter = 0;

  var checkCounter = function(id, next) {
    console.log('test queue 1 - Run task: ' + id);
    // Keep a counter
    counter++;
    // push id to result
    result += id;
    // call next task
    next();
  };


  // Add the tasks to the queue
  queue.add(function(next) { checkCounter('1', next); });
  queue.add(function(next) { checkCounter('2', next); });
  queue.add(function(next) { checkCounter('3', next); });
  queue.add(function(next) { checkCounter('4', next); });
  queue.add(function(next) { checkCounter('5', next); });

  // Run the queue
  queue.run();
});

// We run 5 tasks in serial mode but pause the queue on 3
Tinytest.addAsync('PowerQueue - test serial pause', function (test, onComplete) {
  var queue = new PowerQueue({
    name: 'test queue 2',
    autostart: false,
    maxProcessing: 1,
    debug: true,
    // When this task is released we do our tests
    onPaused: function() {
      console.log('Its paused');
      // Check that we ran the expected number of tasks
      test.equal(counter, 3, 'counter did not match number of tasks');
      // Check that the result was correct
      test.equal(result, expectedResult, 'result was unexpected');
      // We are done testing
      onComplete();
    }
  });

  var result = '';
  var expectedResult = '123';
  var counter = 0;

  var checkCounter = function(id, next) {
    console.log('test queue 2 - Run task: ' + id);
    // Keep a counter
    counter++;
    // push id to result
    result += id;
    // call next task
    if (id === '3')
      next('pause')
    else
      next();
  };


  // Add the tasks to the queue
  queue.add(function(next) { checkCounter('1', next); });
  queue.add(function(next) { checkCounter('2', next); });
  queue.add(function(next) { checkCounter('3', next); });
  queue.add(function(next) { checkCounter('4', next); });
  queue.add(function(next) { checkCounter('5', next); });

  // Run the queue
  queue.run();
});

// We run 5 tasks in serial mode but pause the queue on 3
Tinytest.addAsync('PowerQueue - test 2 task in parallel', function (test, onComplete) {
  var queue = new PowerQueue({
    name: 'test queue 3',
    autostart: false,
    maxProcessing: 2,
    debug: true,
    // When this task is released we do our tests
    onEnded: function() {
      console.log('Its paused');
      // Check that we ran the expected number of tasks
      test.equal(counter, 10, 'counter did not match number of tasks');
      // Check that the result was correct
      test.equal(result, expectedResult, 'result was unexpected');
      // We are done testing
      onComplete();
    }
  });

  // start  1-----3-------4-------6------------------------9-----------------------X
  //        2-----------------5---------------7--------8-----------10------X
  // ms     0  5  10  15  20  25  30  35  40  45   50  55  60  65  70  75  80  85  90  95  100
  // result 1 2   3       4   5   6           7        8   9       10
  // result       1       3   2   4           5        7   6       8       10      9

  var wait = {
    '1': 10,
    '2': 25,
    '3': 10,
    '4': 10,
    '5': 20,
    '6': 30,
    '7': 10,
    '8': 15,
    '9': 30,
    '10': 10,
  };

  // 1324

  var result = '';
  var expectedResult = '13245768109';
  var counter = 0;

  var checkCounter = function(id, next) {
    console.log('test queue 3 - Run task: ' + id);
    // Keep a counter
    counter++;
    // push id to result
    Meteor.setTimeout(function() {
      result += id;
      // call next task
      next();
    }, wait[id] * 5); // give it a factor 2 to make sure we get the correct result
  };


  // Add the tasks to the queue
  queue.add(function(next) { checkCounter('1', next); });
  queue.add(function(next) { checkCounter('2', next); });
  queue.add(function(next) { checkCounter('3', next); });
  queue.add(function(next) { checkCounter('4', next); });
  queue.add(function(next) { checkCounter('5', next); });
  queue.add(function(next) { checkCounter('6', next); });
  queue.add(function(next) { checkCounter('7', next); });
  queue.add(function(next) { checkCounter('8', next); });
  queue.add(function(next) { checkCounter('9', next); });
  queue.add(function(next) { checkCounter('10', next); });

  // Run the queue
  queue.run();
});
//Test API:
//test.isFalse(v, msg)
//test.isTrue(v, msg)
//test.equal(actual, expected, message, not)
//test.length(obj, len)
//test.include(s, v)
//test.isNaN(v, msg)
//test.isUndefined(v, msg)
//test.isNotNull
//test.isNull
//test.throws(func)
//test.instanceOf(obj, klass)
//test.notEqual(actual, expected, message)
//test.runId()
//test.exception(exception)
//test.expect_fail()
//test.ok(doc)
//test.fail(doc)
//test.equal(a, b, msg)
