wekan-cfs-power-queue [![Build Status](https://travis-ci.org/CollectionFS/Meteor-powerqueue.png?branch=master)](https://travis-ci.org/CollectionFS/Meteor-powerqueue)
=========

~~Looking for maintainers - please reach out!~~
This package is to be archived due to inability to find contributors, thanks to everyone who helped make it possible.

**If you're looking for an alternative, we highly recommend [Meteor-Files](https://github.com/VeliovGroup/Meteor-Files) by [VeliovGroup](https://github.com/VeliovGroup)**

---

PowerQueue is a native Meteor package for memory-backed job queue processing. Features include:
* async tasks
* throttling resource usage
* retrying failed tasks
* managing sub-queues
* powered by Meteor's reactive sugar
* etc.
 
PowerQueue can use one of two [spinal-queue](https://github.com/zcfs/Meteor-power-queue/blob/master/spinal-queue.spec.md) packages, [ReactiveList](https://github.com/zcfs/Meteor-reactive-list) or [MicroQueue](https://github.com/zcfs/Meteor-micro-queue).

## Demos

**Check out the cool [live queue demo](http://power-queue-test.meteor.com) and [live sub queue example](http://power-queue-sub-test.meteor.com).**

Source code for both can be found in the two branches of the [power-queue-example repo](https://github.com/zcfs/power-queue-example).


Kind regards,  
Eric(@aldeed) and Morten(@raix)

Happy coding!

# API
All getters and setters are reactive.

[API Documentation](api.md)

## Helpers / Getters / Setters:
* PowerQueue.length - Number of tasks in queue
* PowerQueue.progress - Current progress in percent
* PowerQueue.usage - Current load in percent
* PowerQueue.total - Sum of tasks to run in current queue
* PowerQueue.isPaused - True if queue is paused
* PowerQueue.isHalted - True if queue is paused or stopped
* PowerQueue.processing - Number of tasks being processed
* PowerQueue.errors - Failures where task is passed to the errorHandler
* PowerQueue.failures - Number of failures in current queue
* PowerQueue.isRunning - True if queue is active
* PowerQueue.maxProcessing - Getter + Setter for max tasks to run in parallel
* PowerQueue.autostart - Getter + Setter for autostart flag - Allow add task to start the queue
* PowerQueue.maxFailures - Max allowed retries for failing tasks before marked as an error
* options.queue - Use custom micro-queue compatible queue
* options.onEnded - Called when queue has ended
* options.onRelease(remainingTasks) - Called when queue has ended or paused
* options.onAutostart - Called when queue was autostarted

## Methods
* PowerQueue.add(data) - Add a task to queue
* PowerQueue.run() - Start the queue
* PowerQueue.pause() - Pause the queue
* PowerQueue.resume() - Resume the queue if paused
* PowerQueue.reset() - Reset the queue
* PowerQueue.taskHandler(data, next, failures) - Default task handler, where data is a `function(done)`, can be overwritten
* PowerQueue.errorHandler(data, addTask, failures) - Default error handler, can be overwritten

# Example 1
```js
    var queue = new PowerQueue({
      isPaused: true
    });

    queue.add(function(done) {
      console.log('task 1');
      done();
    });
    queue.add(function(done) {
      console.log('task 2');
      done();
    });
    queue.add(function(done) {
      console.log('task 3');
      done();
    });

    console.log('Ready to run queue');
    queue.run();
```

# Example 2

This is a very rough example of how to make custom task handling.

```js

  queue.errorHandler = function(data, addTask) {
    // This error handler lets the task drop, but we could use addTask to
    // Put the task into the queue again
    tasks.update({ _id: data.id }, { $set: { status: 'error'} });
  };

  queue.taskHandler = function(data, next) {

    // The task is now processed...
    tasks.update({ _id: data.id }, { $set: { status: 'processing'} });

    Meteor.setTimeout(function() {
      if (Math.random() > 0.5) {
        // We random fail the task
        tasks.update({ _id: data.id }, { $set: { status: 'failed'} });
        // Returning error to next
        next('Error: Fail task');
      } else {
        // We are done!
        tasks.update({ _id: data.id }, { $set: { status: 'done'} });
        // Trigger next task
        next();
      }
      // This async task duration is between 500 - 1000ms
    }, Math.round(500 + 500 * Math.random()));
  };

  // Add the task:
  var taskId = 0;
  queue.add({ id: tasks.insert({ status: 'added', index: ++taskId }) });
```

# Contribute

Here's the [complete API documentation](internal.api.md), including private methods.

To update the docs, run `npm install docmeteor` then `docmeteor`.


## TODO / Wishlist

* scheduling jobs to run in the future, like [meteor-queue](https://github.com/artwells/meteor-queue#features) - see [issue #15](https://github.com/zcfs/Meteor-power-queue/issues/15)
