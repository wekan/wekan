# salleman:accounts-oidc package

A Meteor login service for OpenID Connect (OIDC).

## Installation

    meteor add salleman:accounts-oidc

## Usage

`Meteor.loginWithOidc(options, callback)`
* `options` - object containing options, see below (optional)
* `callback` - callback function (optional)

#### Example

```js
Template.myTemplateName.events({
  'click #login-button': function() {
    Meteor.loginWithOidc();
  }
);
```


## Options

These options override service configuration stored in the database.

* `loginStyle`: `redirect` or `popup`
* `redirectUrl`: Where to redirect after successful login. Only used if `loginStyle` is set to `redirect`

## Manual Configuration Setup

You can manually configure this package by upserting the service configuration on startup. First, add the `service-configuration` package:

    meteor add service-configuration

### Service Configuration

The following service configuration are available:

* `clientId`: OIDC client identifier
* `secret`: OIDC client shared secret
* `serverUrl`: URL of the OIDC server. e.g. `https://openid.example.org:8443`
* `authorizationEndpoint`: Endpoint of the OIDC authorization service, e.g. `/oidc/authorize`
* `tokenEndpoint`: Endpoint of the OIDC token service, e.g. `/oidc/token`
* `userinfoEndpoint`: Endpoint of the OIDC userinfo service, e.g. `/oidc/userinfo`
* `idTokenWhitelistFields`: A list of fields from IDToken to be added to Meteor.user().services.oidc object

### Project Configuration

Then in your project:

```js
if (Meteor.isServer) {
  Meteor.startup(function () {
    ServiceConfiguration.configurations.upsert(
      { service: 'oidc' },
      {
        $set: {
          loginStyle: 'redirect',
          clientId: 'my-client-id-registered-with-the-oidc-server',
          secret: 'my-client-shared-secret',
          serverUrl: 'https://openid.example.org',
          authorizationEndpoint: '/oidc/authorize',
          tokenEndpoint: '/oidc/token',
          userinfoEndpoint: '/oidc/userinfo',
          idTokenWhitelistFields: []
        }
      }
    );
  });
}
```
