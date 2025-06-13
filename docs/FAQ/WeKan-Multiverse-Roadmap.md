## What is not Cross-Platform

- Requires CPU to support AVX
  - Bun Javascript Engine https://bun.sh
  - MongoDB 5.x and newer https://github.com/turnkeylinux/tracker/issues/1724#issuecomment-2351544191
- Does not work at s390x
  - Bun Javascript Engine https://github.com/oven-sh/bun/issues/2632
  - Deno Javascript Engine https://github.com/denoland/deno/issues/20212#issuecomment-1756663943
  - Lazarus IDE https://www.lazarus-ide.org
    - FreePascal programming language https://www.freepascal.org
  - TigerBeetle database https://github.com/tigerbeetle/tigerbeetle/issues/2241

## What is Cross-Platform

- Works at s390x
  - Programming languages
    - Node.js https://nodejs.org https://github.com/wekan/ferretdb/tree/main/node-deno-bun (not Deno or Bun)
    - C89 https://github.com/xet7/darkesthour
    - PHP https://github.com/wekan/php
    - Go  https://github.com/wekan/wekango
    - Tcl/Tk
  - Web Frameworks
    - V veb https://github.com/vlang/v/issues/18737
    - Gambas https://github.com/wekan/hx/tree/main/prototypes/ui/gambas
    - Python Py4Web https://py4web.com
    - Ruby on Rails https://github.com/werot
    - WeKan Studio  https://github.com/wekan/wekanstudio
- Works at AmigaOS 3.x/4.x/MorphOS/AROS, Win/Mac/Linux
  - Web frameworks
    - FreePascal https://github.com/wekan/wami
- GUI
  - BBC Basic https://www.bbcbasic.net/wiki/doku.php?id=converting_20programs_20from_20risc_20os_20to_20windows
  - Godot https://godotengine.org , https://github.com/godotengine/godot
  - Redot https://www.redotengine.org , https://github.com/Redot-Engine/redot-engine
  - HaxeUI https://haxeui.org

## Prototype Strategy

- Try building many prototypes, see what works
- https://en.wiktionary.org/wiki/throw_things_at_the_wall_and_see_what_sticks

## Future

- Will this happen? With what tech? See https://github.com/wekan/wekan/blob/main/FUTURE.md
- You can comment at https://github.com/wekan/wekan/issues/4578
- You can help by sending PR to any prototype repo mentioned below

## Wishes to all web frameworks

- Documentation about how to upgrade, all required steps. Or alternatively, a script that does changes required to upgrade.
- Using parts of frameworks as separate packages, like:
  - Authentication, like OAuth2, Gmail, etc
- Option to not use websockets, because at some corporate networks do not allow them.
- Option to not have Javascript at frontend, having SSR only. Working with and without Javascript at frontend, like ufront did.
  - https://github.com/ufront/ufront
  - https://jasono.co/2020/10/03/im-going-to-write-a-web-app-framework-again-maybe-well-see/
  - Please do not discontinue HTML (no Javascript) version https://news.ycombinator.com/item?id=37558372
- Storing session to database, for round robin
  - https://github.com/wekan/wekan/issues/5120
  - https://stackoverflow.com/questions/65547266/how-to-store-my-session-mysql-with-express-mysql-session
- Not having build step:
  - Keep all files at directories they currently are, with understandable directory structure naming, like:
    - Feature name
      - Feature part name 1
      - Feature part name 2
  - Only use file from it's location on page where it is needed
  - Cache dependencies. Make possible coding offline.
  - Do not uglify
  - https://world.hey.com/dhh/you-can-t-get-faster-than-no-build-7a44131c
    - Rails World Opening Keynote by DHH
      - https://www.youtube.com/watch?v=iqXjGiQ_D-A
      - https://news.ycombinator.com/item?id=37843951
      - https://news.ycombinator.com/item?id=37897921
  - I merged all branches to one main branch, because merging between branches did take a lot of time.
  - Do not use linters like eslint and prettier. What I did, is I removed all linters, like eslint, prettier etc, because they did disagree about syntax. Point is to make to code minimal change, that fixes something, or adds some feature. Not that most commits would be about fixing syntax.
    - https://matt-rickard.com/why-is-the-frontend-stack-so-complicated
    - https://news.ycombinator.com/item?id=37895164
    - https://deno.com/blog/node-config-hell
- How to not become slow and unresponsive after a week https://github.com/wekan/wekan/issues/5140
  - Run code like CGI, release all memory
- Looking for most cross-platform web frameworks, supporting many different CPU, OS and database. 
- Both On-Premise AND MultiCloud possible
  - https://github.com/serverless/multicloud
  - https://github.com/xet7/multicloud
- License: MIT and other https://copyfree.org

## List of realtime web frameworks

- Meteor
  - https://www.meteor.com
  - https://github.com/meteor/meteor
- Helene
  - Forum Post https://forums.meteor.com/t/helene-a-lightweight-real-time-web-framework-for-node-js-and-bun/60626
  - Repo https://github.com/leonardoventurini/helene
  - Discussions https://github.com/leonardoventurini/helene/discussions
  - NPM package https://www.npmjs.com/package/helene
  - Discord https://discord.com/invite/PbY36PU75C
- Any others?

## Screenshot

Supporting many more webbrowsers:

<img src="https://wekan.github.io/manybrowser.png" width="100%" alt="Multiverse WeKan screenshot" />

## Talks

- Maintainer of WeKan since December 2016, xet7 (Lauri Ojansivu), about WeKan Multiverse at EU NGI Dapsi https://www.youtube.com/watch?v=BPPjiZHVeyM
- https://dapsi.ngi.eu/20-new-solutions-to-bring-the-power-of-data-back-to-peoples-hands/
- https://dapsi.ngi.eu/hall-of-fame/multiverse/
- WeKan Open Source kanban: add multiple Import/Export/Sync options and UI Designer, making it possible to create any app.

## Roadmap

From https://github.com/wekan/wekan/issues/4578#issuecomment-1407769397

## Standards

- Web Sustainability Guidelines (WSG) 1.0 at a Glance
  - https://w3c.github.io/sustyweb/glance.html
  - Minimize size, support all devices https://w3c.github.io/sustyweb/#benefits-90
- Other standards? https://news.ycombinator.com/item?id=36675451

## Browsers developed for therapy reasons

Are you fed up? Need some therapy? Write a webbrowser!

- Gosub
  - https://adayinthelifeof.nl/2023/09/22/browsers.html
  - Repo https://github.com/jaytaph/gosub-browser
  - https://codemusings.nl/@jaytaph/p/MQpHToAx8c1KXyU98Auip4
  - https://news.ycombinator.com/item?id=37608580
- Ladybird
  - https://www.ladybird.dev
  - Repo https://github.com/SerenityOS/serenity/tree/master/Ladybird

## Browsers that have Javascript

- Use Javascript to add drag-drop etc Javascript features, and hide UI elements like buttons etc that are for non-Javascript

## Browsers without using Websockets

- Maybe with long poll. Or no live update, require webpage reload.
- For internal corporate networks where websockets are not allowed

## Browsers that do not support Javascript

or have Javascript disabled for security reasons.

- Netsurf https://www.netsurf-browser.org/downloads/ , Development Builds https://ci.netsurf-browser.org/builds/
  - RISC OS https://www.riscosopen.org/content/downloads , https://www.riscosdev.com/direct/
  - ReactOS https://reactos.org , https://github.com/howinfo/howinfo/wiki/ReactOS
  - Redox OS https://www.redox-os.org
  - Haiku, Linux, Windows, Amiga, Atari etc       
- Amiga: AWeb, iBrowse
- Dillo Webbrowser at FreeDOS https://github.com/wekan/wekan/issues/4578#issuecomment-1248525591
- Netscape, IE, etc all browsers at all OS/CPU
- FreeDOS: Dillo, Arachne
- Text based browsers: Lynx, Links, w3m (sudo apt-get install w3m w3m-img)
- Ancient browsers:
  - http://9p.sdf.org/who/tweedy/ancient_browsers/
  - https://news.ycombinator.com/item?id=34981257

## Browsers that are programmable

- Nyxt
  - https://github.com/atlas-engineer/nyxt

## Support more databases

- SQLite
- PostgreSQL
- Migrations between databases
- Using many databases at the same time
- Offline or Local-First
  - https://news.ycombinator.com/item?id=37584049
  - https://news.ycombinator.com/item?id=37488034

## Graphics

- Raphael JS, supports also many legacy browsers, with VML and SVG graphics https://dmitrybaranovskiy.github.io/raphael/ 
- Related forked repos for various graphics at https://github.com/raphaeljsorg
- Or alternatively, just use HTML4, images, imagemaps etc to be compatible to non-Javascript browsers

## Programming language alternatives

- Optionally, use some transpiler:
  - https://en.wikipedia.org/wiki/Source-to-source_compiler
  - Haxe https://haxe.org , with HaxeUI [GUI/WebUI](http://haxeui.org/) and [TUI](https://github.com/haxeui/haxeui-pdcurses)
  - Wax https://github.com/xet7/wax
  - Nim https://nim-lang.org
  - V https://vlang.io
  - Maybe transpiling UI to/from HaxeUI XML, HTML4, HTML5, Gopher, Gemini, Lazarus, Gambas, Godot, MUI/ZUI Amiga/AROS

- Cross-platform:
  - C89 code for 30+ OS/CPU like at https://github.com/xet7/darkesthour
  - Pascal code with TRSE https://lemonspawn.com/turbo-rascal-syntax-error-expected-but-begin/
- Embedded webserver, for example:
  - C https://github.com/wekan/hx/blob/main/prototypes/code/webserver/works/c/server.c
  - Sandstorm https://sandstorm.io , https://github.com/sandstorm-io/sandstorm
  - Rust https://github.com/dwrensha/sandstorm-rawapi-example-rust
    - C++ https://github.com/dwrensha/sandstorm-rawapi-example
- Try to avoid strange NPM packages
  - https://marvinh.dev/blog/speeding-up-javascript-ecosystem-part-6/

## Benchmarks

- For selecting programming language:
- https://github.com/wekan/hx/tree/main/prototypes/code/webserver
- https://forums.meteor.com/t/performance-tests-between-meteor-3-meteor-2-help-on-format/60458
- https://www.techempower.com/benchmarks/
- https://github.com/TechEmpower/FrameworkBenchmarks/tree/master/frameworks

## Screenshot of Multiverse WeKan at FreeDOS Dillo

![freedos-dillo](https://user-images.githubusercontent.com/15545/190492967-f2770d0e-86a1-4822-93e7-68c65b23d6c4.png)

## Screenshot of Multiverse WeKan at Netsurf

### Group and count by first character of board names

From https://github.com/wekan/wekan/issues/4578#issuecomment-1250143726

When there is a lot of boards, it is very useful to group by first character of board (and after that click charater to see list of boards for that character, to be added later). I could not figure out how to do it with MongoDB aggregate query. Here is how I did it with SQLite, for type board. SQLite returns results immediately. Note that emojis, UTF-8 shows also on Netsurf browser. TODO is to figure out, could I get these visible also in FreeDOS Dillo browser.
```
SELECT _id, substr(title,1,1), COUNT(*), type from boards
WHERE type=:type GROUP BY substr(title,1,1) ORDER BY substr(title,1,1) ASC;
```
Actually, somewhere I saved answer from ChatGPT or Bing AI search, what this SQL query using MongoDB Javascript syntax. So maybe I should ask again.

https://github.com/wekan/php/blob/main/page/allboardschar.php

![wekan-allboardschar](https://user-images.githubusercontent.com/15545/190877008-ec8a035b-10d4-432a-b3cb-581983b5e24e.png)

## Prototypes

### Redbean

- Currently xet7 actively working with this prototype: https://github.com/wekan/wekanstudio
- https://redbean.dev
- Minimal kanban board drag drop example
  - Repo https://github.com/wekan/hx/tree/main/prototypes/code/webserver/works/fullmoon
  - Redbean amd64 binary works at Win/Mac/Linux/BSD/BIOS without any modifications, because it is based on Cosmopolitan https://github.com/jart/cosmopolitan
  - Uses HTMX https://htmx.org at UI
  - Saves to SQLite database
- Petclinic fork, using Blink to run at s390x https://github.com/wekan/wekan/wiki/s390x#petclinic-s390x

### PHP

- Repo https://github.com/wekan/php
- Features:
  - Some webpages compatible with all browsers
  - SQLite list all boards with first character, show board with some data
  - MongoDB test for newer MongoDB
  - upload file(s)  with drag-drop, for upcoming feature https://github.com/wekan/wekan/issues/2936
  - RTL https://github.com/wekan/wekan/issues/3376#issuecomment-1243922087
- Not yet: Login, Move card

### Gambas

- Repo https://github.com/wekan/hx/tree/main/prototypes/ui/gambas
- Features: Login, dropdown menu structure, SQLite database
- Not yet: Show board
- Problems: Gambas login page etc requires Javascript, does not work in Netsurf

### Meteor SSR

- https://github.com/wekan/we
- Features:
  - Only serverside rendering. Javascript removed removed from frontend.
  - Only test webpage. No actual features.

### Node.js 20, Bun and Deno
- Repo https://github.com/wekan/ferretdb/tree/main/node-deno-bun
- Features:
  - main.js makes database queries to many databases
  - Database drivers:
    - MongoDB driver for Legacy MongoDB 3.2.x, using MongoDB from `sudo snap install wekan`
    - MongoDB driver for newest MongoDB included, using MongoDB 6.x from rebuild-wekan.sh from https://github.com/wekan/wekan
    - FerretDB proxy to PostgreSQL, from docker-compose.yml
    - FerretDB proxy to SQLite, from docker-compose.yml
- Bun size is about 93 MB
- Deno size is usually about 350 MB https://github.com/wekan/wekan-node20/releases , but from source built Linux arm64 is 1.1 GB because of some bug somewhere.
- Deno also includes Node.js as Deno's Node.js compatibility layer.
- Node.js supports many CPU/OS
  - Node.js is used in production and has traceability. https://changelog.com/jsparty/294
  - https://github.com/wekan/wekan/wiki/s390x
  - https://nodejs.org/dist/latest-v20.x/
  - https://github.com/wekan/node-v14-esm/releases/tag/v14.21.4

### Haxe

- https://haxe.org
- Hello world example
  - Repo https://github.com/wekan/hx/blob/main/prototypes/code/hello
  - Transpiled with Haxe to many programming languages
- Tinkweb
  - Repo https://github.com/wekan/hx/tree/main/prototypes/ui/tinkweb
  - Has router and webpage
  - Transpiles to PHP and Node.js

### FreePascal

- Repo https://github.com/wekan/wami
  - Some static pages. At upload page, uploading file now works.
- Previous:
  - Repo https://github.com/wekan/hx/tree/main/prototypes/code/webserver/works/freepascal-router
  - Router and some webpage
- Works at many retro and modern OS, but not at s390x that FreePascal does not support yet https://wiki.freepascal.org/ZSeries

### FreeDOS and Bash

- Repo https://github.com/wekan/wedos
- Features:
  - DOS: .bat script, that shows menu, and uses SQLite DOS version to make queries to WeKan SQLite database
  - Bash: .sh script, that shows menu, and uses SQLite CLI to make queris to WeKan SQLite database

### Minio

- Repo: https://github.com/wekan/minio-metadata
- Features:
  - Uses Bash script and CLI binaries to migerate text data and attachments from MongoDB to SQLite and Minio
  - There is Node.js, Go etc drivers for using Minio

### CloudFlare Workers

- Developing
  - https://developers.cloudflare.com/pages/framework-guides/
  - https://developers.cloudflare.com/pages/
  - https://developers.cloudflare.com/workers/
  - https://developers.cloudflare.com/pages/platform/language-support-and-tools/
  - https://miniflare.dev
  - https://blog.cloudflare.com/workers-playground/
- D1 SQLite
  - https://developers.cloudflare.com/d1/platform/community-projects/#d1-adapter-for-kysely-orm
  - https://blog.cloudflare.com/d1-open-beta-is-here/
  - https://blog.cloudflare.com/introducing-d1/
  - https://www.cloudflare.com/developer-platform/d1/
  - https://blog.cloudflare.com/hyperdrive-making-regional-databases-feel-distributed/
- Northwind Traders example
  - https://northwind.d1sql.com
  - https://github.com/cloudflare/d1-northwind
  - https://github.com/xet7/d1-northwind
- Kysely Query builder for D1 SQLite database
  - https://codedamn.com/news/product/dont-use-prisma
  - https://news.ycombinator.com/item?id=37804072
  - https://kysely.dev
  - https://github.com/kysely-org/kysely
  - https://www.npmjs.com/package/kysely
  - Awesome Kysely https://github.com/kysely-org/awesome-kysely
  - Older database examples: https://github.com/cloudflare/db-connect
- Hono
  - https://blog.yusu.ke/hono-htmx-cloudflare/
  - https://news.ycombinator.com/item?id=37165054
  - https://github.com/yusukebe/hono-htmx
  - https://github.com/xet7/hono-htmx
  - https://developers.cloudflare.com/pages/framework-guides/
- WebGPU
  - https://blog.cloudflare.com/webgpu-in-workers/
  - https://news.ycombinator.com/item?id=37673999
- CloudFlare TV https://cloudflare.tv
- CloudFlare https://cloudflare.com
- TODO example with KV https://github.com/wekan/cloudflare-workers-todos

### Swap microframework, vs HTMX

- https://github.com/josephernest/Swap
- https://news.ycombinator.com/item?id=35991783

### Ruby on Rails

- https://github.com/wekan/weror . Password register and login works, there is workspaces and dragging cards, but no user management etc features yet.