# Changelog

## [v0.1.50] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.1.46)
#### 21/1/19 by Harry Adel

- Bump to version 0.1.50

- *Merged pull-request:* "filename conversion for FS.HTTP.Handlers.Get" [#9](https://github.com/zcfs/Meteor-CollectionFS/pull/994) ([yatusiter](https://github.com/yatusiter))



## [v0.1.46] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.1.46)
#### 30/3/15 by Eric Dobbertin

- Bump to version 0.1.46

- *Merged pull-request:* [#611](https://github.com/zcfs/Meteor-CollectionFS/issues/611)

- Exposed request handlers on `FS.HTTP.Handlers` object so that app can override

## [v0.1.43] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.1.43)
#### 20/12/14 by Morten Henriksen
- add changelog

- Bump to version 0.1.43

- *Fixed bug:* "Doesn't work in IE 8" [#10](https://github.com/zcfs/Meteor-cfs-access-point/issues/10)

- *Merged pull-request:* "rootUrlPathPrefix fix for cordova" [#9](https://github.com/zcfs/Meteor-cfs-access-point/issues/9) ([dmitriyles](https://github.com/dmitriyles))

- *Merged pull-request:* "Support for expiration token" [#1](https://github.com/zcfs/Meteor-cfs-access-point/issues/1) ([tanis2000](https://github.com/tanis2000))

Patches by GitHub users [@dmitriyles](https://github.com/dmitriyles), [@tanis2000](https://github.com/tanis2000).

## [v0.1.42] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.1.42)
#### 17/12/14 by Morten Henriksen
## [v0.1.41] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.1.41)
#### 17/12/14 by Morten Henriksen
- mbr update, remove versions.json

- Cordova rootUrlPathPrefix fix

- Bump to version 0.1.41

## [v0.1.40] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.1.40)
#### 17/12/14 by Morten Henriksen
- mbr fixed warnings

- fixes to GET handler

- add back tests

- support apps in server subdirectories; closes #8

- 0.9.1 support

## [v0.0.39] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.39)
#### 28/08/14 by Morten Henriksen
- Meteor Package System Update

## [v0.0.38] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.38)
#### 27/08/14 by Eric Dobbertin
## [v0.0.37] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.37)
#### 26/08/14 by Eric Dobbertin
- change package name to lowercase

## [v0.0.36] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.36)
#### 06/08/14 by Eric Dobbertin
- pass correct arg

## [v0.0.35] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.35)
#### 06/08/14 by Eric Dobbertin
- move to correct place

## [v0.0.34] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.34)
#### 05/08/14 by Eric Dobbertin
- *Merged pull-request:* "Added contentLength for ranges and inline content" [#5](https://github.com/zcfs/Meteor-cfs-access-point/issues/5) ([maomorales](https://github.com/maomorales))

- Content-Length and Last-Modified headers

Patches by GitHub user [@maomorales](https://github.com/maomorales).

## [v0.0.33] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.33)
#### 31/07/14 by Eric Dobbertin
- *Merged pull-request:* "Force browser to download with filename passed in url" [#3](https://github.com/zcfs/Meteor-cfs-access-point/issues/3) ([elbowz](https://github.com/elbowz))

- Force browser to download with filename passed in url

Patches by GitHub user [@elbowz](https://github.com/elbowz).

## [v0.0.32] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.32)
#### 28/07/14 by Eric Dobbertin
- support collection-specific GET headers

- update API docs

## [v0.0.31] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.31)
#### 06/07/14 by Eric Dobbertin
- allow override filename

## [v0.0.30] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.30)
#### 30/04/14 by Eric Dobbertin
- ignore auth on server so that url method can be called on the server

## [v0.0.29] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.29)
#### 30/04/14 by Eric Dobbertin
- rework the new authtoken stuff to make it easier to debug and cleaner

## [v0.0.28] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.28)
#### 29/04/14 by Eric Dobbertin
- generate api docs

- adjustments to use new FS.File API functions, plus have `url` function omit query string whenever possible

- *Merged pull-request:* "Support for expiration token" [#1](https://github.com/zcfs/Meteor-cfs-access-point/issues/1) ([tanis2000](https://github.com/tanis2000))

- Switched to HTTP.call() to get the server time

- Better check for options.auth being a number. Check to see if we have Buffer() available on the server side. New check to make sure we have the token. Switched Metheor.method to HTTP.methods for the getServerTime() function.

- Expiration is now optional. If auth is set to a number, that is the number of seconds the token is valid for.

- Added time sync with the server for token generation.

- Added code to pass a token with a set expiration date from the client. Added token check on the server side.

Patches by GitHub user [@tanis2000](https://github.com/tanis2000).

## [v0.0.27] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.27)
#### 08/04/14 by Eric Dobbertin
- clean up/fix whole-file upload handler

## [v0.0.26] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.26)
#### 07/04/14 by Eric Dobbertin
- add URL options to get temporary images while uploading and storing

## [v0.0.25] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.25)
#### 03/04/14 by Eric Dobbertin
- * allow `setBaseUrl` to be called either outside of Meteor.startup or inside * move encodeParams helper to FS.Utility

## [v0.0.24] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.24)
#### 03/04/14 by Eric Dobbertin
- properly remount URLs

- when uploading chunks, check the insert allow/deny since it's part of inserting

## [v0.0.23] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.23)
#### 31/03/14 by Eric Dobbertin
- use latest releases

## [v0.0.22] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.22)
#### 29/03/14 by Morten Henriksen
- remove underscore deps

## [v0.0.21] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.21)
#### 25/03/14 by Morten Henriksen
- add comments about shareId

## [v0.0.20] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.20)
#### 23/03/14 by Morten Henriksen
- Rollback to specific git dependency

- Try modified test script

- deps are already in collectionFS

## [v0.0.19] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.19)
#### 22/03/14 by Morten Henriksen
- try to fix travis test by using general package references

## [v0.0.18] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.18)
#### 22/03/14 by Morten Henriksen
- If the read stream fails we send an error to the client

## [v0.0.17] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.17)
#### 21/03/14 by Morten Henriksen
- remove smart lock

- commit smart.lock, trying to get tests to pass on travis

- some minor pkg adjustments; trying to get tests to pass on travis

## [v0.0.16] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.16)
#### 18/03/14 by Morten Henriksen
- Rollback to using the direct storage adapter - makes more sense when serving files

- shift to new http.methods streaming api

- move server side DDP access points to cfs-download-ddp pkg; update API docs

- fix typo...

- return something useful

- convert to streaming

- Add streaming WIP

- fix/adjust some tests; minor improvements to some handlers

- Add unmount and allow mount to use default selector function

- Refactor access point - wip

## [v0.0.15] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.15)
#### 05/03/14 by Morten Henriksen
- Refactor note, encode stuff should be prefixed into FS.Utility

- FS.File.url add user deps when auth is used

- fix url method

- query string fix

- move PUT access points for HTTP upload into this package; mount DELETE on /record/ as well as /files/; some fixes and improvements to handlers

## [v0.0.14] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.14)
#### 03/03/14 by Eric Dobbertin
- better error; return Buffer instead of converting to Uint8Array

## [v0.0.13] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.13)
#### 02/03/14 by Eric Dobbertin
- more tests, make everything work, add unpublish method

- Merge branch 'master' of https://github.com/zcfs/Meteor-cfs-access-point

## [v0.0.12] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.12)
#### 01/03/14 by Eric Dobbertin
- add travis-ci image

- rework URLs a bit, use http-publish package to publish FS.Collection listing, and add a test for this (!)

- add http-publish dependency

- del should be delete

## [v0.0.11] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.11)
#### 28/02/14 by Eric Dobbertin
- move some code to other packages; redo the HTTP GET/DEL methods

## [v0.0.10] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.10)
#### 28/02/14 by Eric Dobbertin
- move DDP upload methods to new cfs-upload-ddp package

## [v0.0.9] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.9)
#### 21/02/14 by Eric Dobbertin
- new URL syntax; use the store's file key instead of ID; also fix allow/deny checks with insecure

## [v0.0.8] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.8)
#### 20/02/14 by Eric Dobbertin
- support HTTP PUT of new file and fix PUT of existing file

## [v0.0.7] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.7)
#### 17/02/14 by Morten Henriksen
- add http-methods dependency

## [v0.0.6] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.6)
#### 16/02/14 by Morten Henriksen
## [v0.0.5] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.5)
#### 16/02/14 by Morten Henriksen
- a few fixes and improvements

- need to actually mount it

- attempt at switching to generic HTTP access point; also add support for chunked http downloads (range header)

## [v0.0.4] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.4)
#### 15/02/14 by Morten Henriksen
- Merge branch 'master' of https://github.com/zcfs/Meteor-cfs-access-point

- corrected typo

- added debugging

- call HTTP.methods on server only

- run client side, too, for side effects

- rework for additional abstraction; also DDP methods don't need to be per-collection so they no longer are

## [v0.0.3] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.3)
#### 13/02/14 by Morten Henriksen
## [v0.0.2] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.2)
#### 13/02/14 by Morten Henriksen
## [v0.0.1] (https://github.com/zcfs/Meteor-cfs-access-point/tree/v0.0.1)
#### 13/02/14 by Morten Henriksen
- init commit

