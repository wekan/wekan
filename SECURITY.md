About money, see [CONTRIBUTING.md](CONTRIBUTING.md)

Security is very important to us. If you discover any issue regarding security, please disclose
the information responsibly by sending an email to security@wekan.team and not by
creating a GitHub issue. We will respond swiftly to fix verifiable security issues.

We thank you with a place at our hall of fame page, that is
at https://wekan.github.io/hall-of-fame

## How should reports be formatted?

```
Name: %name
Twitter: %twitter
Bug type: %bugtype
Domain: %domain
Severity: %severity
URL: %url
PoC: %poc
CVSS (optional): %cvss
CWSS (optional): %cwss
```

## Who can participate in the program

Anyone who reports a unique security issue in scope and does not disclose it to
a third party before we have patched and updated may be upon their approval
added to the Wekan Hall of Fame.

## Which domains are in scope?

No public domains, because all those are donated to Wekan Open Source project,
and we don't have any permissions to do security scans on those donated servers.

Please don't perform research that could impact other users. Secondly, please keep
the reports short and succinct. If we fail to understand the logics of your bug, we will tell you.

You can [Install Wekan](https://github.com/wekan/wekan/releases) to your own computer
and scan it's vulnerabilities there.

## About Wekan versions

There are only 2 versions of Wekan: Standalone Wekan, and Sandstorm Wekan.

### Standalone Wekan Security

Standalone Wekan includes all non-Sandstorm platforms. Some Standalone Wekan platforms
like Snap and Docker have their own specific sandboxing etc features.

Standalone Wekan by default does not load any files from Internet, like fonts, CSS, etc.
This also means all Standalone Wekan functionality works in offline local networks.
WeKan is used at most countries of the world https://snapcraft.io/wekan
and by by companies that have 30k users.

- Wekan private board attachments are not accessible without logging in.
- There is feature to set board public, so that board is visible without logging in in readonly mode, with realtime updates.
- Admin Panel has feature to disable all public boards, so all boards are private.

## SSL/TLS

- SSL/TLS encrypts traffic between webbrowser and webserver.
- If you are thinking about TLS MITM, look at https://github.com/caddyserver/caddy/issues/2530
- Let's Encrypt TLS requires publicly accessible webserver, that Let's Encrypt TLS validation servers check.
- If firewall limits to only allowed IP addresses, you may need non-Let's Encrypt TLS cert.
- For On Premise:
  - https://caddyserver.com/docs/automatic-https#local-https
  - https://github.com/wekan/wekan/wiki/Caddy-Webserver-Config
  - https://github.com/wekan/wekan/wiki/Azure
  - https://github.com/wekan/wekan/wiki/Traefik-and-self-signed-SSL-certs

## XSS

- Dompurify https://www.npmjs.com/package/dompurify
  - WeKan uses dompurify npm package to filter for XSS at fields like cards, as you can see from
    [package.json](https://github.com/wekan/wekan/blob/main/package.json). Other used versions can be seen from
    [Meteor versions file](https://github.com/wekan/wekan/blob/main/.meteor/versions).
  - Forms can include markdown links, html, image tags etc like you see at https://wekan.github.io .
  - It's possible to add attachments to cards, and markdown/html links to files.
  - Dompurify cleans up viewed code, so Javascript in input fields does not execute
    - https://wekan.github.io/hall-of-fame/fieldbleed/
- Reaction in comment is now checked, that it does not have extra added code
  - https://wekan.github.io/hall-of-fame/reactionbleed/
- https://github.com/wekan/wekan/blob/main/packages/markdown/src/template-integration.js#L76

## QA about PubSub

Q:

Hello,
I have just seen the Meteor DevTools Evolved extension and was wondering if anyone had asked themselves the question of security.
Insofar as all data is shown in the minimongo tab in plain text.
How can data be hidden from this extension?

A:

## PubSub

- It is not security issue to show some text or image, that user has permission to see. It is a security issue, if browserside is some text or image that user should not see.
- Meteor has browserside minimongo database, made with Javascript, updated with Publish/Subscribe, PubSub.
- Publish/Subscribe means, that realtime web framework reads database changes stream, and then immediately updates webpage,
  like like dashboards, chat, kanban. That is the point in any realtime web framework in any programming language.
- Yes, you should check with Meteor DevTools Evolved Chromium/Firefox extension that at minimongo is only text that user has permission to see.
- Do checking as logged in user, and logged out user.
- Check permissions and sanitize before allowing some change, because someone could modify content of input field,
  PubSub/websocket data (for example with Burp Suite Community Edition), etc.
- If you have REST API, also check that only those that have login token, and have permission, can view or edit text
- You should not include any data user is not allowed to see. Not to webpage text, not to websockets/PubSub, etc.
- Minimongo should not have password hashes PubSub https://wekan.github.io/hall-of-fame/userbleed/
- PubSub uses Websockets, so you need those to be enabled at webserver like Caddy/Nginx/Apache etc, examples of settings
  at right menu of https://github.com/wekan/wekan/wiki
- Clientside https://github.com/wekan/wekan/tree/main/client/components subscribes to 
  PubSub https://github.com/wekan/wekan/tree/main/server/publications or calls meteor methods at https://github.com/wekan/wekan/tree/main/models
- For Admin:
  - You can have input field for password https://github.com/wekan/wekan/blob/main/client/components/cards/attachments.js#L303-L312
  - You can save password to database https://github.com/wekan/wekan/blob/main/client/components/cards/attachments.js#L303-L312
  - Check that only current user or Admin can change password https://github.com/wekan/wekan/blob/main/client/components/cards/attachments.js#L303-L312
    - Note that currentUser uses code like Meteor.user() in .js file
  - Do not have password hashes in PubSub https://github.com/wekan/wekan/blob/main/server/publications/users.js
  - Only show Admin Panel to Admin https://github.com/wekan/wekan/blob/main/client/components/settings/settingBody.jade#L3
- If there is a lot of data, use pagination https://github.com/wekan/wekan/blob/main/client/components/settings/peopleBody.js
- Only have limited amount of data published in PubSub. Limit in MongoDB query in publications how much is published. Too much could make browser too slow.
- Use Environment variables for any email etc passwords.
- But what if you would like to remove minimongo? And only use Meteor methods for saving? In that case, you don't have realtime updates,
  and you need to write much more code to load and save data yourself, handle any multi user data saving conflicts yourself,
  and many Meteor Atmospherejs.com PubSub using packages would not work anymore https://github.com/wekan/we

## PubSub: Fix that user can not change to Admin

- With PubSub, there is checking, that someone modifying Websockets content, like permission isAdmin, can not change to Admin.
- https://github.com/wekan/wekan/commit/cbad4cf5943d47b916f64b4582f8ca76a9dfd743
- https://wekan.github.io/hall-of-fame/adminbleed/

## Permissions and Roles

- For any user permissions, it's best to use Meteor package package https://github.com/Meteor-Community-Packages/meteor-roles .
- Currently WeKan has custom hardcoded permissions, WeKan does not yet use that meteor-roles package.
  - Using permissions at WeKan sidebar https://github.com/wekan/wekan/blob/main/client/components/sidebar/sidebar.js#L1854-L1875
  - List of roles https://github.com/wekan/wekan/wiki/REST-API-Role . Change at board or Admin Panel. Also Organizations/Teams.
  - Worker role: https://github.com/wekan/wekan/issues/2788
  - Not implemented yet: Granular Roles https://github.com/wekan/wekan/issues/3022
- Check is user logged in, with `if (Meteor.user()) {`
- Check is code running at server `if (Meteor.isServer()) {` or client `if Meteor.isClient()) {` .
- Here is some authentication code https://github.com/wekan/wekan/blob/main/server/authentication.js

## Environment variables

- For any passwords, use environment variables, those are serverside
- Do not copy environment variable to public variable that is visible browserside https://github.com/wekan/wekan/blob/main/server/max-size.js

```
Meteor.startup(() => {
  if (process.env.HEADER_LOGIN_ID) {
    Meteor.settings.public.attachmentsUploadMaxSize   = process.env.ATTACHMENTS_UPLOAD_MAX_SIZE;
    Meteor.settings.public.attachmentsUploadMimeTypes = process.env.ATTACHMENTS_UPLOAD_MIME_TYPES;
    Meteor.settings.public.avatarsUploadMaxSize       = process.env.AVATARS_UPLOAD_MAX_SIZE;
```

- For serverside, you can set Meteor.settings.variablename, without text public
- For WeKan kanban, there is feature for setting board public, it can be viewed by anyone, there is realtime updates. But 
- Some of those permissions are checked at users.js models at https://github.com/wekan/wekan/tree/main/models
- Environment variables are used for email server passwords, etc, at all platforms https://github.com/wekan/wekan/commit/a781c0e7dcfdbe34c1483ee83cec12455b7026f7

## Escape HTML comment tags so that HTML comments are visible

- Someone reported, that it is problem that content of HTML comments in edit mode, are not visible at at view mode, so this makes HTML comments visible.
- https://github.com/wekan/wekan/commit/167863d95711249e69bb3511175d73b34acbbdb3
- https://wekan.github.io/hall-of-fame/invisiblebleed/

## Attachments: XSS in filename is sanitized

- https://github.com/wekan/wekan/blob/main/client/components/cards/attachments.js#L303-L312
- https://wekan.github.io/hall-of-fame/filebleed/

## Brute force login protection

- https://github.com/wekan/wekan/commit/23e5e1e3bd081699ce39ce5887db7e612616014d
- https://github.com/wekan/wekan/tree/main/packages/wekan-accounts-lockout

### Sandstorm Wekan Security

On Sandstorm platform using environment variable Standalone Wekan features like Admin Panel etc are
turned off, because Sandstorm platform provides SSO for all apps running on Sandstorm. 

[Sandstorm](https://sandstorm.io) is separate Open Source platform that has been
[security audited](https://sandstorm.io/news/2017-03-02-security-review) and found bugs fixed.
Sandstorm also has passwordless login, LDAP, SAML, Google etc auth options already.
At Sandstorm code is read-only and signed by app maintainers, only grain content can be modified.
Wekan at Sandstorm runs in sandboxed grain, it does not have access elsewhere without user-visible
PowerBox request or opening randomly-generated API key URL.
Also read [Sandstorm Security Practices](https://docs.sandstorm.io/en/latest/using/security-practices/) and
[Sandstorm Security non-events](https://docs.sandstorm.io/en/latest/using/security-non-events/).
For Sandstorm specific security issues you can contact [kentonv](https://github.com/kentonv) by email. 

## What Wekan bugs are eligible?

Any typical web security bugs. If any of the previously mentioned is somehow problematic and
a security issue, we'd like to know about it, and also how to fix it:

- Cross-site Scripting
- Open redirect
- Cross-site request forgery
- File inclusion
- Authentication bypass
- Server-side code execution

## What Wekan bugs are NOT eligible?

Typical already known or "no impact" bugs such as:

- [Wekan API old tokens not replaced correctly](https://github.com/wekan/wekan/issues/1437)
- Missing Cookie flags on non-session cookies or 3rd party cookies
- Logout CSRF
- Social engineering
- Denial of service
- SSL BEAST/CRIME/etc. Wekan does not have SSL built-in, it uses Caddy/Nginx/Apache etc at front.
  Integrated Caddy support is updated often.
- Email spoofing, SPF, DMARC & DKIM. Wekan does not include email server.

Wekan is Open Source with MIT license, and free to use also for commercial use.
We welcome all fixes to improve security by email to security@wekan.team

## Bonus Points

If your Responsible Security Disclosure includes code for fixing security issue,
you get bonus points, as seen on [Hall of Fame](https://wekan.github.io/hall-of-fame).
