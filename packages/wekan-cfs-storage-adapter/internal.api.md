> File: ["storageAdapter.server.js"](storageAdapter.server.js)
> Where: {server}

-
#############################################################################

STORAGE ADAPTER

#############################################################################

#### <a name="self.insert"></a>*self*.insert(fsFile, [options], [callback])&nbsp;&nbsp;<sub><i>Server</i></sub> ####
```
Attempts to insert a file into the store, first running the beforeSave
function for the store if there is one. If there is a temporary failure,
returns (or passes to the second argument of the callback) `null`. If there
is a permanant failure or the beforeSave function returns `false`, returns
`false`. If the file is successfully stored, returns an object with file
info that the FS.Collection can save.
Also updates the `files` collection for this store to save info about this
file.
```
-
*This method __insert__ is defined in `self`*

__Arguments__

* __fsFile__ *{[FS.File](#FS.File)}*  
The FS.File instance to be stored.
* __options__ *{Object}*    (Optional)
Options (currently unused)
* __callback__ *{Function}*    (Optional)
If not provided, will block and return file info.

-




> ```self.insert = function(fsFile, options, callback) { ...``` [storageAdapter.server.js:169](storageAdapter.server.js#L169)

-

#### <a name="self.update"></a>*self*.update(fsFile, [options], [callback])&nbsp;&nbsp;<sub><i>Server</i></sub> ####
```
Attempts to update a file in the store, first running the beforeSave
function for the store if there is one. If there is a temporary failure,
returns (or passes to the second argument of the callback) `null`. If there
is a permanant failure or the beforeSave function returns `false`, returns
`false`. If the file is successfully stored, returns an object with file
info that the FS.Collection can save.
Also updates the `files` collection for this store to save info about this
file.
```
-
*This method __update__ is defined in `self`*

__Arguments__

* __fsFile__ *{[FS.File](#FS.File)}*  
The FS.File instance to be stored.
* __options__ *{Object}*    (Optional)
Options (currently unused)
* __callback__ *{Function}*    (Optional)
If not provided, will block and return file info.

-




> ```self.update = function(fsFile, options, callback) { ...``` [storageAdapter.server.js:264](storageAdapter.server.js#L264)

-

#### <a name="self.remove"></a>*self*.remove(fsFile, [options], [callback])&nbsp;&nbsp;<sub><i>Server</i></sub> ####
```
Attempts to remove a file from the store. Returns true if removed, or false.
Also removes file info from the `files` collection for this store.
```
-
*This method __remove__ is defined in `self`*

__Arguments__

* __fsFile__ *{[FS.File](#FS.File)}*  
The FS.File instance to be stored.
* __options__ *{Object}*    (Optional)
Options
    - __ignoreMissing__ *{Boolean}*    (Optional)
Set true to treat missing files as a successful deletion. Otherwise throws an error.
* __callback__ *{Function}*    (Optional)
If not provided, will block and return true or false

-




> ```self.remove = function(fsFile, options, callback) { ...``` [storageAdapter.server.js:321](storageAdapter.server.js#L321)

-
