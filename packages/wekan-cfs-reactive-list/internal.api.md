> File: ["reactive-list.js"](reactive-list.js)
> Where: {client|server}

-
#ReactiveList
Provides a simple reactive list interface

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
####Example of a sort algorithm
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
###Object chain
```
                  first                               last
 undefined -       obj       -       obj       -       obj       - undefined
            (prev value next) (prev value next) (prev value next)
```

> ```ReactiveList = function(options) { ...``` [reactive-list.js:46](reactive-list.js#L46)

-

#### <a name="ReactiveList.prototype.length"></a>*reactivelist*.length()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __length__ is defined in `prototype` of `ReactiveList`*

__Returns__  *{number}*  __(is reactive)__
Length of the reactive list

> ```ReactiveList.prototype.length = function() { ...``` [reactive-list.js:73](reactive-list.js#L73)

-

#### <a name="ReactiveList.prototype.reset"></a>*reactivelist*.reset()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __reset__ is defined in `prototype` of `ReactiveList`*
__TODO__
```
* Check for memory leaks, if so we have to iterate over lookup and delete the items
```

> ```ReactiveList.prototype.reset = function() { ...``` [reactive-list.js:83](reactive-list.js#L83)

-

#### <a name="ReactiveList.prototype.update"></a>*reactivelist*.update(key, value)&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __update__ is defined in `prototype` of `ReactiveList`*

__Arguments__

* __key__ *{string|number}*  
Key to update
* __value__ *{any}*  
Update with this value

-

> ```ReactiveList.prototype.update = function(key, value) { ...``` [reactive-list.js:102](reactive-list.js#L102)

-

#### <a name="ReactiveList.prototype.insert"></a>*reactivelist*.insert(key, value)&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __insert__ is defined in `prototype` of `ReactiveList`*

__Arguments__

* __key__ *{string|number}*  
Key to insert
* __value__ *{any}*  
Insert item with this value

-

> ```ReactiveList.prototype.insert = function(key, value) { ...``` [reactive-list.js:118](reactive-list.js#L118)

-

#### <a name="ReactiveList.prototype.remove"></a>*reactivelist*.remove(key)&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __remove__ is defined in `prototype` of `ReactiveList`*

__Arguments__

* __key__ *{string|number}*  
Key to remove

-

> ```ReactiveList.prototype.remove = function(key) { ...``` [reactive-list.js:180](reactive-list.js#L180)

-

#### <a name="ReactiveList.prototype.getLastItem"></a>*reactivelist*.getLastItem()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __getLastItem__ is defined in `prototype` of `ReactiveList`*

__Returns__  *{any}*
Pops last item from the list - removes the item from the list

> ```ReactiveList.prototype.getLastItem = function(first) { ...``` [reactive-list.js:221](reactive-list.js#L221)

-

#### <a name="ReactiveList.prototype.getFirstItem"></a>*reactivelist*.getFirstItem()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __getFirstItem__ is defined in `prototype` of `ReactiveList`*

__Returns__  *{any}*
Pops first item from the list - removes the item from the list

> ```ReactiveList.prototype.getFirstItem = function() { ...``` [reactive-list.js:239](reactive-list.js#L239)

-

#### <a name="ReactiveList.prototype.forEach"></a>*reactivelist*.forEach(f, [noneReactive], [reverse])&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __forEach__ is defined in `prototype` of `ReactiveList`*

__Arguments__

* __f__ *{function}*  
Callback `funciton(value, key)`
* __noneReactive__ *{boolean}*    (Optional = false)
Set true if want to disable reactivity
* __reverse__ *{boolean}*    (Optional = false)
Set true to reverse iteration `forEachReverse`

-

> ```ReactiveList.prototype.forEach = function(f, noneReactive, reverse) { ...``` [reactive-list.js:249](reactive-list.js#L249)

-

#### <a name="ReactiveList.prototype.forEachReverse"></a>*reactivelist*.forEachReverse(f, [noneReactive])&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __forEachReverse__ is defined in `prototype` of `ReactiveList`*

__Arguments__

* __f__ *{function}*  
Callback `funciton(value, key)`
* __noneReactive__ *{boolean}*    (Optional = false)
Set true if want to disable reactivity

-

> ```ReactiveList.prototype.forEachReverse = function(f, noneReactive) { ...``` [reactive-list.js:272](reactive-list.js#L272)

-

#### <a name="ReactiveList.prototype.fetch"></a>*reactivelist*.fetch([noneReactive])&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __fetch__ is defined in `prototype` of `ReactiveList`*

__Arguments__

* __noneReactive__ *{boolean}*    (Optional = false)
Set true if want to disable reactivity

-

__Returns__  *{array}*  __(is reactive)__
List of items

> ```ReactiveList.prototype.fetch = function(noneReactive) { ...``` [reactive-list.js:282](reactive-list.js#L282)

-
