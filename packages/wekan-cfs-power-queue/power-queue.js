// Rig weak dependencies
if (typeof MicroQueue === 'undefined' && Package['micro-queue']) {
  MicroQueue = Package['micro-queue'].MicroQueue;
}
if (typeof ReactiveList === 'undefined' && Package['reactive-list']) {
  ReactiveList = Package['reactive-list'].ReactiveList;
}

// Rig weak dependencies in +0.9.1
if (typeof MicroQueue === 'undefined' && Package['wekan-cfs-micro-queue']) {
  MicroQueue = Package['wekan-cfs-micro-queue'].MicroQueue;
}
if (typeof ReactiveList === 'undefined' && Package['wekan-cfs-reactive-list']) {
  ReactiveList = Package['wekan-cfs-reactive-list'].ReactiveList;
}

/**
 * Creates an instance of a power queue // Testing inline comment
 * [Check out demo](http://power-queue-test.meteor.com/)
 *
 * @constructor
 * @self powerqueue
 * @param {object} [options] Settings
 * @param {boolean} [options.filo=false] Make it a first in last out queue
 * @param {boolean} [options.isPaused=false] Set queue paused
 * @param {boolean} [options.autostart=true] May adding a task start the queue
 * @param {string} [options.name="Queue"] Name of the queue
 * @param {number} [options.maxProcessing=1] Limit of simultanous running tasks
 * @param {number} [options.maxFailures = 5] Limit retries of failed tasks, if 0 or below we allow infinite failures
 * @param {number} [options.jumpOnFailure = true] Jump to next task and retry failed task later
 * @param {boolean} [options.debug=false] Log verbose messages to the console
 * @param {boolean} [options.reactive=true] Set whether or not this queue should be reactive
 * @param {boolean} [options.onAutostart] Callback for the queue autostart event
 * @param {boolean} [options.onPaused] Callback for the queue paused event
 * @param {boolean} [options.onReleased] Callback for the queue release event
 * @param {boolean} [options.onEnded] Callback for the queue end event
 * @param {[SpinalQueue](spinal-queue.spec.md)} [options.spinalQueue] Set spinal queue uses pr. default `MicroQueue` or `ReactiveList` if added to the project
 */
PowerQueue = function(options) {
  var self = this;
  var test = 5;

  self.reactive = (options && options.reactive === false) ? false :  true;

  // Allow user to use another micro-queue #3
  // We try setting the ActiveQueue to MicroQueue if installed in the app
  var ActiveQueue = (typeof MicroQueue !== 'undefined') && MicroQueue || undefined;

  // If ReactiveList is added to the project we use this over MicroQueue
  ActiveQueue = (typeof ReactiveList !== 'undefined') && ReactiveList || ActiveQueue;

  // We allow user to overrule and set a custom spinal-queue spec complient queue
  if (options && typeof options.spinalQueue !== 'undefined') {
    ActiveQueue = options.spinalQueue;
  }

  if (typeof ActiveQueue === 'undefined') {
    console.log('Error: You need to add a spinal queue to the project');
    console.log('Please add "micro-queue", "reactive-list" to the project');
    throw new Error('Please add "micro-queue", "reactive-list" or other spinalQueue compatible packages');
  }

  // Default is fifo lilo
  self.invocations = new ActiveQueue({
    //
    sort: (options && (options.filo || options.lifo)),
    reactive: self.reactive
  });
  //var self.invocations = new ReactiveList(queueOrder);

  // List of current tasks being processed
  self._processList = new ActiveQueue({
    reactive: self.reactive
  }); //ReactiveList();

  // Max number of simultanious tasks being processed
  self._maxProcessing = new ReactiveProperty(options && options.maxProcessing || 1, self.reactive);

  // Reactive number of tasks being processed
  self._isProcessing = new ReactiveProperty(0, self.reactive);

  // Boolean indicating if queue is paused or not
  self._paused = new ReactiveProperty((options && options.isPaused || false), self.reactive);

  // Boolean indicator for queue status active / running (can still be paused)
  self._running = new ReactiveProperty(false, self.reactive);

  // Counter for errors, errors are triggered if maxFailures is exeeded
  self._errors = new ReactiveProperty(0, self.reactive);

  // Counter for task failures, contains error count
  self._failures = new ReactiveProperty(0, self.reactive);

  // On failure jump to new task - if false the current task is rerun until error
  self._jumpOnFailure = (options && options.jumpOnFailure === false) ? false : true;

  // Count of all added tasks
  self._maxLength = new ReactiveProperty(0, self.reactive);

  // Boolean indicate whether or not a "add" task is allowed to start the queue
  self._autostart = new ReactiveProperty( ((options && options.autostart === false) ? false : true), self.reactive);

  // Limit times a task is allowed to fail and be rerun later before triggering an error
  self._maxFailures = new ReactiveProperty( (options && options.maxFailures || 5), self.reactive);

  // Name / title of this queue - Not used - should deprecate
  self.title = options && options.name || 'Queue';

  // debug - will print error / failures passed to next
  self.debug = !!(options && options.debug);

  /** @method PowerQueue.total
   * @reactive
   * @returns {number} The total number of tasks added to this queue
   */
  self.total = self._maxLength.get;

  /** @method PowerQueue.isPaused
   * @reactive
   * @returns {boolean} Status of the paused state of the queue
   */
  self.isPaused = self._paused.get;

  /** @method PowerQueue.processing
   * @reactive
   * @returns {number} Number of tasks currently being processed
   */
  self.processing = self._isProcessing.get;

  /** @method PowerQueue.errors
   * @reactive
   * @returns {number} The total number of errors
   * Errors are triggered when [maxFailures](PowerQueue.maxFailures) are exeeded
   */
  self.errors = self._errors.get;

  /** @method PowerQueue.failures
   * @reactive
   * @returns {number} The total number of failed tasks
   */
  self.failures = self._failures.get;

  /** @method PowerQueue.isRunning
   * @reactive
   * @returns {boolean} True if the queue is running
   * > NOTE: The task can be paused but marked as running
   */
  self.isRunning = self._running.get;

  /** @method PowerQueue.maxProcessing Get setter for maxProcessing
   * @param {number} [max] If not used this function works as a getter
   * @reactive
   * @returns {number} Maximum number of simultaneous processing tasks
   *
   * Example:
   * ```js
   *   foo.maxProcessing();    // Works as a getter and returns the current value
   *   foo.maxProcessing(20);  // This sets the value to 20
   * ```
   */
  self.maxProcessing = self._maxProcessing.getset;

  self._maxProcessing.onChange = function() {
    // The user can change the max allowed processing tasks up or down here...
    // Update the throttle up
    self.updateThrottleUp();
    // Update the throttle down
    self.updateThrottleDown();
  };

  /** @method PowerQueue.autostart Get setter for autostart
   * @param {boolean} [autorun] If not used this function works as a getter
   * @reactive
   * @returns {boolean} If adding a task may trigger the queue to start
   *
   * Example:
   * ```js
   *   foo.autostart();    // Works as a getter and returns the current value
   *   foo.autostart(true);  // This sets the value to true
   * ```
   */
  self.autostart = self._autostart.getset;

  /** @method PowerQueue.maxFailures Get setter for maxFailures
   * @param {number} [max] If not used this function works as a getter
   * @reactive
   * @returns {number} The maximum for failures pr. task before triggering an error
   *
   * Example:
   * ```js
   *   foo.maxFailures();    // Works as a getter and returns the current value
   *   foo.maxFailures(10);  // This sets the value to 10
   * ```
   */
  self.maxFailures = self._maxFailures.getset;

  /** @callback PowerQueue.onPaused
   * Is called when queue is ended
   */
  self.onPaused = options && options.onPaused || function() {
    self.debug && console.log(self.title + ' ENDED');
  };

  /** @callback PowerQueue.onEnded
   * Is called when queue is ended
   */
  self.onEnded = options && options.onEnded || function() {
    self.debug && console.log(self.title + ' ENDED');
  };

  /** @callback PowerQueue.onRelease
   * Is called when queue is released
   */
  self.onRelease = options && options.onRelease || function() {
    self.debug && console.log(self.title + ' RELEASED');
  };

  /** @callback PowerQueue.onAutostart
   * Is called when queue is auto started
   */
  self.onAutostart = options && options.onAutostart || function() {
    self.debug && console.log(self.title + ' Autostart');
  };
};

  /** @method PowerQueue.prototype.processList
   * @reactive
   * @returns {array} List of tasks currently being processed
   */
  PowerQueue.prototype.processingList = function() {
    var self = this;
    return self._processList.fetch();
  };

  /** @method PowerQueue.prototype.isHalted
   * @reactive
   * @returns {boolean} True if the queue is not running or paused
   */
  PowerQueue.prototype.isHalted = function() {
    var self = this;
    return (!self._running.get() || self._paused.get());
  };

  /** @method PowerQueue.prototype.length
   * @reactive
   * @returns {number} Number of tasks left in queue to be processed
   */
  PowerQueue.prototype.length = function() {
    var self = this;
    return self.invocations.length();
  };

  /** @method PowerQueue.prototype.progress
   * @reactive
   * @returns {number} 0 .. 100 % Indicates the status of the queue
   */
  PowerQueue.prototype.progress = function() {
    var self = this;
    var progress = self._maxLength.get() - self.invocations.length() - self._isProcessing.get();
    if (self._maxLength.value > 0) {
      return Math.round(progress / self._maxLength.value * 100);
    }
    return 0;
  };

  /** @method PowerQueue.prototype.usage
   * @reactive
   * @returns {number} 0 .. 100 % Indicates resource usage of the queue
   */
  PowerQueue.prototype.usage = function() {
    var self = this;
    return Math.round(self._isProcessing.get() / self._maxProcessing.get() * 100);
  };

  /** @method PowerQueue.prototype.reset Reset the queue
   * Calling this will:
   * * stop the queue
   * * paused to false
   * * Discart all queue data
   *
   * > NOTE: At the moment if the queue has processing tasks they can change
   * > the `errors` and `failures` counters. This could change in the future or
   * > be prevented by creating a whole new instance of the `PowerQueue`
   */
  PowerQueue.prototype.reset = function() {
    var self = this;
    self.debug && console.log(self.title + ' RESET');
    self._running.set(false);
    self._paused.set(false);
    self.invocations.reset();
    self._processList.reset();

    // // Loop through the processing tasks and reset these
    // self._processList.forEach(function(data) {
    //   if (data.queue instanceof PowerQueue) {
    //     data.queue.reset();
    //   }
    // }, true);
    self._maxLength.set(0);
    self._failures.set(0);
    self._errors.set(0);
  };

  /** @method PowerQueue._autoStartTasks
   * @private
   *
   * This method defines the autostart algorithm that allows add task to trigger
   * a start of the queue if queue is not paused.
   */
  PowerQueue.prototype._autoStartTasks = function() {
    var self = this;

    // We dont start anything by ourselfs if queue is paused
    if (!self._paused.value) {

      // Queue is not running and we are set to autostart so we start the queue
      if (!self._running.value && self._autostart.value) {
        // Trigger callback / event
        self.onAutostart();
        // Set queue as running
        self._running.set(true);
      }

      // Make sure that we use all available resources
      if (self._running.value) {
        // Call next to start up the queue
        self.next(null);
      }

    }
  };

  /** @method PowerQueue.prototype.add
   * @param {any} data The task to be handled
   * @param {number} [failures] Used internally to Pass on number of failures.
   */
  PowerQueue.prototype.add = function(data, failures, id) {
    var self = this;

    // Assign new id to task
    var assignNewId = self._jumpOnFailure || typeof id === 'undefined';

    // Set the task id
    var taskId = (assignNewId) ? self._maxLength.value + 1 : id;

    // self.invocations.add({ _id: currentId, data: data, failures: failures || 0 }, reversed);
    self.invocations.insert(taskId, { _id: taskId, data: data, failures: failures || 0 });

    // If we assigned new id then increase length
    if (assignNewId) self._maxLength.inc();

    self._autoStartTasks();
  };

  /** @method PowerQueue.prototype.updateThrottleUp
   * @private
   *
   * Calling this method will update the throttle on the queue adding tasks.
   *
   * > Note: Currently we only support the PowerQueue - but we could support
   * > a more general interface for pauseable tasks or other usecases.
   */
  PowerQueue.prototype.updateThrottleUp = function() {
    var self = this;

    // How many additional tasks can we handle?
    var availableSlots = self._maxProcessing.value - self._isProcessing.value;
    // If we can handle more, we have more, we're running, and we're not paused
    if (!self._paused.value && self._running.value && availableSlots > 0 && self.invocations._length > 0) {
      // Increase counter of current number of tasks being processed
      self._isProcessing.inc();
      // Run task
      self.runTask(self.invocations.getFirstItem());
      // Repeat recursively; this is better than a for loop to avoid blocking the UI
      self.updateThrottleUp();
    }

  };

  /** @method PowerQueue.prototype.updateThrottleDown
   * @private
   *
   * Calling this method will update the throttle on the queue pause tasks.
   *
   * > Note: Currently we only support the PowerQueue - but we could support
   * > a more general interface for pauseable tasks or other usecases.
   */
  PowerQueue.prototype.updateThrottleDown = function() {
    var self = this;
    // Calculate the differece between acutuall processing tasks and target
    var diff = self._isProcessing.value - self._maxProcessing.value;

    // If the diff is more than 0 then we have many tasks processing.
    if (diff > 0) {
      // We pause the latest added tasks
      self._processList.forEachReverse(function(data) {
        if (diff > 0 && data.queue instanceof PowerQueue) {
          diff--;
          // We dont mind calling pause on multiple times on each task
          // theres a simple check going on preventing any duplicate actions
          data.queue.pause();
        }
      }, true);
    }
  };

  /** @method PowerQueue.prototype.next
   * @param {string} [err] Error message if task failed
   * > * Can pass in `null` to start the queue
   * > * Passing in a string to `next` will trigger a failure
   * > * Passing nothing will simply let the next task run
   * `next` is handed into the [taskHandler](PowerQueue.taskHandler) as a
   * callback to mark an error or end of current task
   */
  PowerQueue.prototype.next = function(err) {
    var self = this;
    // Primary concern is to throttle up because we are either:
    // 1. Starting the queue
    // 2. Starting next task
    //
    // This function does not shut down running tasks
    self.updateThrottleUp();

    // We are running, no tasks are being processed even we just updated the
    // throttle up and we got no errors.
    // 1. We are paused and releasing tasks
    // 2. We are done
    if (self._running.value && self._isProcessing.value === 0 && err !== null) {

      // We have no tasks processing so this queue is now releasing resources
      // this could be that the queue is paused or stopped, in that case the
      // self.invocations._length would be > 0
      // If on the other hand the self.invocations._length is 0 then we have no more
      // tasks in the queue so the queue has ended
      self.onRelease(self.invocations._length);

      if (!self.invocations._length) { // !self._paused.value &&
        // Check if queue is done working
        // Stop the queue
        self._running.set(false);
        // self.invocations.reset(); // This should be implicit
        self.onEnded();
      }

    }
  };

  /** @callback done
   * @param {Meteor.Error | Error | String | null} [feedback] This allows the task to communicate with the queue
   *
   * Explaination of `feedback`
   * * `Meteor.Error` This means that the task failed in a controlled manner and is allowed to rerun
   * * `Error` This will throw the passed error - as its an unitended error
   * * `null` The task is not done yet, rerun later
   * * `String` The task can perform certain commands on the queue
   *    * "pause" - pause the queue
   *    * "stop" - stop the queue
   *    * "reset" - reset the queue
   *    * "cancel" - cancel the queue
   *
   */


  /** @method PowerQueue.prototype.runTaskDone
   * @private
   * @param {Meteor.Error | Error | String | null} [feedback] This allows the task to communicate with the queue
   * @param {object} invocation
   *
   * > Note: `feedback` is explained in [Done callback](#done)
   *
   */
  // Rig the callback function
  PowerQueue.prototype.runTaskDone = function(feedback, invocation) {
    var self = this;

    // If the task handler throws an error then add it to the queue again
    // we allow this for a max of self._maxFailures
    // If the error is null then we add the task silently back into the
    // microQueue in reverse... This could be due to pause or throttling
    if (feedback instanceof Meteor.Error) {
      // We only count failures if maxFailures are above 0
      if (self._maxFailures.value > 0) invocation.failures++;
      self._failures.inc();

      // If the user has set the debug flag we print out failures/errors
      self.debug && console.error('Error: "' + self.title + '" ' + feedback.message + ', ' + feedback.stack);

      if (invocation.failures < self._maxFailures.value) {
        // Add the task again with the increased failures
        self.add(invocation.data, invocation.failures, invocation._id);
      } else {
        self._errors.inc();
        self.errorHandler(invocation.data, self.add, invocation.failures);
      }

      // If a error is thrown we assume its not intended
    } else if (feedback instanceof Error) throw feedback;

    if (feedback)

    // We use null to throttle pauseable tasks
    if (feedback === null) {
      // We add this task into the queue, no questions asked
      self.invocations.insert(invocation._id, { data: invocation.data, failures: invocation.failures, _id: invocation._id });
    }

    // If the user returns a string we got a command
    if (feedback === ''+feedback) {
      var command = {
        'pause': function() { self.pause(); },
        'stop': function() { self.stop(); },
        'reset': function() { self.reset(); },
        'cancel': function() { self.cancel(); },
      };
      if (typeof command[feedback] === 'function') {
        // Run the command on this queue
        command[feedback]();
      } else {
        // We dont recognize this command, throw an error
        throw new Error('Unknown queue command "' + feedback + '"');
      }
    }
    // Decrease the number of tasks being processed
    // make sure we dont go below 0
    if (self._isProcessing.value > 0) self._isProcessing.dec();
    // Task has ended we remove the task from the process list
    self._processList.remove(invocation._id);

    invocation.data = null;
    invocation.failures = null;
    invocation._id = null;
    invocation = null;
    delete invocation;
    // Next task
    Meteor.setTimeout(function() {
      self.next();
    }, 0);

  };


  /** @method PowerQueue.prototype.runTask
   * @private // This is not part of the open api
   * @param {object} invocation The object stored in the micro-queue
   */
  PowerQueue.prototype.runTask = function(invocation) {
    var self = this;

    // We start the fitting task handler
    // Currently we only support the PowerQueue but we could have a more general
    // interface for tasks that allow throttling
    try {
      if (invocation.data instanceof PowerQueue) {

        // Insert PowerQueue into process list
        self._processList.insert(invocation._id, { id: invocation._id, queue: invocation.data });
        // Handle task
        self.queueTaskHandler(invocation.data, function subQueueCallbackDone(feedback) {
          self.runTaskDone(feedback, invocation);
        }, invocation.failures);

      } else {

        // Insert task into process list
        self._processList.insert(invocation._id, invocation.data);
        // Handle task
        self.taskHandler(invocation.data, function taskCallbackDone(feedback) {
          self.runTaskDone(feedback, invocation);
        }, invocation.failures);

      }
    } catch(err) {
      throw new Error('Error while running taskHandler for queue, Error: ' + err.message);
    }
  };

  /** @method PowerQueue.prototype.queueTaskHandler
   * This method handles tasks that are sub queues
   */
  PowerQueue.prototype.queueTaskHandler = function(subQueue, next, failures) {
    var self = this;
    // Monitor sub queue task releases
    subQueue.onRelease = function(remaining) {
      // Ok, we were paused - this could be throttling so we respect this
      // So when the queue is halted we add it back into the main queue
      if (remaining > 0) {
        // We get out of the queue but dont repport error and add to run later
        next(null);
      } else {
        // Queue has ended
        // We simply trigger next task when the sub queue is complete
        next();
        // When running subqueues it doesnt make sense to track failures and retry
        // the sub queue - this is sub queue domain
      }
    };

    // Start the queue
    subQueue.run();
  };

  /** @callback PowerQueue.prototype.taskHandler
   * @param {any} data This can be data or functions
   * @param {function} next Function `next` call this to end task
   * @param {number} failures Number of failures on this task
   *
   * Default task handler expects functions as data:
   * ```js
   *   self.taskHandler = function(data, next, failures) {
   *     // This default task handler expects invocation to be a function to run
   *     if (typeof data !== 'function') {
   *       throw new Error('Default task handler expects a function');
   *     }
   *     try {
   *       // Have the function call next
   *       data(next, failures);
   *     } catch(err) {
   *       // Throw to fail this task
   *       next(err);
   *     }
   *   };
   * ```
   */

  // Can be overwrittin by the user
  PowerQueue.prototype.taskHandler = function(data, next, failures) {
    var self = this;
    // This default task handler expects invocation to be a function to run
    if (typeof data !== 'function') {
      throw new Error('Default task handler expects a function');
    }
    try {
      // Have the function call next
      data(next, failures);
    } catch(err) {
      // Throw to fail this task
      next(err);
    }
  };

  /** @callback PowerQueue.prototype.errorHandler
   * @param {any} data This can be data or functions
   * @param {function} addTask Use this function to insert the data into the queue again
   * @param {number} failures Number of failures on this task
   *
   * The default callback:
   * ```js
   *   var foo = new PowerQueue();
   *
   *   // Overwrite the default action
   *   foo.errorHandler = function(data, addTask, failures) {
   *     // This could be overwritten the data contains the task data and addTask
   *     // is a helper for adding the task to the queue
   *     // try again: addTask(data);
   *     // console.log('Terminate at ' + failures + ' failures');
   *   };
   * ```
   */
  PowerQueue.prototype.errorHandler = function(data, addTask, failures) {
    var self = this;
    // This could be overwritten the data contains the task data and addTask
    // is a helper for adding the task to the queue
    // try again: addTask(data);
    self.debug && console.log('Terminate at ' + failures + ' failures');
  };

  /** @method PowerQueue.prototype.pause Pause the queue
   * @todo We should have it pause all processing tasks
   */
  PowerQueue.prototype.pause = function() {
    var self = this;
    if (!self._paused.value) {

      self._paused.set(true);
      // Loop through the processing tasks and pause these
      self._processList.forEach(function(data) {
        if (data.queue instanceof PowerQueue) {
          // Pause the sub queue
          data.queue.pause();
        }
      }, true);

      // Trigger callback
      self.onPaused();
    }
  };

  /** @method PowerQueue.prototype.resume Start a paused queue
   * @todo We should have it resume all processing tasks
   *
   * > This will not start a stopped queue
   */
  PowerQueue.prototype.resume = function() {
    var self = this;
    self.run();
  };

  /** @method PowerQueue.prototype.run Starts the queue
   * > Using this command will resume a paused queue and will
   * > start a stopped queue.
   */
  PowerQueue.prototype.run = function() {
    var self = this;
    //not paused and already running or queue empty or paused subqueues
    if (!self._paused.value && self._running.value || !self.invocations._length) {
      return;
    }

    self._paused.set(false);
    self._running.set(true);
    self.next(null);
  };

  /** @method PowerQueue.prototype.stop Stops the queue
   */
  PowerQueue.prototype.stop = function() {
    var self = this;
    self._running.set(false);
  };

  /** @method PowerQueue.prototype.cancel Cancel the queue
   */
  PowerQueue.prototype.cancel = function() {
    var self = this;
    self.reset();
  };

