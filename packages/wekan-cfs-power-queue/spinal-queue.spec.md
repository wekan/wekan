#Spinal Queue Spec
This specification declares the interface for the "spinal" queue in `PowerQueue`.
We allready have two implementations the [MicroQueue](https://github.com/zcfs/Meteor-micro-queue) and [ReactiveList](https://github.com/zcfs/Meteor-reactive-list)

#SpinalQueue
Provides a simple reactive list interface

#### <a name="SpinalQueue"></a>new SpinalQueue(lifo)&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-

__Arguments__

* __lifo__ *{boolean}*
Set the order of the queue default is `fifo`

-
Example:
```js
  var list = new SpinalQueue();
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

-

#### <a name="SpinalQueue.length"></a>*SpinalQueue*.length()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __length__ is defined in `SpinalQueue`*

__Returns__  *{number}*  __(is reactive)__
Length of the reactive list

-

#### <a name="SpinalQueue.reset"></a>*SpinalQueue*.reset()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __reset__ is defined in `SpinalQueue`*

-

#### <a name="SpinalQueue.update"></a>*SpinalQueue*.update(key, value)&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __update__ is defined in `SpinalQueue`*

__Arguments__

* __key__ *{string|number}*  
Key to update
* __value__ *{any}*  
Update with this value

> Note: Method is currently not used by `PowerQueue`

-

#### <a name="SpinalQueue.insert"></a>*SpinalQueue*.insert(key, value)&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __insert__ is defined in `SpinalQueue`*

__Arguments__

* __key__ *{string|number}*  
Key to insert
* __value__ *{any}*  
Insert item with this value

-

#### <a name="SpinalQueue.remove"></a>*SpinalQueue*.remove(key)&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __remove__ is defined in `SpinalQueue`*

__Arguments__

* __key__ *{string|number}*  
Key to remove

-

#### <a name="SpinalQueue.getLastItem"></a>*SpinalQueue*.getLastItem()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __getLastItem__ is defined in `SpinalQueue`*

__Returns__  *{any}*
Pops last item from the list - removes the item from the list

> Note: Method is currently not used by `PowerQueue`

-

#### <a name="SpinalQueue.getFirstItem"></a>*SpinalQueue*.getFirstItem()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __getFirstItem__ is defined in `SpinalQueue`*

__Returns__  *{any}*
Pops first item from the list - removes the item from the list


#### <a name="SpinalQueue.forEach"></a>*SpinalQueue*.forEach(f, [noneReactive], [reverse])&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __forEach__ is defined in `SpinalQueue`*

__Arguments__

* __f__ *{function}*  
Callback `funciton(value, key)`
* __noneReactive__ *{boolean}*    (Optional = false)
Set true if want to disable reactivity

-


#### <a name="SpinalQueue.forEachReverse"></a>*SpinalQueue*.forEachReverse(f, [noneReactive])&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __forEachReverse__ is defined in `SpinalQueue`*

__Arguments__

* __f__ *{function}*  
Callback `funciton(value, key)`
* __noneReactive__ *{boolean}*    (Optional = false)
Set true if want to disable reactivity

-

#### <a name="SpinalQueue.fetch"></a>*SpinalQueue*.fetch([noneReactive])&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __fetch__ is defined in `SpinalQueue`*

__Arguments__

* __noneReactive__ *{boolean}*    (Optional = false)
Set true if want to disable reactivity

-

__Returns__  *{array}*  __(is reactive)__
List of items

-
