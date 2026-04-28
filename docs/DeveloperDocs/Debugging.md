## Maximum Call Stack Size Exceeded

https://github.com/wekan/wekan/issues?q=is%3Aissue+maximum+call+stack+is%3Aclosed

https://stackoverflow.com/questions/75869629/ios-websocket-close-and-error-events-not-firing

This can happen, when there is too much or incompatible code at browserside, for example at iOS Safari.

To fix it:

1. Move ExcelJS from browserside to run at serverside https://github.com/wekan/wekan/pull/3871
2. Use Bundle Visualizer to see what is the size of dependencies, and try what can be moved to serverside like at step 1, that bundle visualizer is used in this script https://github.com/wekan/wekan/blob/main/rebuild-wekan.sh
```
meteor run --exclude-archs web.browser.legacy,web.cordova --port 4000 --extra-packages bundle-visualizer --production  2>&1 | tee ../log.txt
```
3. Make dependencies smaller. For example, use only required files, and do not include all dependencies: https://github.com/wekan/wekan/commit/23e5e1e3bd081699ce39ce5887db7e612616014d . In that commit, package was forked to packages directory, then renamed, and added with `meteor add packagename`, where package name does not have character `:`
4. Use Browserstack.com to see errors at browser / inspect / console, or use iOS or other device emulators, to see error messages. Testing at real device is more important, because they could work differently than emulators, emulators sometimes do not emulate all same features. Those error messages have file where error happened, and line number, like `something.js:301` . From there, scroll up a little, look at what function or what package dependency it is where it happened. If possible, try to move that package serverside, like at step 1. Or alternatively, look is it possible to remove or change to some other compatible dependency.
5. See what are the dependencies at your Meteor based software, compared to WeKan dependencies that are usually already upgraded to newest Meteor, is there any differences where changing to correct dependencies could help you to upgrade to newest Meteor:
  - https://github.com/wekan/wekan/blob/main/package.json
  - https://github.com/wekan/wekan/blob/main/.meteor/packages
  - https://github.com/wekan/wekan/blob/main/.meteor/versions
  - https://github.com/wekan/wekan/blob/main/.meteor/release
5. If you get some errors, search are those same already fixed in WeKan/Meteor/RocketChat, could you fix them same way:
  - https://github.com/wekan/wekan/blob/main/CHANGELOG.md
  - https://github.com/wekan/wekan/issues
  - https://github.com/wekan/wekan/issues?q=is%3Aissue+is%3Aclosed
  - https://github.com/meteor/meteor/issues
  - https://github.com/meteor/meteor/issues?q=is%3Aissue+is%3Aclosed
  - https://github.com/RocketChat/Rocket.Chat/issues
  - https://github.com/RocketChat/Rocket.Chat/issues?q=is%3Aissue+is%3Aclosed
6. If you have some webserver providing SSL/TLS, check that you have websockets enabled:
  - https://github.com/wekan/wekan/wiki/Caddy-Webserver-Config
  - https://github.com/wekan/wekan/wiki/Nginx-Webserver-Config
  - https://github.com/wekan/wekan/wiki/Apache
  - OpenLiteSpeed https://github.com/wekan/wekan/issues/3334#issuecomment-723651328
  - https://github.com/wekan/wekan/wiki/Local-self-signed-TLS
  - https://github.com/wekan/wekan/wiki/Traefik-and-self-signed-SSL-certs

## OLD: TODO

[Quote from advise](https://github.com/meteor/meteor/issues/9796#issuecomment-443520767):

> Identify the core service your app is providing and make sure it is running independently. Put everything non-critical, including reporting, on some other system.

[Look at scaling tips here](https://github.com/meteor/meteor/issues/9796#issuecomment-411373831), quote:

> smeijer commented 25 days ago
> Just wanted to let know that I haven't experienced this issue anymore since I've replaced a lot of `meteor publications` with `apollo/graphql requests`.
> 
> The reactivity is thereby lost, but in my case a 30sec poll is also fine. On the places that I do require reactivity, I only `publish` a single `timestamp`. This timestamp is passed through to `apollo`, which triggers a `refetch` when the timestamp is changed.
>
> The [discussion here](https://forums.meteor.com/t/implementing-livedocument-as-an-alternative-to-livequery-discussion/40152) has also been helpfull to improve performance here and there.

[Rocket.Chat scaling tips](https://rocket.chat/docs/installation/manual-installation/multiple-instances-to-improve-performance/)

## Kadira

- https://github.com/edemaine/kadira-compose
- https://github.com/meteor/meteor-apm-agent
- https://github.com/kadira-open/kadira-server
- https://www.gethappyboards.com/2017/07/rolling-out-your-own-instance-of-kadira/

## Finding memory leaks

**[Collect a heap profile and then analyze it](https://github.com/v8/sampling-heap-profiler)**

[Older article: How to Self Detect a Memory Leak in Node](https://www.nearform.com/blog/self-detect-memory-leak-node/)

## 100% CPU usage

1) Increase ulimit system wide to 100 000 in systemd config.

2) Wekan Javascript code has [increaded fiber poolsize](https://github.com/wekan/wekan/blob/main/server/authentication.js#L5-L9).

3) There is [on-going 100% CPU usage Meteor issue](https://github.com/meteor/meteor/issues/9796#issuecomment-400079380) and hopefully [fixes to Node.js will land in Node v8.12](https://github.com/nodejs/node/pull/21593#issuecomment-403636667) sometime. Node 8.12 is now released and official version included at Wekan.

## Scaling to thousands of users

[Production setup at AWS](AWS)

## Current versions of dependencies

[Dockerfile](https://github.com/wekan/wekan/blob/main/Dockerfile), versions of Meteor.js, Node etc listed at beginning.

[Included Meteor packages](https://github.com/wekan/wekan/blob/main/.meteor/packages)

[Included Meteor package versions](https://github.com/wekan/wekan/blob/main/.meteor/versions)

[Added packages at package.json](https://github.com/wekan/wekan/blob/main/package.json)

## Build from source

Wekan:
- On any x64 hardware that has Ubuntu 14.04 or Debian 9 or newer installed directly or in VM:
[Build from source scripts](https://github.com/wekan/wekan-maintainer/tree/master/virtualbox)

Wekan for Sandstorm:
- Install above Wekan from source
- Install [Sandstorm locally](https://sandstorm.io/install) with `curl https://install.sandstorm.io | bash`, select dev install
- Install [meteor-spk](https://github.com/sandstorm-io/meteor-spk)
- Get 100% CPU issue fibers fixed node, and copy it to spk directory:<br />
`wget https://releases.wekan.team/node`<br />
`chmod +x node`<br />
`mv node ~/projects/meteor-spk/meteor-spk-0.4.0/meteor-spk.deps/bin/`
- Add to your /home/username/.bashrc : <br /> `export PATH=$PATH:$HOME/projects/meteor-spk/meteor-spk-0.4.0`
- Close and open your terminal, or read settings from .bashrc with<br />`source ~/.bashrc`
- `cd wekan && meteor-spk dev`
- Then Wekan will be visible at local sandstorm at http://local.sandstorm.io:6080/
- Sandstorm commands: `sudo sandstorm`. [Release scripts](https://github.com/wekan/wekan-maintainer/tree/master/releases). Official releases require publishing key that only xet7 has.

Docker:
- `git clone https://github.com/wekan/wekan`
- `cd wekan`
- Edit docker-compose.yml script ROOT_URL etc like documented at https://github.com/wekan/wekan-mongodb docker-compose.yml script
- `docker-compose up -d --build`