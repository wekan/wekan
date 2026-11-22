# Admin Panel / Settings / Version

## What it is

The **first** pane of Settings, and the one that opens with the Admin Panel: what
this WeKan is running - the WeKan version, how it was installed, the operating
system, Meteor, the database and Node.js. It is what an admin usually comes here
to read, or to paste into an issue. A **Check Version** button compares it with
the newest released versions.

It used to be a tab of its own in the Admin Panel bar, with a one-entry left menu.
A page whose menu had a single entry was a page in name only, so it became this
pane; the old `/information` URL redirects to Settings.

## Read more

- [Software versioning](https://en.wikipedia.org/wiki/Software_versioning) on
  Wikipedia.
- [Meteor](https://docs.meteor.com/), [Node.js](https://en.wikipedia.org/wiki/Node.js),
  [MongoDB](https://en.wikipedia.org/wiki/MongoDB) and
  [FerretDB](https://www.ferretdb.io/) - what the rows describe.
- MongoDB's [replica set oplog](https://www.mongodb.com/docs/manual/core/replica-set-oplog/)
  and [change streams](https://www.mongodb.com/docs/manual/changeStreams/) -
  two of the three reactivity modes.
- [Uptime](https://en.wikipedia.org/wiki/Uptime) on Wikipedia.
- [Databases](../../../Databases/) — MongoDB and FerretDB, and migrating between
  them.
- [Problems / CPU usage](../Problems/CPU-usage.md) — when the database is the
  reason pages are slow.

## How to use it

**Read what this WeKan is running**

1. Open **Admin Panel**. Settings / **Version** opens first
   (`/admin/settings/version`).
2. Read the table. It is one table of two equal columns in five groups:
   - **Platform** — WeKan ® Version, and **Package**: how it was installed
     (`bundle.zip`, `Snap`, `Docker` or `Sandstorm`).
   - **OS** — type, platform, architecture, release, uptime, load average,
     total memory, free memory and CPU count.
   - **Meteor** — Meteor version, the live **Reactivity mode** (changeStreams /
     oplog / polling), the configured **Reactivity order**
     (`METEOR_REACTIVITY_ORDER`) and the **DDP transport** (`DDP_TRANSPORT`).
   - **Database** — type (MongoDB or FerretDB v1), the MongoDB compatible
     version, the database commit, the FerretDB version and commit (only on
     FerretDB), the storage engine, whether the oplog is enabled, and the Mongo
     sessions count.
   - **Node** — Node version, and the V8 heap and memory figures.
3. Copy the table into an issue when asking for help.

**Check for a newer version**

1. Press **Check Version**. While it runs it says *Loading, please wait.*
2. It shows the newest WeKan, FerretDB, Meteor, Node and NPM versions, one per
   line. If the check fails - offline, a timeout, an answer that is not a
   version list - it shows one translated failure message and nothing from the
   reply.

## How the numbers are calculated

All values come from the site-admin-only method `getStatistics` in
[server/statistics.js](../../../../server/statistics.js), read once when the
pane opens:

- **Versions**: WeKan from `package.json` (`v` removed), Meteor from
  `Meteor.release` (`METEOR@` removed), Node from `process.version`.
- **Package**: `detectPackaging()` in
  [models/lib/platformPackaging.js](../../../../models/lib/platformPackaging.js),
  most specific first: `WEKAN_PACKAGING` when set, then Sandstorm, then `Snap`
  when `SNAP` or `SNAP_NAME` is set, then `Docker` when `/.dockerenv` or
  `/run/.containerenv` exists, else `bundle.zip`.
- **OS Uptime**: `os.uptime()` seconds, shown as days, hours, minutes and
  seconds (each part only when above zero).
- **OS Load Average**: the three `os.loadavg()` values (1, 5 and 15 minutes),
  each to two decimals.
- **Memory and heap sizes**: bytes from `os.totalmem()`, `os.freemem()`,
  `v8.getHeapStatistics()` and `process.memoryUsage()`, shown with the
  `filesize` library. **OS CPU Count** is the length of `os.cpus()`.
- **Reactivity mode**: `oplog` when Meteor has an active oplog handle
  (`changeStreams` when that handle is a change-stream one), else `polling`.
  **Reactivity order** and **DDP transport** are the environment variables,
  `(unset)` when empty.
- **Database type**: FerretDB when the `buildInfo` reply carries `ferretdb`,
  `ferretdbVersion` or `ferretdbFeatures`, else MongoDB. Version and commit are
  `buildInfo.version` and `buildInfo.gitVersion`.
- **Storage engine**: `serverStatus.storageEngine.name`; when per-database
  credentials may not run `serverStatus`, the `$collStats` of the first
  non-system collection (`wiredTiger` or `inMemory`); on FerretDB `SQLite`;
  otherwise `unknown`.
- **Mongo sessions count**: the number of active sessions of the MongoDB
  driver's client, so an admin can see that it is not growing all the time.
- **Check Version**: fetches `https://wekan.fi/version.txt` with a 10-second
  timeout. `parseVersionManifest()` in
  [models/lib/versionCheck.js](../../../../models/lib/versionCheck.js) accepts
  it only if it is at most 1024 characters and exactly five lines,
  `WeKan`, `FerretDB`, `Meteor`, `Node`, `NPM`, each followed by a version.

On Sandstorm the Node heap and memory figures are not collected, and they and
the sessions count are not shown: Sandstorm does not expose machine performance data to apps,
to prevent side-channel attacks.

## How it works in WeKan

- **Pane**: template `statistics` in
  [client/components/settings/informationBody.jade](../../../../client/components/settings/informationBody.jade)
  and [informationBody.js](../../../../client/components/settings/informationBody.js),
  rendered by [settingBody.jade](../../../../client/components/settings/settingBody.jade)
  when the `version` slug is open. `defaultSlug: 'version'` in
  [models/lib/adminUrls.js](../../../../models/lib/adminUrls.js) makes it the
  pane that opens first.
- **Server**: methods `getStatistics` and `checkNewestVersions` in
  [server/statistics.js](../../../../server/statistics.js); both answer only a
  site administrator.
- **Redirect**: `/information` in [config/router.js](../../../../config/router.js).
- **Tests**: [tests/versionPaneCategories.test.cjs](../../../../tests/versionPaneCategories.test.cjs),
  [tests/versionCheck.test.cjs](../../../../tests/versionCheck.test.cjs) and
  [tests/platformPackaging.test.cjs](../../../../tests/platformPackaging.test.cjs).

## Commits

 - [Publish and use the WeKan version manifest](https://github.com/wekan/wekan/commit/b39d57bf7852c9bfc1a4d63871d19cf6c21cfd15)
 - [Check Version: the newest versions in the Admin Panel](https://github.com/wekan/wekan/commit/3b613201a38b3a154fd40d0ef2f2b973a249fc84)
 - [One table with category rows over two 50% columns](https://github.com/wekan/wekan/commit/aed26c67718dbc0df4db6d185f1a79424fdb6218)
 - [Groups with a heading each, and what WeKan is installed as](https://github.com/wekan/wekan/commit/dcc6c8fe5d592e0b8e0c06aa5c116c20e00107e7)
 - [Version opens first, as a pane of Settings](https://github.com/wekan/wekan/commit/d232194070314bbde9ab80f90cad037a215a90f9)
 - [The configured METEOR_REACTIVITY_ORDER and DDP_TRANSPORT](https://github.com/wekan/wekan/commit/e1aa5a22e87ffc2e6b18c612f888c0005268b8e8)
 - [The storage engine with per-database credentials](https://github.com/wekan/wekan/commit/5a90a1987ab0db39c46efbea5882c73fba14a0b3)
 - [FerretDB detected from its top-level ferretdbVersion](https://github.com/wekan/wekan/commit/cfa5707a40a2707cfbd69a48b31c76adf96edc22)
 - [Database type, version, commit, storage engine and reactivity mode](https://github.com/wekan/wekan/commit/d5c69e02595c9a4caf597496a4f1572064142b9f)
 - [The storage engine and oplog status are shown again](https://github.com/wekan/wekan/commit/3b98f862bcda3e8a9b0d0131b91cdfa59986c2d8)
 - [The version is visible again](https://github.com/wekan/wekan/commit/1f6b5ed0e387dee0b5a90bcf10dd425e098bba6a)
 - [Mongo sessions count](https://github.com/wekan/wekan/commit/49404203aba23bd9c6fea37b037e1e8432a92cee)
 - [Sizes shown with the filesize library](https://github.com/wekan/wekan/commit/20c2679dc8a51d90e75f994e26e1eddfeb48d84c)
 - [The MongoDB version is read without a missing variable](https://github.com/wekan/wekan/commit/37f9de8b9b11e8dd1b54452531aa708e16517c6d)
 - [Node heap figures only outside Sandstorm](https://github.com/wekan/wekan/commit/02b6df320fc98e18e5a97105a35196bdffec98bb)
 - [Node memory usage](https://github.com/wekan/wekan/commit/d04e9bbabd4ada0df86e9bd3cb377bf6f735785b)
 - [Node heap statistics](https://github.com/wekan/wekan/commit/790a82c4b19706a6389ad25a46f29a334f0902b4)
 - [Meteor version, MongoDB version, storage engine and oplog status](https://github.com/wekan/wekan/commit/20294d833a2bf0bd1720444f4ffe018b025dacca)
 - [The WeKan version and the runtime environment](https://github.com/wekan/wekan/commit/e407eb9a8b91d1100315f2fcab2cf8d184957929)
