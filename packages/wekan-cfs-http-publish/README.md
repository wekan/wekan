wekan-cfs-http-publish [![Build Status](https://travis-ci.org/CollectionFS/Meteor-http-publish.png?branch=master)](https://travis-ci.org/CollectionFS/Meteor-http-publish)
============

This package add the ability to add `HTTP` server publish to your project. It's a server-side package only.

DEPRECATING: Use https://atmospherejs.com/simple/rest instead

## Usage
HTTP.publish creates a http crud restpoint for a collection *- only one cursor is allowed pr. publish*

### Security
`CRUD+L` - Create Read Update Delete + List are common rest point operations.

All `CUD` methods are the exact same as the `ddp` methods handlers - This means that `Meteor.allow` and `Meteor.deny` are setting the access rules for both `ddp` and `http` collection methods.

All `R+L` methods are limited to the publish function.

### Fully mounted
If handed a collection and a publish function the HTTP.publish will mount on follow urls and methods:
* `GET` - `/api/list` *- all published data*
* `POST` - `/api/list` *- insert a document into collection*
* `GET` - `/api/list/:id` *- find one published document*
* `PUT` - `/api/list/:id` *- update a document*
* `DELETE` - `/api/list/:id` *- remove a document*

```js
  myCollection = new Meteor.Collection('list');

  // Add access points for `GET`, `POST`, `PUT`, `DELETE`
  HTTP.publish({collection: myCollection}, function(data) {
    // this.userId, this.query, this.params
    return myCollection.find({});
  });
```

### Publish view only
If handed a mount name and a publish function the HTTP.publish will mount:
* `GET` - `/mylist` *- all published data*

```js
  myCollection = new Meteor.Collection('list');

  // Add access points for `GET`
  HTTP.publish({name: 'mylist'}, function(data) {
    // this.userId, this.query, this.params
    return myCollection.find({});
  });
```

### Create Update Delete only
If handed a collection only the HTTP.publish will mount:
* `POST` - `/api/list` *- insert a document into collection*
* `PUT` - `/api/list/:id` *- update a document*
* `DELETE` - `/api/list/:id` *- remove a document*

```js
  myCollection = new Meteor.Collection('list');

  // Add access points for `POST`, `PUT`, `DELETE`
  HTTP.publish({collection: myCollection});
```

## Publish scope
The publish scope contains different kinds of inputs. We can also get user details if logged in.

* `this.userId` The user whos id and token was used to run this method, if set/found
* `this.query` - query params `?token=1` -> { token: 1 }
* `this.params` - Set params /foo/:name/test/:id -> { name: '', id: '' }

## Passing data via header
From the client:
```js
  HTTP.get('/api/list', {
    data: { foo: 'bar' }
  }, function(err, result) {
    console.log('Content in parsed json: ');
    console.log(result.data);
  });
```

HTTP Server method:
```js
  HTTP.publish({collection: myCollection}, function(data) {
    // data === { foo: 'bar' }
  });
```

## Authentication
For details on authentication of http calls please read the [Authentication part in HTTP.methods package](https://github.com/raix/Meteor-http-methods#authentication)

*The publish will have the `this.userId` set if an authenticated user is making the request.*

## Format handlers
The query parametre `format` is used to set different output formats. The buildin format is `json` *(EJSON since we are on Meteor)*

Example: *(`json` is buildin)*
```js
  // Format the output into json
  HTTP.publishFormats({
    'json': function(result) {
      // Set the method scope content type to json
      this.setContentType('application/json');
      // Return EJSON string
      return EJSON.stringify(result);
    }
  });
```

`GET` url: `/api/list?format=json`
```js
    HTTP.get('/api/list', {
      params: {
        format: 'json'
      }
    }, function(err, result) {
      console.log('Back from update');
      if (err) {
        console.log('Got error');
      }
      console.log('Got json back: ' + result.content);
    });
```

## Unpublish
For `api` integrity theres added an `HTTP.unpublish` method that takes a collection or name of mount point to remove.

## API Documentation

[Here](api.md)
