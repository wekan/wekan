## Issue

Pull requests are not accepted to https://github.com/wekan/wekan/pulls

Pull requests are accepted to next version of WeKan
https://github.com/wekan/wami/pulls
that are done according to design docs of Wami:
https://github.com/wekan/wami/blob/main/docs/Design/Design.md

There will be automatic upgrades from WeKan to Wami at Snap,
and info how to upgrade all WeKan platforms to Wami.

UPGRADE OR MIGRATE: https://github.com/wekan/wekan/blob/main/docs/Upgrade/Upgrade.md

Please report these issues elsewhere:

- SECURITY ISSUES, PGP EMAIL: https://github.com/wekan/wekan/blob/main/SECURITY.md
- UCS: https://github.com/wekan/univention/issues

If WeKan Snap is slow, try this: https://github.com/wekan/wekan/wiki/Cron

Please search existing Open and Closed issues, most questions have already been answered.

If you can not login for any reason: https://github.com/wekan/wekan/wiki/Forgot-Password
Email settings, only SMTP MAIL_URL and MAIL_FROM are in use:
https://github.com/wekan/wekan/wiki/Troubleshooting-Mail

### Server Setup Information

Please anonymize info, and do not any of your Wekan board URLs, passwords,
API tokens etc to this public issue.

* Did you test in newest Wekan?:
* Did you configure root-url correctly so Wekan cards open correctly (see https://github.com/wekan/wekan/wiki/Settings)?
* Operating System:
* Deployment Method (Snap/Docker/Sandstorm/bundle/source):
* Http frontend if any (Caddy, Nginx, Apache, see config examples from Wekan GitHub wiki first):
* Node.js Version:
* MongoDB Version:
* What webbrowser version are you using (Wekan should work on all modern browsers that support Javascript)?

### Problem description

Add a recorded animated gif (e.g. with https://github.com/phw/peek) about
how it works currently, and screenshot mockups how it should work.


#### Reproduction Steps



#### Logs

Check Right Click / Inspect / Console in you browser - generally Chromium
based browsers show more detailed info than Firefox based browsers.

Please anonymize logs.

Snap: sudo snap logs wekan.wekan

Docker: sudo docker logs wekan-app

If logs are very long, attach them in .zip file

