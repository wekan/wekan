> File: ["reactive-property.js"](reactive-property.js)
> Where: {client|server}

-
#ReactiveProperty
A simple class that provides an reactive property interface

#### <a name="ReactiveProperty"></a>new ReactiveProperty(defaultValue, [reactive])&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-

__Arguments__

* __defaultValue__ *{any}*  
Set the default value for the reactive property
* __reactive__ *{boolean}*    (Optional = true)
Allow the user to disable reactivity

-


This api should only be in the internal.api.md

> ```ReactiveProperty = function(defaultValue, reactive) { ...``` [reactive-property.js:18](reactive-property.js#L18)

-

#### <a name="ReactiveProperty.value"></a>ReactiveProperty.value {any}&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This property is private*
*This property __value__ is defined in `ReactiveProperty`*
This contains the non reactive value, should only be used as a getter for
internal use

> ```self.value = defaultValue;``` [reactive-property.js:27](reactive-property.js#L27)

-

#### <a name="ReactiveProperty.get"></a>ReactiveProperty.get()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __get__ is defined in `ReactiveProperty`*

Usage:
```js
  var foo = new ReactiveProperty('bar');
  foo.get(); // equals "bar"
```

> ```self.get = function() { ...``` [reactive-property.js:44](reactive-property.js#L44)

-

#### <a name="ReactiveProperty.set"></a>ReactiveProperty.set(value)&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __set__ is defined in `ReactiveProperty`*

__Arguments__

* __value__ *{any}*  

-

Usage:
```js
  var foo = new ReactiveProperty('bar');
  foo.set('bar');
```

> ```self.set = function(value) { ...``` [reactive-property.js:58](reactive-property.js#L58)

-

#### <a name="ReactiveProperty.dec"></a>ReactiveProperty.dec([by])&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __dec__ is defined in `ReactiveProperty`*

__Arguments__

* __by__ *{number}*    (Optional = 1)
Value to decrease by

-

Usage:
```js
  var foo = new ReactiveProperty('bar');
  foo.set(0);
  foo.dec(5); // -5
```

> ```self.dec = function(by) { ...``` [reactive-property.js:75](reactive-property.js#L75)

-

#### <a name="ReactiveProperty.inc"></a>ReactiveProperty.inc([by])&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __inc__ is defined in `ReactiveProperty`*

__Arguments__

* __by__ *{number}*    (Optional = 1)
Value to increase by

-

Usage:
```js
  var foo = new ReactiveProperty('bar');
  foo.set(0);
  foo.inc(5); // 5
```

> ```self.inc = function(by) { ...``` [reactive-property.js:90](reactive-property.js#L90)

-

#### <a name="ReactiveProperty.getset"></a>ReactiveProperty.getset([value])&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __getset__ is defined in `ReactiveProperty`*

__Arguments__

* __value__ *{any}*    (Optional)
Value to set property - if undefined the act like `get`

-

__Returns__  *{any}*
Returns value if no arguments are passed to the function

Usage:
```js
  var foo = new ReactiveProperty('bar');
  foo.getset(5);
  foo.getset(); // returns 5
```

> ```self.getset = function(value) { ...``` [reactive-property.js:106](reactive-property.js#L106)

-

#### <a name="ReactiveProperty.toString"></a>ReactiveProperty.toString()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __toString__ is defined in `ReactiveProperty`*

Usage:
```js
  var foo = new ReactiveProperty('bar');
  foo.toString(); // returns 'bar'
```

> ```self.toString = function() { ...``` [reactive-property.js:122](reactive-property.js#L122)

-

#### <a name="ReactiveProperty.toText"></a>ReactiveProperty.toText()&nbsp;&nbsp;<sub><i>Anywhere</i></sub> ####
-
*This method __toText__ is defined in `ReactiveProperty`*

Usage:
```js
  var foo = new ReactiveProperty('bar');
  foo.toText(); // returns 'bar'
```

> ```self.toText = self.toString;``` [reactive-property.js:135](reactive-property.js#L135)

-
