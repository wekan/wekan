# Changelog

## vCurrent
## [v0.1.2] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.1.2)
#### 17/12/14 by Morten Henriksen
## [v0.1.1] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.1.1)
#### 17/12/14 by Morten Henriksen
- mbr update, remove versions.json

- Bump to version 0.1.1

## [v0.1.0] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.1.0)
#### 17/12/14 by Morten Henriksen
- mbr update versions and fix warnings

- fix 0.9.1 package scope

- don't rely on package names; fix for 0.9.1

- 0.9.1 support

## [v0.0.29] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.29)
#### 28/08/14 by Morten Henriksen
- Meteor Package System Update

## [v0.0.28] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.28)
#### 27/08/14 by Eric Dobbertin
- change package name to lowercase

## [v0.0.27] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.27)
#### 17/06/14 by Eric Dobbertin
- add `FS.TempStore.removeAll` method

## [v0.0.26] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.26)
#### 30/04/14 by Eric Dobbertin
## [v0.0.25] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.25)
#### 30/04/14 by Eric Dobbertin
- use third-party combined-stream node pkg as attempt to resolve pesky streaming issues

## [v0.0.24] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.24)
#### 29/04/14 by Eric Dobbertin
- generate api docs

- fileKey methods now expect an FS.File always, so we give them one

- small FS.File API change

## [v0.0.23] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.23)
#### 12/04/14 by Eric Dobbertin
- test for packages since we're assigning default error functions for stores

## [v0.0.22] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.22)
#### 12/04/14 by Eric Dobbertin
- avoid errors if file already removed from temp store

## [v0.0.21] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.21)
#### 12/04/14 by Eric Dobbertin
## [v0.0.20] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.20)
#### 08/04/14 by Eric Dobbertin
- cleanup stored/uploaded events and further improve chunk tracking

## [v0.0.19] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.19)
#### 08/04/14 by Eric Dobbertin
- use internal tracking collection

- Have TempStore set the size

- Add the SA on stored result

- allow unset chunkSum

## [v0.0.18] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.18)
#### 06/04/14 by Eric Dobbertin
- delete chunkCount and chunkSize props from fileObj after upload is complete

## [v0.0.17] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.17)
#### 06/04/14 by Eric Dobbertin
- We now wait to mount storage until it's needed (first upload begins); this ensures that we are able to accurately check for the cfs-worker package, which loads after this one. It also makes the code a bit cleaner.

## [v0.0.16] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.16)
#### 04/04/14 by Morten Henriksen
- Temporary workaround: We currently we generate a mongoId if gridFS is used for TempStore

- Note: At the moment tempStore will only use gridfs if no filesystem is installed

## [v0.0.15] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.15)
#### 02/04/14 by Morten Henriksen
- Use the stored event and object instead (result object is not used at the moment - but we could store an id at some point)

## [v0.0.14] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.14)
#### 31/03/14 by Eric Dobbertin
- use latest releases

- use latest releases

## [v0.0.13] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.13)
#### 31/03/14 by Morten Henriksen
- Try to use latest when using weak deps

## [v0.0.12] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.12)
#### 30/03/14 by Morten Henriksen
## [v0.0.11] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.11)
#### 30/03/14 by Morten Henriksen
- Set noon callback - we just want the file gone

## [v0.0.10] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.10)
#### 29/03/14 by Morten Henriksen
- add filesystem and gridfs as weak deps

## [v0.0.9] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.9)
#### 29/03/14 by Morten Henriksen
- Add check to see if FS.TempStore.Storage is set

## [v0.0.8] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.8)
#### 29/03/14 by Morten Henriksen
- Converting TempStore to use SA api

## [v0.0.7] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.7)
#### 25/03/14 by Morten Henriksen
- use `new Date`

- Have TempStore emit relevant events

## [v0.0.6] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.6)
#### 23/03/14 by Morten Henriksen
- Rollback to specific git dependency

- use collectionFS travis version force update

## [v0.0.5] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.5)
#### 22/03/14 by Morten Henriksen
- try to fix travis test by using general package references

## [v0.0.4] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.4)
#### 21/03/14 by Morten Henriksen
- fix chunk files not actually being deleted

## [v0.0.3] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.3)
#### 18/03/14 by Morten Henriksen
- * TempStore is now an EventEmitter   * progress event   * uploaded   * (start) should perhaps be created   * remove * Added FS.TempStore.listParts - will return lookup object listing the parts already uploaded

- Allow chunk to be undefined an thereby have the createWriteStream follow normal streaming api

- Allow undefined in chunkPath

- added comments

- bug hunting

- Add streaming WIP

- rename temp store collection to 'cfs.tempstore'

- fix ensureForFile

- track tempstore chunks in our own collection rather than in the file object

- change to accept buffer; less converting

- prevent bytesUploaded from getting bigger than size

## [v0.0.2] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.2)
#### 15/02/14 by Morten Henriksen
- fix typo

## [v0.0.1] (https://github.com/zcfs/Meteor-cfs-tempstore/tree/v0.0.1)
#### 13/02/14 by Morten Henriksen
- init commit

