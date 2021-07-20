
#### <a name="PowerQueue"></a>new PowerQueue([options])&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
```
Creates an instance of a power queue 
[Check out demo](http://power-queue-test.meteor.com/)
```
-

__Arguments__

* __options__ *{object}*    (Optional)
Settings
    - __filo__ *{boolean}*    (Default = false)
Make it a first in last out queue
    - __isPaused__ *{boolean}*    (Default = false)
Set queue paused
    - __autostart__ *{boolean}*    (Default = true)
May adding a task start the queue
    - __name__ *{string}*    (Default = "Queue")
Name of the queue
    - __maxProcessing__ *{number}*    (Default = 1)
Limit of simultanous running tasks
    - __maxFailures__ *{number}*    (Default = 5)
Limit retries of failed tasks, if 0 or below we allow infinite failures
    - __jumpOnFailure__ *{number}*    (Default = true)
Jump to next task and retry failed task later
    - __debug__ *{boolean}*    (Default = false)
Log verbose messages to the console
    - __reactive__ *{boolean}*    (Default = true)
Set whether or not this queue should be reactive
    - __spinalQueue__ *{[SpinalQueue](spinal-queue.spec.md)}*    (Optional)
Set spinal queue uses pr. default `MicroQueue` or `ReactiveList` if added to the project

-



> ```PowerQueue = function(options) { ...``` [power-queue.js:27](power-queue.js#L27)

-

#### <a name="PowerQueue.onEnded"></a>*powerqueue*.onEnded&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This callback __onEnded__ is defined in `PowerQueue`*
Is called when queue is ended

> ```self.onEnded = options && options.onEnded || function() { ...``` [power-queue.js:103](power-queue.js#L103)

-

#### <a name="PowerQueue.onRelease"></a>*powerqueue*.onRelease&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This callback __onRelease__ is defined in `PowerQueue`*
Is called when queue is released

> ```self.onRelease = options && options.onRelease || function() { ...``` [power-queue.js:110](power-queue.js#L110)

-

#### <a name="PowerQueue.onAutostart"></a>*powerqueue*.onAutostart&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This callback __onAutostart__ is defined in `PowerQueue`*
Is called when queue is auto started

> ```self.onAutostart = options && options.onAutostart || function() { ...``` [power-queue.js:115](power-queue.js#L115)

-

#### <a name="PowerQueue.total"></a>*powerqueue*.total()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __total__ is defined in `PowerQueue`*

__Returns__  *{number}*  __(is reactive)__
The total number of tasks added to this queue

> ```self.total = self._maxLength.get;``` [power-queue.js:123](power-queue.js#L123)

-

#### <a name="PowerQueue.isPaused"></a>*powerqueue*.isPaused()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __isPaused__ is defined in `PowerQueue`*

__Returns__  *{boolean}*  __(is reactive)__
Status of the paused state of the queue

> ```self.isPaused = self._paused.get;``` [power-queue.js:129](power-queue.js#L129)

-

#### <a name="PowerQueue.processing"></a>*powerqueue*.processing()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __processing__ is defined in `PowerQueue`*

__Returns__  *{number}*  __(is reactive)__
Number of tasks currently being processed

> ```self.processing = self._isProcessing.get;``` [power-queue.js:135](power-queue.js#L135)

-

#### <a name="PowerQueue.errors"></a>*powerqueue*.errors()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __errors__ is defined in `PowerQueue`*

__Returns__  *{number}*  __(is reactive)__
The total number of errors
Errors are triggered when [maxFailures](PowerQueue.maxFailures) are exeeded

> ```self.errors = self._errors.get;``` [power-queue.js:142](power-queue.js#L142)

-

#### <a name="PowerQueue.failures"></a>*powerqueue*.failures()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __failures__ is defined in `PowerQueue`*

__Returns__  *{number}*  __(is reactive)__
The total number of failed tasks

> ```self.failures = self._failures.get;``` [power-queue.js:148](power-queue.js#L148)

-

#### <a name="PowerQueue.isRunning"></a>*powerqueue*.isRunning()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __isRunning__ is defined in `PowerQueue`*

__Returns__  *{boolean}*  __(is reactive)__
True if the queue is running
> NOTE: The task can be paused but marked as running

> ```self.isRunning = self._running.get;``` [power-queue.js:155](power-queue.js#L155)

-

#### <a name="PowerQueue.maxProcessing"></a>*powerqueue*.maxProcessing([max])&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __maxProcessing__ is defined in `PowerQueue`*

__Arguments__

* __max__ *{number}*    (Optional)
If not used this function works as a getter

-

__Returns__  *{number}*  __(is reactive)__
Maximum number of simultaneous processing tasks

Example:
```js
  foo.maxProcessing();    // Works as a getter and returns the current value
  foo.maxProcessing(20);  // This sets the value to 20
```

> ```self.maxProcessing = self._maxProcessing.getset;``` [power-queue.js:168](power-queue.js#L168)

-

#### <a name="PowerQueue.autostart"></a>*powerqueue*.autostart([autorun])&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __autostart__ is defined in `PowerQueue`*

__Arguments__

* __autorun__ *{boolean}*    (Optional)
If not used this function works as a getter

-

__Returns__  *{boolean}*  __(is reactive)__
If adding a task may trigger the queue to start

Example:
```js
  foo.autostart();    // Works as a getter and returns the current value
  foo.autostart(true);  // This sets the value to true
```

> ```self.autostart = self._autostart.getset;``` [power-queue.js:189](power-queue.js#L189)

-

#### <a name="PowerQueue.maxFailures"></a>*powerqueue*.maxFailures([max])&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __maxFailures__ is defined in `PowerQueue`*

__Arguments__

* __max__ *{number}*    (Optional)
If not used this function works as a getter

-

__Returns__  *{number}*  __(is reactive)__
The maximum for failures pr. task before triggering an error

Example:
```js
  foo.maxFailures();    // Works as a getter and returns the current value
  foo.maxFailures(10);  // This sets the value to 10
```

> ```self.maxFailures = self._maxFailures.getset;``` [power-queue.js:202](power-queue.js#L202)

-

#### <a name="PowerQueue.prototype.processList"></a>*powerqueue*.processList()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __processList__ is defined in `prototype` of `PowerQueue`*

__Returns__  *{array}*  __(is reactive)__
List of tasks currently being processed

> ```PowerQueue.prototype.processingList = function() { ...``` [power-queue.js:209](power-queue.js#L209)

-

#### <a name="PowerQueue.prototype.isHalted"></a>*powerqueue*.isHalted()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __isHalted__ is defined in `prototype` of `PowerQueue`*

__Returns__  *{boolean}*  __(is reactive)__
True if the queue is not running or paused

> ```PowerQueue.prototype.isHalted = function() { ...``` [power-queue.js:218](power-queue.js#L218)

-

#### <a name="PowerQueue.prototype.length"></a>*powerqueue*.length()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __length__ is defined in `prototype` of `PowerQueue`*

__Returns__  *{number}*  __(is reactive)__
Number of tasks left in queue to be processed

> ```PowerQueue.prototype.length = function() { ...``` [power-queue.js:227](power-queue.js#L227)

-

#### <a name="PowerQueue.prototype.progress"></a>*powerqueue*.progress()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __progress__ is defined in `prototype` of `PowerQueue`*

__Returns__  *{number}*  __(is reactive)__
0 .. 100 % Indicates the status of the queue

> ```PowerQueue.prototype.progress = function() { ...``` [power-queue.js:236](power-queue.js#L236)

-

#### <a name="PowerQueue.prototype.usage"></a>*powerqueue*.usage()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __usage__ is defined in `prototype` of `PowerQueue`*

__Returns__  *{number}*  __(is reactive)__
0 .. 100 % Indicates ressource usage of the queue

> ```PowerQueue.prototype.usage = function() { ...``` [power-queue.js:249](power-queue.js#L249)

-

#### <a name="PowerQueue.prototype.reset"></a>*powerqueue*.reset()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __reset__ is defined in `prototype` of `PowerQueue`*
Calling this will:
* stop the queue
* paused to false
* Discart all queue data

> NOTE: At the moment if the queue has processing tasks they can change
> the `errors` and `failures` counters. This could change in the future or
> be prevented by creating a whole new instance of the `PowerQueue`

> ```PowerQueue.prototype.reset = function() { ...``` [power-queue.js:264](power-queue.js#L264)

-

#### <a name="PowerQueue.prototype.add"></a>*powerqueue*.add(data, [failures])&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __add__ is defined in `prototype` of `PowerQueue`*

__Arguments__

* __data__ *{any}*  
The task to be handled
* __failures__ *{number}*    (Optional)
Internally used to Pass on number of failures.

-

> ```PowerQueue.prototype.add = function(data, failures, id) { ...``` [power-queue.js:316](power-queue.js#L316)

-

#### <a name="PowerQueue.prototype.next"></a>*powerqueue*.next([err])&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __next__ is defined in `prototype` of `PowerQueue`*

__Arguments__

* __err__ *{string}*    (Optional)
Error message if task failed

-
> * Can pass in `null` to start the queue
> * Passing in a string to `next` will trigger a failure
> * Passing nothing will simply let the next task run
`next` is handed into the [taskHandler](PowerQueue.taskHandler) as a
callback to mark an error or end of current task

> ```PowerQueue.prototype.next = function(err) { ...``` [power-queue.js:394](power-queue.js#L394)

-

#### <a name="PowerQueue.prototype.queueTaskHandler"></a>*powerqueue*.queueTaskHandler()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __queueTaskHandler__ is defined in `prototype` of `PowerQueue`*
This method handles tasks that are sub queues

> ```PowerQueue.prototype.queueTaskHandler = function(subQueue, next, failures) { ...``` [power-queue.js:555](power-queue.js#L555)

-

#### <a name="PowerQueue.prototype.taskHandler"></a>*powerqueue*.taskHandler&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This callback __taskHandler__ is defined in `prototype` of `PowerQueue`*

__Arguments__

* __data__ *{any}*  
This can be data or functions
* __next__ *{function}*  
Function `next` call this to end task
* __failures__ *{number}*  
Number of failures on this task

-

Default task handler expects functions as data:
```js
  self.taskHandler = function(data, next, failures) {
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
```

> ```PowerQueue.prototype.taskHandler = function(data, next, failures) { ...``` [power-queue.js:601](power-queue.js#L601)

-

#### <a name="PowerQueue.prototype.errorHandler"></a>*powerqueue*.errorHandler&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This callback __errorHandler__ is defined in `prototype` of `PowerQueue`*

__Arguments__

* __data__ *{any}*  
This can be data or functions
* __addTask__ *{function}*  
Use this function to insert the data into the queue again
* __failures__ *{number}*  
Number of failures on this task

-

The default callback:
```js
  var foo = new PowerQueue();

  // Overwrite the default action
  foo.errorHandler = function(data, addTask, failures) {
    // This could be overwritten the data contains the task data and addTask
    // is a helper for adding the task to the queue
    // try again: addTask(data);
    // console.log('Terminate at ' + failures + ' failures');
  };
```

> ```PowerQueue.prototype.errorHandler = function(data, addTask, failures) { ...``` [power-queue.js:634](power-queue.js#L634)

-

#### <a name="PowerQueue.prototype.pause"></a>*powerqueue*.pause()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __pause__ is defined in `prototype` of `PowerQueue`*

> ```PowerQueue.prototype.pause = function() { ...``` [power-queue.js:645](power-queue.js#L645)

-

#### <a name="PowerQueue.prototype.resume"></a>*powerqueue*.resume()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __resume__ is defined in `prototype` of `PowerQueue`*

> This will not start a stopped queue

> ```PowerQueue.prototype.resume = function() { ...``` [power-queue.js:665](power-queue.js#L665)

-

#### <a name="PowerQueue.prototype.run"></a>*powerqueue*.run()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __run__ is defined in `prototype` of `PowerQueue`*
> Using this command will resume a paused queue and will
> start a stopped queue.

> ```PowerQueue.prototype.run = function() { ...``` [power-queue.js:677](power-queue.js#L677)

-
