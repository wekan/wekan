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

Put CAS settings in Meteor.settings (for example using METEOR_SETTINGS env or --settings) like so:

If casVersion is not defined, it will assume you use CAS 1.0. (note by xaionaro: option `casVersion` seems to be just ignored in the code, ATM).

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
* *  `debug` : by default `false` ; `true` will print to the server console the CAS attribute names to map, the CAS attributes values retrieved, if necessary the new user account created, and finally the user to use
* *  `id` : by default, the CAS user is used for the user account, but you can specified another CAS attribute
* *  `firstname` : by default `cas:givenName` ; but you can use your own CAS attribute
* *  `lastname` : by default `cas:sn` (respectively) ; but you can use your own CAS attribute
* *  `fullname` : by default unused, but if you specify your own CAS attribute, it will be used instead of the `firstname` + `lastname`
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
			"popup": true,
		}
	}
}
```

`proxyUrl` is not required. Setup [ROOT_URL](http://docs.meteor.com/api/core.html#Meteor-absoluteUrl) environment variable instead.

Then, to start authentication, you have to call the following method from the client (for example in a click handler) :

```
Meteor.loginWithCas([callback]);
```

It must open a popup containing you CAS login form or redirect to the CAS login form (depending on "popup" setting).

If popup is disabled (== false), then it's required to execute `Meteor.initCas([callback])` in `Meteor.startup` of the client side. ATM, `Meteor.initCas()` completes authentication.

## Examples

* [https://devel.mephi.ru/dyokunev/start-mephi-ru](https://devel.mephi.ru/dyokunev/start-mephi-ru)


