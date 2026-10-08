This is a merged repository of useful forks of: atoy40:accounts-cas
===================
([(https://atmospherejs.com/atoy40/accounts-cas](https://atmospherejs.com/atoy40/accounts-cas))

## Essential improvements by ppoulard to atoy40 and xaionaro versions

* Added support of CAS attributes

With this plugin, you can pick CAS attributes : https://github.com/joshchan/node-cas/wiki/CAS-Attributes

Moved to Wekan GitHub org from from https://github.com/ppoulard/meteor-accounts-cas

## Install

```
cd ~site
mkdir packages
cd packages
git clone https://github.com/wekan/meteor-accounts-cas
cd ~site
meteor add wekan:accounts-cas
```

## Usage

Put CAS settings in Meteor.settings (for example using METEOR_SETTINGS env or
--settings) like so:

If casVersion is not defined, it will assume you use CAS 1.0. (note by
xaionaro: option `casVersion` seems to be just ignored in the code, ATM).

Server side settings:

```
Meteor.settings = {
    "cas": {
        "baseUrl": "https://cas.example.com/cas",
        "autoClose": true,
        "validateUrl":"https://cas.example.com/cas/p3/serviceValidate",
        "casVersion": 3.0,
        "attributes": {
            "debug" : true
        }
    },
}
```

CAS `attributes` settings :

* `attributes`: by default `{}` : all default values below will apply
* *  `debug` : by default `false` ; `true` will print to the server console the
  CAS attribute names to map, the CAS attributes values retrieved, if necessary
  the new user account created, and finally the user to use
* *  `id` : by default, the CAS user is used for the user account, but you can
  specified another CAS attribute
* *  `firstname` : by default `cas:givenName` ; but you can use your own CAS
  attribute
* *  `lastname` : by default `cas:sn` (respectively) ; but you can use your own
  CAS attribute
* *  `fullname` : by default unused, but if you specify your own CAS attribute,
  it will be used instead of the `firstname` + `lastname`
* *  `mail` : by default `cas:mail`

Client side settings:

```
Meteor.settings = {
	"public": {
		"cas": {
			"loginUrl": "https://cas.example.com/login",
			"serviceParam": "service",
			"popupWidth": 810,
			"popupHeight": 610,
			"popup": false,
		}
	}
}
```

`proxyUrl` is not required. Setup [ROOT_URL](http://docs.meteor.com/api/core.html#Meteor-absoluteUrl) environment variable instead.

Then, to start authentication, you have to call the following method from the client (for example in a click handler) :

```
Meteor.loginWithCas({}, [callback]);
```

By default the browser leaves for the CAS login form and comes back to the
same page, which completes the login: this package calls
`Meteor.initCas()` at client startup, and reports the result as a
`wekan-cas-login` window event (`event.detail.error`), because the
callback did not survive the page change. Set both the server's and the
public `"popup": true` to open the CAS login form in a popup instead; a popup
is blocked in iframes and on some phones, and a CAS server's
Cross-Origin-Opener-Policy can cut it off from the page, so the login never
finishes.

## Examples

* [https://devel.mephi.ru/dyokunev/start-mephi-ru](https://devel.mephi.ru/dyokunev/start-mephi-ru)


