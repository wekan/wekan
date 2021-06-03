"use strict";

function equals(a, b) {
  return !!(JSON.stringify(a) === JSON.stringify(b));
}

Tinytest.add('ReactiveList - definition', function(test) {
  test.isTrue(typeof ReactiveList !== 'undefined', 'ReactiveList is undefined, make sure to add the reactive-list package');
});


// We do a small test of insert and remove
Tinytest.addAsync('ReactiveList - basic insert and remove - test 1', function test1 (test, onComplete) {
  Meteor.setTimeout(function() {
    var list = new ReactiveList({
      reactive: true
    });

    var testLength = 500;

    for (var i = 0; i < testLength; i++)
      list.insert(i, 'value' + i);

    test.equal(list._length, testLength, 'List length is not as expected');

    var order = 0;
    list.forEach(function(value, key) {
      test.equal(key, order, 'order is not as expected');
      test.equal(value, 'value'+order, 'order is not as expected');
      order++;
    });

    test.equal(order, testLength, 'forEach length is not as expected');

    list.forEachReverse(function(value, key) {
      order--;
      test.equal(key, order, 'order is not as expected');
      test.equal(value, 'value'+order, 'order is not as expected');
    });

    test.equal(order, 0, 'forEachReverse length is not as expected');

    // Remove all items
    for (var i = 0; i < testLength; i++)
      list.remove(i);

    test.equal(list._length, 0, 'List length is not as expected');

    test.isUndefined(list.first, 'First should now be undefined');

    test.isUndefined(list.last, 'Last should now be undefined');
    onComplete();
  }, 1000);  
});


// We test insert and remove on larger scale
Tinytest.addAsync('ReactiveList - basic insert and reset - test 2', function test2 (test, onComplete) {
  Meteor.setTimeout(function() {
    var list = new ReactiveList({
      reactive: true
    });


    var testLength = 500;

    for (var i = 0; i < testLength; i++)
      list.insert(i, 'value' + i);

    test.equal(list._length, testLength, 'List length is not as expected');


    // Remove all items
    list.reset();

    test.equal(list._length, 0, 'List length is not as expected');

    test.isUndefined(list.first, 'First should now be undefined');

    test.isUndefined(list.last, 'Last should now be undefined');

    onComplete();
  }, 5000);
});

//Test API:
//test.isFalse(v, msg)
//test.isTrue(v, msg)
//test.equalactual, expected, message, not
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
