// #ReactiveList
// Provides a simple reactive list interface
var _noopCallback = function() {};

var _nonReactive = {
  changed: _noopCallback,
  depend: _noopCallback
};

/** @method ReactiveList Keeps a reactive list of key+value items
  * @constructor
  * @namespace ReactiveList
  * @param {object} [options]
  * @param {function} sort The sort algorithm to use
  * @param {boolean} [reactive=true] If set false this list is not reactive
  * Example:
  * ```js
  *   var list = new ReactiveList();
  *   list.insert(1, { text: 'Hello id: 1' });
  *   list.insert(2, { text: 'Hello id: 2' });
  *   list.insert(3, { text: 'Hello id: 3' });
  *   list.update(2, { text: 'Updated 2'});
  *   list.remove(1);
  *
  *   list.forEach(function(value, key) {
  *     console.log('GOT: ' + value.text);
  *   }, true); // Set noneReactive = true, default behaviour is reactive
  *
  *   // Return from Template:
  *   Template.hello.list = function() {
  *     return list.fetch();
  *   };
  * ```
  *
  * ####Example of a sort algorithm
  * Sort can be used to define the order of the list
  * ```js
  *   var list = new ReactiveList({
  *     sort: function(a, b) {
  *       // a and b are type of { key, value }
  *       // here we sort by the key:
  *       return a.key < b.key;
  *     }
  *   });
  * ```
  * ###Object chain
  * ```
  *                   first                               last
  *  undefined -       obj       -       obj       -       obj       - undefined
  *             (prev value next) (prev value next) (prev value next)
  * ```
  */
ReactiveList = function(options) {
  var self = this;
  // Object container
  self.lookup = {};
  // Length
  self._length = 0;
  // First object in list
  self.first;
  // Last object in list
  self.last;
  // Set sort to options.sort or default to true (asc)
  self.sort = (options && options.sort || function(a, b) {
    return a.key < b.key;
  });

  // Allow user to disable reactivity, default true
  self.isReactive = (options)? options.reactive !== false : true;

  // If lifo queue
  if (options === true || options && options.sort === true) {
    self.sort = function(a, b) { return a.key > b.key; };
  }

  // Rig the dependencies
  self._listDeps = (self.isReactive)? new Deps.Dependency() : _nonReactive;

  self._lengthDeps = (self.isReactive)? new Deps.Dependency() : _nonReactive;
};

/** @method ReactiveList.prototype.length Returns the length of the list
  * @reactive
  * @returns {number} Length of the reactive list
  */
ReactiveList.prototype.length = function() {
  var self = this;
  // Make this reactive
  self._lengthDeps.depend();
  return self._length;
};

/** @method ReactiveList.prototype.reset Reset and empty the list
  * @todo Check for memory leaks, if so we have to iterate over lookup and delete the items
  */
ReactiveList.prototype.reset = function() {
  var self = this;
  // Clear the reference to the first object
  self.first = undefined;
  // Clear the reference to the last object
  self.last = undefined;
  // Clear the lookup object
  self.lookup = {};
  // Set the length to 0
  self._length = 0;
  self._lengthDeps.changed();
  // Invalidate the list
  self._listDeps.changed();
};

/** @method ReactiveList.prototype.update
  * @param {string|number} key Key to update
  * @param {any} value Update with this value
  */
ReactiveList.prototype.update = function(key, value) {
  var self = this;
  // Make sure the key is found in the list
  if (typeof self.lookup[key] === 'undefined') {
    throw new Error('Reactive list cannot update, key "' + key + '" not found');
  }
  // Set the new value
  self.lookup[key].value = value;
  // Invalidate the list
  self._listDeps.changed();
};

/** @method ReactiveList.prototype.insert
  * @param {string|number} key Key to insert
  * @param {any} value Insert item with this value
  */
ReactiveList.prototype.insert = function(key, value) {
  var self = this;
  if (typeof self.lookup[key] !== 'undefined') {
    throw new Error('Reactive list could not insert: key "' + key +
            '" allready found');
  }
  // Create the new item to insert into the list
  var newItem = { key: key, value: value };
  // Init current by pointing it at the first object in the list
  var current = self.first;
  // Init the isInserted flag
  var isInserted = false;


  // Iterate through list while not empty and item is not inserted
  while (typeof current !== 'undefined' && !isInserted) {

    // Sort the list by using the sort function
    if (self.sort(newItem, current)) {

      // Insert self.lookup[key] before
      if (typeof current.prev === 'undefined') { self.first = newItem; }

      // Set the references in the inserted object
      newItem.prev = current.prev;
      newItem.next = current;

      // Update the two existing objects
      if (current.prev) { current.prev.next = newItem; }
      current.prev = newItem;

      // Mark the item as inserted - job's done
      isInserted = true;
    }
    // Goto next object
    current = current.next;
  }


  if (!isInserted) {
    // We append it to the list
    newItem.prev = self.last;
    if (self.last) { self.last.next = newItem; }

    // Update the last pointing to newItem
    self.last = newItem;
    // Update first if we are appending to an empty list
    if (self._length === 0) { self.first = newItem; }
  }


  // Reference the object for a quick lookup option
  self.lookup[key] = newItem;
  // Increase length
  self._length++;
  self._lengthDeps.changed();
  // And invalidate the list
  self._listDeps.changed();
};

/** @method ReactiveList.prototype.remove
  * @param {string|number} key Key to remove
  */
ReactiveList.prototype.remove = function(key) {
  var self = this;
  // Get the item object
  var item = self.lookup[key];

  // Check that it exists
  if (typeof item === 'undefined') {
    return;
    // throw new Error('ReactiveList cannot remove item, unknow key "' + key +
    //        '"');
  }

  // Rig the references
  var prevItem = item.prev;
  var nextItem = item.next;

  // Update chain prev object next reference
  if (typeof prevItem !== 'undefined') {
    prevItem.next = nextItem;
  } else {
    self.first = nextItem;
  }

  // Update chain next object prev reference
  if (typeof nextItem !== 'undefined') {
    nextItem.prev = prevItem;
  } else {
    self.last = prevItem;
  }

  // Clean up
  self.lookup[key].last = null;
  self.lookup[key].prev = null;
  self.lookup[key] = null;
  prevItem = null;

  delete self.lookup[key];
  // Decrease the length
  self._length--;
  self._lengthDeps.changed();
  // Invalidate the list
  self._listDeps.changed();
};

/** @method ReactiveList.prototype.getLastItem
  * @returns {any} Pops last item from the list - removes the item from the list
  */
ReactiveList.prototype.getLastItem = function(first) {
  var self = this;

  // Get the relevant item first or last
  var item = (first)?self.first: self.last;

  if (typeof item === 'undefined') {
    return; // Empty list
  }
  // Remove the item from the list
  self.remove(item.key);
  // Return the value
  return item.value;
};

/** @method ReactiveList.prototype.getFirstItem
  * @returns {any} Pops first item from the list - removes the item from the list
  */
ReactiveList.prototype.getFirstItem = function() {
  // This gets the first item...
  return this.getLastItem(true);
};

/** @method ReactiveList.prototype.forEach
  * @param {function} f Callback `funciton(value, key)`
  * @param {boolean} [noneReactive=false] Set true if want to disable reactivity
  * @param {boolean} [reverse=false] Set true to reverse iteration `forEachReverse`
  */
ReactiveList.prototype.forEach = function(f, noneReactive, reverse) {
  var self = this;
  // Check if f is a function
  if (typeof f !== 'function') {
    throw new Error('ReactiveList forEach requires a function');
  }
  // We allow this not to be reactive
  if (!noneReactive) { self._listDeps.depend(); }
  // Set current to the first object
  var current = (reverse)?self.last: self.first;
  // Iterate over the list while its not empty
  while (current) {
    // Call the callback function
    f(current.value, current.key);
    // Jump to the next item in the list
    current = (reverse)?current.prev: current.next;
  }
};

/** @method ReactiveList.prototype.forEachReverse
  * @param {function} f Callback `funciton(value, key)`
  * @param {boolean} [noneReactive=false] Set true if want to disable reactivity
  */
ReactiveList.prototype.forEachReverse = function(f, noneReactive) {
  // Call forEach with the reverse flag
  this.forEach(f, noneReactive, true);
};

/** @method ReactiveList.prototype.fetch Returns list as array
  * @param {boolean} [noneReactive=false] Set true if want to disable reactivity
  * @reactive This can be disabled
  * @returns {array} List of items
  */
ReactiveList.prototype.fetch = function(noneReactive) {
  var self = this;
  // Init the result buffer
  var result = [];
  // Iterate over the list items
  self.forEach(function fetchCallback(value) {
    // Add the item value to the result
    result.push(value);
  }, noneReactive);
  // Return the result
  return result;
};
