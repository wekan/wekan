wekan-cfs-tempstore
=========================

This is a Meteor package used by
[CollectionFS](https://github.com/zcfs/Meteor-CollectionFS). It provides
an API for quickly storing chunks of file data in temporary files. If also supports deleting those chunks, and combining them into one
binary object and attaching it to an FS.File instance.

You don't need to manually add this package to your app, but you could replace
this package with your own if you want to handle temporary storage in another
way.

> `FS.TempStore` uses the `wekan-cfs-storage-adapter` compatible Storage Adapters, both `FS.Store.FileSystem` and `FS.Store.GridFS` will be defaulted. *for more information read the [internal.api.md](internal.api.md)*

##Documentation
[API Documentation](api.md)

##Contribute
Here's the [complete API documentation](internal.api.md), including private methods.

Update docs, `npm install docmeteor`
```bash
$ docmeteor
```