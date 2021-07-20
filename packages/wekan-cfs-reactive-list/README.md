wekan-cfs-reactive-list [![Build Status](https://travis-ci.org/CollectionFS/Meteor-reactive-list.png?branch=master)](https://travis-ci.org/CollectionFS/Meteor-reactive-list)
=========

~~Looking for maintainers - please reach out!~~
This package is to be archived due to inability to find contributors, thanks to everyone who helped make it possible.

**If you're looking for an alternative, we highly recommend [Meteor-Files](https://github.com/VeliovGroup/Meteor-Files) by [VeliovGroup](https://github.com/VeliovGroup)**

---

ReactiveList keeps a sortable reactive list of key+value items. It's simple and fast.

And... It's powered by Meteor's reactive sugar :)

Kind regards,  
Eric (@aldeed) and Morten (@raix)

Happy coding!!

#API
[API Documentation](api.md)

From the docs:
#### <a name="ReactiveList"></a>new ReactiveList([options], sort)&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-

__Arguments__

* __options__ *{object}*    (Optional)
* __sort__ *{function}*  
The sort algorithm to use

-
Example:
```js
 var list = new ReactiveList();
 list.insert(1, { text: 'Hello id: 1' });
 list.insert(2, { text: 'Hello id: 2' });
 list.insert(3, { text: 'Hello id: 3' });
 list.update(2, { text: 'Updated 2'});
 list.remove(1);
 
 list.forEach(function(value, key) {
   console.log('GOT: ' + value.text);
 }, true); // Set noneReactive = true, default behaviour is reactive
 // Return from Template:
 Template.hello.list = function() {
   return list.fetch();
 };
```

#### Example of a sort algorithm
Sort can be used to define the order of the list
```js
 var list = new ReactiveList({
   sort: function(a, b) {
     // a and b are type of { key, value }
     // here we sort by the key:
     return a.key < b.key;
   }
 });
```
### Object chain
```
                  first                               last
 undefined -       obj       -       obj       -       obj       - undefined
            (prev value next) (prev value next) (prev value next)
```

```
ReactiveList = function(options) { ...
```

See more at [reactive-list.js:46](reactive-list.js#L46).

# Contribute

Here's the [complete API documentation](internal.api.md). To update the docs, run `npm install docmeteor`, then

```bash
$ docmeteor
```
