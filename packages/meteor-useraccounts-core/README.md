[![Meteor Icon](http://icon.meteor.com/package/useraccounts:core)](https://atmospherejs.com/useraccounts/core)
[![Build Status](https://travis-ci.org/meteor-useraccounts/core.svg?branch=master)](https://travis-ci.org/meteor-useraccounts/core)

# User Accounts

User Accounts is a suite of packages for the [Meteor.js](https://www.meteor.com/) platform. It provides highly customizable user accounts UI templates for many different front-end frameworks. At the moment it includes forms for sign in, sign up, forgot password, reset password, change password, enroll account, and link or remove of many 3rd party services.

## Some Details

The package `useraccounts:core` contains all the core logic and templates' helpers and events used by dependant packages providing styled versions of the accounts UI.
This means that developing a version of the UI with a different styling is just a matter of writing a few dozen of html lines, nothing more!

Thanks to [accounts-t9n](https://github.com/softwarerero/meteor-accounts-t9n) you can switch to your preferred language on the fly! Available languages are now: Arabic, Czech, French, German, Italian, Polish, Portuguese, Russian, Slovenian, Spanish, Swedish, Turkish and Vietnamese.

For basic routing and content protection, `useraccounts:core` integrates with either [flow-router](https://github.com/meteor-useraccounts/flow-routing) or [iron-router](https://atmospherejs.com/package/iron-router).

Any comments, suggestions, testing efforts, and PRs are very very welcome! Please use the [repository](https://github.com/meteor-useraccounts/ui) issues tracker for reporting bugs, problems, ideas, discussions, etc..

## The UserAccounts Guide
Detailed explanations of features and configuration options can be found in the <a href="https://github.com/meteor-useraccounts/core/blob/master/Guide.md" target="_blank">Guide</a>.

## Who's using this?

* [Abesea](https://abesea.com/)
* [backspace.academy](http://backspace.academy/)
* [bootstrappers.io](http://www.bootstrappers.io/)
* [crater.io](http://crater.io/)
* [Dechiper Chinese](http://app.decipherchinese.com/)
* [Henfood](http://labs.henesis.eu/henfood)
* [meteorgigs.io](https://www.meteorgigs.io/)
* [Orion](http://orionjs.org/)
* [Telescope](http://www.telesc.pe/)
* [We Work Meteor](http://www.weworkmeteor.com/)


Aren't you on the list?!
If you have a production app using accounts templates, let me know! I'd like to add your link to the above ones.

## Contributing
Contributors are very welcome. There are many things you can help with,
including finding and fixing bugs and creating examples for the brand new [wiki](https://github.com/meteor-useraccounts/wiki).
We're also working on `useraccounts@2.0` (see the [Milestone](https://github.com/meteor-useraccounts/core/milestones)) so you can also help
with an improved design or adding features.

Some guidelines below:

* **Questions**: Please create a new issue and label it as a `question`.

* **New Features**: If you'd like to work on a feature,
  start by creating a 'Feature Design: Title' issue. This will let people bat it
  around a bit before you send a full blown pull request. Also, you can create
  an issue to discuss a design even if you won't be working on it.

* **Bugs**: If you think you found a bug, please create a "reproduction." This is a small project that demonstrates the problem as concisely as possible. If you think the bug can be reproduced with only a few steps a description by words might be enough though. The project should be cloneable from Github. Any bug reports without a reproduction that don't have an obvious solution will be marked as "awaiting-reproduction" and closed after a bit of time.

###  Working Locally
This is useful if you're contributing code to useraccounts or just trying to modify something to suit your own specific needs.

##### Scenario A

1. Set up a local packages folder
2. Add the PACKAGE_DIRS environment variable to your .bashrc file
  - Example: `export PACKAGE_DIRS="/full/path/topackages/folder"`
  - Screencast: https://www.eventedmind.com/posts/meteor-versioning-and-packages
3. Clone the repository into your local packages directory
4. Add the package just like any other meteor core package like this: `meteor
   add useraccounts:unstyled`

```bash
> cd /full/path/topackages/folder
> git clone https://github.com/meteor-useraccounts/semantic-ui.git
> cd your/project/path
> meteor add useraccounts:semantic-ui
> meteor
```

##### Scenario B

Like Scenario A, but skipping point 2.
Add the official package as usual with `meteor add useraccounts:semantic-ui` but then run your project like this:

```bash
> PACKAGE_DIRS="/full/path/topackages/folder" meteor
```

##### Scenario C

```bash
> cd your/project/path
> mkdir packages && cd packages
> git clone https://github.com/meteor-useraccounts/semantic-ui.git
> cd ..
> meteor add useraccounts:semantic-ui
> meteor
```


## Thanks

Anyone is welcome to contribute. Fork, make your changes, and then submit a pull request.

Thanks to [all those who have contributed code changes](https://github.com/meteor-useraccounts/ui/graphs/contributors) and all who have helped by submitting bug reports and feature ideas.

[![Support via Gittip](https://rawgithub.com/twolfson/gittip-badge/0.2.0/dist/gittip.png)](https://www.gittip.com/splendido/)
