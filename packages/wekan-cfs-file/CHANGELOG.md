# Changelog

## vCurrent
## [v0.1.14] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.1.14)
#### 17/12/14 by Morten Henriksen
- mbr update, remove versions.json

- Merge branch 'master' of https://github.com/zcfs/Meteor-cfs-file

- update pkg, dependencies, delinting, etc.

## [v0.1.13] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.1.13)
#### 05/09/14 by Eric Dobbertin
- 0.9.1 support

## [v0.1.12] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.1.12)
#### 28/08/14 by Morten Henriksen
- Meteor Package System Update

## [v0.1.11] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.1.11)
#### 27/08/14 by Eric Dobbertin
- change package name to lowercase

## [v0.1.10] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.1.10)
#### 31/07/14 by Eric Dobbertin
- allow FS.File to emit events

## [v0.1.9] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.1.9)
#### 30/07/14 by Eric Dobbertin
- add fileObj.copy()

## [v0.1.8] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.1.8)
#### 14/07/14 by Eric Dobbertin
- make setters save to DB automatically with ability to disable

## [v0.1.7] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.1.7)
#### 30/06/14 by Eric Dobbertin
- *Fixed bug:* "fsFile-common.js:66:8: Unexpected identifier" [#3](https://github.com/zcfs/Meteor-cfs-file/issues/3)

## [v0.1.6] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.1.6)
#### 30/06/14 by Eric Dobbertin
- a few more changes for supporting URL options

- support request options like `auth` and `headers` when attaching a URL

## [v0.1.5] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.1.5)
#### 20/05/14 by Eric Dobbertin
- add almost all necessary tests!

- fix updatedAt setting

- correct logic

- store size as number

- API doc fixes

## [v0.1.4] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.1.4)
#### 11/05/14 by Eric Dobbertin
- document API for createReadStream and createWriteStream

## [v0.1.3] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.1.3)
#### 06/05/14 by Eric Dobbertin
- missed this during api change

## [v0.1.2] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.1.2)
#### 30/04/14 by Eric Dobbertin
- updating from DB before getting should be opt-in instead of opt-out; it's more efficient this way, and it prevents issues with local props unintentionally being overwritten

## [v0.1.1] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.1.1)
#### 29/04/14 by Eric Dobbertin
- add `extension` getter/setter method and make the other new methods work as UI helpers

## [v0.1.0] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.1.0)
#### 29/04/14 by Eric Dobbertin
- generate api docs

- add updatedAt method

- provide option to skip updating from the file record before getting info

- more changes for new name, size, and type API

- add getter/setter methods for name, size, and type; move original file info under `original` property object backwards compatibility break!

- change name of `hasCopy` function to `hasStored`

## [v0.0.34] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.34)
#### 18/04/14 by Eric Dobbertin
- add formattedSize method and weak dependency on numeral pkg

## [v0.0.33] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.33)
#### 15/04/14 by Eric Dobbertin
- call attachData only if we have some data

## [v0.0.32] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.32)
#### 08/04/14 by Eric Dobbertin
- throw a more helpful error if null/undefined data is passed to attachData

- remove `get` method; the code in it is old and would fail so I'm assuming nothing calls it anymore

## [v0.0.31] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.31)
#### 07/04/14 by Eric Dobbertin
- allow passing any data (except URL on client) to FS.File constructor to attach it

## [v0.0.30] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.30)
#### 07/04/14 by Eric Dobbertin
- make it safe to call attachData without a callback on the client, unless we are attaching a URL; in that case, an error is thrown if no callback

## [v0.0.29] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.29)
#### 06/04/14 by Eric Dobbertin
- use full clone to fix issue with saving FS.File into a collection using EJSON

## [v0.0.28] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.28)
#### 06/04/14 by Eric Dobbertin
- use uploadedAt so that we can remove chunk info when it's no longer needed

## [v0.0.27] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.27)
#### 06/04/14 by Eric Dobbertin
- improve setName a bit and move some logic to FS.Utility

## [v0.0.26] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.26)
#### 05/04/14 by Eric Dobbertin
- set name when inserting filepath without callback

## [v0.0.25] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.25)
#### 03/04/14 by Eric Dobbertin
- Make sure passing in a storeName works

## [v0.0.24] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.24)
#### 03/04/14 by Eric Dobbertin
- move all data handling to data-man package; fix issue getting size properly

## [v0.0.23] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.23)
#### 02/04/14 by Morten Henriksen
- We should allow size to be updated if org size is 0

## [v0.0.22] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.22)
#### 31/03/14 by Eric Dobbertin
- use latest releases

## [v0.0.21] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.21)
#### 29/03/14 by Morten Henriksen
- remove underscore deps

## [v0.0.20] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.20)
#### 25/03/14 by Morten Henriksen
- refactor utime into updatedAt

## [v0.0.19] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.19)
#### 23/03/14 by Morten Henriksen
- Rollback to specific git dependency

- use collectionFS travis version force update

## [v0.0.18] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.18)
#### 22/03/14 by Morten Henriksen
- try to fix travis test by using general package references

## [v0.0.17] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.17)
#### 21/03/14 by Morten Henriksen
- remove smart.lock

- adjustments, trying to make everything work in phantomjs

- add server tests for FS.Data and fix found issues; add Blob.js polyfill so that we have phantomjs support (and travis tests can pass)

- ignore potential query string when seeing if URL ends in filename

## [v0.0.16] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.16)
#### 20/03/14 by Eric Dobbertin
- set size when attaching filepath

- add travis-ci image

- package changes to fix auto test issues

- should not have been committed

- we should ignore packages folder entirely

- Return self from attachData, and adjust code in other areas to keep the flow of all methods similar

## [v0.0.15] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.15)
#### 18/03/14 by Eric Dobbertin
- See if we can extract a file name from URL or filepath

- use utility function to get file extension

## [v0.0.14] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.14)
#### 18/03/14 by Eric Dobbertin
- remove code that deleted files from temp store; the worker does this in a remove observe

## [v0.0.13] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.13)
#### 18/03/14 by Morten Henriksen
- Add note about dataUrl references

- fixed issue #204

- client-side tests for FS.Data (!) and fix failed tests

- allow attachData to run synchronous on server even when attaching URL

- fix some data attachment issues and move file allowed check to FS.Collection

- silently handle non-object args

- refactor FS.File.createWriteStream to support TempStore and FileWorker

- tidy the FS.File.createReadStream

- update API docs

- use correct api

- Merge branch 'master' of https://github.com/zcfs/Meteor-cfs-file

- Complete rewrite; better split between client/server, move data handling to FS.Data class, and support streams

- use chunks in the filerecord

- make sure we have a downloadqueue

## [v0.0.12] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.12)
#### 07/03/14 by Eric Dobbertin
- should not require a filename; check extension only if we have one

- allow `FS.File.fromUrl` to run synchronously without a callback on the server

## [v0.0.11] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.11)
#### 03/03/14 by Eric Dobbertin
- add `format` option for FS.File.prototype.get

- Merge branch 'master' of https://github.com/zcfs/Meteor-cfs-file

## [v0.0.10] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.10)
#### 01/03/14 by Eric Dobbertin
- add pkg necessary for tests

## [v0.0.9] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.9)
#### 28/02/14 by Eric Dobbertin
- changes for http uploads

## [v0.0.8] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.8)
#### 28/02/14 by Eric Dobbertin
- fix issues with callbacks

## [v0.0.7] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.7)
#### 21/02/14 by Eric Dobbertin
- new URL syntax; use the store's file key instead of ID

## [v0.0.6] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.6)
#### 17/02/14 by Morten Henriksen
- add getCopyInfo method

## [v0.0.5] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.5)
#### 16/02/14 by Morten Henriksen
- added public

## [v0.0.4] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.4)
#### 16/02/14 by Morten Henriksen
- fix url

- use generic http url

## [v0.0.3] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.3)
#### 15/02/14 by Morten Henriksen
- reference cfs-filesaver pkg instead

- rework http/ddp method init; also DDP methods don't need to be per-collection so they no longer are

- minor adjustments; add missing FileSaver.js

## [v0.0.2] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.2)
#### 13/02/14 by Morten Henriksen
- Fixed getter of storage adapters

## [v0.0.1] (https://github.com/zcfs/Meteor-cfs-file/tree/v0.0.1)
#### 13/02/14 by Morten Henriksen
- Corrections to new scope

- init commit

