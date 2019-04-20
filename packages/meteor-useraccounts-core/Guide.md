User Accounts
=============

User Accounts is a suite of packages for the [Meteor.js](https://www.meteor.com/) platform. It provides highly customizable user accounts UI templates for many different front-end frameworks. At the moment it includes forms for sign in, sign up, forgot password, reset password, change password, enroll account, and link or remove of many 3rd party services.

<a name="documentation"/>
# Documentation

* [Features](#features)
* [Quick Start](#quickstart)
  * [Available Versions](#available-versions)
  * [Boilerplates](#boilerplates)
  * [Setup](#setup)
  * [Routing](#routing)
  * [Templates](#templates)
* [Basic Customization](#basic-customization)
  * [I18n Support](#i18n)
  * [Configuration API](#configuration-api)
    * [Options](#options)
    * [logout](#logout)
  * [Internal States](#internal-states)
  * [Content Protection](#content-protection)
  * [reCaptcha Setup](#reCaptcha-setup)
  * [Detect reactively when a form is being processed](#detect-reactively-when-a-form-is-being-processed)
* [Advanced Customization](#advanced-customization)
  * [Configuring Texts](#configuring-texts)
    * [Form Title](#form-title)
    * [Button Text](#button-text)
    * [Social Button Icons](#social-button-icons)
    * [Info Text](#info-text)
    * [Errors Text](#errors-text)
  * [Disabling Client-side Accounts Creation](#disabling-client-side-accounts-creation)
  * [Form Fields Configuration](#form-fields-configuration)
  * [Extending Templates](#extending-templates)
    * [Grouping Fields](#grouping-fields)
  * [CSS Rules](#css-rules)
* [Wrapping Up for Famo.us](#wrapping-up-for-famo.us)
* [Side Notes](#side-notes)
  * [3rd Party Login Services Configuration](#3rd-party-login-services-configuration)


<a name="features"/>
## Features

* fully customizable
* security aware
* internationalization support thanks to [accounts-t9n](https://github.com/softwarerero/meteor-accounts-t9n)
* custom sign-up fields
* robust server side sign-up field validation
* easy content protection
* return to previous route after sign-in (even for random sign in choice and not only after required sign-in)
* fully reactive, Blaze fast!
* no use of `Session` object
* very easily stylizable for different font-end frameworks
* ...[wrap it up for famo.us](#wrapping-up-for-famo.us) with a simple meteor line!



<a name="quickstart"/>
## Quick Start


<a name="available-versions"/>
### Available Versions

* [useraccounts:bootstrap](https://atmospherejs.com/useraccounts/bootstrap) styled for [Twitter Bootstrap](http://getbootstrap.com/)
* [useraccounts:foundation](https://atmospherejs.com/useraccounts/foundation) styled for [Zurb Foundation](http://foundation.zurb.com/)
* [useraccounts:ionic](https://atmospherejs.com/useraccounts/ionic) styled for [Ionic](http://ionicframework.com/)
* [useraccounts:materialize](https://atmospherejs.com/useraccounts/materialize) styled for [Materialize](http://materializecss.com/)
* [useraccounts:polymer](https://atmospherejs.com/useraccounts/polymer) styled for [Polymer](https://www.polymer-project.org/) (WIP)
* [useraccounts:ratchet](https://atmospherejs.com/useraccounts/ratchet) styled for [Ratchet](http://goratchet.com/)
* [useraccounts:semantic-ui](https://atmospherejs.com/useraccounts/semantic-ui) styled for [Semantic UI](http://semantic-ui.com)
* [useraccounts:unstyled](https://atmospherejs.com/useraccounts/unstyled) with plain html and no CSS rules
* plus others coming soon...


<a name="boilerplates"/>
### Boilerplates

For a very very quick start you can find some boilerplate examples inside [this repository](https://github.com/meteor-useraccounts/boilerplates).

We'll try to make them richer and richer, while still keeping them as general as possible.

<a name="setup"/>
### Setup

Just choose one of the packages among the [available styled versions](#available-versions) and install it:

```Shell
meteor add useraccounts:bootstrap
meteor add <your preferred bootstrap package>
```

**Note 1:** no additional packages nor CSS/LESS/SASS files providing styles are included by useraccounts packages. This is to let you choose your preferred way to include them!

**Note 2:** You don't have to add `useraccounts:core` to your app! It is automatically added when you add `useraccounts:<something>`...

Then add at least one login service:

```Shell
meteor add accounts-password
meteor add accounts-facebook
meteor add accounts-google
...
```

**Note**: 3rd party services need to be configured... more about this [here](http://docs.meteor.com/#meteor_loginwithexternalservice)

And that's it!

...but don't expect to see much without doing something more ;-)
This is to let you configure your app exactly the way you wish, without imposing anything beforehand!


<a name="routing"/>
### Routing

If you'd like to easily configure specific routes to deal with accounts management, you might be interested to check out
[useraccounts:iron-routing](https://github.com/meteor-useraccounts/iron-routing) and [useraccounts:flow-routing](https://github.com/meteor-useraccounts/flow-routing) packages.
They provide very easy routes set-up via the `AccountsTemplates.configureRoute` method.


<a name="templates"/>
### Templates

There is **only one template** which is used to reactively draw appropriate sign in, sign up, forgot password, reset password, change password, and enroll account forms!

It is `atForm` and can be used anywhere you wish like this:

```html
{{> atForm}}
```

Its design is as *transparent* as possible, making it play nicely with themes and your CSS customizations! Also, it is not wrapped inside any *container* so that you can put it anywhere, including complex multi-column layouts.

In case you wish to *lock* the template to a particular state, you can specify that via the `state` parameter:

```html
{{> atForm state='signUp'}}
```

This will prevent the template from changing its content. See [internal states](#internal-states) for more details...


Well, actually there is many, used inside `atForm`...

...plus one another: `atNavButton` which can be used inside navbars to get a basic sign-in sign-out button which changes text and behaviour based on the user status (to get it working you should set up at least a `signIn` route).


<a name="basic-customization"/>
## Basic Customization


<a name="i18n"/>
### I18n Support

i18n is achieved using [accounts-t9n](https://atmospherejs.com/softwarerero/accounts-t9n). The only thing you have to do is ensure

```javascript
T9n.setLanguage('<lang>');
```

is called somewhere, whenever you want to switch language.


<a name="configuration-api"/>
### Configuration API

There are basically two different ways to interact with AccountsTemplates for basic configuration:

* AccountsTemplates.configureRoute(route_code, options);
* AccountsTemplates.configure(options);

**These functions should be called in top-level code, not inside `Meteor.startup()`.**

There is no specific order for the above calls to be effective, and you can call them more than once, possibly in different files.

**The only other requirement is to make exactly the same calls on both the server and the client.** The best thing is to put everything inside a file shared between both. I suggest you use something like `lib/config/at_config.js`


<a name="options"/>
#### Options

By calling `AccountsTemplates.configure(options)` you can specify a bunch of choices regarding both visual appearance and behavior.

The following is an almost complete example of options configuration (with fields in alphabetical order):

```javascript
AccountsTemplates.configure({
    // Behavior
    confirmPassword: true,
    enablePasswordChange: true,
    forbidClientAccountCreation: false,
    overrideLoginErrors: true,
    sendVerificationEmail: false,
    lowercaseUsername: false,
    focusFirstInput: true,

    // Appearance
    showAddRemoveServices: false,
    showForgotPasswordLink: false,
    showLabels: true,
    showPlaceholders: true,
    showResendVerificationEmailLink: false,

    // Client-side Validation
    continuousValidation: false,
    negativeFeedback: false,
    negativeValidation: true,
    positiveValidation: true,
    positiveFeedback: true,
    showValidating: true,

    // Privacy Policy and Terms of Use
    privacyUrl: 'privacy',
    termsUrl: 'terms-of-use',

    // Redirects
    homeRoutePath: '/home',
    redirectTimeout: 4000,

    // Hooks
    onLogoutHook: myLogoutFunc,
    onSubmitHook: mySubmitFunc,
    preSignUpHook: myPreSubmitFunc,
    postSignUpHook: myPostSubmitFunc,

    // Texts
    texts: {
      button: {
          signUp: "Register Now!"
      },
      socialSignUp: "Register",
      socialIcons: {
          "meteor-developer": "fa fa-rocket"
      },
      title: {
          forgotPwd: "Recover Your Password"
      },
    },
});
```

Details for each of them follow.

| Option                      | Type     | Default   | Description |
| --------------------------- | -------- | --------- | ----------- |
| **Behavior**               |          |           |             |
| confirmPassword             | Boolean  | true      | Specifies whether to ask the password twice for confirmation. This has no effect on the sign in form. |
| defaultState                | String   | "signIn"  | Specifies the state to be used initially when atForm is rendered. This is not considered when rendering atForm on configured routes. |
| enablePasswordChange        | Boolean  | false     | Specifies whether to allow to show the form for password change. Note: In case the `changePwd` route is not configured, this is to be done *manually* inside some custom template. |
| enforceEmailVerification    | Boolean  | false     | When set to true together with sendVerificationEmail, forbids user login unless the email address is verified. **Warning: experimental! Use it only if you have accounts-password as the only service!!!** |
| focusFirstInput             | Boolean  | !Meteor.isCordova      | When set to true, asks to autofocus the first input of atForm when the template is rendered. Note: have a look at [this issue](https://github.com/meteor-useraccounts/core/issues/594) in case you're getting problems with cordova apps. |
| forbidClientAccountCreation | Boolean  | false     | Specifies whether to forbid user registration from the client side. In case it is set to true, neither the link for user registration nor the sign up form will be shown. |
| overrideLoginErrors         | Boolean  | true      | Asks to show a general `Login Forbidden` on a login failure, without specifying whether it was for a wrong email or for a wrong password. |
| sendVerificationEmail       | Boolean  | false     | Specifies whether to send the verification email after successful registration. |
| redirectTimeout             | Number   | 2000      | Specifies a timeout time for the redirect after successful form submit on `enrollAccount`, `forgotPwd`, `resetPwd`, and `verifyEmail` routes. |
| socialLoginStyle            | String   | "popup"   | Specifies the login style for 3rd party services login. Valid values are `popup` or `redirect`. See `loginStyle` option of [Meteor.loginWith<ExternalService>](http://docs.meteor.com/#/full/meteor_loginwithexternalservice) for more information.  |
| lowercaseUsername           | Boolean  | false     | Possibly asks to transform `username` field for user objects at registration time to be always in lowercase with no spaces. The original `username` value will be added to the `user.profile` field for later use.  |
| **Appearance**              |          |           |             |
| hideSignInLink              | Boolean  | false     | When set to true, asks to never show the link to the sign in page  |
| hideSignUpLink              | Boolean  | false     | When set to true, asks to never show the link to the sign up page  |
| showAddRemoveServices       | Boolean  | false     | Tells whether to show social account buttons also when the user is signed in. In case it is set to true, the text of buttons will change from 'Sign in With XXX' to 'Add XXX' or 'Remove XXX' when the user signs in. 'Add' will be used if that particular service is still not associated with the current account, while 'Remove' is used only in case a particular service is already used by the user **and** there are at least two services available for sign in operations. Clicks on 'Add XXX' trigger the call to `Meteor.loginWithXXX`, as usual, while click on 'Remove XXX' will call the method `ATRemoveService` provided by AccountsTemplates. This means you need to have some additional logic to deal with the call `Meteor.loginWithXXX` in order to actually add the service to the user account. One solution to this is to use the package [accounts-meld](https://atmospherejs.com/package/accounts-meld) which was build exactly for this purpose. |
| showForgotPasswordLink      | Boolean  | false     | Specifies whether to display a link to the forgot password page/form |
| showLabels                  | Boolean  | true      | Specifies whether to display text labels above input elements. |
| showPlaceholders            | Boolean  | true      | Specifies whether to display place-holder text inside input elements. |
| showResendVerificationEmailLink      | Boolean  | false     | Specifies whether to display a link to the resend verification email page/form |
| **Texts**                   |          |           |             |
| texts                       | Object   |           | Permits to specify texts to be shown on the atForm for each of its states (see [below](#configuring-texts)). |
| **Client-side Validation**  |          |           |             |
| continuousValidation        | Boolean  | false     | Specifies whether to continuously validate fields' value while the user is typing. *It is performed client-side only to save round trips with the server*. |
| negativeValidation          | Boolean  | false     | Specifies whether to highlight input elements in case of negative validation. |
| positiveValidation          | Boolean  | false     | Specifies whether to highlight input elements in case of positive validation. |
| negativeFeedback            | Boolean  | false     | Specifies whether to display negative validation feed-back inside input elements. |
| positiveFeedback            | Boolean  | false     | Specifies whether to display positive validation feed-back inside input elements. |
| showValidating              | Boolean  | false     | Specifies whether to display a loading icon inside input elements while the validation process is in progress. |
| **Links**                   |          |           |             |
| homeRoutePath               | String   | '/'       | Path for the home route, to be possibly used for redirects after successful form submission. |
| privacyUrl                  | String   | undefined | Path for the route displaying the privacy document. In case it is specified, a link to the page will be displayed at the bottom of the form (when appropriate). |
| termsUrl                    | String   | undefined | Path for the route displaying the document about terms of use. In case it is specified, a link to the page will be displayed at the bottom of the form (when appropriate). |
| **Hooks**                   |          |           |             |
| onLogoutHook                | Function |           | Called on `AccountsTemplates.logout` invocation: allows for custom redirects or whatever custom action to be taken on user logout. |
| onSubmitHook                | Function |           | `func(error, state)` Called when the `pwdForm` is being submitted: allows for custom actions to be taken on form submission. `error` contains possible errors occurred during the submission process, `state` specifies the `atForm` internal state from which the submission was triggered. A nice use case might be closing the modal or side-menu showing `atForm` |
| preSignUpHook               | Function |           | `func(password, info)` Called just before submitting the `pwdForm` for sign-up: allows for custom actions on the data being submitted. A nice use could be extending the user profile object accessing `info.profile`.  to be taken on form submission. The plain text `password` is also provided for any reasonable use. |
| postSignUpHook               | Function |           | `func(userId, info)` Called, **server side only**, just after a successfull user account creation, post submitting the `pwdForm` for sign-up: allows for custom actions on the data being submitted ___after___ we are sure a new user was ___successfully___ created.  A common use might be applying roles to the user, as this is only possible after fully completing user creation in alanning:roles.  The `userId` is available as the first parameter, so that user user object may be retrieved.  The `password` is not available as it's already encrypted, though the encrypted password may be found in `info` if of use. |

##### onSubmitHook

A straightforward configuration about how to detect when a user logs in or registers might look like the following:

```javascript
var mySubmitFunc = function(error, state){
  if (!error) {
    if (state === "signIn") {
      // Successfully logged in
      // ...
    }
    if (state === "signUp") {
      // Successfully registered
      // ...
    }
  }
};

AccountsTemplates.configure({
    onSubmitHook: mySubmitFunc
});
```

<a name="logout"/>
##### AccountsTemplates.logout()

Should be used in place of `Meteor.logout()`.  This function invokes the `onLogoutHook` specified in the optional configuration.
Also note that `AccountsTemplates.logout()` is invoked when logging out using the `atNavButton`.


```javascript
//Use in  place of Meteor.logout() in your client code.  Also called automatically by atNavButton when clicking Sign Off
AccountsTemplates.logout();

```


```javascript
var myPostLogout = function(){
    //example redirect after logout
    Router.go('/home');
};

AccountsTemplates.configure({
    onLogoutHook: myPostLogout
});
```

<a name="internal-states"/>
### Internal States

The `atForm` template changes reactively based on the current internal state of AccountsTemplates.
The current internal state can be queried with `AccountsTemplates.getState()` and set with `AccountsTemplates.setState(new_state)`


Currently available states are:

| Internal State          | What's shown                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------- |
| changePwd               | Change password form asking to set a new password                                     |
| enrollAccount           | Account Enrollment form asking to set a password                                      |
| forgotPwd               | Forgot Password form asking for the email address where to send a reset password link |
| hide                    | None at all...                                                                        |
| resendVerificationEmail | Login form with an additional button to get another verification email                |
| resetPwd                | Reset Password form asking to set a password                                          |
| signIn                  | Login form                                                                            |
| signUp                  | Registration form                                                                     |
| verifyEmail             | Only the result about email verification                                              |



<a name="content-protection"/>
### Content Protection


If you want to secure a specific template, you could add that template like this:

```handlebars
{{> ensureSignedIn template="myTemplate"}}
```
and that will render the default `fullPageAtForm` template from your chosen User Accounts templates package (bootstrap, materialize, etc).  Once signed in, it'll render `myTemplate` instead of the accounts form.

If you want to declare a custom sign in template instead of `fullPageAtForm`, you would do this:

```handlebars
{{> ensureSignedIn template="myTemplate" auth="myLoginForm"}}
```
That custom auth template just needs to include `{{> atForm}}` somewhere in it.  The only reason you'd use this optional feature is if you wanted to modify the layout around the `atForm` template (like
`fullPageAtForm` does).


In case you're using one of the routing packages [useraccounts:iron-routing](https://github.com/meteor-useraccounts/iron-routing)
or [useraccounts:flow-routing](https://github.com/meteor-useraccounts/flow-routing) refer to their documentation for more possibilities.


<a name="reCaptcha-setup"/>
### reCaptcha Setup
To set up [reCaptcha](https://www.google.com/recaptcha/intro/index.html), you need to first obtain API keys.

Then, a recommended setup is as follows.

A [Meteor settings file](http://docs.meteor.com/#/full/meteor_settings) with the keys:

```javascript
{
    "public": {
        "reCaptcha": {
            "siteKey": YOUR SITE KEY
        }
    },
    "reCaptcha": {
        "secretKey": YOUR SECRET KEY
    }
}
```

and configuration to show the reCaptcha widget:

```javascript
AccountsTemplates.configure({
    showReCaptcha: true
});
```

The reCaptcha plugin can likewise be set up with the following complete example:


```javascript
AccountsTemplates.configure({
    reCaptcha: {
        siteKey: YOUR SITE KEY,
        theme: "light",
        data_type: "image"
    },
    showReCaptcha: true
});
```

And, in a separate file in the `/server` folder:

```javascript
AccountsTemplates.configure({
    reCaptcha: {
        secretKey: YOUR SECRET KEY.
    },
});
```

Each option is described below:

| Option                      | Type     | Default   | Description |
| --------------------------- | -------- | --------- | ----------- |
| siteKey                     | String   | none      | The site key needed to create the reCaptcha widget. This can be specified in just the Meteor settings file. |
| secretKey                   | String   | none      | The secret key needed to verify the reCaptcha response. ***Warning: Only set this in a file in `/server` or in a Meteor settings file. Otherwise, your private key can be read by anyone!*** |
| theme                       | String   | "light"   | Sets the reCaptcha theme color. The options are "light" and "dark". |
| data_type                   | String   | "image"   | Sets the verification method. Options are "image" or "audio". |
| showReCaptcha               | Boolean  | false     | Whether to show the reCaptcha widget on sign in or not. No reCaptcha validation will occur if set to false. |

<a name="detect-reactively-when-a-form-is-being-processed"/>
### Detect reactively when a form is being processed

`AccountsTemplates.disabled()` returns `true` when a submitted form is being processed and `false` once the submission process has been completed (successfully or not). `AccountsTemplate.disabled()` is reactive and can be used to trigger UI events, such as spinners, "Please wait" messages or to disable input elements, while the form is being processed. The function works irrespectively of form status (signIn, signUp, pwdReset etc.). A typical use-case would be in a template helper:

```html
<template name="myLogin">
 {{#if atDisabled}}
  Please wait...
 {{/if}}
 <div class="{{atClass}}">
  {{> atForm}}
 </div>
</template>
```

```js
Template.myLogin.helpers({
 atDisabled: function() {
  return AccountsTemplates.disabled();
 },
 atClass: function() {
  return AccountsTemplates.disabled() ? 'disabled' : 'active';
 }
});
```

<a name="advanced-customization"/>
## Advanced Customization


<a name="configuring-texts"/>
### Configuring Texts

In case you wish to change texts on atForm, you can call:

```javascript
AccountsTemplates.configure({
    texts: {
        navSignIn: "signIn",
        navSignOut: "signOut",
        optionalField: "optional",
        pwdLink_pre: "",
        pwdLink_link: "forgotPassword",
        pwdLink_suff: "",
        resendVerificationEmailLink_pre: "Verification email lost?",
        resendVerificationEmailLink_link: "Send again",
        resendVerificationEmailLink_suff: "",
        sep: "OR",
        signInLink_pre: "ifYouAlreadyHaveAnAccount",
        signInLink_link: "signin",
        signInLink_suff: "",
        signUpLink_pre: "dontHaveAnAccount",
        signUpLink_link: "signUp",
        signUpLink_suff: "",
        socialAdd: "add",
        socialConfigure: "configure",
        socialIcons: {
            "meteor-developer": "fa fa-rocket",
        },
        socialRemove: "remove",
        socialSignIn: "signIn",
        socialSignUp: "signUp",
        socialWith: "with",
        termsPreamble: "clickAgree",
        termsPrivacy: "privacyPolicy",
        termsAnd: "and",
        termsTerms: "terms",
    }
});
```

the above example asks to change some of the available text configurations. You can specify only a subsets of them leaving default values unchanged.
To learn how to change title, button, social buttons' icon, info, and errors text read below.


<a name="form-title"/>
#### Form Title

In case you wish to change form titles, you can call:

```javascript
AccountsTemplates.configure({
    texts: {
      title: {
        changePwd: "Password Title",
        enrollAccount: "Enroll Title",
        forgotPwd: "Forgot Pwd Title",
        resetPwd: "Reset Pwd Title",
        signIn: "Sign In Title",
        signUp: "Sign Up Title",
        verifyEmail: "Verify Email Title",
      }
    }
});
```

the above example asks to change the title for all possible form states, but you can specify only a subset of them leaving default values unchanged.

You can also *hide* a title by setting it to an empty string. For example with:

```
AccountsTemplates.configure({
    texts: {
      title: {
        signIn: "",
      }
    }
});
```

no title will be shown on the sign in form.


<a name="button-text"/>
#### Button Text

In case you wish to change the text appearing inside the submission button, you can call:

```javascript
AccountsTemplates.configure({
    texts: {
        button: {
          changePwd: "Password Text",
          enrollAccount: "Enroll Text",
          forgotPwd: "Forgot Pwd Text",
          resetPwd: "Reset Pwd Text",
          signIn: "Sign In Text",
          signUp: "Sign Up Text",
        }
    }
});
```

the above example asks to change the button text for all possible form states, but you can specify only a subset of them leaving default values unchanged.

<a name="social-button-icons"/>
#### Social Button Icons

In case you wish to change the icon appearing on the left of social login buttons, you can call:

```javascript
AccountsTemplates.configure({
    texts: {
        socialIcons: {
          google: "myGoogleIcon",
          "meteor-developer": "myMeteorIcon",
        }
    }
});
```

to specify a different icon classes to be used for services. By default the icon class is set to `fa fa-*service*`,
but for the "meteor-developer" service for which `fa fa-rocket` is used. An exception is made for `useaccounts:semantic-ui`
which sets them simply to `*service*`, which is the correct way to go.

<a name="info-text"/>
#### Info Text

In case you wish to change the info text appearing inside the results box, you can call:

```javascript
AccountsTemplates.configure({
    texts: {
        info: {
            emailSent: "info.emailSent",
            emailVerified: "info.emailVerified",
            pwdChanged: "info.passwordChanged",
            pwdReset: "info.passwordReset",
            pwdSet: "info.passwordReset",
            signUpVerifyEmail: "Successful Registration! Please check your email and follow the instructions.",
            verificationEmailSent: "A new email has been sent to you. If the email doesn't show up in your inbox, be sure to check your spam folder.",
        }
    }
});
```

The above calls simply set all values as the current default ones.

<a name="input-icons"/>
#### Input Field Icons

In case you wish to change the icon appearing on the right side of input fields to show their validation status, you can call:

```javascript
AccountsTemplates.configure({
    texts: {
      inputIcons: {
          isValidating: "fa fa-spinner fa-spin",
          hasSuccess: "fa fa-check",
          hasError: "fa fa-times",
      }
    }
});
```

<a name="errors-text"/>
#### Errors Text

In case you wish to change the text for errors appearing inside the error box, you can call:

```javascript
AccountsTemplates.configure({
    texts: {
        errors: {
            accountsCreationDisabled: "Client side accounts creation is disabled!!!",
            cannotRemoveService: "Cannot remove the only active service!",
            captchaVerification: "Captcha verification failed!",
            loginForbidden: "error.accounts.Login forbidden",
            mustBeLoggedIn: "error.accounts.Must be logged in",
            pwdMismatch: "error.pwdsDontMatch",
            validationErrors: "Validation Errors",
            verifyEmailFirst: "Please verify your email first. Check the email and follow the link!",
        }
    }
});
```

The above calls simply set all values as the current default ones.
*Note:* The above list of errors refers to those set directly by AccountsTemplates only!
Errors which comes from the Accounts packages cannot be overwritten (at least not easily...)
Please have a look at [Form Fields Configuration](#form-fields-configuration) to learn how to set validation errors on a field basis.


<a name="disabling-client-side-accounts-creation"/>
### Disabling Client-side Accounts Creation

AccountsTemplates disables by default accounts creation on the client. This is done to use a dedicated method called `ATCreateUserServer` **(sending the password on the wire already hashed as usual...)** to create the new users server-side.
This way a bulletproof profile fields full validation can be performed.
But there is one more parameter to set in case you'd like to forbid client-side accounts creation, which is the following:

* `forbidClientAccountCreation` - (Boolean, default false) Specifies whether to forbid accounts creation from the client.

it is exactly the same provided by the Accounts object, so this means you need to do:

```javascript
AccountsTemplates.configure({
    forbidClientAccountCreation: true
});
```

instead of the usual:

```javascript
Accounts.config({
  forbidClientAccountCreation : true
});
```


<a name="form-fields-configuration"/>
### Form Fields Configuration

Every input field appearing inside AccountsTemplates forms can be easily customized both for appearance and validation behaviour. Additional (custom) fields can be added to the sign up and registration forms, and the properties of built-in fields, like `email` and `password` can be overridden (see [Remove fields](https://github.com/meteor-useraccounts/core/blob/master/Guide.md#remove-fields))

Each field object is represented by the following properties:

| Property             | Type             | Required | Description                                                                                                                                                                                                                            |
| -------------------- | -----------------|:--------:| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _id                  | String           |    X     | A unique field's id/name (internal use only) to be also used as attribute name into `Meteor.user().profile` in case it identifies an additional sign up field. Usually all lowercase letters.                                       |
| type                 | String           |    X     | Specifies the input element type. At the moment supported inputs are: `password`, `email`, `text`, `tel`, `url`, `checkbox`, `select`, `radio`, `hidden`.                                                                                        |
| required             | Boolean          |          | When set to true the corresponding field cannot be left blank                                                                                                                                                                          |
| displayName          | String or Object |          | The field name to be shown as text label above the input element. In case nothing is specified, the capitalized `_id` is used. The text label is shown only if `showLabels` options is set to true.                             |
| placeholder          | String or Object |          | The placeholder text to be shown inside the input element. In case nothing is specified, the capitalized `_id` will be used. The place-holder is shown only if `showPlaceholders` option is set to true.                    |
| select               | [Object]         |          | Lets you specify an array of choices to be displayed for select and radio inputs. See example below.                                                                                                                                   |
| minLength            | Integer          |          | If specified, requires the content of the field to be at least `minLength` characters.                                                                                                                                                  |
| maxLength            | Integer          |          | If specified, require the content of the field to be at most `maxLength` characters.                                                                                                                                                    |
| re                   | RegExp           |          | Possibly specifies the regular expression to be used for the field's content validation. Validation is performed both client-side (at every input change if `continuousValidation` option is set to true) and server-side on form submit. |
| func                 | Function         |          | Custom function to be used for validation.                                                                                                                                                                                             |
| errStr               | String           |          | Error message to be displayed in case re or func validation fail.                                                                                                                                                                      |
| trim                 | Boolean          |          | Trim the input value.                                                                                                                                                                                      |
| lowercase            | Boolean          |          | Convert the input value to lowercase.                                                                                                                                                                      |
| uppercase            | Boolean          |          | Convert the input value to uppercase.                                                                                                                                                                      |
| transform            | Function         |          | Custom function to transform the input value.                                                                                                                                                                      |
| continuousValidation | Boolean          |          | Continuously validate fields' value while the user is typing. *It is performed client-side only to save round trips with the server*. |
| negativeValidation   | Boolean          |          | Highlight input elements in case of negative validation. |
| positiveValidation   | Boolean          |          | Highlight input elements in case of positive validation. |
| negativeFeedback     | Boolean          |          | Display negative validation feedback inside input elements. |
| positiveFeedback     | Boolean          |          | Display positive validation feedback inside input elements. |
| showValidating       | Boolean          |          | Display a loading icon inside input elements while the validation process is in progress. |
| options              | Object           |          | Allows to pass in additional custom options to be possibly used to extend input templates (see [Extending Templates](https://github.com/meteor-useraccounts/core/blob/master/Guide.md#extending-templates))  |
| template             | String           |          | The name of a custom template to be used in place of the default one. |


`displayName`, `placeholder`, and `errStr` can also be an [accounts-t9n](https://atmospherejs.com/softwarerero/accounts-t9n) registered key, in which case it will be translated based on the currently selected language.
In case you'd like to specify a key which is not already provided by accounts-t9n you can always map your own keys. To learn how to register new labels, please refer to the official [documentation](https://github.com/softwarerero/meteor-accounts-t9n#define-translations).

`continuousValidation`, `negativeFeedback`, `negativeValidation`, `positiveValidation`, `positiveFeedback`, `showValidating` can be used to override global settings (see [Form Fields Configuration](#form-fields-configuration)) on a per field basis.

Furthermore, you can pass an object for `displayName`, `placeholder` to specify different texts for different form states. The matched pattern is:

```javascript
{
    default: Match.Optional(String),
    changePwd: Match.Optional(String),
    enrollAccount: Match.Optional(String),
    forgotPwd: Match.Optional(String),
    resetPwd: Match.Optional(String),
    signIn: Match.Optional(String),
    signUp: Match.Optional(String),
}
```

which permits to specify a different text for each different state, or a default value to be used for states which are not explicitly provided. For example:

```javascript
AccountsTemplates.addField({
    _id: 'password',
    type: 'password',
    placeholder: {
        signUp: "At least six characters"
    },
    required: true,
    minLength: 6,
    re: /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/,
    errStr: 'At least 1 digit, 1 lowercase and 1 uppercase',
});
```

asks AccountsTemplates to display "At least six characters" as the placeholder for the password field when the sign up form is display, and to display "Password" (the capitalized *_id*_) in any other case.

##### Custom validation
Custom validation can be achieved by providing a regular expression or a function. In case you go for the function solution, this:

```javascript
AccountsTemplates.addField({
    _id: 'name',
    type: 'text',
    displayName: "Name",
    func: function(value){return value !== 'Full Name';},
    errStr: 'Only "Full Name" allowed!',
});
```

will require the name input to be exactly "Full Name" (though this might not be that interesting...).
If instead you do something along the following line:

```javascript
AccountsTemplates.addField({
    _id: 'phone',
    type: 'tel',
    displayName: "Phone",
    required: true,
    func: function (number) {
        if (Meteor.isServer){
          if (isValidPhone(number))
              return false; // meaning no error!
          return true; // Validation error!
        }
    },
    errStr: 'Invalid Phone number!',
});
```

supposing `isValidPhone` is available only server-side, you will be validating the field only server-side, on form submission.

If, differently, you do something like this:

```javascript
if (Meteor.isServer){
    Meteor.methods({
        "userExists": function(username){
            return !!Meteor.users.findOne({username: username});
        },
    });
}

AccountsTemplates.addField({
    _id: 'username',
    type: 'text',
    required: true,
    func: function(value){
        if (Meteor.isClient) {
            console.log("Validating username...");
            var self = this;
            Meteor.call("userExists", value, function(err, userExists){
                if (!userExists)
                    self.setSuccess();
                else
                    self.setError(userExists);
                self.setValidating(false);
            });
            return;
        }
        // Server
        return Meteor.call("userExists", value);
    },
});
```

you can achieve also client-side and server-side validation calling a server method
During the waiting time a loading icon will be displayed (if you configure `showValidating` to be true).
To configure the loading icon see [Input Field Icons](#input-icons).

*Note:* `field.setError(err)`, `field.setSuccess()`, and `field.setValidating()` are methods used to deal with inputs' validation states. A `null` value means non-validated, `false` means correctly validated, no error, and any other value evaluated as true (usually strings specifying the reason for the validation error), are finally interpreted as error and displayed where more appropriate.

#### Checkboxes, Selects, Radios, and Hidden

This is an example about how to add Checkboxes, Selects, and Radios to the sign up fields:

```javascript
AccountsTemplates.addField({
    _id: "gender",
    type: "select",
    displayName: "Gender",
    select: [
        {
            text: "Male",
            value: "male",
        },
        {
            text: "Female",
            value: "female",
        },
    ],
});

AccountsTemplates.addField({
    _id: "fruit",
    type: "radio",
    displayName: "Preferred Fruit",
    select: [
        {
        text: "Apple",
        value: "aa",
      }, {
        text: "Banana",
        value: "bb",
      }, {
        text: "Carrot",
        value: "cc",
      },
    ],
});

AccountsTemplates.addField({
    _id: "mailing_list",
    type: "checkbox",
    displayName: "Subscribe me to mailing List",
});

AccountsTemplates.addField({
    _id: 'reg_code',
    type: 'hidden'
});
```

please note the `select` list which lets you specify the values for the choice.
The `value` value of corresponding selected `text` will be picked up and added into the `profile` field of the user object.

Hidden inputs might be of help in case you want to consider to link to your registration page from around the web (emails, ads, discount campaigns, etc...) with links like this:

```
http://my.splendido.site/sign-up?email=giorgio@example.com&reg_code=123
```

exploiting the ability of AccountsTemplates to pick-up query parameters having the same key as field ids, this would permit to get `reg_code: "123"` under the `profile` field of the user object.
**Please use this with caution!** ..never ever do something like:
```
http://my.splendido.site/sign-up?role=admin
```
and then set the role of the new user based on the hidden `role` field. I guess you can appreciate the security hole there ;-)

#### Special Field's Ids

There are a number of special ids used for basic input fields. These are:

* current_password
* email
* password
* password_again
* username
* username_and_email

Any other id will be interpreted as an additional sign up field.
In case a special field is not explicitly added, it will be automatically inserted at initialization time (with appropriate default properties). To customize special fields see [Remove fields](https://github.com/meteor-useraccounts/core/blob/master/Guide.md#remove-fields)

#### Add a field

You can use `AccountsTemplates.addField(options)` to configure an input field. This apply for both special fields and custom ones.
For example you can do:

```javascript
AccountsTemplates.addField({
    _id: 'phone',
    type: 'tel',
    displayName: "Landline Number",
});
```

The above snippet asks `AccountsTemplates` to draw an additional input element within the sign-up form.

#### Add many fields at once

Another possibility is to add many additional fields at once using `addFields`:

```javascript
AccountsTemplates.addFields([
    {
        _id: 'phone',
        type: 'tel',
        displayName: "Landline Number",
    },
    {
        _id: 'fax',
        type: 'tel',
        displayName: "Fax Number",
    }
]);
```

#### Remove fields

There is also a `removeField` method which can be used to remove predefined required fields and adding them again specify different options.

```javascript
AccountsTemplates.removeField('password');
AccountsTemplates.addField({
    _id: 'password',
    type: 'password',
    required: true,
    minLength: 6,
    re: /(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/,
    errStr: 'At least 1 digit, 1 lower-case and 1 upper-case',
});
```

#### Login with Username or Email

In order to let the user register with both a `username` and an `email` address and let him the possibility to log in using one of them, both the `username` and `email` fields must be added.
This is an example about how to configure such a behaviour:

```javascript
var pwd = AccountsTemplates.removeField('password');
AccountsTemplates.removeField('email');
AccountsTemplates.addFields([
  {
      _id: "username",
      type: "text",
      displayName: "username",
      required: true,
      minLength: 5,
  },
  {
      _id: 'email',
      type: 'email',
      required: true,
      displayName: "email",
      re: /.+@(.+){2,}\.(.+){2,}/,
      errStr: 'Invalid email',
  },
  pwd
]);
```

This will trigger the automatic insertion of the special field `username_and_email` to be used for the sign in form.
If you wish to further customize the `username_and_email` field you can add it together with the other two:

```javascript
var pwd = AccountsTemplates.removeField('password');
AccountsTemplates.removeField('email');
AccountsTemplates.addFields([
  {
      _id: "username",
      type: "text",
      displayName: "username",
      required: true,
      minLength: 5,
  },
  {
      _id: 'email',
      type: 'email',
      required: true,
      displayName: "email",
      re: /.+@(.+){2,}\.(.+){2,}/,
      errStr: 'Invalid email',
  },
  {
      _id: 'username_and_email',
      type: 'text',
      required: true,
      displayName: "Login",
  },
  pwd
]);
```


<a name="extending-templates"/>
### Extending Templates

With the [aldeed:template-extension](https://github.com/aldeed/meteor-template-extension) package, the built-in templates or sub-templates of any `user-accounts` UI package may be replaced by custom templates. The purpose is to create more sophisticated or specialized layouts or styling.

In case of input fields the option `template` (see [Form Fields Configuration](#form-fields-configuration)) can be directly used without the need to rely on `aldeed:template-extension` package.

Here is a simple example of a template you can use for a field of type 'select':

```html
<template name="customSelectTemplate">
  <select id="at-field-{{_id}}" name="at-field-{{_id}}" data-something="{{options.someOption}}">
    {{#each select}}
    <option value="{{value}}">{{text}}</option>
    {{/each}}
  </select>
</template>
```

Custom properties that hold information about the look of the form may be attached to the `options` object of a field. It may then be used to change the output while looping the fields. Adding a divider might look like this:

```javascript
AccountsTemplates.addField({
  _id: "address",
  type: "text",

  // Options object with custom properties for my layout. At the moment, there are
  // no special properties; it is up the developer to invent them
  options: {
    // Put a divider before this field
    dividerBefore: true
  }
});
```

```html
<template name="appAtInput">
  {{#if options.dividerBefore}}<hr>{{/if}}

  {{> Template.dynamic template=templateName}}
</template>
```

```javascript
Template.appAtInput.replaces("atInput");
```


<a name="grouping-fields"/>
#### Grouping fields

Grouping fields together is a special problem in regard to layout. The issue is creating some container markup *while* iterating over the fields (the templating engine of Meteor doesn't allow outputting an opening tag inside a loop without closing it in the same iteration).

A solution to the problem is demonstrated in [this gist](https://gist.github.com/dalgard/a844f6569d8f471db9a7) (Semantic UI version).


<a name="css-rules"/>
### CSS Rules

The main atForm is build up of several pieces, appearing and disappearing based on configuration options as well as the current internal status.
Each of these blocks is wrapped inside a `div` with class `at-<something>`: this should made your life easier if you're trying to write your own CSS rules to change templates' appearance.

Social login buttons (`button.at-social-btn`) have an `id` in the form `at-<servicename>` and name `<servicename>`.

Input fields for the password service form are wrapped inside a div with class `at-input`. The same div gets classes `has-error`, `has-success`, and `has-feedback` in case of negative validation result, positive validation and validation with feedback respectively.
The input element itself has id and name in the form `at-field-<field_id>`.
**Note:** `has-error`, `has-success`, and `has-feedback` names might change from framework to framework. These are valid for the *unstyled* and *bootstrap* versions...


Below is a html snapshot of an over-complete `atForm` taken from the unstyled version in which you can find all elements possibly shown under different configurations and circumstances.

```html
<div class="at-form">
  <!-- Title -->
  <div class="at-title">
    <h3>Create an Account</h3>
  </div>
  <!-- Social Buttons for Oauth Sign In / Sign Up-->
  <div class="at-oauth">
    <button class="at-social-btn" id="at-facebook" name="facebook">
      <i class="fa fa-facebook"></i> Sign in with Facebook
    </button>
    <button class="at-social-btn" id="at-twitter" name="twitter">
      <i class="fa fa-twitter"></i> Sign in with Twitter
    </button>
  </div>
  <!-- Services Separator -->
  <div class="at-sep">
    <strong>OR</strong>
  </div>
  <!-- Global Error -->
  <div class="at-error">
      <p>Login forbidden</p>
  </div>
  <!-- Global Resutl -->
  <div class="at-result">
      <p>Email Sent!</p>
  </div>
  <!-- Password Service -->
  <div class="at-pwd-form">
    <form role="form" id="at-pwd-form" novalidate="">
      <!-- Input -->
      <div class="at-input">
        <label for="at-field-username">
          Username
        </label>
        <input type="text" id="at-field-username" name="at-field-username" placeholder="Username" autocapitalize="none" autocorrect="off">
      </div>
      <!-- Input with Validation Error -->
      <div class="at-input has-error">
        <label for="at-field-email">
          Email
        </label>
        <input type="email" id="at-field-email" name="at-field-email" placeholder="Email" autocapitalize="none" autocorrect="off">
        <span>Invalid email</span>
      </div>
      <!-- Input with Successful Validation -->
      <div class="at-input has-success">
        <label for="at-field-password">
          Password
        </label>
        <input type="password" id="at-field-password" name="at-field-password" placeholder="Password" autocapitalize="none" autocorrect="off">
      </div>
      <!-- Forgot Password Link -->
      <div class="at-pwd-link">
        <p>
          <a href="/forgot-password" id="at-forgotPwd" class="at-link at-pwd">Forgot your password?</a>
        </p>
      </div>
      <!-- Form Submit Button -->
      <button type="submit" class="at-btn submit disabled" id="at-btn">
        Register
      </button>
    </form>
  </div>
  <!-- Link to Sign In -->
  <div class="at-signin-link">
    <p>
      If you already have an account
      <a href="/sign-in" id="at-signIn" class="at-link at-signin">sign in</a>
    </p>
  </div>
  <!-- Link to Sign Up -->
  <div class="at-signup-link">
    <p>
      Don't have an account?
      <a href="/sign-up" id="at-signUp" class="at-link at-signup">Register</a>
    </p>
  </div>
  <!-- Link to Privacy Policy and Terms of use -->
  <div class="at-terms-link">
    <p>
      By clicking Register, you agree to our
        <a href="/privacyPolicy">Privacy Policy</a>
        and
        <a href="/termsOfUse">Terms of Use</a>
    </p>
  </div>
</div>
```



<a name="wrapping-up-for-famo.us"/>
## Wrapping Up for Famo.us

By simply typing

```shell
meteor add useraccounts:famous-wrapper
```

you'll be able to turn your preferred flavour of accounts templates into a package ready to be used within a [famous-views](https://atmospherejs.com/gadicohen/famous-views) + [Famo.us](http://famo.us) application.

This means you can get an animated version of the `atForm` template without any effort! :-)

To learn how to make animations you might want to check the following links:

* http://famous-views.meteor.com
* http://famous-views.meteor.com/examples/animate
* http://famo.us/university/lessons/#/famous-101/animating/1
* http://famo.us/guides/layout
* http://famo.us/guides/animations
* http://famo.us/docs/modifiers/StateModifier
* http://famo.us/docs/transitions/Transitionable

### configureAnimations

...well, actually it might be that you don't like the default animations so you might consider to use `AccountsTemplates.configureAnimations` (provided by the wrapper...) to specify your custom animation functions.
This is an example showing how to do it:

```javascript
var Transform;
var Easing;
if (Meteor.isClient){
    FView.ready(function(require) {
        Transform = famous.core.Transform;
        Easing = famous.transitions.Easing;
    });
}

var slideLeftDestroy = function(fview){
    fview.modifier.setTransform(
        Transform.translate(-$(window).width(),0),
        { duration : 250, curve: Easing.easeOutSine },
        function() { fview.destroy();}
    );
};


AccountsTemplates.configureAnimations({
    destroy: {
        atSignupLink: slideLeftDestroy,
    }
});
```

this asks AT to use `slideLeftDestroy` to animate the template `atSignupLink` when it is to be destroyed.

As you've just seen `configureAnimations` take an `options` object as parameter:

```javascript
AccountsTemplates.configureAnimations(options);
```

this options object can have three different keys at the first level:

```javascript
var options = {
    render: {
      // more stuff here...
    },
    destroy: {
      // more stuff here...
    },
    state_change: {
      // more stuff here...
    },
    animQueueDelay: 100,
    animQueueStartDelay: 200,
    setStateDelay: 300,

};
AccountsTemplates.configureAnimations(options);
```

they are `render`, `destroy`, `state_change`, `animQueueDelay`, `animQueueStartDelay`, and `setStateDelay`.
The first three, what a surprise, they let you specify what to do when one of the templates building up the `atForm` is rendered, destroyed or when the form's state changes (respectively).

...at the second level you can specify which animation has to be applied to which template:

```javascript
var options = {
    render: {
        default: animA,
        atTitle: animB,
        atSocial: animC,
        atSep: animC,
        atError: animB,
        atResult: animB,
        atPwdForm: null,
        atSigninLink: null,
        atSignupLink: animB,
        atTermsLink: animD,
    },
    // ...
};
```

the above one is the full list of available animated templates...
The value you specify can be `null` (to remove a default animation...) or a function.
If you specify a function it should be like the following:

```javascript
var animFunc = function(fview){
    fview.modifier.setTransform(
        Transform.<some_transform>( ... ),
        { duration : <millisecs>, curve: Easing.<some_curve> }
    );
};
```

the `fview` parameter actually let you access the famous view associated with the template (so feel free to do whatever you wish with it...).

**Warning:** when you specify an animation to be used on `destroy` you must take care of the actual destroy!
...usually it is enough to call `fview.destroy()` when the animation completes:

```javascript
var animFunc = function(fview){
    fview.modifier.setTransform(
        Transform.<some_transform>( ... ),
        { duration : <millisecs>, curve: Easing.<some_curve> },
        function(){ fview.destroy();}
    );
};
```

**Warning2:** At the moment the animation for the state change is supposed to last for double the `setStateDelay` duration, and the state change is actually postponed by `setStateDelay` milliseconds. This let you divide your animation in two different part (so, e.g., you can hide things and show them again with the new content...).
The following is the default animations used on state change:

```javascript
vFlip = function(fview){
    fview.modifier.setTransform(
        Transform.rotate(Math.PI-0.05,0,0),
        {
            duration : AccountsTemplates.animations.setStateDelay,
            curve: "easeIn",
        },
        function() {
            fview.modifier.setTransform(
                Transform.rotate(-0.1,0,0),
                {
                    duration : AccountsTemplates.animations.setStateDelay,
                    curve: "easeOut",
                }
            );
        }
    );
};
```

and as you can see schedules two different animations, one after the another, lasting `setStateDelay` ms each.


### pushToAnimationQueue

In case you're interested in sequence animation, AT also provides an experimental animation cue you can use to schedule your animation with a bit of delay between them.
To use it simply wrap the `modifier.setTransform` within an `AccountsTemplates.pushToAnimationQueue` call, like this:

```jacascript
var fallFromTop = function(fview){
    fview.modifier.setTransform(Transform.translate(0, -$(window).height()));
    AccountsTemplates.pushToAnimationQueue(function() {
        fview.modifier.setTransform(
            Transform.translate(0,0),
            { duration : 450, curve: Easing.easeOutSine }
        );
    });
};
```

the full signature for it is:

```javascript
AccountsTemplates.pushToAnimationQueue(func, at_begin);
```

and if pass `true` for `at_begin`, the function will be pushed to the begin of the cue rather than at the end.

The first animation is started after `animQueueStartDelay` milliseconds from the first insertion and a delay of `animQueueStartDelay` milliseconds is applied between start of animations (you can configure these two values with `configureAnimations` function as listed above...).

And that's it!
Enjoy ;-)


<a name="side-notes"/>
## Side Notes


<a name="3rd-party-login-services-configuration"/>
### 3rd Party Login Services Configuration

Normally, if you have not configured a social account with, e.g.,

```javascript
// Set up login services
Meteor.startup(function() {
    // Add Facebook configuration entry
    ServiceConfiguration.configurations.update(
      { "service": "facebook" },
      {
        $set: {
          "appId": "XXXXXXXXXXXXXXX",
          "secret": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        }
      },
      { upsert: true }
    );

    // Add GitHub configuration entry
    ServiceConfiguration.configurations.update(
      { "service": "github" },
      {
        $set: {
          "clientId": "XXXXXXXXXXXXXXXXXXXX",
          "secret": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        }
      },
      { upsert: true }
    );
});
```

3rd party login buttons are not shown. To allow display buttons with, e.g., 'Configure Foobook', simply add the packages `service-configuration` and `accounts-ui` with:

```Shell
meteor add service-configuration
meteor add accounts-ui
```

**Warning**: At the moment the UI for service configuration is not supported and the one provided by `accounts-ui` will be shown!
