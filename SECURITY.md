Security is very important to us. If you discover any issue regarding security, please disclose
the information responsibly by sending an email to security (at) wekan.team and not by
creating a GitHub issue. We will respond swiftly to fix verifiable security issues.

We thank you with a place at our hall of fame page, that is
at https://wekan.github.io/hall-of-fame . Others have just posted public GitHub issue,
so they are not at that hall-of-fame page.

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
Wekan is used by companies that have [thousands of users](https://github.com/wekan/wekan/wiki/AWS) and at healthcare.

Wekan uses xss package for input fields like cards, as you can see from
[package.json](https://github.com/wekan/wekan/blob/devel/package.json). Other used versions can be seen from
[Meteor versions file](https://github.com/wekan/wekan/blob/devel/.meteor/versions).
Forms can include markdown links, html, image tags etc like you see at https://wekan.github.io .
It's possible to add attachments to cards, and markdown/html links to files.

Wekan attachments are not accessible without logging in. Import from Trello works by copying
Trello export JSON to Wekan Trello import page, and in Trello JSON file there is direct links to all publicly
accessible Trello attachment files, that Standalone Wekan downloads directly to Wekan MongoDB database in
[CollectionFS](https://github.com/wekan/wekan/pull/875) format. When Wekan board is exported in
Wekan JSON format, all board attachments are included in Wekan JSON file as base64 encoded text.
That Wekan JSON format file can be imported to Sandstorm Wekan with all the attachments, when we get
latest Wekan version working on Sandstorm, only couple of bugs are left before that. In Sandstorm it's not
possible yet to import from Trello with attachments, because Wekan does not implement Sandstorm-compatible
access to outside of Wekan grain.

Standalone Wekan only has password auth currently, there is work in progress to add
[oauth2](https://github.com/wekan/wekan/pull/1578), [Openid](https://github.com/wekan/wekan/issues/538),
[LDAP](https://github.com/wekan/wekan/issues/119) etc. If you need more login security for Standalone Wekan now,
it's possible add additional [Google Auth proxybouncer](https://github.com/wekan/wekan/wiki/Let's-Encrypt-and-Google-Auth) in front of password auth, and then use Google Authenticator for Google Auth. Standalone Wekan does have [brute force protection with eluck:accounts-lockout and browser-policy clickjacking protection](https://github.com/wekan/wekan/blob/devel/CHANGELOG.md#v080-2018-04-04-wekan-release). You can also optionally use some [WAF](https://en.wikipedia.org/wiki/Web_application_firewall)
like for example [AWS WAF](https://aws.amazon.com/waf/).

[All Wekan Platforms](https://github.com/wekan/wekan/wiki/Platforms)

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

- Brute force password guessign. Currently there is
  [brute force protection with eluck:accounts-lockout](https://github.com/wekan/wekan/blob/devel/CHANGELOG.md#v080-2018-04-04-wekan-release).
- Security issues related to that Wekan uses Meteor 1.6.0.1 related packages, and upgrading to newer
  Meteor 1.6.1 is complicated process that requires lots of changes to many dependency packages.
  Upgrading [has been tried many times, spending a lot of time](https://github.com/meteor/meteor/issues/9609)
  but there still is issues. Helping with package upgrades is very welcome.
- [Wekan API old tokens not replaced correctly](https://github.com/wekan/wekan/issues/1437)
- Missing Cookie flags on non-session cookies or 3rd party cookies
- Logout CSRF
- Social engineering
- Denial of service
- SSL BEAST/CRIME/etc. Wekan does not have SSL built-in, it uses Caddy/Nginx/Apache etc at front.
  Integrated Caddy support is updated often.
- Email spoofing, SPF, DMARC & DKIM. Wekan does not include email server.

Wekan is Open Source with MIT license, and free to use also for commercial use.
We welcome all fixes to improve security by email to security (at) wekan.team .

## Bonus Points

If your Responsible Security Disclosure includes code for fixing security issue,
you get bonus points, as seen on [Hall of Fame](https://wekan.github.io/hall-of-fame).
