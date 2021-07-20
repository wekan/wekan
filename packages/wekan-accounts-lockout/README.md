# Meteor - Accounts - Lockout

[![Build Status](https://travis-ci.org/LucasAntoniassi/meteor-accounts-lockout.svg?branch=master)](https://travis-ci.org/LucasAntoniassi/meteor-accounts-lockout)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/8ce60fa7e2c24891b9bdfc3b65433d23)](https://www.codacy.com/app/lucasantoniassi/meteor-accounts-lockout?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=LucasAntoniassi/meteor-accounts-lockout&amp;utm_campaign=Badge_Grade)
[![Code Climate](https://codeclimate.com/github/LucasAntoniassi/meteor-accounts-lockout/badges/gpa.svg)](https://codeclimate.com/github/LucasAntoniassi/meteor-accounts-lockout)

## What it is

Seamless Meteor apps accounts protection from password brute-force attacks.
Users won't notice it. Hackers shall not pass.

![you-shall-not-pass](https://cloud.githubusercontent.com/assets/3399956/9023729/007dd2a2-38b1-11e5-807a-b81c6ce00c80.jpg)

## Installation

```
meteor add lucasantoniassi:accounts-lockout
```

## Usage via ES6 import

```javascript
// server
import { AccountsLockout } from 'meteor/lucasantoniassi:accounts-lockout';
```

## How to use

Default settings:

```javascript
  "knownUsers": {
    "failuresBeforeLockout": 3, // positive integer greater than 0
    "lockoutPeriod": 60, // in seconds
    "failureWindow": 10 // in seconds
  },
  "unknownUsers": {
    "failuresBeforeLockout": 3, // positive integer greater than 0
    "lockoutPeriod": 60, // in seconds
    "failureWindow": 10 // in seconds
  }
```

`knownUsers` are users where already belongs to your `Meteor.users` collections,
these rules are applied if they attempt to login with an incorrect password but a know email.

`unknownUsers` are users where **not** belongs to your `Meteor.users` collections,
these rules are applied if they attempt to login with a unknown email.

`failuresBeforeLockout` should be a positive integer greater than 0.

`lockoutPeriod` should be in seconds.

`failureWindow` should be in seconds.

If the `default` is nice to you, you can do that.

```javascript
(new AccountsLockout()).startup();
```

You can overwrite passing an `object` as argument.

```javascript
(new AccountsLockout({
  knownUsers: {
    failuresBeforeLockout: 3,
    lockoutPeriod: 60,
    failureWindow: 15,
  },
  unknownUsers: {
    failuresBeforeLockout: 3,
    lockoutPeriod: 60,
    failureWindow: 15,
  },
})).startup();
```

If you prefer, you can pass a `function` as argument.

```javascript
const knownUsersRules = (user) => {
  // apply some logic with this user
  return {
    failuresBeforeLockout,
    lockoutPeriod,
    failureWindow,
  };
};

const unknownUsersRules = (connection) => {
  // apply some logic with this connection
  return {
    failuresBeforeLockout,
    lockoutPeriod,
    failureWindow,
  };
};

(new AccountsLockout({
  knownUsers: knownUsersRules,
  unknownUsers: unknownUsersRules,
})).startup();
```

If you prefer, you can use `Meteor.settings`. It will overwrite any previous case.

```javascript
"accounts-lockout": {
  "knownUsers": {
    "failuresBeforeLockout": 3,
    "lockoutPeriod": 60,
    "failureWindow": 10
  },
  "unknownUsers": {
    "failuresBeforeLockout": 3,
    "lockoutPeriod": 60,
    "failureWindow": 10
  }
}
```

## License

This package is open-sourced software licensed under the [MIT license](http://opensource.org/licenses/MIT).

