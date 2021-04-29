wekan-cfs-http-methods [![Build Status](https://travis-ci.org/CollectionFS/Meteor-http-methods.png?branch=master)](https://travis-ci.org/CollectionFS/Meteor-http-methods)
============

~~Looking for maintainers - please reach out!~~
This package is to be archived due to inability to find contributors, thanks to everyone who helped make it possible.

**If you're looking for an alternative, we highly recommend [Meteor-Files](https://github.com/VeliovGroup/Meteor-Files) by [VeliovGroup](https://github.com/VeliovGroup)**

---

Add server-side methods to the `HTTP` object your app. It's a server-side package only *- no client simulations added.*

## Usage

The `HTTP` object gets a `methods` method:

```js
  HTTP.methods({
    'list': function() {
      return '<b>Default content type is text/html</b>';
    }
  });
```

## Methods scope
The methods scope contains different kinds of inputs. We can also get user details if logged in.


* `this.userId` - the user whose id and token was used to run this method, if set/found
* `this.method` - `GET`, `POST`, `PUT`, `DELETE`
* `this.query` - query params `?token=1&id=2` -> `{ token: 1, id: 2 }`
* `this.params` - set params `/foo/:name/test/:id` -> `{ name: '', id: '' }`
* `this.userAgent` - get the user agent string set in the request header
* `this.requestHeaders` - request headers object
* `this.setUserId(id)` - option for setting the `this.userId`
* `this.isSimulation` - always false on the server
* `this.unblock` - not implemented
* `this.setContentType('text/html')` - set the content type in header, defaults to `text/html`
* `this.addHeader('Content-Disposition', 'attachment; filename="name.ext"')`
* `this.setStatusCode(200)` - set the status code in the response header
* `createReadStream` - if a request, then get the read stream
* `createWriteStream` - if you want to stream data to the client
* `Error` - when streaming we have to be able to send error and close connection
* `this.request` The original request object

## Passing data via header

From the client:
```js
  HTTP.post('list', {
    data: { foo: 'bar' }
  }, function(err, result) {
    console.log('Content: ' + result.content + ' === "Hello"');
  });
```

HTTP Server method:
```js
  HTTP.methods({
    'list': function(data) {
      if (data.foo === 'bar') {
        /* data we pass via the header is parsed by EJSON.parse
        If not able, then it returns the raw data instead */
      }
      return 'Hello';
    }
  });
```

## Parameters
The method name or URL can be used to pass parameters to the method. The parameters are available on the server under `this.params`:

Client
```js
  HTTP.post('/items/12/emails/5', function(err, result) {
    console.log('Got back: ' + result.content);
  });
```

Server
```js
  HTTP.methods({
    '/items/:itemId/emails/:emailId': function() {
      // this.params.itemId === '12'
      // this.params.emailId === '5'
    }
  });
```

## Extended usage
The `HTTP.methods` normally takes a function, but it can be set to an object for fine-grained handling.

Example:
```js
  HTTP.methods({
    '/hello': {
      get: function(data) {},
      // post: function(data) {},
      // put: function(data) {},
      // delete: function(data) {},
      // options: function() {
      //   // Example of a simple options function
      //   this.setStatusCode(200);
      //   this.addHeader('Accept', 'POST,PUT');
      //    // The options for this restpoint
      //    var options = {
      //      POST: {
      //        description: 'Create an issue',
      //        parameters: {
      //          title: {
      //            type: 'string',
      //            description: 'Issue title'
      //          }
      //        }
      //       }
      //    };
      //    // Print the options in pretty json
      //    return JSON.stringify(options, null, '\t');
      //  },
      //  stream: true // flag whether to allow stream handling in the request
    }
  });
```
*In this example the mounted http rest point will only support the `get` method*

Example:
```js
  HTTP.methods({
    '/hello': {
      method: function(data) {},
    }
  });
```
*In this example all methods `get`, `put`, `post`, `delete` will use the same function - This would be equal to setting the function directly on the http mount point*

## Authentication

The client needs the `access_token` to login in HTTP methods. *One could create a HTTP login/logout method for allowing pure external access*

Client
```js
  HTTP.post('/hello', {
    params: {
      token: Accounts && Accounts._storedLoginToken()
    }
  }, function(err, result) {
    console.log('Got back: ' + result.content);
  });
```

Server
```js
  'hello': function(data) {
    if (this.userId) {
      var user = Meteor.users.findOne({ _id: this.userId });
      return 'Hello ' + (user && user.username || user && user.emails[0].address || 'user');
    } else {
      this.setStatusCode(401); // Unauthorized
    }
  }
```

## Using custom authentication

It's possible to make your own function to set the userId - not using the built-in token pattern.
```js
  // My auth will return the userId
  var myAuth = function() {
    // Read the token from '/hello?token=5'
    var userToken = self.query.token;
    // Check the userToken before adding it to the db query
    // Set the this.userId
    if (userToken) {
      var user = Meteor.users.findOne({ 'services.resume.loginTokens.token': userToken });

      // Set the userId in the scope
      return user && user._id;
    }  
  };

  HTTP.methods({
    '/hello': {
      auth: myAuth,
      method: function(data) {
        // this.userId is set by myAuth
        if (this.userId) { /**/ } else { /**/ }
      }
    }
  });
```
*The above resembles the builtin auth handler*

## Security
When buffering data instead of streaming we set the buffer limit to 5mb - This can be changed on the fly:
```js
  // Set the max data length
  // 5mb = 5 * 1024 * 1024 = 5242880;
  HTTP.methodsMaxDataLength = 5242880;
```

## Login and logout (TODO)

These operations are not currently supported for off Meteor use - there are some security considerations.

`basic-auth` is broadly supported, but:
* password should not be sent in clear text - hash with base64?
* should be used on https connections
* Its difficult / impossible to logout a user?

`token` the current `access_token` seems to be a better solution. Better control and options to logout users. But calling the initial `login` method still requires:
* hashing of password
* use https

## HTTP Client-side usage
If you want to use the HTTP client-side functionality and find yourself having a hard time viewing all available options; these can be found on https://docs.meteor.com/#/full/http.
