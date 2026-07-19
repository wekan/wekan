## About Money: No bounty

There is no bounty, like described at [CONTRIBUTING.md](CONTRIBUTING.md),
because WeKan is NOT Big Tech. WeKan is FLOSS.

## Steps for Coordinated Vulnerability Disclosure

### 1. Security Researcher:

- **Report**: Click "New draft security advisory" at [WeKan Security Advisories](https://github.com/wekan/wekan/security/advisories).
  More info at [GitHub Docs about reporting privately](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/report-privately).
- **Proof of Concept (PoC)**: If possible, include a fix or a reproduction script/code.
- DO NOT EMAIL [security@wekan.fi](security-at-wekan.fi.asc), because:
  - Email is NOT secure or private.
  - Using GitHub directly verifies that:
    - You are:
      - Saving my time by filling all details at GitHub, so that I can easily click request CVE at GitHub
      - A correct GitHub user
      - Really reading this SECURITY.md
      - Knowing what you are doing
    - You are not:
      - Someone that tries to waste my time
      - Trying to impersonate as some other GitHub user
      - Spammer
      - Bot

### 2. WeKan Security Team:

- **Remediation**: Please wait for a new WeKan release that addresses the issue.
  Fixes are announced at the top of the [ChangeLog](https://github.com/wekan/wekan/blob/main/CHANGELOG.md).
- **Recognition**: We will acknowledge your contribution by adding you to our
  [Hall of Fame](https://wekan.fi/hall-of-fame/).
- **CVE Policy**: WeKan Security requests CVE at GitHub when releasing Security Advisory.

### 3. Post-Release and Public Disclosure:

- Advisories reported at GitHub are listed at [WeKan Security Advisories](https://github.com/wekan/wekan/security/advisories).
- DO NOT EMAIL [security@wekan.fi](security-at-wekan.fi.asc), because:
  - Email is NOT secure or private.
  - Using GitHub directly verifies that:
    - You are:
      - Saving my time by filling all details at GitHub, so that I can easily click request CVE at GitHub
      - A correct GitHub user
      - Really reading this SECURITY.md
      - Knowing what you are doing
    - You are not:
      - Someone that tries to waste my time
      - Trying to impersonate as some other GitHub user
      - Spammer
      - Bot

## Who can participate in the program

Anyone who reports a unique security issue in scope and does not disclose it to
a third party before we have patched, and is able to add
"New draft security advisory" at [WeKan Security Advisories](https://github.com/wekan/wekan/security/advisories).

## Which domains are in scope?

No public domains, because all those are donated to WeKan Open Source project,
and we don't have any permissions to do security scans on those donated servers.

Please don't perform research that could impact other users. Second, please keep
the reports short and succinct. If we fail to understand the logic of your bug, we will tell you.

You can [Install WeKan](https://wekan.fi/install/) on your own computer
and scan it's vulnerabilities there.

## About WeKan Versions

There are 2 versions of WeKan: Standalone WeKan, and Sandstorm WeKan.

## Meteor Security

https://guide.meteor.com/security

### Standalone WeKan Security

Standalone WeKan includes all non-Sandstorm platforms. Some Standalone WeKan platforms
like Snap and Docker have their own specific sandboxing etc features.

Standalone WeKan by default does not load any files from Internet, like fonts, CSS, etc.
This also means all Standalone WeKan functionality works in offline local networks.
WeKan is used in most countries of the world https://snapcraft.io/wekan
and by companies that have 30k users.

- WeKan private board attachments are not accessible without logging in.
- There is feature to set board public, so that board is visible without logging
  in readonly mode, with realtime updates.
- Admin Panel has feature to disable all public boards, so all boards are private.

## SSL/TLS

- SSL/TLS encrypts traffic between webbrowser and webserver.
- If you are thinking about TLS MITM, look at https://github.com/caddyserver/caddy/issues/2530
- Let's Encrypt TLS requires publicly accessible webserver, that Let's Encrypt TLS validation servers check.
- If firewall limits to only allowed IP addresses, you may need non-Let's Encrypt TLS cert.

## XSS

- DOMPurify https://www.npmjs.com/package/dompurify
  - WeKan uses DOMPurify npm package to filter for XSS at fields like cards, as you can see from
    [package.json](https://github.com/wekan/wekan/blob/main/package.json). Other used versions can be seen from
    [Meteor versions file](https://github.com/wekan/wekan/blob/main/.meteor/versions).
  - Forms can include markdown links, html, image tags etc like you see at https://wekan.fi .
  - It's possible to add attachments to cards, and markdown/html links to files.
  - DOMPurify cleans up viewed code, so JavaScript in input fields does not execute
    - https://wekan.fi/hall-of-fame/fieldbleed/
- Reaction in comment is now checked, that it does not have extra added code
  - https://wekan.fi/hall-of-fame/reactionbleed/
- https://github.com/wekan/wekan/blob/main/packages/markdown/src/template-integration.js#L76

## QA About PubSub

Q:

Hello,
I have just seen the Meteor DevTools Evolved extension and was wondering if anyone
had asked themselves the question of security.
Insofar as all data is shown in the minimongo tab in plain text.
How can data be hidden from this extension?

A:

## PubSub

- It is not a security issue to show text or images that the user has permission to see.
  It is a security issue, if browserside is some text or image that user should not see.
- Meteor has browserside minimongo database, made with JavaScript, updated with Publish/Subscribe, PubSub.
- Publish/Subscribe means, that realtime web framework reads database changes stream,
  and then immediately updates webpage, like dashboards, chat, kanban.
  That is the point of any realtime web framework in any programming language.
- Yes, you should check with Meteor DevTools Evolved Chromium/Firefox extension that
  at minimongo is only text that user has permission to see.
- Check as a logged-in user and as a logged-out user.
- Check permissions and sanitize before allowing some change, because someone could modify content of input field,
  PubSub/websocket data (for example with Burp Suite Community Edition), etc.
- If you have a REST API, also check that only those who have a login token and permission can view or edit text.
- You should not include any data user is not allowed to see. Not to webpage text, not to websockets/PubSub, etc.
- Minimongo should not have password hashes PubSub https://wekan.fi/hall-of-fame/userbleed/
- PubSub uses WebSockets, so you need those to be enabled on the webserver like Caddy/Nginx/Apache etc, examples of settings
  at right menu of https://github.com/wekan/wekan/wiki
- Clientside https://github.com/wekan/wekan/tree/main/client/components subscribes to
  PubSub https://github.com/wekan/wekan/tree/main/server/publications or calls meteor methods
  at https://github.com/wekan/wekan/tree/main/models
- For Admin:
  - You can have input field for password https://github.com/wekan/wekan/blob/main/client/components/cards/attachments.js#L303-L312
  - You can save password to database https://github.com/wekan/wekan/blob/main/client/components/cards/attachments.js#L303-L312
  - Check that only current user or Admin can change password https://github.com/wekan/wekan/blob/main/client/components/cards/attachments.js#L303-L312
    - Note that currentUser uses code like Meteor.user() in .js file
  - Do not include password hashes in PubSub https://github.com/wekan/wekan/blob/main/server/publications/users.js
  - Only show Admin Panel to Admin https://github.com/wekan/wekan/blob/main/client/components/settings/settingBody.jade#L3
- If there is a large amount of data, use pagination https://github.com/wekan/wekan/blob/main/client/components/settings/peopleBody.js
- Only publish a limited amount of data in PubSub. Limit in MongoDB query in publications how much is published. Too much could make browser too slow.
- Environment variables for email and other passwords.
- But what if you would like to remove Minimongo and only use Meteor methods for saving? In that case, you don't have realtime updates,
  and you need to write much more code to load and save data yourself, handle any multi user data saving conflicts yourself,
  and many Meteor Atmospherejs.com PubSub using packages would not work anymore https://github.com/wekan/we

## PubSub: Fix that user can not change to Admin

- With PubSub, there is checking, that someone modifying Websockets content, like permission isAdmin, can not change to Admin.
- https://github.com/wekan/wekan/commit/cbad4cf5943d47b916f64b4582f8ca76a9dfd743
- https://wekan.fi/hall-of-fame/adminbleed/

## Permissions and Roles

- For any user permissions, it's best to use Meteor package https://github.com/Meteor-Community-Packages/meteor-roles .
- Currently, WeKan has custom hardcoded permissions and does not yet use the meteor-roles package.
  - Using permissions at WeKan sidebar https://github.com/wekan/wekan/blob/main/client/components/sidebar/sidebar.js#L1854-L1875
  - List of roles: https://github.com/wekan/wekan/wiki/REST-API-Role . Change at board or Admin Panel. Also Organizations/Teams.
  - Worker role: https://github.com/wekan/wekan/issues/2788
  - Not implemented yet: Granular Roles https://github.com/wekan/wekan/issues/3022
- Check is user logged in, with `if (Meteor.user()) {`
- Check is code running at server `if (Meteor.isServer()) {` or client `if Meteor.isClient()) {` .
- Here is some authentication code https://github.com/wekan/wekan/blob/main/server/authentication.js

## Environment variables

- For any passwords, use environment variables; those are serverside
- Do not copy environment variables to public variables that are visible on the browserside https://github.com/wekan/wekan/blob/main/server/max-size.js

```
Meteor.startup(() => {
  if (process.env.HEADER_LOGIN_ID) {
    Meteor.settings.public.attachmentsUploadMaxSize   = process.env.ATTACHMENTS_UPLOAD_MAX_SIZE;
    Meteor.settings.public.attachmentsUploadMimeTypes = process.env.ATTACHMENTS_UPLOAD_MIME_TYPES;
    Meteor.settings.public.avatarsUploadMaxSize       = process.env.AVATARS_UPLOAD_MAX_SIZE;
```

- For serverside, you can set Meteor.settings.variablename, without text public
- For WeKan kanban, there is a feature for setting a board to public; it can be viewed by anyone, with realtime updates. But
- Some of those permissions are checked at users.js models at https://github.com/wekan/wekan/tree/main/models
- Environment variables are used for email server passwords, etc, at all platforms https://github.com/wekan/wekan/commit/a781c0e7dcfdbe34c1483ee83cec12455b7026f7

## Escape HTML comment tags so that HTML comments are visible

- Someone reported that it was a problem that the content of HTML comments in edit mode was not visible in view mode, so this change makes HTML comments visible.
- https://github.com/wekan/wekan/commit/167863d95711249e69bb3511175d73b34acbbdb3
- https://wekan.fi/hall-of-fame/invisiblebleed/

## Attachments: XSS in filename is sanitized

- https://github.com/wekan/wekan/blob/main/client/components/cards/attachments.js#L303-L312
- https://wekan.fi/hall-of-fame/filebleed/

### Attachments: Forced download to prevent stored XSS

- To prevent browser-side execution of uploaded content under the app origin, all attachment downloads are served with safe headers:
  - `Content-Type: application/octet-stream`
  - `Content-Disposition: attachment`
  - `X-Content-Type-Options: nosniff`
  - A restrictive `Content-Security-Policy` with `sandbox`
- This means attachments are downloaded instead of rendered inline by default. This mitigates HTML/JS/SVG based stored XSS vectors.
- Avatars and inline images remain supported but SVG uploads are blocked and never rendered inline.

## Users: Client update restrictions

- Client-side updates to user documents are limited to safe fields only:
  - `username`
  - `profile.*`
- Sensitive fields are blocked from any client updates and can only be modified by server methods with authorization:
  - `orgs`, `teams`, `roles`, `isAdmin`, `createdThroughApi`, `loginDisabled`, `authenticationMethod`, `services.*`, `emails.*`, `sessionData.*`
- Attempts to update forbidden fields from the client are denied.
- Admin operations like managing org/team membership or toggling flags must use server methods that check permissions.

## Voting: integrity and authorization

- Client updates to card `vote` fields are blocked to prevent forged votes and inconsistent policy enforcement.
- Voting is performed via a server method that enforces:
  - Authentication and board membership, or an explicit per-card flag allowing non-members to vote.
  - Only the caller's own userId is added/removed from `vote.positive`/`vote.negative`.
- This prevents members from fabricating other users' votes and ensures non-members cannot vote unless explicitly allowed.

## Planning Poker: integrity and authorization

- Client updates to card `poker` fields are blocked. All poker actions go through server methods that enforce:
  - Authentication and board membership for configuration and results.
  - For casting a poker vote, either board membership or an explicit per-card flag allowing non-members to participate.
  - Only the caller's own userId is added/removed from the selected estimation bucket (e.g., one, two, five, etc.).
- Methods cover setting/unsetting poker question/end, casting votes, replaying, and setting final estimation.

## Attachment API: authentication and DoS prevention

- The attachment API (`/api/attachment/*`) requires proper authentication using `X-User-Id` and `X-Auth-Token` headers.
- Authentication validates tokens by hashing with `Accounts._hashLoginToken` and matching against stored login tokens, preventing identity spoofing.
- Request handlers implement:
  - 30-second timeout to prevent hanging connections.
  - Request body size limits (50MB for uploads, 10MB for metadata operations).
  - Proper error handling and guaranteed response completion.
  - Request error event handlers to clean up failed connections.
- This prevents:
  - DoS attacks via concurrent unauthenticated or malformed requests.
  - Identity spoofing by using arbitrary bearer tokens or user IDs.
  - Resource exhaustion from hanging connections or excessive payloads.
- Access control: all attachment operations verify board membership before allowing access.

## Brute force login protection

- https://github.com/wekan/wekan/commit/23e5e1e3bd081699ce39ce5887db7e612616014d
- https://github.com/wekan/wekan/tree/main/packages/wekan-accounts-lockout

### Sandstorm WeKan Security

On the Sandstorm platform, Standalone WeKan features like the Admin Panel are turned off using environment variables, because Sandstorm platform provides SSO for all apps running on Sandstorm.

[Sandstorm](https://sandstorm.io) is a separate Open Source platform that has been
[security audited](https://sandstorm.io/news/2017-03-02-security-review) and found bugs fixed.
Sandstorm also has passwordless login, LDAP, SAML, Google, and other auth options already.
On Sandstorm, code is read-only and signed by app maintainers; only grain content can be modified.
WeKan on Sandstorm runs in a sandboxed grain; it does not have access elsewhere without a user-visible PowerBox request or opening a randomly-generated API key URL.
Also read [Sandstorm Security Practices](https://docs.sandstorm.io/en/latest/using/security-practices/) and
[Sandstorm Security non-events](https://docs.sandstorm.io/en/latest/using/security-non-events/).
For Sandstorm specific security issues you can contact [kentonv](https://github.com/kentonv) by email.

## What WeKan bugs are eligible?

Any typical web security bugs. If any of the previously mentioned is somehow problematic and
a security issue, we'd like to know about it, and also how to fix it:

- Cross-site Scripting
- Open redirect
- Cross-site request forgery
- File inclusion
- Authentication bypass
- Server-side code execution

## What WeKan bugs are NOT eligible?

Typical already-known or 'no impact' bugs such as:

- Social engineering
- Denial of service
- SSL BEAST/CRIME/etc. WeKan does not have SSL built-in; it uses Caddy/Nginx/Apache on the front end.

WeKan is Open Source with MIT license, and free to use also for commercial use.
