# meteor-reactive-cache [![Build Status](https://travis-ci.org/maxnowack/meteor-reactive-cache.svg?branch=master)](https://travis-ci.org/maxnowack/meteor-reactive-cache)
Utilities for caching reactive data

### Installation
````bash
  $ npm install --save meteor-reactive-cache
````

### Usage

#### `ReactiveCache(compare: function)`
A simple reactive cache. It haves the same API like a `ReactiveDict`, but the values are getting deleted if all wrapped computations are stopped.

````es6
import { Tracker } from 'meteor/tracker'
import { ReactiveCache } from 'meteor-reactive-cache'

const reactiveCache = new ReactiveCache(/* compareFn */);
reactiveCache.set('foo', 'bar');
const computation = Tracker.autorun(() => {
  reactiveCache.get('foo'); // reactive!
})
reactiveCache.set('foo', 'new bar');
computation.stop(); // keys will be invalidated if they don't have reactive dependants
reactiveCache.get('foo'); // undefined
````

#### `DataCache(resolve: function, { timeout: number, compare: function })`
Provides a simple reactive data cache, by passing in a function, that resolves a key to data in a reactive context.

````es6
import { Tracker } from 'meteor/tracker'
import { DataCache } from 'meteor-reactive-cache'

const dataCache = new DataCache((key) => {
  // do some expensive reactive work here, which returns the same data for the same key.
  // this function will only be executed if a reactive dependency changes or the requested key isn't cached.

})
const computation = Tracker.autorun(() => {
  reactiveCache.get('foo'); // reactive!
})
computation.stop(); // keys will be invalidated if they don't have reactive dependants
reactiveCache.get('foo'); // undefined
````

#### `reactiveField(resolve: function, { timeout: number, compare: function })`
Like DataCache, but with a much simpler API and support for multiple function parameters.

````es6
import { Tracker } from 'meteor/tracker'
import { reactiveField } from 'meteor-reactive-cache'

const field = reactiveField((val1, val2, val3) => {
  // …
})
const computation = Tracker.autorun(() => {
  field('foo', 'bar', 1234); // reactive!
})
````




## License
Licensed under MIT license. Copyright (c) 2017 Max Nowack

## Contributions
Contributions are welcome. Please open issues and/or file Pull Requests.

## Maintainers
- Max Nowack ([maxnowack](https://github.com/maxnowack))
