# WeKan ® 2026-08 releases, part 3

Moved out of [CHANGELOG.md](../../CHANGELOG.md) to keep that
file small enough to open (wekan/wekan#6580). Nothing here has been changed:
a release section is a record, and it reads the same as it did there.

This is part 3 of 4, newest first: [1](08.md), [2](08-part2.md), 3, [4](08-part4.md).

Releases per day:

| 2026-08 | Releases |
| --- | --- |
| 09 | 2 |
| 10 | 2 |
| 11 | 3 |
| 12 | 6 |
| 13 | 2 |
| 15 | 1 |

# v10.92 2026-08-15 WeKan ® release

**In short:** this was tagged **v10.92** and never published: its release job
died before running a line of its own script, with *Argument list too long*,
because the release notes had outgrown the size a single environment variable
may hold — so the release, and every job that needs it, never happened. The
amd64 and arm64 bundles built and verified; only the publishing failed. The
notes now travel from file to file and never become a shell value, which is the
one shape that neither runs a backtick as a command nor has a size limit at all.
Everything below was written for v10.92 and ships here instead. It begins with
what the published Docker image SHIPS, cleaned up against a container scan of
`ghcr.io/wekan/wekan:v10.91`. That scan reported 80 findings against "Node.js",
three of them CRITICAL, and not one of them was in code WeKan runs: **npm** and
**node-gyp** are build tools that were left in the finished image, and their
trees are where `tar` 6.2.1, `sigstore`, `ip-address` and the rest came from.
Both go now, after the install that needs them - 83 of the 120 packages in
`programs/server`, and npm itself. The rest of that list is the npm packages
**Meteor's own packages bundle**, which no `package.json` here can reach:
**nodemailer**, **openpgp**, **svgo**, **postcss**, **nanoid**, **lodash**,
**qs**, **body-parser**, **cookie**, **on-headers**, **tmp**, **diff**,
**@babel/runtime** and **underscore** are raised inside the built bundle, to
fixed versions in the same major, by a manifest the release jobs and the
`Dockerfile` share. Below that: the guard suites that keep both from coming
back, and what could NOT be fixed and why. Then **card export**: the PDF and
Excel exports of a card were two different answers to "what is on this card",
and are now one - the same fields under the same translated labels, dates in the
reader's own **time zone** and in the **date format the opened card shows**, and
a description's markdown drawn as **bold** and *italic* rather than stripped. On
top of that, **#1173** after eight years: a **board**, a **swimlane** or a
**list** exports to PDF and Excel in that same card layout, from one selection
popup that says what to include. And **titles are edited where they are
written**: a card's title on the **board** (#4990, asked in 2022), a board's by
clicking its **name** in the header bar instead of a pencil beside it. Above all
of it, though: five **CRITICAL** REST API fixes reported by ybsun0215, the worst
of which let any user with write access to one board destroy the comments,
checklists and history of every card on every board in the instance. Below that:
twelve bug fixes - among them **Custom Fields**, which the browser tests caught
being unreachable on a card that had none, which is exactly where it is needed,
and a field made from a card that was silently never created - a test that pins
that a browser downloads **one** language file and not all 246 of them, and **81
languages** taken past the words on the board into the menus and the login page,
beside the **Export** row that read as the lowercase key `export` in every one
of them because that key had never existed. And then the translations turned out
to have a much older problem than any missing string: **8,716 values were
written in the wrong language entirely**, which no count had ever reported
because nothing was looking. **Korean** held Japanese, **Georgian** Russian,
**Hindi** Gujarati, **Tamil** Telugu — and, once a second check asked about the
Latin alphabet inside a language that is not written in it, **Greek** held
Italian, **Thai** Vietnamese and **Algerian Arabic** French. All of it is
translated now, and the scan that found it stays as the guard, reporting zero
for both of its checks across all 246 files. Below that: the search operators a
user TYPES, in the language they read; the one-letter shorthands beside them,
each derived from that language's own word; and the panels a file never had
because they were added after it was last touched. Then dependency updates,
thirty-odd bug fixes, the developer-facing changes, and the rest of the
translation work.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-amd64) | v1.53.0 | `eae1f0a8f73bfc979738bfff7284d40fd1bc55de2cc56514721fc155c3624f7d` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.53.0/ferretdb-arm64) | v1.53.0 | `bdc50caee3ac28495b42d2130b94a042a9dd6d3a38f732cac02b648f36c891da` |
| armhf | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armhf) | v24.19.0 | `b55350f3071b765a98ed66fdc410657ff168a937935057077fd7ab33cb30b9aa` |
| armhf | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armhf) | v1.49.0 | `144404fb9793dc8e039874812f4e2cb3e6d8b1df0ffdbe50254e7790a342a2f4` |
| armv6 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armv6) | v24.19.0 | `128ded0cda638c1f144eadb23ad249889515df017d298fd49c8faf3db110f0f1` |
| armv6 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armv6) | v1.49.0 | `7c27b2c15448709a24eace9b3c951c62fbe33413f7d20d56cb5520f4436efe2d` |
| armv7 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armv7) | v24.19.0 | `8dbe0a9aa8550ad5275c5538ebf868eb2037f0c4d9cccbe319f63b7e5854cd45` |
| armv7 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armhf) | v1.49.0 | `144404fb9793dc8e039874812f4e2cb3e6d8b1df0ffdbe50254e7790a342a2f4` |
| i386 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-i386) | v24.19.0 | `3b0b3bbfe27daf583b3a0f432efacc508407a012cdd9e8847250e7c015565bac` |
| i386 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-i386) | v1.49.0 | `1f70cb1687411b2a0fa9ac3b5bfc8c4ed9ce25ec2ddfa17e6fd3efb38136a39c` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-mac-arm64) | v1.49.0 | `576364db59dfce3ba564b9a3e484496eb57f95d76d2007b9f83241acdbd2f4fa` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-mac-amd64) | v1.49.0 | `37d70cd90aad6d3867b6686507ff1888f1edf6791818c31d014d130e8f39fc14` |
| ppc64le | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-ppc64le.tar.xz) | v24.19.0 | `c510c6ce12f07010f771e6edb22a3fe23f4f2e6f40b1ffd4941aed0646a0d8b3` |
| ppc64le | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-ppc64le) | v1.49.0 | `7c61d4853d5163ad8761449d693fd458ebbb8611a2351c718014876242c5b1fb` |
| riscv64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-riscv64.tar.xz) | v24.19.0 | `cd1f14af2812148002f58b58a5f9af512a50e3b8e8c148e0db44019dcb68edfd` |
| riscv64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-riscv64) | v1.49.0 | `bd4912da70f5e6c1475ab989668c76b4ab7db4ee06c44357693df64f5e1d0e0b` |
| s390x | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-s390x.tar.xz) | v24.19.0 | `a4792e65962ffa0af42627aacf1122a60c3c88dbf4e4184f06820d66f9da8ba4` |
| s390x | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-s390x) | v1.49.0 | *no checksum published* |
| win-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-arm64.zip) | v24.19.0 | `8502f4a50b458d4cc38ed8f2001556c2cd239d464920f74017926ccb1e1c157f` |
| win-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-win-arm64.exe) | v1.49.0 | `792166623e774b0af2aced31ed3ae39f545ca5268dc4c2b8d1a329228ff52cbc` |
| win64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip) | v24.19.0 | `57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73` |
| win64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-win64.exe) | v1.49.0 | `f42c50aa84095a9616b00f27a584c66b7bf79e3b109450c62a5f146ba3c85478` |

This release fixes the following CRITICAL SECURITY ISSUES:

**The REST API** - what an endpoint authorises, and what it then acts on.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9cc4139699ef8d6b6e51efb45b9a06f66e4340b4">PurgeBleed: the single-card DELETE destroyed the contents of any card in the instance</a>. Thanks to ybsun0215 and xet7.</summary>

[PurgeBleed](https://wekan.fi/hall-of-fame/purgebleed/) is the severe one of the
five. `DELETE /api/boards/{boardId}/lists/{listId}/cards/{cardId}` authorised
the caller on the board in the URL, and then fetched the card by its id ALONE.

The order is what makes it destructive. `cardRemover` runs BEFORE the card is
removed - it has to, so the children's `before.remove` hooks still find their
parent - and it removes strictly by card id: checklists, checklist items,
comments, the activity history and the whole subcard tree. So it erased those
for whatever card the bare lookup returned, which was any card in the instance,
on boards the caller cannot read, irreversibly.

The removal that follows uses a triple key, `{_id, listId, boardId}`, which a
foreign card never matches. The card SHELL therefore survived and the endpoint
answered 200 with the card id - so nothing in the response said that the
contents of somebody else's card had just been destroyed, and the attack is
repeatable for every card id an attacker learns.

Any authenticated user with write access to ONE board - their own is enough -
could reach every board on the instance. All deployments with `WITH_API=true`
are affected.

The bulk endpoint had always constrained its lookup with `{_id, boardId}`; the
single-card path is the sibling that was missed, the same shape as
[PassBleed](https://wekan.fi/hall-of-fame/passbleed/). It uses the constrained
lookup now, so a card outside the authorised board does not resolve, and
`cardRemover` is never reached.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9cc4139699ef8d6b6e51efb45b9a06f66e4340b4">HashBleed: the admin user endpoints answered with password and session-token hashes</a>. Thanks to ybsun0215 and xet7.</summary>

[HashBleed](https://wekan.fi/hall-of-fame/hashbleed/): `GET /api/users/{userId}`
and `PUT /api/users/{userId}` serialised the whole Meteor user document with no
projection, so every answer carried `services.password.bcrypt` - an
offline-crackable password hash - and `services.resume.loginTokens`, the hash of
every live session with the time it began.

The authorisation was never the problem: both endpoints are admin-only and stay
that way. The payload was. Walking the ids that `GET /api/users` returns
harvested the credential material of the whole instance, and a password hash is
an attack that continues offline long after the export.

The two sibling endpoints in the same file show what was intended: the list
projects down to `_id` and `username`, and the self view runs `delete
data.services` before answering. Nothing in the code, the CHANGELOG or the
documentation ever said the subtree was meant to be exposed. One helper strips
`services` and `sessionData` now, and both endpoints answer through it - the PUT
as well, which returned the same unprojected document after every action.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9cc4139699ef8d6b6e51efb45b9a06f66e4340b4">GuestBleed: an outsider named on a card could read a private board's cards</a>. Thanks to ybsun0215 and xet7.</summary>

[GuestBleed](https://wekan.fi/hall-of-fame/guestbleed/) is two paths that are
each defensible alone. The `members` and `assignees` ARRAYS on card create and
card update were stored exactly as given, with nothing checking that those ids
belong to the card's board. And `GET /api/user/cards` answered by CARD
membership, without re-checking the caller's access to the card's BOARD.

Together they are a channel: a member of a private board writes an outsider's id
onto a card, and the outsider's own *my cards* feed then returns that card's
title, its board, list and swimlane ids, its dates and its co-members - for as
long as the id stays on the card. Their direct read of the board stayed
Forbidden the whole time, which is what made it quiet.

The invariant already existed, documented on the merge endpoint `POST
.../cards/{cardId}/members/{memberId}`, which has refused a non-member with 400
since [#5998](https://github.com/wekan/wekan/issues/5998). It covers the array
shapes now - single create, bulk create and update - and an id that may not be
assigned is dropped rather than the request refused, so a bulk edit does not
fail over one stale id. The listing is filtered by board visibility as well,
because fixing only the write path would leave every card placed before this
release still answering.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9cc4139699ef8d6b6e51efb45b9a06f66e4340b4">StaleBleed: a removed board member kept seeing the board's id and title</a>. Thanks to ybsun0215 and xet7.</summary>

[StaleBleed](https://wekan.fi/hall-of-fame/stalebleed/): `GET
/api/users/{userId}/boards` selected boards with a dotted `'members.userId'`
match, which ignores the membership's `isActive` flag. Removing a board member
does not delete their entry - it sets `isActive: false` and `isAdmin: false` and
keeps it - so a removed member's own board listing went on showing that board's
id and title, indefinitely.

Reading the board itself was already refused, which bounds this to the id and
the title. The id is the part that matters, because it is what every other
endpoint in the API is addressed by, and a private board's title is often the
thing it is private about.

A dotted path cannot express this: in Mongo, `'members.userId'` and
`'members.isActive'` may be satisfied by DIFFERENT entries of the array.
`$elemMatch` is what ties them to the same entry, and it is what the rest of
WeKan uses - the single builder introduced by the fix for
[GHSA-gwc4-fw7p-gw58](https://github.com/wekan/wekan/security/advisories/GHSA-gwc4-fw7p-gw58),
whose header note reads *"A share entry counts only while it is active,
everywhere"*. This listing predates that consolidation and was never converted.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9cc4139699ef8d6b6e51efb45b9a06f66e4340b4">AuthorBleed: six paths let the caller choose whose name went into the board's history</a>. Thanks to ybsun0215 and xet7.</summary>

[AuthorBleed](https://wekan.fi/hall-of-fame/authorbleed/): six server paths took
the actor's identity from the request body's `authorId` field, checking only
that such a user exists. An existence check is not an authentication check - it
confirms that the name in the envelope belongs to somebody, and says nothing
about who wrote the letter.

So a board member could record *"victim created this card"* and *"victim deleted
this card"* on any board they may write to, and the card document itself
recorded the forged `userId` as its creator. The six are single card create,
bulk card create, the linked-card form, single card delete, bulk card delete and
custom-field create.

WeKan had already accepted this exact class as a vulnerability and fixed it for
card comments in 8.19, and again for the card PUT handler - whose inline note
still reads *"use req.userId consistently (it previously read req.body.authorId
here)"*. These six were missed, which makes it an incomplete fix rather than a
decision. All six read `req.userId` now, the session the request authenticated
as, which is the only identity the server can vouch for.

</details>

and fixes the following SECURITY ISSUES found by container scanning:

**The published image** - what it carries that it never runs.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6157094ab8e633e65427c7cd046537af77956bff">npm and node-gyp's tree are not shipped any more, after the install that needed them</a>. Thanks to xet7.</summary>

Three CRITICAL findings and most of the HIGH ones were three copies of one
package - `tar` 6.2.1 twice and `tar` 7.5.11 once - and none of them is
reachable from `boot.js`:

- `node-gyp` and `@mapbox/node-pre-gyp` are dependencies of Meteor's
  `meteor-dev-bundle`, there to COMPILE native modules during the `npm install`
  in `programs/server`. WeKan compiles nothing at run time: uWebSockets.js,
  bcrypt and argon2 all ship prebuilt `.node` files that `node-gyp-build` picks
  at require time. Their tree is 83 of the 120 packages that install leaves
  behind, and it brought `tar` 6.2.1 (via `node-gyp` and `cacache`),
  `brace-expansion`, `minimatch` and npm's networking stack with it.
- `npm` itself runs exactly once in the image, for that install. The container
  starts `bash /build/wekan-entrypoint.sh`, which never calls it. Shipping it
  shipped its own bundled `tar` 7.5.11, `sigstore` 4.1.0, `@sigstore/verify`,
  `@sigstore/core`, `ip-address` 10.1.0 and `brace-expansion` 5.0.4 as image
  content no code path can reach.

`releases/prune-build-only-modules.mjs` removes the first, and it is a
REACHABILITY walk rather than a list of 83 names - start from every dependency
of `programs/server/package.json` except those two, follow each package's own
dependencies, keep the closure - so it cannot go stale the next time Meteor
changes its dev-bundle. The `Dockerfile` deletes npm and npx in its cleanup
step; `node` stays, because that is what runs WeKan.

It runs in every place a bundle is made, not only in the image: the amd64 build,
the arm64 container, the three Windows legs, both macOS legs, and
`install-node-for-arch.sh` for the emulated arches - each one reinstalls
`programs/server`, so each one has the tree to remove. The pruned bundle was
booted before and after to prove nothing needs what it takes:
identical failure at the database, no missing module.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6157094ab8e633e65427c7cd046537af77956bff">The npm packages Meteor's own packages bundle are raised inside the built bundle</a>. Thanks to xet7.</summary>

The rest of that scan was `nodemailer` 8.0.3 and `openpgp` 5.11.1
(meteor/email),
`svgo` 2.8.2, `postcss` 8.5.1 and `nanoid` 3.3.15 (meteor/minifier-css), `qs`
6.13.0, `cookie` 0.4.1, `on-headers` 1.0.2 and `tmp` 0.2.3 (meteor/webapp),
`lodash` 4.17.21 and `diff` 3.5.0 (ostrio:files), `body-parser` 1.20.3
(meteor/oauth), `@babel/runtime` 7.20.7 and `underscore` 1.13.7.

`Npm.depends` names an EXACT version, and `meteor build` copies that version
into
`programs/server/npm/node_modules/meteor/<package>/node_modules`. Nothing in
this
repository's `package.json` is consulted for it - not a dependency, not an
`overrides` entry - so the only place those versions can be raised is the
bundle,
after it has been built. `releases/bump-bundle-npm-deps.mjs` does that from the
minimums in `releases/bundle-npm-security-bumps.json`, installing with
`--ignore-scripts` so no prebuilt native module is rebuilt by a version bump,
and
replacing only copies BELOW the minimum.

A minimum stays inside the major the Meteor package was built against, and that
rule was learned rather than assumed: `uuid` 8.3.2 and 9.0.1 are both affected
and the lowest fixed release is 11.1.1, which moved its entry point to
`dist/cjs/index.js` - the bundle records `dist/index.js` at build time, and the
server died on boot with `Cannot find module .../uuid/dist/index.js`. It is in
the manifest's `notFixable` list with that error, beside `lodash.template`,
which has no fixed release at all.

One pass on the amd64 bundle reaches every architecture, because every other
bundle is that bundle with `programs/server` reinstalled. That reinstall is also
why every leg runs it again: `meteor-dev-bundle` pins `underscore` 1.13.7
(CVE-2026-27601) and puts it back over the bumped copy - including in the
`Dockerfile`, which reinstalls from the .zip.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6157094ab8e633e65427c7cd046537af77956bff">Guard suites for both, and the Debian findings that no upgrade can fix</a>. Thanks to xet7.</summary>

`tests/imageBuildOnlyModules.test.cjs` pins that the pruner is
reachability-driven
and never touches `npm/node_modules`, that the image prunes AFTER the install
and
before the bundle is moved, that npm and npx are removed and `node` is not, and
that every leg which installs `programs/server` prunes afterwards.
`tests/bundleNpmSecurityBumps.test.cjs` pins the manifest's versions, the
`--ignore-scripts` install, the below-the-minimum-only replacement, and that
`uuid` is NOT in `minimums` and says why.

Not everything in that report can be fixed here, and it is worth saying which:

- The `debian 13.6` target's 176 findings are ALL `Fixed in: -` - unfixed
  upstream, in `perl-base`, `util-linux`, `ncurses`, `glibc` and the rest of a
  base system. No upgrade closes them; only carrying fewer packages helps, which
  is what the build-dependency purge and the `pebble` removal already do.
- `lodash.template` 4.5.0 has no fixed release; it reaches the bundle through
  aldeed:simple-schema.
- `nodemailer`'s fifth advisory needs 9.0.1, a major the Meteor email package is
  not written against; 8.0.11 fixes the other four.
- The nine `build/<tool>` binaries and `build/ferretdb` are other repositories'
  builds - wekan/mongo-tools-patches and wekan/FerretDB - and are fixed there.

</details>

and adds the following new features:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d11f5ffdb768f5ebcb6bc447c385d77147e0c59a">Import into a swimlane, a list or a card, beside the one whose menu was used</a>. Thanks to xet7.</summary>

The other direction of the same popup. Importing used to mean one thing: a whole
new board, from the full-width page at All Boards. A swimlane's menu now imports
a swimlane BELOW that swimlane, a list's menu imports a list after it - which is
to its RIGHT in English and to its LEFT in Arabic - and a card's menu imports a
card below it, into the board that is already open.

The RTL side of that is ONE rule and not two, which is worth saying because it
looks like a missing branch: the page carries `dir`, so the board's row of lists
mirrors itself and "after in sort order" is already "the other side". A
direction
branch in the placement would mirror it twice and put the list back where it
started.

Placement is a FRACTION between the target's sort and the next one's, not a
renumbering of every sibling - renumbering is what a board with ten thousand
cards cannot afford, and what two clients doing it at once get wrong. Several
imported items spread evenly through that gap, so importing a swimlane of ten
lists does not put nine of them in the same position.

The file is what the export writes, at any scope, and the SAME checkboxes decide
what comes in: a document full of comments imported with **Comments** unticked
brings the cards and leaves the comments. A `.zip` is unpacked in the browser
and
its `wekan.json` handed to the same method, so there is one import path rather
than two. Nothing is merged - everything created is new, because an import that
half-updated a board would be an edit nobody could undo - and a custom field is
matched by NAME, since an id from another board matches nothing here.

Importing WRITES, so unlike the exports beside it, it asks whether you may
change
the board rather than whether you may see it, and a read-only member is not
offered it at all.

</details>

**All Boards** - the overview and the tiles in it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6c591968024d8889accdd9a1c342d05db7d6738e">A starred page and a Template Container are the same height as a board and as "+ Add Board"</a>. Thanks to xet7.</summary>

In All Boards / Starred, a bookmark tile stood 8px taller than the board tile
beside it and than the grey "+ Add Board" box, and pulled its whole row up with
it.

Two of the four tiles in that grid carry `border: 4px solid #fff` - a bookmark
and the Template Container - to say they are not an ordinary board. The tile's
height was a 72px floor with 42px of padding added outside it, which comes to
the same 114px for a plain tile and to 122px for a bordered one, because on a
content-box element a border is added to the height rather than taken out of it.
The heights all said 72px, so nothing in the stylesheet looked wrong.

The tile now states the height it actually renders at - 114px, with the padding
and the border folded into it (`box-sizing: border-box`), which is what the
mobile rules in the same file already do for the same reason. Nothing moves
except the two bordered tiles, which lose the 8px they were never meant to have.
The guard compares RENDERED heights now, borders included, instead of comparing
the declared `min-height` of two tiles that were both content-box - which is how
this went unnoticed while a test watched it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f0745dec4aec88703e0d19ddea0f6b8d59c747e9">One import page, for every source, with the same checkboxes the exports use</a>. Thanks to xet7.</summary>

The last piece of [#1173](https://github.com/wekan/wekan/issues/1173): "combine
all import options to same template". They were fourteen - a link per source in
a pop-over, each going to its own address - and the page each one landed on
never said which other sources existed, so "where do I import a Jira export"
was answered by a menu somewhere else, if you knew it was there.

**All Boards / + Add Board / Import** is now one full-width page that lists
every source it can read - Trello, Jira, CSV/TSV, Excel, Kanboard, NextCloud
Deck, OpenProject, GitHub, GitLab, Gitea, Forgejo, Asana, Zenkit, and a previous
export of this WeKan, named with the **Product name** this instance is branded
with rather than with a product the reader has never seen.

Under the source picker are the same **what to include** checkboxes every export
offers, from the same list, and on this side they say what comes IN. That works
for every source without teaching five different creators a selection each: the
parts that were not ticked are taken OUT of the parsed document before any
creator sees it, and a creator that never sees a comment cannot import one. A
section that was not ticked is EMPTIED rather than removed, because the creators
read `board.comments` directly and an undefined array is a crash where an empty
one is "there were none". A source's own name for a part is pruned with it -
Trello calls its comments `actions` - and a key this list does not know about is
left alone rather than silently dropped.

`/import/:source` still works, under its own route name, so every existing link,
bookmark and back button lands exactly where it did.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bada25de4d95b0e5b473ec3176dccffcc5a999a7">Imported cards bring their attachments, from a .json and from a .zip</a>. Thanks to xet7.</summary>

The round trip was half a round trip: a card imported from a swimlane, list or
card menu arrived with its checklists and comments and without its files.

A `.json` export carries each attachment's bytes as base64, and the importer now
writes them the way the board import always has - the server-side Meteor-Files
`writeAsync`, one attachment at a time. A `.zip` carries them as the files they
are, named `attachments/<id>-<name>`; the archive is unpacked in the browser and
each file is put back on the metadata row its id names, so the server sees the
same document either way and there is one import path rather than one per
container.

An attachment lands where its CARD landed - the list and swimlane it is in now,
not the ones it was exported from - and one unreadable file is warned about and
skipped rather than losing the rest of the import. A `url` attachment from an
older export is still fetched through the downloader that validates and pins
every hop, so [FollowBleed](https://wekan.fi/hall-of-fame/followbleed/) stays
fixed on this path too.

The **whole-board** import on the new import page takes a `.json` or a `.zip`
the same way, through the same reader, which is the case the `.zip` exists for:
a board whose attachments are too large to sit inside one JSON string.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fe77b7461e6737a528e953b1080e91f206812b45">A large .zip is uploaded and streamed instead of unpacked in the browser</a>. Thanks to xet7.</summary>

Reading an archive in the browser and sending its attachments as base64 over DDP
is fine for a card and wrong for a board: 2 GB of attachments become 2.7 GB in
one message, in the browser's memory and then in the server's.

A `.zip` now goes to `POST /api/import/zip` as the file itself, and nothing is
ever whole in memory on the way in. The request body is streamed to a temp file
as it arrives; `unzipper.Open.file` reads the archive's central directory, so
entries are opened on demand rather than inflated together - the same approach
the backup restore already takes; and each attachment is piped from the archive
into the attachments collection by `addAttachmentFromStream`, which writes it to
a temp file and hands Meteor-Files the PATH rather than a Buffer. That helper is
lifted out of the attachment-copy code that already did exactly this, so there
is one way to add an attachment from a stream rather than two.

Where the files END UP is not decided by the import: `addFile` fires the
collection's `onAfterUpload`, which validates the file and moves it to the
**default storage configured in the Admin Panel**, exactly as an ordinary upload
does.

The upload is capped as it ARRIVES rather than after
(`WEKAN_IMPORT_ZIP_MAX_BYTES`,
5 GB by default), so an oversized archive never lands, and the temp file is
removed whatever happens. An entry's name is data and never a path: only the
attachment id before the first dash is read from it, the temp file is named by
WeKan, and the path is built through the same `safeEntryPath` containment check
the backup restore uses - so an entry called `../../etc/cron.d/x` can only ever
be an attachment with a strange name ([ZipBleed](https://wekan.fi/hall-of-fame/zipbleed/)).

A `.json` still travels as a document over DDP, which is what it is.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5d68d94bb7d3d765215f4d3725dd05800d55bf2d">The import page asks with the app's own checkboxes, in two columns</a>. Thanks to xet7.</summary>

Three things about the page that lists the sources. The pop-over that opens it
said "Import board (Trello, Jira, WeKan export, CSV, Excel, ...)" - a list of
five of the fourteen sources, in a menu whose only job is to get to the page
that lists all of them - and now says **Import board** and nothing else.

**Import from:** and **Select what to include:** were rows of grey ticks that
were never anything else: a `fa-check` drawn once per row, the same shape
whether that row was chosen or not, so the answer to "which one did I pick" was
a shade of grey. Both are the app's own animated checkbox now
(`.materialCheckBox`, the one Admin Panel / Announcement uses), which grows its
green tick out of the empty square over 0.2s, so a click is visible as it
happens. The box and its label are spaced apart by the same amount ticked or
unticked - the checked box is a narrower shape shifted left, so the two margins
differ by exactly that shift - and the row itself declares no alignment of its
own, because the tick's rotation is written for the plain flow and an
`align-items: center` on top of it lands the tick on the first word.

The two questions sit **side by side** when the window has room for two 280px
columns and stack when it does not, so the second one is not below the fold on
a page whose first list is fourteen rows long. No source is chosen to begin
with, and choosing one un-chooses the last, because an import reads one file in
one format; every part is ticked to begin with, because an import that silently
left things out would be worse than one that asks.

And **Import without mapping members (map later)** is a primary button like the
**Import** it sits beside. It was the one unstyled button on the page, which
reads as disabled - and it is not a cancel, it is the same import with one
question skipped.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/05ddc83cb786f7ca3baede3e80bf925a72e0e696">A board tile in All Boards is the board's whole theme, and light themes are readable on it</a>. Thanks to xet7.</summary>

A board on the **clearpink** theme was a pink rectangle floating inside a grey
tile, while the flat-coloured board beside it filled its tile edge to edge.

Two lists decided what a tile is coloured with. `boardColors.css` painted
`.board-list .board-color-<name> a` - the LINK inside the tile, which sits
inside the tile's own 24px/18px padding and so can never reach its edges - and
`boardsList.css` carried a hand-copied list of seventeen flat background
colours on the tile itself, which is what made the flat themes look right. The
five colour SLIDE themes added later were never copied into that list, so their
tiles kept the default grey and only the inset link showed the slide.
**clearblue** was in the list, flattened to one hex, so it did not show its
slide either, and **Clean Dark** and **Clean Light** were in neither list.

There is one list now. Each theme paints `.board-list li.board-color-<name>`
where it paints its header bar and its Public Boards row, the copy in
`boardsList.css` is gone, and a tile is the whole tile at every theme.

The other half of a theme is the text on it. A tile writes its title in
`#f6f6f6`, which is right on the fifteen dark themes and invisible on a light
one: **Apple Glass Pastel**'s tile is a pastel wash from `#f6f7fb`, so its name
and description were white on near-white and only the tile's shape said a board
was there. Both light themes now write their title, description and archive
line in their own dark ink, and darken the card-count pill and the unstarred
star that sit on the same tile - in ONE block, named as the place a third light
theme goes, because a per-theme copy is what caused the first half of this.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/05ddc83cb786f7ca3baede3e80bf925a72e0e696">Clean Light's top bar is one shade of dark, icons included</a>. Thanks to xet7.</summary>

The **Clean Light** theme's top bar is `#F1F1F3`, and `header.css` paints every
icon in that bar white by id (`#header-quick-access i.fa`). The buttons inside a
`ul li` escaped that through a more specific `color: inherit` and took the
theme's own text colour; the **house** and the **notification bell** are in no
`ul li`, so they stayed white on near-white - the bell's LABEL was readable
beside a bell that was not there, which is how it was noticed.

Both are dark now, and so is everything beside them: the bar's labels were
`rgba(10, 10, 20, 0.5)` and its board title full black, so fixing the two icons
alone would have left the bar at three darknesses. There is ONE shade in it now.
The **current** entry used to be the dark one among pale ones - a difference
that no longer exists - so it is the full-black, heavier one instead. A bell
with something to report keeps its white glyph, because it is on the red circle
then and not on the bar.

The **dividers** between the bar's groups - the seam that separates the page's
own controls from your account - are white too, a background in the first bar
and a border in the second, so on this theme they were not there at all. They
are in ink now, at the divider's own weight rather than the text's: a hairline
as dark as the label beside it stops reading as a seam and becomes a stroke.
The **starred group**'s outline - the box around the caret, the count and the
star - was white for the same reason, so the three sat loose on this theme; it
is the same 0.7 in ink now, which is the dark outline the phone/desktop toggle
beside it already draws for itself and why that one looked right and this one
did not.

**Hovering** an icon lightens it - `#header-quick-access i.fa:hover` goes to
`#ccc` - which on a dark bar reads as "brighter, so you know you are on it" and
on this one made the house fade towards the bar it sits on. On this theme it
goes the other way, to full black, which is the same message read the right way
round for a light bar.

And with **Member Settings / Change color / All Boards** on, a tile is the
theme's own fill rather than the accent under a flat white veil. The veil made
every tile one shade lighter than the selected row in the left menu beside it,
which reads as two colours rather than as one page. It reads
`--theme-accent-fill` now, not `--theme-accent`: the accent is ONE colour - the
solid end of a colour-slide theme - so on **clearorange** the tiles came out
flat beside a menu row that slid. The fill is the theme's slide where it has
one and its accent where it does not, which is what every other themed control
already reads. The popup's own **All Boards** button is filled from the same
variable, because the button and the tiles it turns on are one decision and
were two looks.

On the **Modern** theme the popup that asks all this was a single narrow column
of swatches. That theme set `width: 260px` on every popup's content, so any
popup that asks for width by name - Change Color, Export board, Show on Card,
Show on Minicard - was pinned to 260px whatever it had asked for. A theme
decides what a popup looks like; how wide it is belongs to the popup, and the
declaration is gone.

And on the **Dark** theme that popup had no title bar at all. That theme hid
every popup's header outright, and the header is not decoration: it carries the
popup's title, the back arrow into the popup it came from, and the X - so
"Change Color" was an untitled panel that could only be left with Escape or a
click outside. No other theme does that, and Dark no longer does either.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d5b69137cc3090e5b0ca503d1a516b6518d401c7">Member Settings / Font / Size moves all of the text, not the part written in rem</a>. Thanks to xet7.</summary>

Picking **Largest** grew the page heading and the minicards and left the header
bar, the left menu, the lists, the swimlane header and every popup exactly as
they were - a setting that half-works, which is harder to use than one that does
nothing.

The preset was a **percentage on the root element**, and a root percentage only
reaches text whose size is written in a RELATIVE unit: `rem` is measured against
the root, `em` against its parent. WeKan writes most of its sizes in **px**, and
px is absolute - no root percentage moves it. So exactly the rem-sized parts
scaled. The base rule made it worse: `html, body, input, select, textarea,
button` re-stated `font: 14px …`, so the body took the stock size straight back
off the scaled root, and everything inheriting from the body with it.

The preset is now published as a NUMBER as well
(`--wekan-ui-font-scale`), and every px `font-size` and `line-height` in the
client stylesheets - 433 declarations across 37 files - is written
`calc(14px * var(--wekan-ui-font-scale, 1))`. One preset moves the whole
interface. `line-height` scales with the size on purpose: 21px of type in an
18px line box is the same setting half-applied.

Nothing renders differently until a preset is chosen: the fallback in every one
of those declarations is `1`, and the variable is REMOVED for **Default**, so an
instance where nobody touched the setting computes exactly the sizes it always
did. The base font rule is split into `font-family` and `font-size` because the
shorthand's size was the one thing the setting had to be able to move. A guard
fails on any bare px `font-size` or `line-height` added later, so a new one
cannot quietly opt out of the setting.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c56b556538045e0ead870ad09ede2de334a167db">The text colour under Member Settings / Font reaches all of the text</a>. Thanks to xet7.</summary>

Colour is inherited, and it was set on `<body>` and the form controls, so it
only ever reached text that had no colour of its own - and WeKan gives most of
its text one: the header bar's buttons, the left menu's rows, a minicard's
title, a list header. Choosing green recoloured the page heading and the menu
and left the rest exactly as it was. It is set on every element now.

`.fa` is left out, because those are Font Awesome GLYPHS rather than text - a
red alert and a green tick mean something by being that colour - and the icons
that are meant to follow their label already say `color: inherit`, so they
follow this anyway.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b77a1663d80cb3ee5d876c491da8508ca5f403bc">Member Settings / Font / Text background color is removed</a>. Thanks to xet7.</summary>

A colour painted behind the text needs elements to sit on, and neither choice of
them looks good. On the boxes - which is what it did, from `<body>` - it painted
the whole window: the board canvas and the empty space under the lists, which is
a page background and not a text background. On the elements that actually carry
text it striped every heading, menu row and paragraph with a full-width band. A
setting nobody can make look good is worse than no setting, so it is removed
rather than tuned a third time.

The wheel and its Unset button are gone from the popup, nothing reads
`profile.uiTextBgColor`, and no stylesheet rule paints it. A profile that
already HAS a colour is cleaned rather than left dormant: `setUiColors` unsets
the field on every call, whatever it is passed - and it still accepts the
argument, so an older client cannot fail against a newer server. The schema key
stays declared for exactly one reason: a modifier touching a key SimpleSchema
does not know is rejected, which would leave those profiles the only ones that
could not be cleaned.

The **text colour** beside it stays.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/024036f4ee4b976f51bf6a032aa9b5d8c3916138">A custom colour can be chosen in Member Settings and the Admin Panel, not only on a board</a>. Thanks to xet7.</summary>

All three places render the same picker, so the **Custom color** wheel was
already written for all three - it was just never reachable in two of them. It
appeared only once a named theme had been SELECTED, and a board always has a
colour whose first entry is flat, so **Board Settings / Change Color** always
showed it; **Member Settings / Change Color** and **Admin Panel / Settings /
Visibility** open on *Default (no override)* with nothing selected, so both
looked as though they had no custom colour at all.

The wheel is offered from that state too, as the **flat** category's single
colour - which is what a custom colour means with no theme under it - and
choosing one applies it over the first flat theme. That fallback was already in
the code that saves; it is now written into the picker's own selection as well,
because otherwise the wheel would store a theme the page did not show as chosen
and the next click would read the selection back as *none*.

Picking a **clear** theme first still gives the two wheels its colour slide
needs. One helper answers "which category's custom colours is this picker
offering", so the wheel, the preview and what gets saved cannot disagree.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/df2913744e382eaeaa36b3cdc407998895124c27">Every export popup is one popup with one scope, and looks like it</a>. Thanks to xet7.</summary>

There were two export menus. The **board** popup wrote nineteen formats of its
own under four subheadings, in two panes across the width of the window; the
**swimlane**, **list**, **card** and **checklist** popups wrote five in one
narrow column with no panes. So "the export popup" looked like two different
features depending on which menu opened it, and a format added to one was
missing from the other.

They are one template now, drawing one TABLE of formats. Each entry says what it
is - an icon, a label, and either a path to download or a class to click - and
which scopes it belongs to: `BOARD_ONLY` for the ones that only make sense for a
whole board (the HTML archive, the dependency graph, the CSV columns and the
exports written for Trello, Jira, Kanboard and the rest), and nothing at all for
the ones that work anywhere, because `exportUrl` already carries the scope - a
swimlane, a list and a card differ from a board by a query parameter, not by a
route. The board popup is now the same one-line include the other four are, with
no markup and no URL builders of its own; the nineteen helpers that built those
URLs are gone with the list that called them.

All five get the board's **panel**: what to include in one pane and what to
export it to in the other, side by side when the window has room and stacked
when it does not, pinned to the viewport so the header and its X are always
reachable. The layout is written against the panes' own class rather than
against one popup's name, so it cannot be true of one menu and not another.

Which scope a popup is, is asked in ONE place - and every scope is named there,
because a scope left out would be read as "a whole board" and offered a board's
formats.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e948acfdd31e48d2544b81268a8309352581d1f0">Every menu on a board has an Export row and an Import row</a>. Thanks to xet7.</summary>

The card, list, swimlane and board menus each had ONE row, and each named itself
differently: *Export card*, *Export list / Import*, *Export swimlane / Import*,
*Export board*. Two of them mentioned an import that was a section inside the
popup rather than a thing you could go to, and the card and board menus did not
mention it at all - so importing into a list was discoverable and importing into
a card was not.

Each of the four now has **Export** and **Import**, in that order. The rows are
named for what they do and not for what they act on: the menu already says
whether it is a card, a list, a swimlane or the board, so *Export card* inside
the card menu said "card" twice.

Both rows open the same popup - the same panes, the same table of formats, the
same *what to include* selection - with one difference: the second pane offers
the formats to write out, or the file to read in. The selection means the same
thing in both directions, which is why it is the pane they share.

**Import** writes, so it is offered only to somebody who may change the board.
That question is asked once, in one function, registered as a helper the four
menus use - and asked AGAIN inside the popup, because a row that is merely
hidden is not a permission check.

</details>

**Search** - finding a card by what people call it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/530ef32c16c41dfa52f408e31da21a2d32cbb93e">Cards can be searched by their card number</a>. Thanks to mfilser and xet7.</summary>

[#5006](https://github.com/wekan/wekan/issues/5006), open since 2023: "A
customer has just hinted us that we are not able to search cards by its number
(#)". A card carries a number, the board shows it, people quote it to each other
in meetings and in tickets - and the one thing that could not be done with it
was
find the card again.

`number:12` now does, in the global search and everywhere else that parses the
same query. It is an EQUALITY match on a number rather than a regular expression
on text, which is the whole difference between finding card 12 and finding cards
12, 120 and 312. `number:abc` is refused with the same "expected a number" error
`limit:` already gives, because a string never equals a numeric field and a
search that quietly finds nothing teaches nobody anything.

The issue's title says "number/#", and both of those forms work too: `#12` and a
bare `12` search for a label called 12 AND the card numbered 12. A board calls a
card "#12" and a label can be called anything, so which of the two somebody
means cannot be read off the text - answering with both is the only reading that
never hides what they were looking for.

The two halves are joined with **OR**, which is what makes that safe rather than
destructive: a search that used to find a label called *2024* still finds it,
and the card numbered 2024 is ADDED to the answer instead of replacing it. An
AND would have found nothing at all in almost every case and looked like the
feature working. Only a term that is entirely digits gets the second half, so
`#red` is the label red exactly as before. And `#12` on a board with no label
called 12 no longer reports "label not found" - the card-number half is a real
answer, and a not-found message beside the card it just found contradicts the
screen.

</details>

**Board, swimlane and list export** - printing a board, and what goes in it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bb6f18c469810c787ce1ac6b2872cc39b5dc1ae5">The export selection reaches every format, and the menu opens wide enough to read at once</a>. Thanks to xet7.</summary>

Two halves of the same menu.

**The selection now reaches all of it.** PDF, Excel, JSON and .zip took the
parts checkboxes; CSV, TSV, Kanboard and the eleven JSON dialects built their
own
addresses and could not carry them, so ticking "no comments" changed four
downloads out of nineteen. Every board export link is built by the one url
helper now, so `?fields=` rides along with all of them.

What a format can DROP depends on what it has, and that is the honest part. A
**CSV** has no comments to leave out - what it has is columns, so the selection
lands there: unticking People removes five of them, Dates removes eight, Custom
Fields removes the trailing block. One mask filters the header and every row, so
the two cannot drift apart. A **Trello, Jira or GitHub** export carries a title,
a description, a due date and labels; those three parts are gated and nothing
pretends to gate what is not there.

**It is a full-width panel, and its X is always reachable.** It was anchored to
the button that opens it and clamped into the window using an assumed width -
and the assumption and the stylesheet disagreed by a few percent, so on a narrow
window the panel's trailing edge, with the pop-over's own X on it, ended up past
the edge of the screen: Escape or a click away were the only ways to shut it. It
is pinned to the top of the viewport now, at the 10px gutter every popup keeps,
and is `calc(100vw - 20px)` wide - the whole window, less that gutter on each
side - so the header, the X and both panes are always on screen.

**And the menu is a menu again.** Twenty-odd entries under three subheadings
were a single column you scrolled past. On a window with room it is now TWO
PANES - what to include on the left, what to export to on the right - each
filling its own width with as many columns as fit, so the whole menu is visible
at once. The panes are grid COLUMNS, which is what makes the right-to-left case
free: a mirrored page puts the first column on the right, so the selection lands
on the right and the formats on the left with no second rule to write or forget,
and the divider between them is a `border-inline-start` for the same reason.
Below 800px they stack, because popup.css already lays every popup out as a
full-screen sheet there, which is what a phone should get. The 1100px width is
mirrored in `client/lib/popupOffset.js`, which places a popup using its width:
left at the default 380 a wide menu opened near the right edge lands most of the
way off the screen.

A rule sits above each subheading, so a group's name says where the group before
it ended - one rule per heading and no stray separators, which a test counts.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b77299c8063859f11855467bbfd59e0a6097c7bc">A component that others import loads its own template, so the client bundle cannot die at startup</a>. Thanks to xet7.</summary>

`Template.exportScopeBody.helpers(...)` runs at module scope, and it throws when
that template is not defined YET. That does not break one popup - it stops the
module evaluating, so every template registered after it never registers either.
The visible symptom was the SIGN-IN page: a blank form and

```
Uncaught TypeError: can't access property "helpers", Template.exportScopeBody is
undefined
[UserAccounts] Warning no template passwordInput found!
```

The central lists in `client/features/*.js` import a component's `.jade` before
its `.js`, which is enough for a component nobody else imports. The export popup
body is imported by the sidebar, by the card details and by the import page, and
whichever of those is reached first evaluates it - long before the feature list
gets to the template. It imports its own `.jade` now, so the order is a fact
rather than a hope.

A guard in `tests/clientBundleImports.test.cjs` checks the whole rule, and found
a second component with the same fragility that had not fired yet -
`migrationProgress.js`, imported by `boardBody.js`. Fixed the same way.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8d716de7ccbae184cc3cdda4a54c82e8e90461ab">The board Export menu is grouped under subheadings instead of one flat list</a>. Thanks to xet7.</summary>

It was nineteen entries in one list, each spelling out its whole family:
"Export / CSV (,)", "Export / CSV (;)", "Export / TSV", then eleven lines
beginning "Export / JSON /". The part that differed - the only part worth
reading - started two thirds of the way along every line.

A subheading names the family once and the entries under it say only what they
are: **PDF**, **Excel** and **HTML**, then **Dependencies** (JSON, SVG), **CSV**
((,), (;), TSV) and **JSON** (JSON, JSON without attachments, .zip, Kanboard,
Trello, Jira, NextCloud Deck, OpenProject, GitHub, GitLab, Gitea, Forgejo,
Asana, Zenkit). The `.zip` sits with the JSON it is a container for.

The parts checkboxes stay at the top, from the shared popup body: the board
passes `hideFormats` because it lays the formats out itself, and borrows the
selection rather than growing a second copy of it. Its links are built by the
same url helper every other menu uses, so a menu cannot send a different
selection than the one on the screen. Nothing was dropped in the regrouping, and
a test walks the whole list in order to say so.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b0ca22609905c45c35090d097f46d339fb4a748a">JSON and .zip export at every menu, streamed, with the attachments as files</a>. Thanks to xet7.</summary>

The board's Export menu had JSON; nothing else did, and there was no .zip at
all.
Both are now offered wherever an export is - the board, a swimlane, a list, a
card and a checklist - from the same popup, with the same checkboxes deciding
what goes in.

They are the same export in two shapes, not two exports. The document is written
by `models/exporter.js`'s streaming writer either way, so a `.zip`'s
`wekan.json`
and a `.json` download of the same scope are the same bytes. What differs is
where the attachments are: base64 INSIDE the document for JSON - or omitted,
with
the existing "without attachments" option now offered at every menu - and beside
it under `attachments/` as the files they are for the `.zip`.

Both halves stream. The JSON writer already wrote a document at a time from raw
cursors with backpressure; the `.zip` gives it a `PassThrough` that archiver
compresses as it fills, and pipes every attachment from the file store rather
than reading it into a Buffer. A board with a gigabyte of attachments costs a
gigabyte of disk reads and not a gigabyte of RAM - which is what makes the
`.zip`
the shape to use when the JSON is too large to hold as one string.

A SCOPED export is the same `wekan-board-1.0.0` document with fewer rows in it,
plus the lists and swimlanes its cards refer to, so what comes out can be
imported back into somewhere. A section the popup did not tick is an EMPTY array
rather than a missing key, for the same reason. A checklist scope exports the
card that holds it, because a checklist alone has nowhere to land.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bd009cf601b81072308f7e1f56e73c88a89aa7cd">A board, a swimlane and a list export to PDF and Excel in the card export's own layout</a>. Thanks to xet7.</summary>

[#1173](https://github.com/wekan/wekan/issues/1173) "Add Feature: Print Board
with Params" has been open since 2017, and two things were missing. There was no
CHOICE of what to print: the board's Excel and PDF exports took everything they
knew how to render and nothing else, while the card export already had a popup
with a checkbox per section. And they did not LOOK like the card export - the
board's Excel export was a spreadsheet table, one row per card and eighteen
columns, which is a data dump rather than a printed board.

Both now render a board as the board's own header followed by every card as the
CARD export's block, drawn by the card export's own code - `cardBlockLines()`
for the PDF, `ExporterExcelCard.renderCardBlock()` for the Excel one - so a card
looks the same whether it was exported alone or as part of its board, and the
two cannot drift into two layouts again. Each card starts on its own page in the
Excel export, because a printed board is read a card at a time.

The **swimlane and list menus** offer the same export, which is the board export
with one more parameter saying which cards are in scope. They sit beside "Copy
link" rather than below the permission checks, because exporting is reading. The
file is named for what was exported - a PDF titled with the board that holds one
list is a file nobody can place afterwards.

Rendering a card block needs the whole board in memory, and
`models/server/ExporterExcel.js` STREAMS on purpose - it was rewritten that way
after the in-memory version ate gigabytes on boards with thousands of cards. So
that exporter is still there and still reachable: unticking **Card details**
asks for it. That is a checkbox in the popup, not a silent fallback nobody can
see.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bd009cf601b81072308f7e1f56e73c88a89aa7cd">One selection popup, and one list of what an export can contain</a>. Thanks to xet7.</summary>

The card export's popup had a list of sections, and the server had another one,
under a comment reading "Must match ALL_FIELDS in
models/server/ExporterExcelCard.js" - which is a comment, not a mechanism. A
section added on one side and forgotten on the other is either a checkbox that
does nothing or a section nobody can turn off.

Both now import [`models/lib/exportFields.js`](models/lib/exportFields.js), and
so do the board, swimlane and list popups, which are ONE shared body -
`exportScopeBody` - included with a different scope each. The selection is
remembered for the session, because somebody printing a board rarely wants a
different shape for each list of it.

The same `?fields=` gates the same sections in both formats: the card export's
checkboxes used to be labelled "fields to include in Excel export" and did
nothing to the PDF, so one popup meant two things. A section a request does not
name is not rendered and, where the export is the only reason to read it, not
even fetched.

</details>

**Titles** - renaming a thing where its name is written.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6ad79562955d1993d703e9d57885ae5db20088f">Clicking a card's title on the board edits it there</a>. Thanks to bonnebulle and xet7.</summary>

A list's title has always been edited in place: click the heading, type, save.
A card's title could only be changed by opening the card, so correcting a typo
on a board of forty cards was open, edit, close, forty times - which is what
[#4990](https://github.com/wekan/wekan/issues/4990) asked about, in 2022.

The minicard's title text is now an `inlinedForm`, the same component the list
heading uses, with the same textarea, Save button and X. Only the TEXT opens it,
and only for somebody who may write: the complete checkbox, the linked-card
icons and the card number beside it keep doing what they did, and everything
else on the card still opens the card. A title nobody may edit still opens it
too.

The minicard sits inside the link to the card, so a click in the open editor
would have navigated away mid-rename. That default is cancelled - except on the
Save button, whose own default IS the submit, and which the browser picks over
the link around it because the innermost element with an activation behaviour is
the one that runs. An empty save is a no-op rather than a way to end up with a
card that has nothing to click.

**Half of the title edits; the other half drags.** With drag handles OFF a card
is dragged by its own body, so a title that is entirely an edit target leaves
nowhere on that line to take hold of - a grab that moves a few pixels is a
click, and the editor opens instead of the card moving. The edit target is the
LEADING half (left in English, right in Arabic, from one logical edge) and the
trailing half is there to drag from. With handles ON the handle is the only drag
source, so nothing has to be reserved and the whole title edits.

The opened card's title splits the same way, and its drag handle now appears
only when drag handles are on - with them off, the title bar is what moves the
window. The drag surface there is the header ROW rather than the heading: a
heading is only as wide as its own text, so on a short title "the trailing half"
was a few pixels and the empty space beside it - the obvious place to take hold
of - belonged to nothing. The heading fills the row now, and the handler steps
aside for the buttons in it, for the drag handle when there is one, and for the
half that edits.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6ad79562955d1993d703e9d57885ae5db20088f">A board is renamed by clicking its name, and the pencil beside it is gone</a>. Thanks to xet7.</summary>

The board's name in the first header bar had a pencil next to it. Two targets
for one job, and the smaller of the two was the one that did it.

The name itself now opens the rename popup - the SAME `boardChangeTitlePopup`
that the pencil opened, with the title and the description in it, so only what
you click to get there changed. It is opened with the board as its data context,
because that bar's context is the page rather than the board. Board admins only;
everybody else sees a plain title, as before.

A board whose title is EMPTY renders no text at all, and an element with no
content is zero pixels wide - so there would be nothing to aim at, and an empty
title could never be given one. The clickable title carries a minimum width and
height for exactly that.

</details>

**Card and minicard menus** - the settings about a thing, in that thing's menu.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ec8ba5875357860ab65d00efc350b713c490c747">Subtasks Settings is in the menu of the subtask it is about</a>. Thanks to xet7.</summary>

What subtasks DO on a board - whether they are shown at all, which board and
list a new one is deposited in, and how a parent is named on a minicard - was
in Board Settings only: open the sidebar, open the board menu, find Subtasks
Settings. Somebody who wants to change it is usually looking at a subtask on an
opened card at that moment.

It is behind a hamburger at the end of the **Subtasks heading** on an opened
card - where the card and the minicard already keep theirs - and clicking it
opens the same popup Board Settings did. **Board Settings no longer has the
entry**: the settings are where subtasks are.

The heading IS the control that folds the section, so the hamburger's click has
to stop there. Without that, opening the menu would close the thing it was
opened from.

It is the SAME template in both places, with its own state, helpers and
handlers, so neither place needs code of its own and the two lists cannot
drift. That is what the move needed: a template included in two places cannot
reach its parent's helpers, because a helper is looked up on the template it is
written in.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/02025aa6c6dd504869595dc0ff7065579b24fa23">Show on Card and Show on Minicard do not print their own title again</a>. Thanks to xet7.</summary>

The heading row named the columns of a ROW - *Show on Card* over the checkbox
and *Description* over the setting's name - which is what they labelled, but not
what they looked like. The rows flow into as many columns as the window fits, so
the two headings sat above the FIRST of three or four columns and read as if
they named those: *Show on Card* over one column of settings and *Description*
over another, when both columns hold the same kind of row.

The first heading also said what the popup's own title says. Show on Card opened
a popup titled *Show on Card* and repeated it a line below, and the same for
Show on Minicard.

Both are gone, and the two-pixel rule under them with them - one more line
across a popup that is a list of lines. A row is a checkbox and the name of a
setting, which needs no heading over it. One template serves both popups, so
both lose it together, and the sticky positioning that existed only to keep
those headings in view while the rows scrolled goes with it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f0204ae014d1b312355be89bba09717ffeb28d47">Show on Card and Show on Minicard lead the card's and the minicard's menus</a>. Thanks to xet7.</summary>

Board Settings / Card Settings is a table of twenty-four settings with two
columns - what a card shows, and what a MINICARD shows - and it lived in one
place only: the right sidebar, four clicks from the card whose fields it
decides.

It is now also the first entry of the two menus it is about. The hamburger on an
opened card offers **Show on Card**, the hamburger on a card on the board offers
**Show on Minicard**, each followed by a rule like every other group in those
menus. Both open the SAME popup with the other column hidden by a class, so
there is still one list of settings and one set of handlers: a setting added to
the table appears in all three places by itself, and none of them can drift from
the others.

**Both are wide, and lay their rows out in columns.** Two dozen settings in one
column is a list nobody sees the end of - "is Description on?" was somewhere
below the fold. With one of the two checkbox columns hidden each row is half as
wide as it was, so the popup is `min(90vw, 900px)` and the rows flow into as
many columns as fit: one on a narrow window, three or four on a wide one, with
the headings still spanning the width because they name the columns of a ROW
rather than of the grid.

The permission is the one Board Settings already used - a board admin - asked
in the menu and again where it acts. The one menu is opened from two places and
its data context is the card either way, so the opener says which hamburger it
was in [`client/lib/cardMenuSource.js`](client/lib/cardMenuSource.js): a
module-level reactive value, not a field on the card document, which is gone the
next time Blaze re-renders the popup with a fresh copy of it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f0204ae014d1b312355be89bba09717ffeb28d47">Hide minicard label text became the Labels text row, and now works when logged in</a>. Thanks to xet7.</summary>

It was in the right sidebar under the People and Organizations tabs, which is
not where anything else about a minicard is. It is a row of the same table now,
directly under **Labels**, named "Labels text" with the Labels icon and the
Description Text icon in front of it - because it is about what those labels
look like on a minicard: coloured words, or coloured bars with the words left
out.

It is ticked when the text is SHOWN, which is what a board does out of the box.
The stored flag is a "hidden" one, so reading it straight through would have
left the box unticked for the default behaviour, which reads as a broken
checkbox.

It is the one PERSONAL row of a board-wide table - the user's own profile, or
this browser when nobody is logged in - so it appears in the minicard's view
and nowhere else, and it is offered to EVERYBODY. A reader who is not a board
admin gets that row alone rather than a table of checkboxes the server would
refuse.

The move found a bug. The setting was written out three times, and the
minicard's own copy only ever wrote `localStorage`: a logged-in user toggling it
set something nothing reads, because for a user the value is read from the
profile. One module reads and writes it now
([`client/lib/minicardLabelText.js`](client/lib/minicardLabelText.js)), so the
two halves cannot disagree again.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8d0a457e6893756c4cddf58ec776e728005e01c8">Custom Fields and Edit custom fields are one group in the card's menu</a>. Thanks to xet7.</summary>

The board's LIST of custom fields - where a field is created, renamed or
deleted - was in Board Settings only, and the picker for which of those fields
are on THIS card was down among Voting, Planning Poker and Spent time. Two
halves of one subject, three groups apart.

They are one group now, under Watch and its rule: **Custom Fields** first,
because a field has to exist before a card can be given it, then **Edit custom
fields**, then a rule like every other group in that menu. A board admin's, the
same as in Board Settings.

**Card Settings is gone from Board Settings.** Every setting in that table is
in the menu of the thing it is about now, so a board-wide entry as well would
be a third way to one list - and the way that is furthest from what it changes.
The table itself is unchanged; the two menus include it.

**Everything about custom fields is on the section that shows them.** It was
spread over three places: Board Settings had the board's LIST of fields behind a
right-sidebar view, the card menu had an entry for that list and another for the
picker of which fields are on this card, and the picker had a cog that jumped
back to the sidebar - closing the menu and the card pane on the way.

One place now: the **hamburger at the end of the card's own Custom Fields
heading**. It opens every field the board has, ticked when it is on THIS card,
with a pencil each and, under a rule, **Add custom field**. Edit and Add open in
the same pop-over on top of that list, so the back arrow returns to it and the
card stays open behind; they are the board's own forms, not second copies of
them. The card menu's entry and the Board Settings row are both gone, and so is
the wrapper popup that nothing opened any more.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9d9b8ae93b3876845510d28c8905e1ae63c6c03f">Show list on minicard became the List title row of Show on Minicard</a>. Thanks to xet7.</summary>

It was a line in the card's menu that read "Show list on minicard", or "Hide
list on minicard" once it was on - a menu entry that changes its own name is
the shape a checkbox has, drawn as a sentence. It is a checkbox now, the FIRST
row of Show on Minicard, above Received, named **List title** and unchecked by
default, which is what the field itself has always been.

It shows the name of the LIST the card is in on its minicard, which is worth
having where a card is read away from the column it lives in: a swimlane,
search results, My Cards. The board-wide "Show lists" row further down the same
table turns that on for EVERY card; this one is for a single card that needs it,
and either is enough for the name to show.

It belongs to the card rather than to the board, so it is drawn only in the
minicard's own view - Board Settings has no card to act on - and only for
somebody who may change that card, which is the permission the menu entry had.
The card is passed into the popup and re-read from the collection when it is
toggled: a minicard's menu is opened from the board, where there is no "current
card" to fall back on.

On the minicard itself the name sits on its own line under the badges. It was
landing BESIDE them: the badge row is `float: inline-start`, so the line after
it shared its row and read as one more badge rather than as the line it is.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6a6fc252929cb98b8bd6116dcd45d1cf68837d35">Change Background Image holds both ways of setting one, and Unset sits beside Save</a>. Thanks to xet7.</summary>

Two popups of the same menu answered one question. **Change Background Image**
asked for a URL; **Board backgrounds** listed the images uploaded to this board
and carried the upload button. So the popup that reads as the place to set a
background had half of the ways to set one, and the other half was behind a
different entry.

The upload is under the URL field now - a picture from the web and a picture
from this machine, read together. Board backgrounds keeps what it is named for:
the images already there, to set active, download or delete. The uploader moved
as its own template, once, rather than being copied.

In the same popup, **Unset** was five blank lines and a rule below the **Save**
it belongs beside. They are one row, Save first, sharing the width. Unset is
`type="button"`: inside that form a button with no type is a SUBMIT button, so
beside Save it would have saved the URL it is meant to clear.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/48cf269870c087f36137f1b4960712c0df1b6f39">Members and Labels fold in the board sidebar, by their headings</a>. Thanks to xet7.</summary>

The two sections at the top of the right sidebar could not be folded at all.
The People / Organizations / Teams / Domains tabs with their avatars, and every
label of the board, were always open and pushed everything under them down the
panel.

Both have a caret in front of their heading now, and the heading is the button
- the same control an opened card's sections use, and the same one Activities
got below them. Folding **Members** hides the tabs and the avatars in them;
folding **Labels** hides the labels and the + that creates one. Enter and Space
do what a click does.

The choice is the reader's and lasts the session, not the board's: neither
decides anything on the server, so folding them for yourself must not fold them
for everybody. Activities is the exception and stays as it is - its caret
writes `board.showActivities`, which also decides what the publication sends.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7d0396ebec899e0ade36d78cf6a19ad8f6fba4ff">The board's controls in the header bar fold into one caret</a>. Thanks to xet7.</summary>

A caret leads the group, at its leading edge - left of the lock in a
left-to-right page, right of it in Arabic, because its direction comes from the
same rule every other caret uses. Folded, the seven controls after it are gone
- **Private**, **Muted**, **Sort Cards**, **Filter**, **Search**, **Show
dependencies** and **Multi-Selection** - and the bar is the logo, the board's
name and the caret.

The buttons a board's own Rules put in that bar are NOT folded with them:
somebody added those to this board on purpose, so the standard controls fold
around them. It is named by the words the app already has - Collapse and
Uncollapse - so no key was added to 147 language files to say them again, and
it answers Enter and Space like the button it says it is.

All three folds share one store, one helper and one class
([`client/lib/foldState.js`](client/lib/foldState.js)): a caret in the header
and a caret in the sidebar pointing different ways in one language is the bug
that avoids.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f0204ae014d1b312355be89bba09717ffeb28d47">The board sidebar's Activities has a caret instead of an eye</a>. Thanks to xet7.</summary>

The heading read "Activities" and beside it sat an eye and the words "Show
activities" - one setting with two controls and its own name said twice. It is a
caret in front of the heading now, and the heading is the button: click it and
the activities appear under it, click it again and they are gone. That is the
same control every collapsible section of an opened card has, from the same
function ([`client/lib/sectionCaret.js`](client/lib/sectionCaret.js)), so the
caret cannot point one way on a card and another in the sidebar of the same
language - it points down when open, and toward the text when closed, which is
right in English and left in Arabic. It carries `role="button"` and a tabindex,
so Enter and Space do what a click does.

</details>

and fixes the following bugs:

**The release workflow** - what reaches the Release page.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/38c6ee29fd7487630ed18afe001e59ae5b8440f2">Three snaps built, published, and then fell off the Release: one file listed twice</a>. Thanks to xet7.</summary>

v10.91's release run failed in four jobs, and three of them - **s390x**,
**ppc64el** and **riscv64** - had done all the work: each snap BUILT on
Launchpad and each was published to the Snap Store. What failed was attaching it
to the GitHub Release:

```
HTTP 404: Not Found (https://uploads.github.com/repos/wekan/wekan/releases/370103352/assets?label=&name=wekan_10.91_s390x.snap)
```

The step collected the file with two patterns - `wekan_${VERSION}_<arch>*.snap`
and `*_<arch>.snap` - and a snap called `wekan_10.91_s390x.snap` matches BOTH,
so the same path was passed to `gh release upload --clobber` twice. Asked to
attach one name twice, it deletes the asset it has just uploaded and then 404s
on it. The two other places in the same job that build this list were already
deduplicated; this one was missed.

It is deduplicated now, and the attach is confirmed from the other side the way
the native snap job already did it: read the release's assets back and fail if
this snap is not among them. An upload that reports success and leaves nothing
behind is the failure nobody notices until somebody's download 404s - and here
every job that lost an architecture had already said the snap was built and
published.

The fourth failure, **armhf**, is not this: `snapcraft` died with
`SSLEOFError` while downloading the build log from Launchpad, on all three
attempts, and produced no snap. That one is Launchpad's side of the wire.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac02941663a1a9917896f790a6ab83b8ba9cd15a">v10.92 could not start bash: the release notes outgrew an environment variable</a>. Thanks to xet7.</summary>

v10.92's release job failed before running a line of its script, and with it
every job that needs the release - snap, docker, AppImage, the Windows and
macOS bundles - so **nothing published at all**:

```
  ##[error]An error occurred trying to start process '/usr/bin/bash' with
  working directory '/home/runner/work/wekan/wekan'. Argument list too long
```

Nothing in the step was wrong. The notes are the whole newest CHANGELOG
section - `prepare` measured them at **172,458 characters** - and they reached
the step as `env: CHANGELOG:`. Linux caps a SINGLE argv/envp string at
`MAX_ARG_STRLEN`, **128 KiB**, so `execve` refused to start the shell. The amd64
and arm64 bundles had already built and verified; only the publishing died.

The environment was itself the fix for the PREVIOUS failure. Interpolated
inline as `${{ }}`, the notes become part of the shell SOURCE, so a backtick in
any `code` span runs as a command: that is how v10.59 published nothing and
printed *Incorrect: command not found*. One shape is unsafe and the other does
not scale, and this release was the first big enough to find the second wall.

So the notes stop being a shell value at all. `releases/release-notes.sh` prints
the CHANGELOG section for a version, reading the file itself and taking its
arguments from the environment inside a QUOTED heredoc, and each job appends its
stdout to `release-notes.md`. Only file PATHS are passed around, which has no
size limit and leaves the text as data that no shell ever parses.

`prepare` keeps the validation - a missing section is still cheap to fix there -
but no longer publishes the text as a job output, because an output nobody can
safely consume is a trap for the next person to find. The release job and the
notes-rewrite job check out `ref: main`, the same ref `prepare` read.

The guard test is rewritten around the new shape: no changelog job output, no
CHANGELOG in an `env:`, no interpolation into a script, and the extraction
script is what all three consumers run. It passed throughout this failure,
because it only knew about the injection.

</details>

**Starting up** - what a browser sees while WeKan cannot yet serve.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b4499b0ddc5d8059b8feac1802e1417d3ee1c8ef">A container waiting for its database says so, instead of timing out</a>. Thanks to Alishara and xet7.</summary>

*"We upgraded to 10.91 ... Gateway timeout appears"* -
[#6595](https://github.com/wekan/wekan/issues/6595), from the same reporter as
[#6592](https://github.com/wekan/wekan/issues/6592), whose fix shipped in 10.91.
It could not reach them: that fix is the SNAP's, and this is a container.

WeKan does not open its web port until the database answers, and in a container
nothing else was listening while it waited - so a reverse proxy in front
returned a gateway timeout, and that is the same symptom for two completely
different faults: WeKan is broken, or the database has not come up yet.

The entrypoint now asks whether the database answers (one `ping`, with the
driver already in the bundle), and while it does not it serves the same bridge
page the recovery case uses, saying **WeKan is waiting for its database** and
where to look. What is bounded is the PAGE, not the wait: a database can take
minutes to come up after an update, and giving up on it would be worse than
waiting - so when the window ends the page stops, WeKan starts, and WeKan keeps
waiting exactly as it did before. `WEKAN_DB_WAIT_PAGE=false` turns it off.

</details>


**Performance** - what the database is asked, and what it has to walk.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/569dd4af541b797c8df763aef38cf0db820bf9ea">Cards, activities, comments and checklists are indexed at last</a>. Thanks to xet7.</summary>

Reported by email against 10.91: *"Still slow on loading cards. Test server with
me as only user."* One user is the part that says what it is NOT - with nobody
else on the server there is no contention, no queue and no lock, so the time is
going into the queries themselves.

It was. **`cards`, `activities`, `cardComments`, `checklists` and
`checklistItems` had no index at all** - everything a board draws and everything
an opened card pulls in. "The cards of this list", "the comments of this card",
"the newest activities of this board" each walked the whole collection. That is
invisible on a demo board and expensive on a real one, and worse on FerretDB,
whose SQLite backend has to walk the same documents.

The activities publication even explains that it keeps its selector flat *"so
both push down to FerretDB v1 (SQLite)'s index instead of forcing a
full-collection scan"* - and there was no index for it to push down to.

Each new index matches a selector the app really makes WITH the sort it really
uses, so it serves both the filter and the order: a filter-only index still
leaves an in-memory sort of everything it matched, which on a board with a year
of history is the slow half. They are created through the same idempotent
`ensureIndex` every other index here uses, so a restart does not rebuild them
and a backend that refuses one logs it instead of stopping the server.

</details>

**Attachments and the snap's databases** - what can be read, and what cannot.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/146a5184d90028b3ccf917069b3007ef520fcb59">Moving attachments out of CollectionFS no longer deletes a binary two records share</a>. Thanks to sbruckmueller and xet7.</summary>

Moving from MongoDB CollectionFS to File-System stopped on some attachments
with `FileNotFound: file 66336fc372e64200010f4832 was not found`, and the
reporter had it exactly: it is the identical files.

A CollectionFS filerecord points at its binary by `copies.<coll>.key`, the id of
a file in the `cfs_gridfs.<coll>` bucket, and TWO filerecords can carry the SAME
key - the same file attached twice, or a board copied with its attachments. The
migration deleted the binary as soon as it had moved the FIRST of them, so the
second read a file that was no longer there. The binary now goes only when no
other filerecord still names it, and when the question cannot be asked the
binary stays: a file left behind can be removed later, an attachment deleted out
from under another record cannot be brought back.

A binary that really is missing - metadata restored without the chunks - is no
longer a MongoDB stack trace naming a GridFS id. It names the attachment, says
where it was looked for, and counts as SKIPPED rather than failed, because there
was nothing to move. The Admin Panel's summary line shows how many were skipped
and how many failed, so a run that leaves attachments behind cannot look like a
run that moved everything.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ff21ac962c671bb9cf18a3c07db9ccf7877d30c">A snap whose MongoDB files no reader can open stops comparing them with FerretDB</a>. Thanks to mueschel and xet7.</summary>

An instance whose MongoDB data was written by a MongoDB older than any `mongod`
the snap carries printed this at every start, before the site came up:
`BOTH databases have been written to since the migration` and then `[autopick]
reading both databases to see which one holds the work ...`.

`mongodb_has_data` answers "are the files there", not "can anything here open
them", and on that instance those are different answers - `mongod` 7, 5.0 and
4.2 each refused the files in turn. So the comparison ran on a copy that cannot
be served, and it is not a cheap question: it starts a mongod that cannot open
the data, and then a SECOND FerretDB against the SQLite directory the running
one already holds.

`migration-control` has already tried every reader in the snap and left
`.mongodb-data-too-old` behind when none could open the files. With that marker
present the MongoDB copy is no longer a candidate, and WeKan serves the FerretDB
that has the data. Nothing is deleted and the marker stays: it is true, and it
is right again on a snap that can read those files.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/804004e9e88cf4d21c4f34e7201f532a7ae59cc8">Comparing the two databases reads the one that is already running</a>. Thanks to waltermhl and xet7.</summary>

`snap run wekan.database-compare` answered `MongoDB: <unreadable>` and
`FerretDB: <unreadable>` on a live instance whose `wekan.sqlite` was 85 MB and
whose site was up.

FerretDB was unreadable BECAUSE it was up: SQLite has one writer, so the second
FerretDB the comparison started against the same directory did not get the data.
The tool then reported the database it had been talking to all along as
unreadable, and refused to choose.

The live one is asked first now - `evidence` only counts and sorts - and a
second copy is started only for a database that is not running. Both speak the
MongoDB wire protocol on the same port, so which one is answering is asked
rather than assumed: FerretDB names itself in `buildInfo` and a `mongod` does
not. Reading one as the other would be a wrong answer given with confidence,
which is worse than "unreadable".

</details>

**The page sidebar** - the controls of a page that has no sidebar of its own.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9ef05970d3cb20f9babbcb03dd31cc58f598fe11">The controls in the page sidebar are rows, not three links run together</a>. Thanks to xet7.</summary>

Rules, My Cards, Due Cards and Global Search each keep their controls in the
shared page sidebar, and each draws them as `.board-header-btn` - which is what
they were when they lived in that page's own second header bar.

Every rule for that class is scoped to `#header-quick-access`, so inside the
sidebar they had NO styling at all. On the Rules page that is three bare links
jammed onto one line - *"← Board 🔀 Workflow view ⇄ Import / export"* - with the
icons run into the words and nothing to click but the text itself.

They are rows now: one per line, the width of the panel, with the icon in a
fixed column so every label starts at the same x, and a hover to click against -
the shape the board sidebar's own rows have. Both sidebars built on that shell
get it, All Boards' as well as the page one.

</details>

**Minicards** - what a click on one does.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f525b391a649e7b9cb2c683a3d3f622ec9a385be">The stickers popup is wide enough to see the stickers</a>. Thanks to xet7.</summary>

A hundred and fifty icons, eight to a row, in a popup 380 pixels wide: a column
taller than the screen, so choosing a sticker meant scrolling past most of them.

It is as wide as the colour pickers now - `min(90vw, 720px)` - and the picker
is a grid that fits as many columns as the width allows instead of stopping at
eight. The clamp that places a popup knows the new width too, or a popup opened
near the right edge would have landed half off screen.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f525b391a649e7b9cb2c683a3d3f622ec9a385be">A label on a minicard opens the labels, and not the card as well</a>. Thanks to xet7.</summary>

Clicking a label opened the card's labels popup AND the card details behind it:
the click reached the minicard too, so one click did two things and the one
nobody asked for was underneath the one they did.

It stops at the label now. A click in the labels AREA that is not on a label is
still the card's, as before - and which label was clicked is read from the
EVENT rather than from `:hover`, which answers about the pointer and on a touch
screen can still be true for whatever was tapped last.

</details>

**Card details** - the card as it is opened and edited.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aba09a087935423d8ec209cb67ff5d956b3e336d">Custom Fields is reachable on a card that has none, which is where it is needed</a>. Thanks to xet7.</summary>

Everything about custom fields moved to the hamburger at the end of the card's
own Custom Fields heading - the picker of which fields are on this card, a
pencil each, and *Add custom field* - and the card menu's entry, the Board
Settings row and the wrapper popup went with it. But the heading itself was
drawn only when the card already HAD a custom field on it.

So the one way in existed only once you were already through it. A card with no
custom field had no heading and therefore no hamburger; a board that had never
used them had no way in anywhere, because the sidebar view that still holds the
create and edit forms is opened by nothing. It is invisible on any board that
already has a field - which is every board a developer tests on - and the
browser tests found it on a seeded board that had none.

The heading is drawn for every card its reader may write to now, the same
condition the rest of the editable card uses. The FIELDS below it still come
from the card's own values, so a card with none shows an empty section rather
than a phantom row per board definition, and a reader who may not write sees no
heading at all.

The anchor that used to open the old popup went too: the move took away its
label text and left the tag, so it rendered nothing, could not be clicked, and
still had two handlers bound to it. `tests/customFieldsSectionMenu.test.cjs`
gains the two checks that would have caught this - the heading is gated on who
may write rather than on what the card already has, and no empty anchor or
orphaned handler is left behind.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/67b91c850433ed04569734ff749c759ac557ac81">A custom field made from a card is actually created, and its pencil is beside its name</a>. Thanks to xet7.</summary>

Two things wrong with the popup the Custom Fields heading opens.

A new field made from it never appeared. *Add custom field* sits OUTSIDE the
list of fields, so its data context is the popup's own - which is the CARD - and
the create and edit forms are one form that decided which it was doing by
whether its context had an `_id`. A card has one, so creating a field from a
card ran the UPDATE branch against a custom field whose id was a card's: no such
document, nothing written, and nothing said so. The same form works from the
board sidebar, where the context has no `_id`, which is why this only ever
happened from a card.

Both halves are fixed. The popup hands the form an empty context, because a new
field is made from nothing. And the form no longer trusts a bare `_id`: it asks
whether that id NAMES a custom field, so a context arriving from anywhere cannot
make it update one that is not there.

The pencil that edits a field sat on a line of its own under the field's name.
Every other pop-over list has ONE anchor per row, so the row is a block and the
anchor fills it - and two anchors in a block stack. This list has two by design,
the name with the checkbox that puts the field on this card and the pencil that
edits the field itself, so the row is the flex container now and the name takes
the space the pencil does not. Scoped to this popup, so no other list moves.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/47099b8baadc0bdfcefe5006bf16ed8e7e7ca565">Ten popups had no header, and so no close button</a>. Thanks to xet7.</summary>

A pop-over draws its header from its title, and with no title it renders as
`no-title`: no header, no X, no back arrow - Escape or a click away are the only
ways out. Noticed on the question "Are you sure you want to delete this
background image?", which is the worst place for it.

Ten of them were in that state, and each is titled the way the other 151
already were: a `<name>Popup-title` key. Delete Background Image, Delete
Duplicate Lists, Delete Account, Add Domain, Remove Domain, Map to existing
user, Export swimlane, Export list, Export checklist, and the member popup.

They were added to EVERY language file at the same position, as the English
placeholder a pull would produce - the files are one key order, and a key
inserted in some and appended in others makes every later diff unreadable.

The other mechanism, `Popup.open(name, { titleKey })`, is not a second way but
the same one pointed at a phrase the app HAS - "Custom Fields", "Sort Boards",
"Show on Card" - so a word already translated 147 times is not copied into a
new key that would start as English in all of them.
[`tests/popupTitles.test.cjs`](tests/popupTitles.test.cjs) walks every popup
template and fails if one resolves no title at all, so the next one cannot ship
without a header.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac201d4b5988bf314b4efcb0619ccdc36ab64595">Upload background image did nothing, and every attachment upload now shares one config</a>. Thanks to xet7.</summary>

"Upload background image" picked a file and then nothing arrived. Two fields of
an upload's config are not optional in the way they look, and the board
background's config - written by hand - had neither:

- **`fileId`, and the same id copied into `meta.fileId`.** Attachments'
  `namingFunction` is what decides the name a file is STORED under, and on the
  client it reads that id out of `meta` and deletes it. Without it the name is
  `undefined`.
- **`transport`.** HTTP everywhere, because Meteor-Files' default DDP floods
  the WebSocket and makes Safari reconnect at ~95%; DDP on Sandstorm, whose
  http-bridge strips the `x-*` upload headers so every chunk comes back "Can't
  continue upload, session expired" [408].

Both come from one builder now, in
[`attachmentUploadConfig.js`](client/lib/attachmentUploadConfig.js), used by the
card's file picker, the card's pasted image and the board background alike - so
the next uploader gets them by asking for a config rather than by knowing two
things nothing would have told it.

One popup answers the whole question now - the URL, the upload, and the
pictures uploaded to this board - and **Board Settings / Board backgrounds is
gone** with the popup it opened: a second entry to a list that is already on
screen is a second place to look for one thing. Clicking a PICTURE, or its
name, puts that one behind the board; it used to be a 14px check icon in the
row under an 80px picture of the thing it applies, so the obvious click did
nothing. Download and delete stay in that row, being the two things a picture
cannot say.

Three things around the upload made the failure impossible to read, and are
fixed with it. `insertAsync` can reject BEFORE there is an uploader to listen
to, and that rejection went nowhere: the spinner stopped, no message appeared,
and the picture simply never turned up. It is caught and shown now. Each
picture is listed with its NAME, because two photos are the same picture at 80
pixels and nothing said which one had arrived. And a finished upload puts
itself behind the board: "add background image" is asked for by somebody who
wants that picture there, and an upload that only lands in a list, with the
board unchanged, reads as one that did not work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac201d4b5988bf314b4efcb0619ccdc36ab64595">An avatar with no name to draw broke the render around it</a>. Thanks to xet7.</summary>

`getInitials()` ended with `this.username[0]`, so a user document that arrived
without a username threw a TypeError - from a Blaze helper, mid-render. Two
helpers call it, so each avatar threw twice, and the second throw left the SVG's
`viewBox` half-written (`0 0  15`), which Firefox refuses outright: the avatar
drew nothing and took the rest of that render pass with it.

It is total now: initials, then a fullname, then the first letter of a username
if there is one, then an empty string - a blank circle rather than a broken
page. A fullname of only spaces used to spell the literal word "undefined" in
the circle, because an empty word still contributed its missing first letter;
empty words are skipped.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/443e65b6d0eb2f6b5131d56f4659a4510d1a3039">The Date Format menu is back: two collapse mechanisms were folding one field</a>. Thanks to xet7.</summary>

The dropdown that chooses a card's date format disappeared, and nothing brought
it back - the Received, Start, Due and End dates under the same heading were
there, but the selector above them was gone.

Two things were folding it. [#1591](https://github.com/wekan/wekan/issues/1591)
gave every FIELD of an opened card a caret on its own title and hid everything
after that title when it was clicked, storing the fold per card in the user's
profile. The section carets that replaced it put ONE handle on each section's
heading - and that heading is drawn on the first field of the section, so a
click on it was also a click on a field title. The old handler ran too, folded
that field, and stored it. Reopening the section brought the dates back but not
the field the heading sits on, and the per-field caret had been suppressed
inside a group, so there was nothing left to open it: the Date Format select
was hidden for good.

The #1591 half is gone - the handler, the caret it drew, the rule that hid the
siblings, and the per-card state it re-applied on render. Every field lives in
a section now, and the section's heading is the only handle. The same per-user
store still belongs to the CHECKLISTS, which key their own entries by checklist
id and are untouched; that is why the store itself stays.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7a75779b2cba58de149b99f308360b9944a50dd3">What the card restructuring nearly took with it, and a Copy card link button that can be read</a>. Thanks to xet7.</summary>

Moving eleven sections with a script is how markup disappears without anything
failing: the file still compiles, the tests still pass, and a card is quietly
missing a row. Comparing the card against its state before the section work
turned up four things, three of them lost:

- the **card button row** (`+cardButtons`) - a slice used it as a boundary and
  swallowed it;
- a custom field's **name**: `+cardCustomField` renders the value and nothing
  else, so a card with three custom fields showed three values with nothing to
  say what they were;
- the **attachment count** beside the Attachments heading, which the board
  setting for it still governs;
- and one thing GAINED that should not have been: a second, bare **+** beside
  the End date's add button.

All four now have a test of their own, because each was invisible to everything
else.

The **Copy card link to clipboard** button carried only `.btn`, so it fell back
to the plain grey button whose dark label is nearly unreadable on a dark theme.
It is a `.primary` now - the board's accent with white text - named in the same
rules as the other themed buttons rather than given a copy of them.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c747d51bafd7f7ac09c618be8ea9e00aa37b9762">A group's caret is on its first field's title, so the titles read as one row</a>. Thanks to xet7.</summary>

Grouping the fields gave each group a header LINE of its own, and for a group
named after its first field that line said the same word twice, one above the
other: "Labels" and then "Labels, Stickers, Location".

There is one row of titles now, with the caret at the start of it: **Labels
Stickers Location**, **Members Assignee Creator**, and their **+** buttons on
the row below. The caret belongs to the first field's title rather than to a
header above it, and everything it folds - that field's own content and every
field beside it - is behind the same switch, so a collapsed group is exactly one
line.

The rule moved with it, from inside a field to the group, where it spans the
card. The **Checklists** icon is a plain check again rather than a check in a
box, which is what it was before it became a section.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/050df89f06ab07a17899a4b032beeae04676c270">Requested By and Assigned By are set with a + like Members, and survive an import</a>. Thanks to xet7.</summary>

**Requested By** and **Assigned By** were set by clicking the word "Add". They
have the round **+** the two fields beside them use now, opening the same editor
the text does.

Checking where else those two live turned up a round trip that lost them, which
is the worst shape this kind of bug takes - the export file looks complete and
the import reports success. They were exported by the card PDF, the card Excel
and the board CSV, and imported by NOTHING: a card exported and imported back
came home having forgotten who asked for it and who assigned it. Both importers
put them back now, our own JSON and .zip and the per-menu one.

The board's Excel TABLE did not export them at all, so that one gained two
columns - header and value together, since a header without its value shifts
every column after it.

And from other trackers, where the same idea has another name: **Jira's
Reporter** is who asked for the work, and an issue's **author** on GitHub,
Gitea, Forgejo and GitLab is the same thing. Both arrive as Requested By, as
free text, so they survive an import from a tracker nobody on this board has an
account on. A source with no such field - Trello, CSV - gains nothing, which a
negative test pins.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/050df89f06ab07a17899a4b032beeae04676c270">Assignee and Creator sit beside Members, with their + buttons on one line</a>. Thanks to xet7.</summary>

Grouping the fields left two things crooked. Members, Assignee and Creator were
each a full-width row, so Assignee and Creator fell to the line below Members -
the class that made a FIELD full width was from before the groups, and the group
is the full-width row now. And a field whose title had been taken over by the
group header had its **+** on the first line, level with its neighbours'
titles, instead of on the second line with theirs.

Every field in a group keeps its own title again. The group's header names the
family and folds it; the field's title names the field, and its content - the +,
the avatars - starts on the line under it, level all the way across.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/83147dcc3e357ccfce9a1702568484f2d70bcb3d">A card's fields fold in GROUPS, from one caret each, and Members reads Members, Assignee, Creator</a>. Thanks to xet7.</summary>

The caret beside **Labels** folded the Labels field and left Stickers and
Location sitting under it, and every field had a caret of its own on the right -
[#1591](https://github.com/wekan/wekan/issues/1591) draws one on each
`.card-details-item` - so a row could have two handles saying the same thing in
two sizes.

The fields belong to FAMILIES, and the families are what fold now:

- **Labels** - Labels, Stickers, Location
- **Date Format** - the format, Received, Start, Due, End
- **Members** - Members, Assignee, Creator, Requested By, Assigned By
- **Dependencies**
- **Sort** - Sort, List, Spent time

One caret per group, on its title, at the reading direction's start. The fields
inside a group have none: #1591's per-item caret is turned off there, and its
title is no longer a handle. Outside a group it is untouched, so nothing that
folded before stopped folding. A collapsed group is one line - the caret, the
icon and the name - because everything else is inside the fold.

**Members** reads Members, Assignee, Creator, which is the order it was asked
for. The loose rule the layout drew above the users block is gone with it: the
group's own rule is above the whole group, so there is one line there instead of
two.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/365cfdc4df5187e9cbfc8f83acab39df755a19c7">The rules between card sections are the page's own line, and there is one where there should be</a>. Thanks to xet7.</summary>

Four small things about those separators, all of them visible at a glance and
none of them visible in the source.

The rule drew a **border of its own**, darker than the line the card already had
above Creator. It is that same lighter `hr` now - the section rule sets only its
spacing, so there is one line style on the card rather than two.

**Labels** had a rule above it. It is the first section: there is nothing above
it to be separated from. **Members** had one too, immediately under the rule the
layout already draws above Creator - two lines with a heading between them.
Neither draws one now, and every other section still does.

And the rule above **Activities** was to the LEFT of the heading rather than
above it, because `.activity-title` is `display: flex` and a rule inside it is a
flex item. The heading sits outside that row now.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c4d1801022c1c2ce021c2bb759208b820d128c9d">A section is one full-width row with one rule, and is named once</a>. Thanks to xet7.</summary>

Two things the collapsible sections got wrong the first time, both visible the
moment a card was opened.

**Short rules everywhere.** `.card-details-items` is a wrapping flex row, and
the
rule was drawn INSIDE a section - so it was as wide as that box, which is a stub
of a line beside a heading rather than a separator across the card. The six
sections that live in that row are now rows of their own, so the rule in them
spans the card, and the items that were laid out side by side on purpose -
Stickers, Location, the four dates, Creator, Assignees - still share rows as
they
did.

**Two headings for one section.** The Checklists and Subtasks templates draw
their own title, and the new section header drew it again, so a card showed each
of those names twice, one above the other. The templates keep what belongs to
the LIST - add a checklist, add a subtask - and the section header is the only
thing that names the section.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/384f03b359a47592e08a16060675e330319ec36c">Every section of an opened card collapses from its own caret, with one rule between sections</a>. Thanks to xet7.</summary>

A card had ONE caret, in its header, which collapsed the whole card - and
**Activities** had an eye beside its heading. Every other section was a heading
with no control at all, and the rules between them were written by hand wherever
somebody remembered one.

**Labels**, **Date Format**, **Members**, **Dependencies**, **Sort**, **Custom
Fields**, **Description**, **Checklists**, **Subtasks**, **Attachments**,
**Comments** and **Activities** each carry a caret that collapses that section,
and one rule above it. Both come from ONE template, so eleven sections cannot
end
up with ten separators and nine carets. The heading is a real button - it
announces itself as one and Enter or Space works it - rather than a click target
only a mouse can find. The caret points DOWN when a section is open and toward
the way the reader reads when it is closed: right in English, left in Arabic,
Hebrew and Persian.

**Activities starts collapsed** and everything else open, because a card is
opened to read the card and its history is the thing you go looking for.

The eye is gone, and that needed one piece of care: it was NOT the same control
as the caret. `showActivities: false` - its default - subscribed to
`activityType: 'addComment'` only, so the eye chose between "comments" and "the
whole history" as much as it showed and hid. Removing it without more would have
quietly turned an opened Activities section into a comments-only list. So a card
section that is OPEN now asks for the whole history, and one that is closed
subscribes to nothing at all - which is the cheaper half of what the flag was
for, without a second control to keep in step. A card that had the flag
explicitly set to false keeps it.

Custom Fields is one section with one caret however many fields a card has: its
header was briefly inside the loop that draws them, which would have been six
sections sharing a caret on a card with six fields.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c7b3e8df36d185d97a7cbe442f0eba76ecd897e">A dependency's card title wraps instead of being cut off at the pane edge</a>. Thanks to xet7.</summary>

In an opened card's **Dependencies** section each row is an icon, the linked
card's title and its controls, and the title was held on one line with an
ellipsis. The card details pane is narrow and a card title is a sentence, so
most of a real title - everything to the right of the coloured icon - could not
be read at all.

It wraps now, and the row grows as tall as it needs to. Two properties, and the
second is the one that is easy to miss: `white-space: normal` alone would have
changed nothing, because a flex item's default `min-width: auto` refuses to
shrink below its content, so the text overflowed the row instead of wrapping
inside it. `min-width: 0` is what lets it. A title that is one long token - a
URL, an id - breaks inside itself rather than pushing the type, colour and
remove controls off the row, and the icon and those controls now sit beside the
FIRST line instead of floating halfway down a three-line block.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bada25de4d95b0e5b473ec3176dccffcc5a999a7">Editing a card title keeps the X that closes it</a>. Thanks to xet7.</summary>

Clicking a card's title opens the title editor in place of the card header - and
the header is where the card's own close X lives, so the X disappeared the
moment you started editing and **Save** became the only visible way out. Escape
still worked; nothing on the screen said so.

The editor draws the X itself now, reusing the header button's own class, so it
is the same size in the same place and does not jump as the editor opens and
closes. That class floats to `inline-end`, which is the right in English and the
left in Arabic, Hebrew and Persian without a second rule - so the mirroring
needs no direction branch and must not grow one.

The same one-line omission was in the **Requested by** and **Assigned by**
editors right below it: the close anchor was there, its icon was not, so the
click target existed and was invisible. They have their X now too.

</details>

**Card export** - what it says, and in whose language, format and time zone.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/698e980e27522b53f60ad6fce347727cb11eb017">A card's PDF and Excel exports carry the same fields, under the same translated labels</a>. Thanks to Heart1010 and xet7.</summary>

[#6586](https://github.com/wekan/wekan/issues/6586) was reopened for what the
first fix left: the PDF export of a card had grown separately from the Excel
export of the same card, and every point the reporter came back with was a
symptom of that. The labels were hard-coded English - "Assignee, Labels, due,...
these titels should be in the user set language". They were not even consistent
with each other: the card export wrote `Due: `, the board export wrote `due `
with no colon and a lowercase letter. And a card carries more than either export
printed - "I think all those other things we set in a card should be also
present
in the pdf? Location, Voting, Checklists, Subtasks, Custom Fields, Attachments,
Comments...".

Two exports of one card that disagree about what is on it are one bug reported
twice, so the fix is to stop them being two things. Both now carry the same
fields, in the same order, under the same i18n keys, in the language the request
carries: title, labels, creator, assignees, members, board, swimlane, list, card
number, requested by, assigned by, the six dates, spent time, description,
custom
fields, checklists, subtasks, comments, attachments, voting and Planning Poker.
The three sections neither export had - **custom fields**, **voting** and
**poker** - are new on both sides, selectable like the others in the Excel
export's field checkboxes, and appended to that list rather than inserted, so a
saved `?fields=` link still asks for what it always asked for.

Inside the PDF exporters one `field()` helper writes every `Label: value`, which
is what makes the board export's "due" and the card export's "Due:" impossible
to
have at once again. Every label carries its English text as the fallback, so a
language that has not translated a key shows the word rather than the key.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/698e980e27522b53f60ad6fce347727cb11eb017">Exported dates are in the reader's own time zone and date format, not the server's</a>. Thanks to Heart1010 and xet7.</summary>

"The marked due date - here the time is not in the user set timezone (-2h wrong
for Europe/Berlin)." It was worse than -2h: the PDF export printed UTC and the
Excel export printed whatever zone the server process was started in, so the
same
card could come out with two different times on it and neither was the reader's.

Dates are stored in UTC, and a WeKan profile carries no time zone at all, so the
only place the reader's zone exists is the browser. Every export link now sends
it - `Intl.DateTimeFormat().resolvedOptions().timeZone`, the IANA name the
server's own `Intl` wants back - together with the **date format the opened card
is showing**, which for a reader who is not logged in lives in `localStorage`
where no server-side lookup can reach it. An export that printed `2026-08-14`
for
a card showing `14-08-2026` was the same card in two formats.

Both exports format through one helper, `formatDateByUserPreference`, which
gained an optional zone; without one it still renders in the process's own zone,
which is what every client-side caller - the card view itself - wants. A
server-built export that is given no zone renders UTC and SAYS UTC, rather than
printing the server's and looking like the reader's. The route accepts only the
three formats that helper understands, and a zone name is length-bounded: they
are request parameters, not free text. `12:00Z` now prints as `14:00` for
Europe/Berlin, as `00:00` on the 15th for Pacific/Auckland, and a zone the
runtime does not know falls back instead of failing the download.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/698e980e27522b53f60ad6fce347727cb11eb017">A description's markdown is drawn as bold and italic instead of being stripped</a>. Thanks to Heart1010 and xet7.</summary>

"Would it make sense to support markdown formated text in description? (so it
gets transformed correct in the pdf output with bold, underline,....)" The first
fix removed the syntax and kept the words, because `**bold**` in a PDF is four
stray asterisks; this is the other half.

A description is now cut into RUNS - `**bold**` into a bold run, `*italic*` into
an italic one, `***both***` into both, nested emphasis keeping both - and each
is
drawn in the matching Courier face: Courier, Courier-Bold, Courier-Oblique,
Courier-BoldOblique, all base-14, so no font binary is embedded. Nothing is
measured to place them: consecutive `Tj` operators continue at the current text
position, so a font switch between two of them lands the next run exactly where
the last ended, whatever the glyph widths are. Wrapping counts characters across
the whole line, indent included, so an emphasised word does not push a line past
the page.

What has no face is not invented: `~~strikethrough~~` and `` `code` `` keep
their
words and lose their markers, because a base-14 Type1 font has no strike and
there is no fifth Courier to give code. Block markdown is still flattened either
way - a heading loses its `#` and is drawn in the bold font, a bullet keeps one
shape, a fence keeps its code. An underscore inside a word stays an underscore:
`file_name_here` is an identifier, not three-quarters of an italic.

</details>

and has the following developer-facing changes:

**Language loading** - which of the 246 language files a visitor is sent.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/59c742e6c95b42529b53ec33d2f2d075108e78d9">The browser downloads one language, and a test says so</a>. Thanks to xet7.</summary>

`imports/i18n/data/` is 37 MB across 246 files, every one of them reachable from
the client. The only thing keeping them out of the initial bundle is that each
entry in `imports/i18n/languages.js` loads its file through
`() => import('./data/<tag>.i18n.json')` - a call Meteor's `dynamic-import`
package code-splits into a module fetched on demand - and that `tap.js` imports
exactly ONE of them statically, English, so the interface stays readable when
dynamic import is broken ([#6503](https://github.com/wekan/wekan/issues/6503)).

That was true when checked and nothing pinned it. A single
`import data from './data/xx.i18n.json'` added anywhere on the client would
quietly ship that language to every visitor, and nothing about the app would
look wrong - it would just be a heavier download, which no other test measures.

`tests/i18nLazyLoading.test.cjs` checks the six things that have to hold
together: every registered language has a dynamic loader, `languages.js` pulls
in no data itself, `tap.js` statically imports English and nothing else, the
loader is called once for the single resolved tag rather than mapped over the
registry, no client file bundles a language file, and `dynamic-import` is still
in `.meteor/packages`. A negative test proves the detector really sees a static
import, so the other checks cannot pass by failing to look.

</details>

**Browser tests** - the guards that drive a real browser, and what they say.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/acaaa3c03fa67e1130f694ac2dbbba3802daad3d">Three page objects still described the markup as it was before it moved</a>. Thanks to xet7.</summary>

A run failed the same four tests in Chromium and in Firefox, and three of the
four were the guard describing the OLD markup rather than the app being wrong.

`editTitle` waited for both `js-card-title` and `js-open-inlined-form` on ONE
element. The title splits now - the leading half opens the editor and the rest
of the heading drags the window - so the class is a DESCENDANT of the title, and
the old selector matched nothing and waited out its timeout.

The Activities heading in the board sidebar carries TWO icons since the caret
became shared with the card sections: the caret that says whether the section is
open, and the section’s own comment icon. A bare `i.fa` matches both, which
Playwright fails as a strict-mode violation rather than picking one. The spec
asks for the caret specifically now - the three directions `caretClassFor` can
produce - which is also a stronger assertion, since the caret is the part that
indicates state.

The fourth was not a guard at all: see the Custom Fields fix above.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7a08f081241336aedcd7a57da1678e8d104d8f53">Wait for the client bundle before calling a Meteor method</a>. Thanks to xet7.</summary>

Four Firefox-only failures, all the same cause: *Meteor is not defined*, and in
the fourth a count that came back as the string *error: can’t access property
"callAsync", window.Meteor is undefined*. Chromium and WebKit passed all four.

Waiting for `networkidle` says the NETWORK went quiet, not that the client
bundle has finished executing. Under the three-browser parallel run against one
shared server, Firefox reached the evaluate with `Meteor` still undefined - the
bundle is large and had been fetched but not yet run.

`helpers/auth.js` has had `waitForMeteor` for exactly this since WebKit needed
it; these two specs simply never called it. It is idempotent and returns at once
when Meteor is already up, so it costs the browsers that were passing nothing.

</details>

**Shared templates** - one piece of markup, or one component, not many copies.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9c288c3d4d8045cdd1d76b68b64fc91c414288c9">The date markup is written once instead of twenty-two times</a>. Thanks to xet7.</summary>

Two shapes were copied across three files. The **edit-a-date form** - date,
time, Save, Delete - existed **eight times**, letter for letter: the card's
Received, Start, Due and End, a vote's end date, a planning poker's end date, a
date custom field, and a ninth `datepicker` template that nothing included and
no popup could open. The **date badge** - the coloured date on a card and on a
minicard - existed **fourteen times**.

The JavaScript was already shared: `client/lib/datepicker.js` holds the state
and the handlers, and each popup differs only in the field it stores. It was
only the markup, so a change to the form meant eight edits and a change to the
badge meant fourteen, with nothing to say so.

Each is one template now. They take what they draw as ARGUMENTS, because a
helper is looked up on the template it is written in and not on the one
including it - which is what lets one piece of markup serve them all while every
popup keeps its own state, its own click and its own name. `cardDate.jade` went
from 289 lines to 91.

The badge's `baseClass` is the trap this had to avoid: three of the fourteen -
the custom-field dates - were never `.card-date` and must not become one, so the
class each caller carried is passed in rather than baked into the shared markup.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/82db0800ef6cda8adae06ac3e4f34d3517309a37">Move/Copy selection and Move/Copy swimlane are one dialog each, not two</a>. Thanks to xet7.</summary>

Both pairs duplicated their whole component, not only their markup. The
selection dialog was 152 lines twice over and 145 of them were the same: the
four reactive selections, the four selects' helpers, the change handlers and the
sort-index maths. The seven lines that differed are what each does to a card
once the destination is known - move it, or copy it and move the copy - which is
one `applyToCard` passed to one registration now. The swimlane pair is the same
story with one difference instead of seven: the method called on Done.

The markup is one template each too, handed the popup's own instance as
`dialog`, because a helper is looked up on the template it is written in. What
the two copies really differed in was the ids their labels point at, so those
are passed in - and the title's id has to arrive as an `id=` attribute, since a
literal id cannot hold a mustache.

`sidebarFilters.js` lost 106 lines, `sidebarFilters.jade` 17 and
`swimlanes.jade` 10, and the scan for near-duplicate templates is at 7 pairs
from the 74 it started at. `tests/sharedFormTemplates.test.cjs` covers both.

</details>

**The test harness** - what a test run does before the tests.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/92650b782ec4ea427dc39f783b5e1a26869e395f">Reuse the test database only when it answers, not when the port is open</a>. Thanks to xet7.</summary>

A run reported "WeKan tests FAILED" while the node suites, mocha and the import
regression had all passed. What failed was the test server, on its first query -
`MongoTopologyClosedError: Topology is closed` - because the harness had decided
to reuse a database that was not there: it asked whether the port was open, and
something else was holding it.

An open port is not a database. The check is a query now, so a port held by
anything else means the harness starts its own rather than handing the server a
socket that answers and then closes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/590ccf3e81d173516281c86b12dc97bface9afcc">The test database moves off a port another program owns</a>. Thanks to xet7.</summary>

The next run stopped where the previous one had died, and the port said why:
127.0.0.1:3001 on that machine is an unrelated HTTP server. A test
database that cannot have the port it wants now takes the next free one and
tells the rest of the run which it took, instead of failing at the first query
against whatever was already listening.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/53c3123de5dc82f9c010792989adf55cc15bffb6">Three forms that were written ten times over are written once</a>. Thanks to xet7.</summary>

Three more shapes were copied, and in each of them the JavaScript was already
one piece while the markup was not - so a behaviour change was one edit and a
markup change was four:

- **where a card goes** - board, swimlane, list, above or below which card, and
  Done - drawn four times, by Move card, Copy card, Copy checklist to many
  cards and Convert checklist item to card;
- **where a list goes** - drawn twice, by Copy list and Move list;
- **the Create Board form** - drawn four times, by the one on All Boards and
  three popups, one of which creates a TEMPLATE board and says so with a
  Session flag rather than with different markup.

Each is one template now, and what it shows is passed in. The two pickers are
handed the `dialog` and read it from the template INSTANCE: inside `each
boards` the data context is a board, so a helper reaching into the context for
it would find nothing there.

The events stay with the popups. An event inside an included template bubbles
to the one that includes it, which is the one holding the state - that is what
lets four popups do four different things with one form.

Two more went the same way, and those had their whole COMPONENT duplicated as
well: **Move selection / Copy selection** - 145 of the dialog's 152 lines were
identical, the other seven being what each does to a card once the destination
is known - and **Move swimlane / Copy swimlane**, where the only difference is
the method called on Done. Both are one registration now, taking that
difference as an argument, and `sidebarFilters.js` lost 106 lines.

`cardDetails.jade` lost 71 lines, `boardHeader.jade` 58, `sidebarFilters.jade`
17, `listHeader.jade` 10 and `swimlanes.jade` 10, and a scan for near-duplicate
templates went from **74 pairs to 7**.

What is left of that scan is deliberately left: `attachmentSettings` and
`storageSettings` share a shape but only a third of their code, the two
Change Avatar popups differ in who they act on, and the three `mini*` templates
are eight lines each in the three folders they belong to - indirection would
cost more than the fifteen lines it saved.

</details>

and improves the translations:

**Files written in another language** - and the scan that found them.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f225b3245df2d29d77fb49f9744628f4d405c9de">Korean was Japanese and Georgian was Russian, in 1,143 strings between them</a>. Thanks to xet7.</summary>

A missing translation shows English, which says plainly that nobody has done it
yet and invites the person who can. These files said something else: `ko` opened
a board labelled *ボード* and `ka` one labelled *Доска* - confident text in a
script the reader may not read at all, and the merge rules protect it forever,
because a Japanese word is not equal to the English source and so is never
treated as a placeholder.

Neither file was wholly wrong, which is why nobody had noticed: both had `save`
right and `board` in the wrong language. `ko` had **354** kana values and `ka`
**789** Cyrillic ones, and they are Korean and Georgian now - the card details
pane, the Admin Panel, the rules engine, global search and the error strings.

Found by [comparing each value's Unicode script](https://github.com/wekan/wekan/commit/3673177dab0e9b67dfbe32d7db5a160506704743)
against the one the language is written in, which needs two exclusions to be
usable: the danda `।` is shared across the Indic scripts and so is not evidence,
and hanja in a Korean string is legitimate Korean.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7a3cd208c70562c2496751f7e830f5a33db95ab9">Hindi was Gujarati and Tamil was Telugu, in 2,841 strings between them</a>. Thanks to xet7.</summary>

The same fault, larger: `hi` held **1,204** values in Gujarati script and `ta`
held **1,637** in Telugu and Devanagari - two thirds of the whole Tamil file.
Both are [translated in place](https://github.com/wekan/wekan/commit/9ca57a816654a27ea140130c697383b4d47634fd)
rather than blanked back to English, because blanking three thousand strings
trades one unreadable file for one empty one.

The search operators needed a decision, because they are the words a user TYPES
rather than labels a user reads. They are native words - `operator-board` is
`बोर्ड` in Hindi and `பலகை` in Tamil - and the instruction text names those same
words through its `__operator_*__` placeholders, so the two can never drift
apart. Georgian was done the same way, and the choice is reversible in one file
if search syntax should stay ASCII.

Three values stay in Latin on purpose. `excel-font` is the font family handed to
the spreadsheet writer, `ldap` is a protocol and `gridfs-storage` a product; the
transliterations they carried were wrong in a way no reader could act on.

`node releases/translations/wrong-script.mjs --count` now reports **zero**
across all 246 files, and stays as the guard that catches the next file seeded
from a neighbour before it ships.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fb969b27459a6286c46418d053566c1f0beb9bdf">The scan said zero and meant zero of the tags it happened to name</a>. Thanks to xet7.</summary>

A guard that reports zero is only worth what it looked at. `wrong-script.mjs`
listed the script for a BASE tag - `hi`, `ko`, `ja`, `el`, `ru` - so `hi-IN` and
`ko-KR` were never checked at all, and both are full copies of what `hi` and
`ko` used to be: 1,204 values in Gujarati and 354 in Japanese kana, sitting
behind a green count for the whole time their parents were being fixed.

Every file whose tag reduces to a known base is now checked under that base's
script, so a variant cannot hide behind its parent again. The two that surfaced
are fixed from their corrected base, key by key, and only where the base
actually has a translation.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4be57c2ad5756807b36a77fab16b38756e809cd3">Korean: 80 values per file that were Chinese or Japanese, not hanja</a>. Thanks to xet7.</summary>

The scan excluded CJK entirely for a Korean file, on the correct grounds that
hanja beside hangul is legitimate Korean. That exclusion was too wide: it also
passed a value with NO hangul in it at all, which is not Korean under any
reading - it is whatever the file was seeded from. 看板 for a board, 拡大 and
縮小 for zoom, 担当者 for an assignee, 賛成 and 反対 for the two sides of a
vote, and the three date formats written 年-月-日.

The rule is now the narrower one it should always have been: hanja is fine WITH
hangul, and a hangul-script value carrying CJK and no hangul is flagged. That is
80 values in `ko` and the same 80 in `ko-KR`, translated here - including the
search operators a user types, 담당자, 마감 and 조직.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ae3686d67ca7bde36338a6907744a2696a6204de">Latin in a non-Latin file, and English that stopped looking untranslated</a>. Thanks to xet7.</summary>

Two more blind spots, both found by asking the scan a question it could not
answer before.

**A value written entirely in the LATIN alphabet, inside a language that is
not.** The Unicode-block comparison could never see it, because Latin is not one
of the blocks it compares against - so `el` and `el-GR` held **926 values of
Italian** each, `th` **685 of Vietnamese**, `ar-DZ` **510 of French** and `ka`
**45 of Turkish**, and the count read zero throughout. Product names are Latin
too, so a value is only suspect when it says something: five letters or more,
and not the English source wearing different punctuation.

**English that stopped looking untranslated.** The two keys
`map-to-existing-user-desc` and `-none` were REWORDED in `en.i18n.json`, and
every other file kept the old English. Old English is not equal to the new
source, so the fill tooling counted it as a translation and stopped offering the
key - in 145 files. The current source is written back, which changes nothing a
reader sees and makes 290 values countable again.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b65518dca99550cbd27b9932170879ecd36ec185">Georgian was Turkish, Algerian Arabic was French, Mongolian was English</a>. Thanks to xet7.</summary>

The detector's first harvest, smallest first: 43 values of Turkish in `ka`, 508
of French in `ar-DZ`, and 44 in `mn` that were never translated at all but had
drifted far enough from the English source that the fill tooling no longer
offered them. Plus the tail - six in `ug`, two in `fa`, one each in `or_IN`,
`pa` and `uk`. `ar-DZ` is fixed from `ar`, key by key and only where `ar` has a
translation, so the variant is never ahead of its base.

The script map also grew the languages it had never listed: `ary`, the nine
Turkic and Mongolic languages written in Cyrillic, and Chinese under every tag
it ships as. Of those only `mn` had anything to report, which is the answer
worth having.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/482065d8fb67dc91547a6f3da4f1aefe39904051">Thai: 683 values that were Vietnamese</a>. Thanks to xet7.</summary>

A third of `th.i18n.json` was written in Vietnamese - *Bảng* for a board, *Thẻ*
for a card, *Danh sách* for a list - beside 1,594 values of real Thai. All 683
are Thai now, under terms fixed once and used throughout: บอร์ด, การ์ด, รายการ,
สวิมเลน, เช็คลิสต์, คลังเก็บ.

One value was not a translation at all: `act-withCardTitle` read
`__kartu__[__Panel__]`, two Indonesian words in placeholder syntax, so the
notification it formats could never substitute a board or a card. It is
`[__board__] __card__` again.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8df7376600b378c5d58842683f347c3d74d64e1e">Greek: 924 values that were Italian, and the Latin-only backlog is empty</a>. Thanks to xet7.</summary>

`el` and `el-GR` are the same file twice, and 924 of their values were Italian -
*lista rinominata in*, *si è unito a*, *Bacheca* for a board, and *Couloir*,
French, for a swimlane. All of it is Greek now: the activity feed, the archive
dialogues, Planning Poker, the export fields, the rules engine, the Admin Panel,
the migrations and the whole of global search.

The terms follow what the file already had right - Πίνακας, Κάρτα, Λίστα,
Ετικέτα, Μέλος, Λίστα ελέγχου, Αρχείο - and fill the two it did not: Διάδρομος
for a swimlane and Υπεύθυνος for an assignee.

That empties the backlog the detector found: 3,174 values across six files and a
tail of small ones. `wrong-script.mjs --count` now reports zero for BOTH of its
checks - no value in another script, and none in the Latin alphabet inside a
language that is not written in it.

</details>

**Panels added since a file was last touched** - strings a language never had.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3eb1631d5429fa8d7dd7c894dc61e15a6747e28f">The Home page and starred pages, in the 33 languages that still showed English</a>. Thanks to xet7.</summary>

A key added last month is missing everywhere that has not been visited since,
which is not the same problem as a language nobody has worked on. The All Boards
Home strings - *Remove from Home*, its confirmation, *Click to star this page*,
*Click to unstar this page*, *Starred Pages* and the empty-Home hint - were the
newest in the file, so 33 otherwise-complete languages showed six English rows
in the middle of their own page. 197 values are filled.

Four of those files are not written in the language their name claims, and are
completed in the language they are ACTUALLY in rather than left half English:
`ace` is Malay, `ast-ES` is Spanish, `ve` is Zulu, and every `uz` variant
including `uz-AR` is Latin Uzbek.

`km_KH` already had human translations for all six and kept them, and `sr` kept
the one it had. That is the fill rule doing its job rather than a special case:
it writes only where the value is still the English source, so it reports
*skipped 6* instead of overwriting them.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/330b6421908495a818f431d08abf4c3e0421148d">Board status and Board roles, in the 47 files that still showed English</a>. Thanks to xet7.</summary>

The same shape, two panels wider: the **board status** summary (card loading,
time spent, total, cards with time, overtime cards) and the **roles status**
table - what each board role may do, under its *Invite* / *Sees cards* / *Create
and edit* / *Board settings* columns. 307 values across 47 files.

Five of them are written in a different language from their name and are
completed in that one: `ro` is Italian, `ast-ES` Spanish, `ve` Zulu, `wo`
French, and `sr` uses case-file vocabulary throughout - a board there is
*Списи*, so its board status is *Стање списа* rather than a literal translation
of the English. Two are low confidence and want a speaker: **Klingon**, whose
lexicon has `patlh` for a rank but no idiom for a board role, and **Volapük**.

`roles-status-role` is deliberately left alone in Czech, Spanish and Walloon.
*Role* and *Rol* are those languages' own words, and the fill step ignores a
value equal to the English source rather than pretending a translation happened.
The same is true of far more of the backlog than it first looked: `magenta` and
`indigo` are `magenta` and `indigo` in nearly every language that "misses" them.

</details>

**The search operators** - the words a user types, rather than reads.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d62c15aedc4b260b54340e7de3c2f073b679e059">The rest of the operators, in the 107 files that had done the others</a>. Thanks to xet7.</summary>

A file that translated `board:`, `list:` and `member:` and left `org:`, `title:`
and `customfield:` in English contradicts itself: half the search syntax is in
the reader's language and half is not, and nothing on screen says which half is
which. 217 operator words, filled only in files that had already
translated at least two of the core three - so this never invents a search
vocabulary for a language that has not chosen one.

An operator NAME is matched before the colon, so it can never contain a space.
Languages that write these as two words run them together, the way Greek already
writes *προσαρμοσμένοπεδίο*: Slovak *vlastnépole*, Hungarian *egyénimező*, and
the same in Thai and Vietnamese.

72 are deliberately left alone. *status*, *limit*, *team*, *selector*,
*projection*, *description*, *week* and *open* are those languages' OWN words in
Dutch, Swedish, Spanish, French, Catalan, Czech, Polish, Turkish and Malay.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/774d7a032b1bd17a3ee721ff4611317b6b8f7efe">Each one-letter shorthand is the language's own letter, in 89 files</a>. Thanks to xet7.</summary>

Each search operator has a one-letter shorthand beside it, and the shorthand is
the first letter of THAT LANGUAGE'S word: French *couloir* is `c`, Russian
*доска* is `д`, Georgian *დაფა* is `დ`. A file that translated the word but kept
the English letter contradicts itself - `board:` works, and `b:` stands for
nothing the reader can see.

277 shorthands, derived rather than guessed: the first grapheme of the file's
own word, extended while it collides with another shorthand in the same file,
and written only where it differs from the English letter. Portuguese *lista*
and German *Liste* both begin with an l, so `l` is already correct and is left
alone. Every file ends with five distinct shorthands - Welsh *aelod* and
*aseinai* are `a` and `as`, Hungarian *Tábla* and *tag* are `t` and `ta`.

Three orderings had to be right or the result was worse than what it replaced:
case-fold BEFORE the collision test (*Tábla* and *tag* are both a T), seed the
taken set from the shorthands that are NOT being changed (Frisian kept `l` for
*lijst* while *lid* was handed the same `l`), and test the English letter AFTER
the collision loop rather than before it, or Welsh keeps `a` twice on the
grounds that `a` is what English uses.

Skipped where the operator WORD is itself in another language, because a
shorthand derived from it carries that one step further and the word is what
wants fixing: `tlh` is German, `th` is Vietnamese, `br` is French, `ve-PP` is
Finnish, and one key each in `mn`, `sk`, `lv`, `vo` and `zgh`. Latin-script
contamination like that is invisible to `wrong-script.mjs`, which can only
compare Unicode blocks.

</details>

**Words filled by key** - one key across many files, not one at a time.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/da8d02315a806e9e8a5f5ff4f92e950f6181be61">Statistics, package and the region names, where the word is not the English one</a>. Thanks to xet7.</summary>

128 values across 67 files, chosen by asking of each key whether the language
actually has a different word - because most of what the count calls a prose
backlog is not one. *Status* is Status in Danish, German, Dutch, Swedish and
Polish; *Server* is Server almost everywhere; *Normal*, *Ticket*, *Menu* and
*Logo* are themselves in most of Europe. Those are correct as they stand.

What is filled is where the English word is visibly foreign or the language
plainly has its own: the non-Latin scripts (Κάδος and Στατιστικά, דלי, سطل,
Кофа, Корпа, Багц, and *America* in seven Indic and East Asian files), the
African languages that had been handed English (*IMelika*, *Umlawuli*,
*Iphakethe*, *Iphakheji*, *Ngwugwu*, *Idì*, *Marekani*), and *Statistics* in the
twelve European languages that had not translated it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4a950b80bbfafc5d1a9a3bb107ad8b7b472cc6d4">The import-mapping dialogue, in the 48 files where English is a foreign alphabet</a>. Thanks to xet7.</summary>

An untranslated string is not equally visible everywhere, and counting them as
if it were is what makes the backlog look shapeless. In a Latin-script language
*Status* reads as a word; in a Greek, Arabic, Thai or Devanagari interface an
English paragraph is a different alphabet in the middle of the page. Measured
that way the non-Latin files are nearly done - **235 real words** still in
English across 52 of them, against 1,927 product names and symbols that will
never stop counting - and 102 of those 235 were two keys.

They are the strings the import dialogue shows when it asks which real user an
imported member is: the pair whose English source was reworded, so every file
kept the old English. 96 values, in 24 languages from Arabic to Chinese in both
scripts. Serbian gets the case-file vocabulary the rest of that file uses - a
board is *списи* and a member a *сарадник* - so the sentence reads as the same
document the rest of the interface describes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e53e895f6ba0e875dc14524ba58317fddeff8575">The import-mapping dialogue, in the other 85 files</a>. Thanks to xet7.</summary>

Finishes the pair the non-Latin files got: 170 more values, from Afrikaans to
Zulu. These are the two longest strings in the file - a paragraph explaining
that mapping an imported member onto a real user moves that member's cards,
comments and activity, and that the user is added with the imported member's
OWN role, so mapping can never grant more permission than the import did. That
last clause is the one worth getting right in every language, because it is the
answer to "what am I about to give this person".

Seven files are written in a language other than the one their name claims and
get that one: `ace` is Malay, `ast-ES` Spanish, `ro` Italian, `ve` Zulu, `vl-SS`
Dutch, and `vo`, `wo`, `zgh` and `wa-RR` are French.

`tlh` is deliberately left in English. Klingon has words for a board, a card and
a rank, and this paragraph needs none of those - it needs three subordinate
clauses about permission, and inventing them would produce something that reads
as though somebody meant it. An English placeholder says plainly that nobody has
translated it yet, which is the more useful thing for the one reader who could.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8e62dd157aae8cf0b0f403a2d125c8b30864d7ef">Twenty everyday words, and the 202 that were already right</a>. Thanks to xet7.</summary>

The next twenty keys by how many files share them - *Dialog*, *Container*,
*Tests*, *Filter*, *Version*, *Pause*, *Repository*, *Detail*, *Type*, *Color*,
*Error*, *Roles*, *Latitude*, *Longitude*, *orange*, *Admin* - were offered to
the 56 Latin-script files that still had them in English. **48 were filled and
202 were ignored**, because the value offered was the English word and the
English word is what that language uses: *Filter* is Filter in German, Dutch,
Danish, Frisian and Estonian, and *Container*, *Tests*, *Version*, *Pause*,
*Repository*, *Detail*, *Type* and *Latitude* are themselves across most of
western Europe.

What did change is where a language really has its own: Spanish *Funciones* for
roles, *Administrator* / *Administrateur* / Frisian *Behearder* for admin,
Slovak *Podrobnosť* and *Dialóg*, Italian *Contenitore* and *Finestra di
dialogo*, Vietnamese *Vùng chứa*, Portuguese *Pausa*, and Yoruba *Ìwọ̀n ìhà* and
*Ìwọ̀n gígùn* for latitude and longitude.

The 202 are the result worth recording. They count as untranslated only because
the tool's test for it is "still equal to English", no amount of work will ever
reduce them, and they are why the backlog number is several times the size of
the backlog.

</details>

**Deeper translation** - languages taken past the words on the board.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/72fd4aa1278ba3a827ca6193d6a358e22fe9f63c">Eighty-one languages go past the board, into the menus and the login page</a>. Thanks to xet7.</summary>

A language file starts here with the words a board is made of - board, list,
card, swimlane, member, the buttons - about 50 to 77 strings. Eleven of the
largest new ones went further already, to roughly 112, and the difference is
what somebody meets in the first minute rather than the first second: *Log Out*,
*Forgot password*, *Email Address*, *Create Board*, *Move to Archive*,
*Restore*, *Copy Card*, *Move Card*, *Delete Card?*, *List Actions*, *Board
Settings*, *Member Settings*, *Search All Boards*, *Custom Fields*, *Add
Attachment*, *Accounts*, *People*, *Organizations*, *Teams* - and, for the ones
that had not reached it yet, *Activities*, *Attachments*, *Checklists*,
*Assignee*, *Due Date*, *Register*, *Change Password*, *Admin Panel*, *Profile*,
*Watch* and *Export list*.

Every other language still at that first tier now carries the second one too:
**Maltese**, **Luxembourgish**, **Shona**, **Albanian**, **Bosnian**,
**Hawaiian**, **Latin**, **Luganda**, **Assamese**, **Irish**, **Icelandic**,
**Javanese**, **Kurmanji**, **Kyrgyz**, **Malagasy**, **Maori**, **Marathi**,
**Chichewa**, **Oromo**, **Pashto**, **Kinyarwanda**, **Sindhi**, **Sinhala**,
**Sesotho**, **Tajik**, **Tigrinya**, **Setswana**, **Xitsonga**, **Tatar**,
**Friulian**, **Ladin**, **Neapolitan**, **Romansh**, **Aragonese**,
**Corsican**, **Sardinian**, **Sicilian**, **Aromanian**, **Kashubian**, **Upper
Sorbian**, **Silesian**, **Faroese**, **Greenlandic**, **Northern Sami**,
**Bislama**, **Tok Pisin**, **Fijian**, **Samoan**, **Tongan**, **Haitian
Creole**, **Papiamento**, **Inuktitut**, **Aymara**, **Quechua**, **Nahuatl**,
**Cherokee**, **Manx**, **Cornish**, **Scottish Gaelic**, **Guarani**,
**Bashkir**, **Buryat**, **Chuvash**, **Sakha**, **Tibetan**, **Dzongkha**,
**Bhojpuri**, **Maithili**, **Konkani**, **Kashmiri**, **Sorani**, **Akan**,
**Bambara**, **Ewe**, **Fula**, **Northern Ndebele**, **Northern Sotho**,
**Kirundi**, **Swati**, **Tigre** and **Wolaytta**.

Each string was written from that file's own existing vocabulary, so the new
menu rows use the same word for board, list and card that the board already
uses. The ones written with least confidence are Cherokee, Inuktitut, Nahuatl,
Wolaytta, Tigre and Kashmiri - a speaker who sees an error there should correct
it, and the merge rules guarantee that a human translation arriving on Transifex
REPLACES a filled one and is never overwritten by it.

That is 4,082 strings across 81 files, all of them into placeholders that were
still English: `releases/translations/verify-human-preference.mjs` passes, and
nothing here is pushed to Transifex as if it were human. Every file is still a
small fraction of 2,384 keys, deliberately - the rest falls back to English
exactly as before.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cd13f56c685ae615edb9036140d698964d4360b7">The newest languages go past the words on the board, into the menus</a>. Thanks to xet7.</summary>

A new language file started with the words a board is made of - board, list,
card, swimlane, member, the buttons. Enough to recognise the app, not enough to
use it: the menus, the popup titles and the login page were still English.

Eleven of the largest new ones - **Bengali**, **Urdu**, **Filipino**,
**Hausa**, **Amharic**, **Kannada**, **Malayalam**, **Nepali**, **Somali**,
**Kazakh** and **Burmese** - now carry the second tier as well: *Log Out*,
*Forgot password*, *Email Address*, *Create Board*, *Move to Archive*,
*Restore*, *Copy Card*, *Move Card*, *Delete Card?*, *List Actions*, *Board
Settings*, *Member Settings*, *Search All Boards*, *Custom Fields*, *Add
Attachment*, *Accounts*, *People*, *Organizations*, *Teams* - the strings
somebody meets in the first minute rather than the first second.

They are at about 112 strings each now, from 77. That is still a small fraction
of 2,384, and deliberately so: these are the ones where being in English is most
visible, and the rest falls back to English exactly as before.

</details>

**New languages** - the ones WeKan had no file for at all.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a7332f233637fa9716d276eac967fed300a0017d">Twenty more, including the ones I was least sure of - and which those are</a>. Thanks to xet7.</summary>

**246 languages**, from 154 when this release started.

**Confident enough to write without hedging:** བོད་སྐད་ (Tibetan), རྫོང་ཁ
(Dzongkha), **Kalaallisut**, ᐃᓄᒃᑎᑐᑦ (Inuktitut), ᏣᎳᎩ (Cherokee), **Nāhuatl**,
**Буряад хэлэн**, **Kaszëbsczi**, **Ślōnskŏ gŏdka**, **Aragonés**, **Ladin**,
**Armãneashti**, **मैथिली**, **भोजपुरी**, **कोंकणी** and **کوردیی ناوەندی**
(Sorani Kurdish, right-to-left).

**Written with less to go on, and said so here rather than quietly:** **کٲشُر**
(Kashmiri, right-to-left), **Pulaar**, **ትግረ** (Tigre) and **Wolaytta**. For
these four the sources are thin - a wordlist and a grammar sketch rather than a
dictionary with a UI vocabulary in it - so the terms for *board*, *swimlane* and
*checklist* are built from the ordinary words for a writing-board, a path and a
list of things to check. They are the strings most likely to be wrong, and the
most likely to be corrected by the first speaker who opens the language picker
and finds their language in it at all.

That is the whole argument for doing them: the alternative was not a better
translation, it was no language. Cherokee has around 2,000 fluent speakers;
Tigre, Wolaytta and Pulaar have millions between them and almost no software.
A wrong word invites a correction. An English placeholder invites nothing.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0cca649b7dd37ea5bc59c5afa2659950f0e1c543">Fourteen more: the Pacific, the Caribbean, and the languages of Italy</a>. Thanks to xet7.</summary>

**226 languages**, from 154 at the start of this release.

**Kreyòl ayisyen**, **Papiamentu**, **Tok Pisin**, **Bislama**, **Gagana
Sāmoa**, **Lea faka-Tonga**, **Na Vosa Vakaviti**, **Corsu**, **Sardu**,
**Sicilianu**, **Napulitano**, **Furlan**, **Rumantsch** and **Hornjoserbsce**.

Four are creoles - Haitian, Papiamentu, Tok Pisin and Bislama - which between
them are the everyday language of about fifteen million people and are almost
never what software is written in. Five are languages of Italy that Italian does
not cover: Sardinian and Sicilian each have more than a million speakers.
**Rumantsch** is one of Switzerland's four national languages, and
**Hornjoserbsce** is one of Germany's.

Each is the same shape as the rest: the words a board is made of, the buttons,
the menus, the dates - and English underneath until somebody corrects it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a3ee0262d68ce0d10d4466018a9c5d3b9b44c233">Eighteen more languages: the Americas, the Sahel, Siberia and the Celtic ones</a>. Thanks to xet7.</summary>

**212 languages.** WeKan had 154 when this release started.

This block: **Bamanankan**, **Akan**, **Eʋegbe**, **Ikirundi**, **isiNdebele**,
**Sesotho sa Leboa**, **siSwati**, **Башҡортса**, **Чӑвашла**, **Саха тыла**,
**Runasimi** (Quechua), **Avañe'ẽ** (Guaraní), **Aymar aru**, **Føroyskt**,
**Davvisámegiella**, **Gàidhlig**, **Kernewek** and **Gaelg**.

Three of them are indigenous languages of the Americas with millions of speakers
between them and no project-management tool in any of them. Three are Siberian
and Volga languages of the Russian Federation. Four are Celtic - and Cornish and
Manx are revived languages, which is exactly the case where the wording being
imperfect matters least and the language existing at all matters most.

**Scottish Gaelic** and **Cornish** take the Scottish and English regional
flags rather than the Union Jack - the emoji tag sequences, not the state's
flag - and **Manx** takes the Isle of Man's own. A language gets the flag of
where it is spoken, and for these three that is not the same thing as the flag
of the state.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2395dfd0840b39f584c0338fc4683e560a9af0e8">Fifteen more languages, most of them African</a>. Thanks to xet7.</summary>

**194 languages.** This block is the one WeKan was furthest from having:
**Татарча**, **ʻŌlelo Hawaiʻi**, **chiShona**, **Ikinyarwanda**, **Chichewa**,
**Sesotho**, **Setswana**, **Xitsonga**, **Luganda**, **Afaan Oromoo**,
**ትግርኛ**, **Kurdî**, **سنڌي**, **অসমীয়া** and **Malagasy**.

Nine of the fifteen are African languages with tens of millions of speakers
each and no kanban tool in them at all. **Sindhi** is `rtl: true`; **Kurdish**
takes the Iraqi flag, because Kurdistan has no emoji and that is where most of
its speakers are - the same rule as any language spoken across a border.

The three edits are one script now - `releases/translations/add-language.mjs`.
It writes the strings file as a full copy of the
English one with the translations swapped in, inserts the registry entry in
alphabetical order with the name in the language's own script, and adds the flag
only if the map does not already anticipate it. That is why this block took
three commands rather than thirty, and why nothing was left half-wired.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0d3bb3ee75cc07b2787353d17ba157c910c4e59d">Ten more languages, and Latin among them</a>. Thanks to xet7.</summary>

**179 languages.** This block adds **Íslenska**, **Gaeilge**, **Shqip**,
**Bosanski**, **Malti**, **Lëtzebuergesch**, **Кыргызча**, **Тоҷикӣ**, **Māori**
and **Latina** - the same three edits each, the name written in its own
language, and a flag.

Two of them say something about the policy. **Māori** and **Latin** have nobody
waiting to translate a kanban board, and Latin has no country at all; it takes
the Vatican's flag because that is the state that still uses it, which is the
same reasoning that gives a language spoken across a border the flag of where it
is spoken. A constructed language keeps the globe instead - Esperanto, Klingon
and Volapük are nobody's country, and borrowing one would be a claim rather than
a hint.

Latin is a real translation and not a joke: *tabula*, *charta*, *index*,
*semita*, *titelli*, *sodales*, and the imperatives a menu is written in -
*Adde*, *Dele*, *Serva*, *Quaere*.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/244710e91ec29a30093428ee6fbf64c5791aee26">Nine more languages: Kannada, Malayalam, Burmese, Sinhala, Nepali, Javanese, Somali, Pashto and Kazakh</a>. Thanks to xet7.</summary>

WeKan is at **169 languages**. These nine were missing entirely, and between
them they are spoken by something like 250 million people: **ಕನ್ನಡ**,
**മലയാളം**, **မြန်မာ**, **සිංහල**, **नेपाली**, **Basa Jawa**, **Soomaali**,
**پښتو** and **Қазақша**.

Each arrives the same way as the last six: the strings file, the entry naming
the language in its own script, and the flag. **Pashto** is `rtl: true`, and the
RTL guard's list grew with it - that list is the one place the direction of a
script is written down, so a new right-to-left language that is not added to it
fails rather than laying itself out backwards in silence.

Each starts with the words a board is made of - board, list, card, swimlane,
label, member, the buttons, the menus, the dates - about eighty strings, and the
rest falls back to English until somebody who speaks it says otherwise. That is
the point of the policy: a language that is 3% translated is a language somebody
can start using and correcting, and 0% is not.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1fedfb26256b2cace1d058d93931d94ad223c930">Six languages WeKan did not have: Bengali, Urdu, Marathi, Filipino, Hausa and Amharic</a>. Thanks to xet7.</summary>

WeKan had 154 language files and not one of them was **Bengali** - about 270
million speakers - or **Urdu**, or **Marathi**, **Filipino**, **Hausa** or
**Amharic**. The list of languages WeKan supports was never a judgement about
which languages matter; it is the list somebody happened to start.

Each is three edits, and all three are needed or the language is invisible: the
strings file, the entry in `languages.js` naming the language **in that
language** - বাংলা, اردو, मराठी, አማርኛ - and the flag in the picker. Urdu is
`rtl: true`, so the whole interface lays itself out right-to-left for it.

A new file is a full copy of `en.i18n.json` with the translated values swapped
in, which is what every other language file here is: the key-order guard reads
absolute positions, so a file holding only the strings it has translated would
put every later key at the wrong index. Each of the six starts with the words a
board is made of - board, list, card, swimlane, label, member, the buttons, the
menus, the dates - and grows from there.

`tests/newLanguageWiring.test.cjs` holds the three edits together, and found
that **fourteen languages were showing a globe** instead of a flag (Acehnese,
Moroccan Arabic, Asturian, Breton, Frisian, Norwegian Bokmål, Occitan, Turkmen,
Walloon, Wu, Yiddish, Tamazight and two Chinese variants), which they no longer
do. Constructed languages - Esperanto, Klingon, Volapük - keep the globe on
purpose rather than borrowing somebody's country.

It also learned what a **symlinked** language file is. `km-KH.i18n.json` and
`ru-RU.i18n.json` are symlinks to `km_KH.i18n.json` and `ru_RU.i18n.json`: those
two locales are the ones `.tx/config`'s `lang_map` does not rename, so Transifex
writes the underscored name and the hyphenated link is what `languages.js`
loads. A guard that reads only the import paths sees the target as an orphan and
is wrong about it; this one resolves the link, and checks that every link points
at a file that exists and that one end of each pair is loaded.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/240f8f2d4a1a62f17c90fe0f2b952e937df3d2ec">Uyghur, Belarusian, Catalan, Estonian, Malay, Turkmen, Xhosa and Igbo, and the sort letters</a>. Thanks to xet7.</summary>

Another eight languages, from their own vocabulary: the export and import menus,
the roles table, the board-status pane, the starred pages, the search operators,
and for Igbo the last of its report and recovery strings.

**The list sort letters** are translated too. A list header shows `(N)`, `(M)`
or `(L)` for whether it is sorted by NAME, by your MANUAL order or by LAST
access - initials of the ENGLISH words, so on any other language they were three
letters that stand for nothing. They are that language's own initials now:
German `(N)`/`(R)`/`(Z)` for *Name*, *Reihenfolge*, *Zugriff*; Finnish
`(N)`/`(J)`/`(K)` for *Nimi*, *Järjestys*, *Käyttö*; Russian `(И)`/`(П)`/`(Д)` -
twenty-five languages, and their regional variants after them.

**What is left is mostly not translatable.** Of the strings still flagged in
German, French and Dutch, three quarters are a word of one or two syllables that
those languages spell exactly as English does - *Filter*, *Team*, *Text*,
*Details*, *Layout*, *Person*, *Pause*, *Actions*, *Date*, *Description*,
*Notifications*, *Type*, *Database*, *Help*, *Repository*. They are counted as
untranslated because the only test available is "is this still equal to the
English source", and by that test a correct translation that happens to be
identical can never pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/da022efe627fc3298e21db7ecc4f3a37a5b40ce3">Frisian, Igbo, Yoruba, Wolof, Breton, Walloon, Volapük and Tamazight, from their own words</a>. Thanks to xet7.</summary>

Eight languages nobody has volunteered for. Five of their files were not
untranslated at all - `wo`, `wa`, `br`, `vo` and `zgh` were written in
**French** (*Tableau*, *Carte*, *Liste*, *Supprimer*), with Esperanto in the
Volapük file and Arabic in the Tamazight one, seeded from whatever was to hand.
As with Klingon, that is not a translation to protect: the core vocabulary is
replaced with each language's own words - Breton *Taolenn*, *Kartenn*, *Roll*;
Walloon *Tåvlea*, *Cåte*, *Djivêye*; Wolof *Tablo*, *Karta*, *Limu*; Volapük
*Bod*, *Kad*, *Lised*; Tamazight *Tafelwit*, *Takarḍa*, *Tabdart*.

On top of that each got the strings a board actually shows: the export and
import menus, the roles table, the board status pane, the starred pages, and the
sentence that explains what dragging a board onto Home does.

They are **imperfect**, and that is the point: `CLAUDE.md` now says so outright
- a wrong string is readable, obviously improvable and an invitation to the
person who speaks the language, which an English placeholder never is. When that
person sends a correction through Transifex it REPLACES the filled one, because
the merge always prefers a human translation.

What is left in the big files is mostly not translatable at all: German
*Filter*, *Team*, *Text*, *Details*, French *Actions*, *Date*, *Description*,
*Notifications* and Dutch *Filter*, *Type* are the words those languages use,
and they are counted as "untranslated" only because the tool's test for it is
"still equal to English".
</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3b5f2b24cc16547c50e36fd5308b0c7fde5c67a3">Klingon from its own lexicon, and every regional variant inherits its language</a>. Thanks to xet7.</summary>

**Klingon.** `tlh.i18n.json` was not untranslated - it was written in FRENCH and
GERMAN: *Tableau*, *Karte*, *Liste*, *Löschen*, *Board exportieren*. Somebody
had seeded it from whatever file was to hand. The words are looked up now, in
the [boQwI' lexicon](https://github.com/De7vID/klingon-assistant-data) - the Klingon
Language Institute's own data, ~5800 entries - and Klingon has words for most of
what a kanban board is: `'echlet` is a **board**, `'echletHom` a **card**,
`tetlh` a **list**, `per` a **label**, `chuD` a **member**, `mI'` a **number**,
`Dotlh` a **status**, `yer` a **domain**, `mIllogh` a **picture**. The actions
are imperatives, which is what a menu entry is in Klingon: `yISuq` (acquire it)
for import, `yIngeH` (send it) for export, `yIQaw'` (destroy it) for delete,
`yIchel` (add it), `yIteq` (remove it). So *Export list* is `tetlh yIngeH` and
*Import card* is `'echletHom yISuq`.

**Regional variants.** A variant file that had not translated a string carried
the English source while its base language had a perfectly good translation two
directories away - `de-AT` in English beside German, `es-MX` beside Spanish,
`zh-Hant` beside Traditional Chinese. Each variant now inherits its base for the
strings it has not translated itself, and only for those: a variant's OWN
wording always wins, which is the same rule that protects a human translation
from a filled one.

**Three files were in another language entirely**, and are completed in the
language they are actually written in rather than left half-English: `vl-SS` is
Dutch throughout, `ace` is Malay, `ve` is Zulu.

Two of the languages that had nothing - Igbo and Yoruba - had real translations
under the English placeholders, so they are filled from their own vocabulary
rather than from a neighbour's.

</details>

**New strings** - what this release added, in every language.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f12095efab438128b73a9cf01bec4e769289ec65">The 31 strings this release adds, in 127 languages</a>. Thanks to xet7.</summary>

Everything added to `en.i18n.json` since 10.91 - the new popup titles, the
export and import wording, the card-number search operator, the filesystem
integrity report - shipped as English placeholders in every other language file.
Translated directly, as `CLAUDE.md` requires: no external translation service,
API or key, and each language's OWN existing strings as the reference, so the
new wording matches what that file already says rather than being invented
beside it.

The vocabulary each file already had is what decided the wording: its word for
a swimlane, a list, a card and a board, and whether it says *export* with a
verb or a noun. The four import titles are the four export titles with that
language's own word for importing, because in a menu that already says what it
is about they are the same sentence pointed the other way.

`operator-number` is a special case: it is not a label but a word somebody
TYPES into the search box, beside `operator-board` and `operator-list` - so it
is that language's plain word for a number, in the form those two are already
in.

Nothing overwrote a human translation. The fill step writes only into keys that
are still the English source, and a translation already committed for a key was
kept - Finnish's own *Poista ylimääräiset lista kopiot* stayed exactly as it
was. `verify-human-preference.mjs` proves that property rather than asserting
it, and none of this is pushed to Transifex, so a filled string can never
masquerade there as a human one.

Fifteen languages are deliberately left as English placeholders rather than
guessed at: Klingon, Volapük, Acehnese, Breton, Igbo, Uyghur, Venda and its two
variants, Walloon and its variant, Wolof, Yoruba, Tamazight, and vl-SS. A wrong
translation reads as though somebody meant it; an English placeholder says
plainly that nobody has translated it yet.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9417e35d0b2f5c9925df514f33b9fbd17a989e5c">Export is a word in every language, not the key "export" in lowercase</a>. Thanks to xet7.</summary>

Every menu on a board grew an Export row and an Import row, and the Export one
was written `{{_ 'export'}}` - a key that had never existed in `en.i18n.json`,
or in any of the other 245 files. i18next answers a key it does not know with
the key itself, so the row read *export*: lowercase, untranslated, in every
language including English. It was reported from Finnish, where every other word
in that menu is Finnish and this one was not.

It is a key now, and translated into all 245 other files. For 225 of them the
word is the shared part of that file's own *Export list* and *Export swimlane* -
the word the language already uses, **Vie** in Finnish, **Exportieren** in
German, **Экспортировать** in Russian.

The rest are written out, because a shared prefix is the wrong answer for them.
Where it took an article along - Portuguese *Exportar a*, Irish *Easpórtáil an*,
Welsh *Allforio'r* - the article is dropped. Where the verb is a circumfix that
only appears with its object between the halves, both halves are written:
**Voer uit** in Afrikaans, **Flytja út** in Icelandic, **Yi adi** in Akan,
**Salim i go aut** in Tok Pisin. Hungarian takes the nominative **Exportálás**
rather than the possessive, and Klingon keeps its own capitalisation, **yIngeH**
with the lowercase y, which a capital-first rule got wrong. The twenty-one
languages that put no spaces between words had nothing to derive from at all and
are written from their own phrases - the two Chinese forms by script, and
Japanese, Khmer, Thai, Burmese, Tibetan and Dzongkha.

`import` already existed and was translated everywhere. In seven files it was
still the bare English noun while their Export was a verb, which read as a pair
that did not match: Czech gets **Importovat** beside *Exportovat*, Turkmen
**Import et**, and the four Uzbek files **Import qilish**. Malay and the English
variants keep *Import*, which is the word those languages use.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v10.91 2026-08-13 WeKan ® release

**In short:** four reports from admins who could not tell what their own WeKan
was doing, and two pieces of theming. **Member Settings / Change color** gained
an **All Boards** switch beside "Default (no override)" - the overview's tiles
take the theme's lighter colour instead of eleven different board colours, if
that is what you want - and a highlighted popup row now follows the theme like
the left menu does instead of being a fixed navy. Clicking a **minicard again
did not close the card** it had opened - the toggle was there and had a test,
and it was closing the wrong thing, so it was the one part of this that nobody
could see was broken. A snap **waiting for
its database** answered nothing at all on the web port, so an upgrade that left
the database down looked like WeKan itself loading forever; the wait is a page
now, with the commands that say why, and it carries the product name and the
schema-upgrade dashboard's colours. The **Admin Panel reports** were full of
things that never happened - an ordinary restart written up as a crash (and,
because of the same bug, actually turned into minutes of downtime), and a
reverse proxy written up as a spoofing attempt. And a snap serving
**the older of its two copies of the data** was told "No problems detected",
because the status report reads only the database WeKan is connected to and
never said WHICH one that is; it now ends with a section that does, and names
the two recovery commands. Below that: two open issues that the current code
already answers, closed by reading it.

The binaries below are carried over from v10.90 and have NOT been checked
against a newer build; `releases/provenance-table.sh` prints the real table
from the provenance each build job records.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-amd64) | v1.49.0 | `7c74941ff043f26aa4411ef5065d6b2d0766e369fc2a4458364c2f5571c12762` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-arm64) | v1.49.0 | `092132531555a39eac12566240a5f1ed02f62148b2dca0540a74c68e5957f6b5` |
| armhf | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armhf) | v24.19.0 | `b55350f3071b765a98ed66fdc410657ff168a937935057077fd7ab33cb30b9aa` |
| armhf | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armhf) | v1.49.0 | `144404fb9793dc8e039874812f4e2cb3e6d8b1df0ffdbe50254e7790a342a2f4` |
| armv6 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armv6) | v24.19.0 | `128ded0cda638c1f144eadb23ad249889515df017d298fd49c8faf3db110f0f1` |
| armv6 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armv6) | v1.49.0 | `7c27b2c15448709a24eace9b3c951c62fbe33413f7d20d56cb5520f4436efe2d` |
| armv7 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armv7) | v24.19.0 | `8dbe0a9aa8550ad5275c5538ebf868eb2037f0c4d9cccbe319f63b7e5854cd45` |
| armv7 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armhf) | v1.49.0 | `144404fb9793dc8e039874812f4e2cb3e6d8b1df0ffdbe50254e7790a342a2f4` |
| i386 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-i386) | v24.19.0 | `3b0b3bbfe27daf583b3a0f432efacc508407a012cdd9e8847250e7c015565bac` |
| i386 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-i386) | v1.49.0 | `1f70cb1687411b2a0fa9ac3b5bfc8c4ed9ce25ec2ddfa17e6fd3efb38136a39c` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-mac-arm64) | v1.49.0 | `576364db59dfce3ba564b9a3e484496eb57f95d76d2007b9f83241acdbd2f4fa` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-mac-amd64) | v1.49.0 | `37d70cd90aad6d3867b6686507ff1888f1edf6791818c31d014d130e8f39fc14` |
| ppc64le | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-ppc64le.tar.xz) | v24.19.0 | `c510c6ce12f07010f771e6edb22a3fe23f4f2e6f40b1ffd4941aed0646a0d8b3` |
| ppc64le | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-ppc64le) | v1.49.0 | `7c61d4853d5163ad8761449d693fd458ebbb8611a2351c718014876242c5b1fb` |
| riscv64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-riscv64.tar.xz) | v24.19.0 | `cd1f14af2812148002f58b58a5f9af512a50e3b8e8c148e0db44019dcb68edfd` |
| riscv64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-riscv64) | v1.49.0 | `bd4912da70f5e6c1475ab989668c76b4ab7db4ee06c44357693df64f5e1d0e0b` |
| s390x | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-s390x.tar.xz) | v24.19.0 | `a4792e65962ffa0af42627aacf1122a60c3c88dbf4e4184f06820d66f9da8ba4` |
| s390x | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-s390x) | v1.49.0 | *no checksum published* |
| win-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-arm64.zip) | v24.19.0 | `8502f4a50b458d4cc38ed8f2001556c2cd239d464920f74017926ccb1e1c157f` |
| win-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-win-arm64.exe) | v1.49.0 | `792166623e774b0af2aced31ed3ae39f545ca5268dc4c2b8d1a329228ff52cbc` |
| win64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip) | v24.19.0 | `57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73` |
| win64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-win64.exe) | v1.49.0 | `f42c50aa84095a9616b00f27a584c66b7bf79e3b109450c62a5f146ba3c85478` |

This release fixes the following bugs:

**Cards on the board** - opening one, and closing it again.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/664cc6b95">Clicking a minicard again really closes the card, wherever the card was opened from</a>. Thanks to Heart1010, csonkaoszimt and xet7.</summary>

*"you now can click outside your mini card and the popout will close. Clicking
the mini card again to close the popout is still not possible I think"* -
[#6465](https://github.com/wekan/wekan/issues/6465), on v10.90, which already
had the toggle and a test suite pinning it.

The toggle was closing the wrong thing. On a desktop-sized screen the card
details are not the address you are at: clicking a minicard writes the card id
into the `openCards` session list and the board renders one draggable window per
id in it, leaving the URL on the board. The toggle asked whether the card was
`currentCard` and closed it by navigating to the board - which clears
`currentCard` and leaves the window on screen, because nothing had taken the
card OUT of `openCards`. Only the window's own X button did that, which is why
closing worked from the card and not from the minicard.

Both questions are now the card details' own close logic, so both ways of
closing a card do the same thing. "Already open" is asked of the list that
renders the window, which also fixes it for *Open many cards at once*: with
several open, `currentCard` is only the last one clicked, so every earlier
window was impossible to close from its minicard. Closing navigates back to the
board only when the card really IS the address - a card opened by a click is
not, and navigating would reset the board view for nothing.

</details>

**Member Settings** - the theme, and what it reaches.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e86e7abe0">All Boards tiles can take the theme's lighter colour, and a highlighted popup row follows the theme too</a>. Thanks to khuongsatou and xet7.</summary>

Two things in Member Settings / Change color.

Beside **Default (no override)**, on the same row, a second switch: **All
Boards**. Turned on, every tile in the All Boards overview takes the theme's
lighter colour — a white veil over the theme accent, which is one shade up from
whatever the theme is — with white text on it, instead of the colour its own
board was given. Turned off, which is the default, the overview is exactly what
it was. A board with a background *image* keeps its image: that is a picture
somebody chose, not a colour.

That is [#6593](https://github.com/wekan/wekan/pull/6593)'s observation as a
per-user choice rather than a stylesheet. The pull request paints every tile
white for everybody, and what it noticed is right — a wall of boards in eleven
colours reads as a palette rather than a list — but *"the tile colours are
noise"* and *"the tile colours are how I find my board"* are both true, of
different people. So it lives where the rest of that user's theme is chosen, and
only there: a board has no overview of its own, and a site admin does not choose
this for everybody.

And the **highlighted row** in a popup: it was filled with a fixed dark navy
that appears nowhere else in WeKan and stayed navy however the user had themed
it. The All Boards left menu fills its selected row with the theme accent and
turns the label and icon white, and so does the Admin Panel — the popup does now
too, so there is one selected-thing look rather than three.

</details>

**Starting up** - and what a browser shows while WeKan cannot yet serve.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4254dfa39">A snap waiting for its database says so in the browser, instead of timing out</a>. Thanks to Alishara and xet7.</summary>

*"We upgraded from 10.85 to 10.89 and later to 10.90 - a reload of wekan got a
timeout (loading forever)"* -
[#6592](https://github.com/wekan/wekan/issues/6592).

WeKan does not open its web port until the database answers, and the snap's two
waits are endless on purpose: a database can take minutes to come up after an
update, and giving up on it would be worse than waiting. They are not silent
either - after two minutes each prints what to check. But nothing was listening
on the web port while they waited, so the browser got a timeout and everything
printed went to `snap logs`, which is the last place somebody whose site is down
thinks to look. It also makes the two possible faults look the same: *"WeKan
does not load"* is the report whether WeKan is broken or FerretDB simply did not
start.

The wait now serves a page saying **WeKan is waiting for its database**, naming
the database it is waiting for and, in the browser, the commands that answer
why: the service's own log (an `exec format error` is the bundled binary not
running on this CPU), `wekan.problems` for which copy of the data is served,
`snap start --enable` for a service left stopped by a failed migration, and
`snap revert` back to the revision that worked. It refreshes itself away when
WeKan starts, appears only after 30 seconds so an ordinary restart never shows
it, and is stopped before anything else binds the web port.

This does not say why the reporter's database did not come up - the issue has no
logs yet - but the next person sees the reason instead of a timeout.

</details>

**The Admin Panel reports** - what they say happened, and whether it did.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/034a23ede">A restart is not a crash, and a reverse proxy is not a spoofer</a>. Thanks to xet7.</summary>

Two reports from a server running 10.90 Snap, both full of things that never
happened.

**Filesystem integrity**, over and over: *"the previous run STOPPED WITHOUT
SHUTTING DOWN CLEANLY, and this server was down for about 4 minute(s)"*,
severity high — on a snap that had been refreshed, not crashed. Two faults, and
the second made the downtime real rather than merely reported.
`IntegrityKeys.update()` is not synchronous in Meteor 3: it starts a write and
hands back a promise nobody waited for, so the clean-shutdown mark was never on
disk when the process went. And registering ANY listener for `SIGTERM` replaces
Node's default behaviour, which is to terminate — nothing in that listener
exited, so WeKan ignored `SIGTERM` outright, systemd waited out its stop timeout
and used `SIGKILL`. That is both the minutes of "downtime" in those rows and a
genuinely unclean kill on every ordinary restart. The mark is written with
`updateAsync` now and the handler exits: with 0, after at most two seconds, and
exactly once however many signals arrive. What a crash IS was not touched — the
rows were wrong because the input was wrong.

**Security Report**, over and over: a medium-severity *spoofing* row for
`/metrics` denied *"with X-Forwarded-For present"*, from 127.0.0.1. Every
reverse proxy adds that header to everything it forwards, so a Prometheus scrape
through a local proxy on a server whose allowlist does not cover it was being
written up as an attack, in the report where a real one would have to be
noticed. The spoof has a signature and it is asked for now: the header NAMES an
allowlisted address while the connection is not from one. The 401 is unchanged
and gained the sentence the admin needs — the address in it is the proxy, not
the scraper, unless `METRICS_TRUST_PROXY` says how many hops to trust.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/55552a720">The pages shown when there is no database use the product name and the dashboard's colours</a>. Thanks to xet7.</summary>

The snap's standalone pages — under maintenance, recovering data, database too
old, and the new one above — are a small HTTP server with no database
connection, which is the whole point of them. The product name therefore comes
from a file that `wekan-control` cached once per start, which leaves the case
that matters: the name is set in the Admin Panel and the snap is not restarted
before the next outage, so a rebranded WeKan tells its users *"WeKan is waiting
for its database"* — a word they have never seen. WeKan is the only thing that
knows the name the moment it changes, so WeKan writes it, at startup and
whenever the setting changes.

They also wear the schema-upgrade dashboard's colours now — the same `#111`
ground, `#7bf` blue and monospace face — because that dashboard and these pages
are the same thing to a reader: the product saying what it is doing while it
cannot show them the app.

</details>

**Recovering a snap that has two copies of its data** - and finding out that it
has.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/504e450a1">The status report says which copy of the data is being served, and how to compare them</a>. Thanks to waltermhl and xet7.</summary>

*"error: cannot find app "database-compare" in "wekan". It seems, that database
compare is not included in wekan 10.82"* -
[#6583](https://github.com/wekan/wekan/issues/6583). It is not: the two recovery
commands are snap apps, so they exist only in the revision that ships them,
v10.90. That is the smaller half.

The larger half is what happened before it. The same instance, serving data from
a migration done in July, ran `snap run wekan.problems` and was told *"No
problems detected"* - which was true of everything it checks, because it reads
the one database WeKan is connected to and every check inside it passed. Nothing
asked WHICH of the two copies that is, while the documentation already claimed
this command answered it.

The report now ends with a **Databases on this machine** section: which copy is
being served and why, whether MongoDB files and a FerretDB database both exist,
and - when they do - the two commands to run. It reads the files rather than a
database, so it answers with WeKan down, and it declares no fault: two copies is
the normal state of a migrated snap. A revision without the commands says to
refresh rather than leaving snapd's "cannot find app" as the last word, and says
why a refresh is safe here - it does not import an old MongoDB over a FerretDB
already in use, and neither copy is ever deleted. `wekan.help` and
[Migration-to-FerretDB.md](https://github.com/wekan/wekan/blob/main/docs/Platforms/FOSS/Container/Snap/Migration-to-FerretDB.md)
list both commands with the release they arrived in.

</details>

**Reported behaviour that the current code already gets right**

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b9e00dbb8">Two open issues answered by reading the code, and pinned so they stay answered</a>. Thanks to xet7.</summary>

Both sat in `TODO Later` as "needs the running app", and both are decided by
files that can simply be read.

[#5052](https://github.com/wekan/wekan/issues/5052) — *"Attachments cannot be
opened (.eml)"*, a blank page in the browser and nothing usable in Thunderbird
after a board was copied. Three things could produce that, and each is handled
now. The NAME: an unknown MIME used to append `.bin`
([#6589](https://github.com/wekan/wekan/issues/6589)), and Thunderbird will not
open a `.bin`; every type a mail file arrives as now keeps its extension, and
the board copy names copies with the same rule. The SERVING: `message/rfc822`
is in neither the dangerous-types nor the safe-inline list, so it takes the
"unknown types" branch, which forces the download under the file's own name —
inline is what shows a browser a blank page. The FILE: an attachment whose
recorded path and on-disk name had diverged is found by the same search reading
already used (#6589), so a copied board's attachments open even when the
database's idea of the path is stale.

[#5081](https://github.com/wekan/wekan/issues/5081) — *"Owner is on the very
left, followed by members (if there are any) and on the very right there are
the assignees"*, wrapping to a second right-aligned row when they do not fit.
That is what the current minicard renders, and the reason is the float: three
groups that float to the inline end are laid out RIGHT to left in DOM order, so
the markup's `assignees, members, creator` renders as creator | members |
assignees. Each avatar floats too, so a row that does not fit wraps and stays
right-aligned, and an empty group is `display: none` rather than a gap.

`tests/openIssuesVerifiedFromCode.test.cjs` holds both, so neither can quietly
stop being true.

</details>

# v10.90 2026-08-13 WeKan ® release

**In short:** things that were reported this week, and one of them is data
coming back from the dead: **previously archived cards, some years old,
reappeared in the top swimlane** because the schema upgrade treated an archived
swimlane as breakage. The **board Excel export** answered nothing at all — it
had been broken since a dependency bump, and the route swallowed the failure so
the browser waited forever. A **.drawio attachment** was stored as `.bin`,
unopenable, and could not even be renamed back. The board's **watch popup** did
nothing for anybody who reaches a board through an organisation, a team or an
email domain, and said nothing either. And when the snap **cannot read an old
MongoDB**, it now prints what each reader actually said and where to download a
MongoDB that can. Below that: two release-tooling fixes from the v10.89 run.

The binaries below are carried over from v10.89 and have NOT been checked
against a newer build; `releases/provenance-table.sh` prints the real table
from the provenance each build job records.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-amd64) | v1.49.0 | `7c74941ff043f26aa4411ef5065d6b2d0766e369fc2a4458364c2f5571c12762` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-arm64) | v1.49.0 | `092132531555a39eac12566240a5f1ed02f62148b2dca0540a74c68e5957f6b5` |
| armhf | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armhf) | v24.19.0 | `b55350f3071b765a98ed66fdc410657ff168a937935057077fd7ab33cb30b9aa` |
| armhf | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armhf) | v1.49.0 | `144404fb9793dc8e039874812f4e2cb3e6d8b1df0ffdbe50254e7790a342a2f4` |
| armv6 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armv6) | v24.19.0 | `128ded0cda638c1f144eadb23ad249889515df017d298fd49c8faf3db110f0f1` |
| armv6 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armv6) | v1.49.0 | `7c27b2c15448709a24eace9b3c951c62fbe33413f7d20d56cb5520f4436efe2d` |
| armv7 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armv7) | v24.19.0 | `8dbe0a9aa8550ad5275c5538ebf868eb2037f0c4d9cccbe319f63b7e5854cd45` |
| armv7 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armhf) | v1.49.0 | `144404fb9793dc8e039874812f4e2cb3e6d8b1df0ffdbe50254e7790a342a2f4` |
| i386 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-i386) | v24.19.0 | `3b0b3bbfe27daf583b3a0f432efacc508407a012cdd9e8847250e7c015565bac` |
| i386 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-i386) | v1.49.0 | `1f70cb1687411b2a0fa9ac3b5bfc8c4ed9ce25ec2ddfa17e6fd3efb38136a39c` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-mac-arm64) | v1.49.0 | `576364db59dfce3ba564b9a3e484496eb57f95d76d2007b9f83241acdbd2f4fa` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-mac-amd64) | v1.49.0 | `37d70cd90aad6d3867b6686507ff1888f1edf6791818c31d014d130e8f39fc14` |
| ppc64le | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-ppc64le.tar.xz) | v24.19.0 | `c510c6ce12f07010f771e6edb22a3fe23f4f2e6f40b1ffd4941aed0646a0d8b3` |
| ppc64le | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-ppc64le) | v1.49.0 | `7c61d4853d5163ad8761449d693fd458ebbb8611a2351c718014876242c5b1fb` |
| riscv64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-riscv64.tar.xz) | v24.19.0 | `cd1f14af2812148002f58b58a5f9af512a50e3b8e8c148e0db44019dcb68edfd` |
| riscv64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-riscv64) | v1.49.0 | `bd4912da70f5e6c1475ab989668c76b4ab7db4ee06c44357693df64f5e1d0e0b` |
| s390x | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-s390x.tar.xz) | v24.19.0 | `a4792e65962ffa0af42627aacf1122a60c3c88dbf4e4184f06820d66f9da8ba4` |
| s390x | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-s390x) | v1.49.0 | *no checksum published* |
| win-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-arm64.zip) | v24.19.0 | `8502f4a50b458d4cc38ed8f2001556c2cd239d464920f74017926ccb1e1c157f` |
| win-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-win-arm64.exe) | v1.49.0 | `792166623e774b0af2aced31ed3ae39f545ca5268dc4c2b8d1a329228ff52cbc` |
| win64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip) | v24.19.0 | `57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73` |
| win64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-win64.exe) | v1.49.0 | `f42c50aa84095a9616b00f27a584c66b7bf79e3b109450c62a5f146ba3c85478` |

This release fixes the following bugs:

**Recovering a snap that has two copies of its data**

<details>
<summary><a href="https://github.com/wekan/wekan/commit/073a327d6">Two commands for a snap that is serving the older of its two copies</a>. Thanks to waltermhl, lukechao and xet7.</summary>

From [#6583](https://github.com/wekan/wekan/issues/6583): *"The migration and
the update to 10.83 startet at 11.08.2026 at 6:35 pm and migration failed. Now
we just see the old data from a migration we did in july 2026. … Which steps
exactly could we do, to restore the database with our most recent data?"*

Everything needed to answer that already existed — `db-eval evidence`,
`database-choose.mjs`, `database-merge-missing.mjs`, `database-autopick` — and
none of it was a command anybody could run. `snap run wekan.problems` answered
*"No problems detected"*, which is true of the things it checks and no help at
all here.

```
sudo snap run wekan.database-compare    # what does each copy hold?
sudo snap run wekan.database-merge      # bring the missing documents across
```

**compare** starts each database on a temporary port, counts its documents and
finds the newest moment its data carries, and prints both sides — the running
WeKan is not disturbed, and nothing is written. A file timestamp cannot answer
this question: starting a database moves its files, and a file written a minute
ago may hold nothing anybody typed.

**merge** inserts the documents that exist in the MongoDB copy and not in the
FerretDB one. It overwrites nothing, deletes nothing, and reads the MongoDB
files only — so it is safe to run without first knowing which copy is "right".
That is WeKan's own design doing the work: the history is append-only, so
merging can only ADD to what a card shows, and the work that was stranded
becomes readable in that card's History. What it does not do is reconcile two
edits of the same card; the served copy's version stands, and the other stays
where it is. It asks for a copy of `$SNAP_COMMON` first, with the command, and
takes `--dry-run`.

The removed `snap run wekan.database` switch is gone from the core26 snapcraft
file as well, where it had been left behind.

</details>

**Boards** - what shows on them, and what quietly does not.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8ec78bb14">Cards archived years ago no longer reappear in the top swimlane</a>. Thanks to xet7.</summary>

Reported by email: *"Previously archived cards (some several years old) have
reappeared. These cards have incorrectly been placed in the top swimlane."*

Archiving a swimlane is how a whole swimlane is put away: its cards stay where
they are, `archived: false`, out of sight because the swimlane is. The schema
upgrade's swimlane rescue read that as breakage and moved every such card to
the board's first VISIBLE swimlane — so work anybody had ever archived that way
came back, years later, at the top of the board.

A card is orphaned when its swimlane does not **exist**, or belongs to another
board. That is [#1959](https://github.com/wekan/wekan/issues/1959), and it is
still rescued. The other issue the sweep cited,
[#1971](https://github.com/wekan/wekan/issues/1971), is about cards **added** in
List view landing in an archived swimlane — and that is fixed where cards are
created, by `getDefaultSwimline()` picking a non-archived swimlane. It never
needed a sweep over data somebody archived on purpose.

The two guards that pinned the sweep now pin the opposite, each carrying the
reason, and a board whose every swimlane is archived is left exactly as it is.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8ec78bb14">The watch popup works for everyone who can open the board, and says so when it refuses</a>. Thanks to xet7.</summary>

Reported by email, with a screenshot of the *Ändra bevaka* popup: *"Silent does
not respond. If we try to change it does not change. Nothing happens."*

Driven against a running WeKan, the popup works for a board **member** — the
level is written, the check mark moves, the popup closes — and does nothing at
all for anybody else:

```
login as non-member admin: ok
watch -> ERROR error-board-notAMember
```

A board is shared four ways: membership, an organisation, a team, and (since
[#5850](https://github.com/wekan/wekan/issues/5850)) an email domain. Only the
first puts anybody in `members`, and the watch method asked `hasMember()`.
Everyone reaching a board through an org, a team or a domain could open it, see
the button, and be refused the moment they used it. It asks whether the user may
**see** the board now, through the same selectors the publications use — so a
watch can never be granted where the board is not visible, and a revoked share
still is not.

The other half is why nobody could tell: the popup closed on success and did
**nothing** otherwise, so a refusal was indistinguishable from a dead button. It
reports the reason now — the watch feature being off in the Admin Panel, or the
board not being visible — and `error-watch-disabled`, thrown since #5820 but
never translated, exists as a string.

</details>

**Cards and attachments** - what a card holds, and getting it back out.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a712db947">An unknown file type is no longer renamed to .bin, and a stuck attachment can be repaired</a>. Thanks to rmb82 and xet7.</summary>

[#6589](https://github.com/wekan/wekan/issues/6589): a `.drawio` upload was
stored and displayed as `.bin`, could not be opened, and could not be renamed
back either — `renameAttachment` threw `ENOENT`. Two faults.

**The name.** A browser sends `application/octet-stream` for a type it does not
know, and the upload-time "correct the extension to the type" step took that
literally: `mime.extension('application/octet-stream')` is `bin`, so
`sso-proconnect-keycloak.drawio` became `…drawio.bin`. Every unrecognised format
— `.drawio`, `.kdbx`, `.ova`, anything new — went the same way. An uninformative
type now yields no extension at all, while a type that does say something still
corrects the name, which is what that step is for.

**The rename.** The recorded `versions[].path` and the file on disk had
diverged, and rename used the recorded path alone:

```
Error: ENOENT: no such file or directory, rename
  '/data/files/attachments/6a7d66369c6aee799e857d36.drawio' -> ...
```

while the READER already searched every layout WeKan has used and found the
file. That search is a method now, and reading, renaming and deleting all use
it — so an attachment that can be read can also be repaired. When there really
is no file, the error names the attachment instead of a path nobody recognises.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1f83020b4">A card containing an onenote: link no longer stops a whole board from rendering</a>. Thanks to titver968 and xet7.</summary>

[#6590](https://github.com/wekan/wekan/issues/6590): *"A board gets stuck
indefinitely on the loading animation (three dots) for all users"*, traced to
one card whose description and checklist item held
`onenote:///path/to/file.one#section-id={GUID}`.

It is [#6588](https://github.com/wekan/wekan/issues/6588) from the other end —
the same `this.__schemas__[...].validate is not a function` out of linkify-it 6,
reported as a board nobody could open rather than a card nobody could open — and
it was fixed on 2026-08-12. The regression test now renders that exact string,
in a description and in a checklist item, and pins that the `{GUID}` stays text
rather than being swallowed into a link.

</details>

**Exporting a board** - the format that answered nothing.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a712db947">The Excel export produces a file again, and a failure answers instead of hanging</a>. Thanks to titver968 and xet7.</summary>

[#6591](https://github.com/wekan/wekan/issues/6591): *"Board Settings -> Export
board -> export/Excel didn't work"*. Reproduced against a running WeKan — CSV
and JSON of the same board answered 200, and Excel never answered at all:

```
csv:   HTTP 200 4758b
json:  HTTP 200 4491b
excel: Operation timed out after 30002 ms with 0 bytes received
```

with nothing in the server log. Two faults, either of which hangs the browser on
its own.

**The zip.** exceljs 4.7.3's streaming writer calls archiver the way archiver 7
was called — `Archiver('zip', opts)` — and WeKan moved to archiver 8 for the
low-memory backup zips. archiver 8 is ESM and exports classes, so that is
`TypeError: Archiver is not a function`, and the export has been broken since
the bump. Supplying the missing factory does not rescue it either: archiver 8's
readable-stream then refuses the objects exceljs appends. So the export asks
what archiver exports and, when it cannot stream, it uses a buffered writer
with the same API — the path this export used before it was made streaming.
Bounded memory is what is lost, not the export.

**The silence.** The route called `exporterExcel.build(res)` without awaiting
it, so the rejection went nowhere: no 500, no log line, and a response that was
never written or ended. Every sibling route awaits; this one did not. It does
now, and a failure answers 500 with the reason.

</details>

**The snap** - when it cannot read the database it is asked to migrate.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1f83020b4">Each reader says why it refused the data, and the page says where to get an old MongoDB</a>. Thanks to mueschel and xet7.</summary>

From [#6585](https://github.com/wekan/wekan/issues/6585), a log that says
everything except the useful part:

```
[migration] mongod 7 could not open the data; trying the bundled mongod 5.0 ...
[migration] mongod 7 could not open the data; trying the bundled mongod 4.2 ...
[migration] The database files were made by an older MongoDB
            (MongoDB 4.2 or earlier can still read them).
```

Every reader was tried, each of them said something, none of it was shown — and
the conclusion recommends the version that had just failed. mongod 7 names the
version that can open the FORMAT; it cannot know the files are also damaged, or
left locked by an unclean shutdown.

So each reader now prints its own last words when it does not open the data, the
"trying the bundled X" lines name the reader being tried instead of blaming
mongod 7 for all of them, and when mongod 7 asks for a version this snap
carries, the report says it was tried too and that `--repair` **on a copy** is
the usual next step.

And the other half of that report — *"If you need us to run some external tools,
like an old mongodb, it would be good to provide a source for them"* — the log
and the explanatory page now link mongodb.com's download page and
fastdl.mongodb.org, name the `docker run mongo:<version>` one-liner, and spell
out `mongod --dbpath` / `mongodump` on a copy, never the original.

</details>

and fixes the following release-tooling bugs:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d38ca4680">A snap that reached the Snap Store also reaches the GitHub Release</a>. Thanks to xet7.</summary>

The v10.89 run published the armhf, ppc64el and s390x snaps and then failed on
the next line:

```
Revision 3661 created for 'wekan' and released to
  'beta', 'candidate', 'edge', and 'stable'
no git remotes found
Error: Process completed with exit code 1
```

Those jobs flatten history so the Launchpad push stays small, and the git remote
goes with it — so `gh` had nothing to infer the repository from. The snap was in
the store and not on the release, which reads like a failed build.

Every `gh release upload`, `view` and `edit` in every workflow now names the
repository, so the call does not depend on what the checkout looks like, and a
bare one fails the guard.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a70e69767">A Launchpad build that outlives its job says so, instead of just CANCELLED</a>. Thanks to xet7.</summary>

v10.89's riscv64 leg ran five hours and fifty minutes — its cap — with Launchpad
still printing `Building: riscv64`, and the run showed **CANCELLED** and nothing
else. What is true at that moment is worth saying: the Launchpad build is not
cancelled with the job, it keeps its name, and re-running the job reconnects to
the same build and downloads the snap rather than starting another one.

The cap is now 360 minutes, the maximum a hosted runner allows, and a cancelled
job prints that explanation plus any Launchpad URL its logs carry.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v10.89 2026-08-12 WeKan ® release

**In short:** the **snap stops asking which database it runs on**. It runs on
**FerretDB** — every platform — and MongoDB is in the amd64/arm64 snaps to be
**read** while a migration is owed, so `snap set wekan database=…` and
`snap run wekan.database` are **gone**: the data decides, and it cannot
contradict itself the way a setting could. With them go the three ways a snap
could stay on MongoDB for good — a **5.0 database no reader could open**, a
migrated copy that had fallen behind being answered by **switching back to
MongoDB** ("WeKan changed to old MongoDB data") instead of merging, and a failed
migration that **never tried again**. Below that, the release workflow: a repo
script the job could not see, and an hour of emulated build thrown away on a
push that was never going to be authorized.

The binaries below are carried over from v10.88 and have NOT been checked
against a newer build; `releases/provenance-table.sh` prints the real table
from the provenance each build job records.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-amd64) | v1.49.0 | `7c74941ff043f26aa4411ef5065d6b2d0766e369fc2a4458364c2f5571c12762` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-arm64) | v1.49.0 | `092132531555a39eac12566240a5f1ed02f62148b2dca0540a74c68e5957f6b5` |
| armhf | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armhf) | v24.19.0 | `b55350f3071b765a98ed66fdc410657ff168a937935057077fd7ab33cb30b9aa` |
| armhf | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armhf) | v1.49.0 | `144404fb9793dc8e039874812f4e2cb3e6d8b1df0ffdbe50254e7790a342a2f4` |
| armv6 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armv6) | v24.19.0 | `128ded0cda638c1f144eadb23ad249889515df017d298fd49c8faf3db110f0f1` |
| armv6 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armv6) | v1.49.0 | `7c27b2c15448709a24eace9b3c951c62fbe33413f7d20d56cb5520f4436efe2d` |
| armv7 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armv7) | v24.19.0 | `8dbe0a9aa8550ad5275c5538ebf868eb2037f0c4d9cccbe319f63b7e5854cd45` |
| armv7 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armhf) | v1.49.0 | `144404fb9793dc8e039874812f4e2cb3e6d8b1df0ffdbe50254e7790a342a2f4` |
| i386 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-i386) | v24.19.0 | `3b0b3bbfe27daf583b3a0f432efacc508407a012cdd9e8847250e7c015565bac` |
| i386 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-i386) | v1.49.0 | `1f70cb1687411b2a0fa9ac3b5bfc8c4ed9ce25ec2ddfa17e6fd3efb38136a39c` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-mac-arm64) | v1.49.0 | `576364db59dfce3ba564b9a3e484496eb57f95d76d2007b9f83241acdbd2f4fa` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-mac-amd64) | v1.49.0 | `37d70cd90aad6d3867b6686507ff1888f1edf6791818c31d014d130e8f39fc14` |
| ppc64le | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-ppc64le.tar.xz) | v24.19.0 | `c510c6ce12f07010f771e6edb22a3fe23f4f2e6f40b1ffd4941aed0646a0d8b3` |
| ppc64le | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-ppc64le) | v1.49.0 | `7c61d4853d5163ad8761449d693fd458ebbb8611a2351c718014876242c5b1fb` |
| riscv64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-riscv64.tar.xz) | v24.19.0 | `cd1f14af2812148002f58b58a5f9af512a50e3b8e8c148e0db44019dcb68edfd` |
| riscv64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-riscv64) | v1.49.0 | `bd4912da70f5e6c1475ab989668c76b4ab7db4ee06c44357693df64f5e1d0e0b` |
| s390x | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-s390x.tar.xz) | v24.19.0 | `a4792e65962ffa0af42627aacf1122a60c3c88dbf4e4184f06820d66f9da8ba4` |
| s390x | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-s390x) | v1.49.0 | *no checksum published* |
| win-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-arm64.zip) | v24.19.0 | `8502f4a50b458d4cc38ed8f2001556c2cd239d464920f74017926ccb1e1c157f` |
| win-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-win-arm64.exe) | v1.49.0 | `792166623e774b0af2aced31ed3ae39f545ca5268dc4c2b8d1a329228ff52cbc` |
| win64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip) | v24.19.0 | `57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73` |
| win64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-win64.exe) | v1.49.0 | `f42c50aa84095a9616b00f27a584c66b7bf79e3b109450c62a5f146ba3c85478` |

This release fixes the following bugs:

**The snap** - which database it runs on, and how everything gets into it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e63ac0e77">A migration never runs over the database it already produced</a>. Thanks to lukechao and xet7.</summary>

From [#6583](https://github.com/wekan/wekan/issues/6583): *"the migration
re-ran yesterday (even though it had already run successfully a few weeks ago).
The `.migration-to-ferretdb-done` file is time stamped yesterday … That explains
why I'm seeing old data."*

That is the worst version of this bug. The instance had been migrated and had
been serving from FerretDB for weeks; the marker went missing, the old staleness
guard put it back on `database=mongodb`, and the migration ran again — importing
the MongoDB copy it had been made from, over the database holding the work
since. `discard_partial_ferretdb` could delete that database outright, because
"partial" was assumed rather than checked.

Two locks on that door now, and the same fact opens both: the importer writes
`migration-progress.json` as it goes and resumes from it, so a **FerretDB with
data and no checkpoint beside it is a finished database, in use** — never a
migration to continue.

- `migration-control` checks that before it probes, reads or deletes anything.
  If it finds one it marks the migration done, starts FerretDB, stops MongoDB
  and exits. Nothing is imported.
- `discard_partial_ferretdb` checks it again before removing a SQLite, and says
  so when it declines. The MongoDB data is never touched either way.

`bin/migration-pending` already answered the same question through
`bin/database-role`, so neither branch should be reachable — which is why they
are there. The cost of being wrong in this direction is somebody's data.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/60b4ceda3">A snap ends up on FerretDB, whatever it was running before</a>. Thanks to xet7.</summary>

Three ways a snap could stay on MongoDB for good, all of them reported. The
snap runs on **FerretDB** on every platform — MongoDB is bundled to be READ
during a migration, and is not what WeKan runs on — so each of these is a bug.

**A database nothing could open.** A MongoDB server starts only on data whose
`featureCompatibilityVersion` is at most one major behind it, so the readers
covered FCV 6.0/7.0 (mongod 7), 4.0/4.2 (mongod 4.2) and 3.x (the 3.2 tools) —
and **nothing** covered 4.4 or 5.0. That is not a hypothetical rung: the WeKan
snap shipped MongoDB 5 in February 2023 and 6.0.6 only in May, so a site that
stayed on it has 5.0 files, and every reader refused them. Those instances got
`.mongodb-data-too-old` and an explanatory page while their boards sat in a
database nobody could read. `mongod 5.0` is bundled now, as a fourth read-only
reader, tried between 7 and 4.2 — and through `cpu-exec`, because MongoDB 5.0
requires AVX on x86_64 and a CPU without it should read the database under
emulation rather than die on a SIGILL.

**"WeKan changed to old MongoDB data."** When the migrated FerretDB copy had
fallen behind the MongoDB beside it, the snap answered by switching itself to
`database=mongodb`. That is the mail this came from: the site is put back on
the database the snap is migrating away from — and when the detector guessed
wrong ([#6583](https://github.com/wekan/wekan/issues/6583)), onto a copy that
was weeks behind. The repair is the **merge**, not the switch: the documents
MongoDB has and FerretDB does not are copied into FerretDB — inserting what is
missing, overwriting nothing — and WeKan carries on there. WeKan's history is
append-only, so the work done on MongoDB after the migration lands in the card
History instead of a database nobody opens. Switching to MongoDB is now only
the fallback for when the merge cannot run, because serving a copy that is
behind is exactly the complaint.

**A failed migration that never tried again.** A failure set `migrate=off` so
it would not loop, and nothing ever set it back on. The snap stayed on MongoDB
until an admin read `snap logs` and typed a command, and most never do. A
failure is recorded now — how many attempts, when, and which snap revision —
and retried by itself: **immediately after the next snap refresh**, since the
next release is the most likely thing to have fixed it, and otherwise after a
wait that doubles from an hour up to a day. The same record replaces
`migrate=off` on the unreadable-database path, which is what makes this
release's 5.0 reader reach the instances that were already given up on.
`snap set wekan migrate=off` still stops it completely — an admin saying "not
now" is a decision, not a failure.

None of this deletes anything: the MongoDB data stays in `$SNAP_COMMON` and a
`snap set wekan database=mongodb` is still the way back.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bb76e7bf1">There is no database setting on the snap any more, and nothing to type</a>. Thanks to xet7.</summary>

`snap set wekan database=mongodb|ferretdb` is **removed**, and so is
`snap run wekan.database`. WeKan runs on **FerretDB** — every platform, every
install — and MongoDB is in the amd64/arm64 snaps to be **read** while a
migration is owed, not to be run on.

A setting could say something the data did not support, and each way it could
was a report:

- set to `mongodb`, it kept a site on the database the snap migrates away from,
  for good, because nothing ever set it back — including the instances a failed
  migration or a wrong staleness guess had put there;
- set to `ferretdb` with no FerretDB present, it would have served an empty
  site, so the guard against that had to exist anyway;
- and every script had its own copy of "which database is this, then".

`snap-src/bin/database-role` replaced it: one helper, asked by `wekan-control`,
`mongodb-control`, `ferretdb-control`, `migration-pending`, `attachment-repair`
and the configure hook, that answers from the data — is there a FerretDB with
something in it, and has the migration that fills it finished? An interrupted
migration is told from a finished one by the importer's own checkpoint, so a
partial FerretDB resumes and a finished one whose marker went missing is not
migrated over again ([#6585](https://github.com/wekan/wekan/issues/6585)). A
snap that still carries the old setting is told once that it is ignored, and it
is unset.

The **explanatory page** stopped being a dead end too. When the MongoDB files
cannot be read by this snap but a FerretDB copy is there, that copy is now
**served** instead of the page — older beats unreadable — and the page's first
instruction, which used to be a command to type, says so. The rest of it now
opens with the fact that the snap keeps trying by itself.

[Migration-to-FerretDB.md](https://github.com/wekan/wekan/blob/main/docs/Platforms/FOSS/Container/Snap/Migration-to-FerretDB.md)
is the whole design in one page: what moves (all text data to SQLite,
CollectionFS **and** Meteor-Files attachments to the filesystem, the card
History with it), which MongoDB versions can be read, when it runs, what happens
when it fails, and how two copies are reconciled. The Admin Panel, Snap and
CPU-platform docs point at it instead of describing a setting that is gone.

</details>

**The release workflow** - what it needs to be there before it runs.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e533829f5">Only the wekan Docker image is published; the two variant names are commented out</a>. Thanks to xet7.</summary>

`wekan-ondra` and `wekan-gantt-gpl` are **snap** names — they exist because a
snap name cannot be changed once people have it installed — and as Docker images
they were only ever a second name for the same image. The release tagged them on
all three registries for two versions; it does not any more, and
`docker pull wekanteam/wekan` (or `quay.io/wekan/wekan`, or
`ghcr.io/wekan/wekan`) is the image, as it always was.

Six extra repositories across three registries, each with its own visibility and
its own push permission, is six new ways for a release to fail in order to
publish a copy of something already published — and v10.88 failed exactly that
way, an hour into an emulated build:

```
ERROR: failed to push quay.io/wekan/wekan-ondra:v10.88:
  unauthorized: access to the requested resource is not authorized
```

Quay grants push per repository and that repository had just been created by the
release itself.

The `-t` lines are **commented out, not deleted**, with what it would cost to
uncomment them written beside them — a line that vanishes is a line somebody
re-adds next year — and the same for the names in the two verification loops and
the push preflight. The manual
[`docker-variant.yml`](https://github.com/wekan/wekan/blob/main/.github/workflows/docker-variant.yml)
stays for publishing one out of band; it is `workflow_dispatch` only and no
release calls it.

Nothing is deleted from any registry: `ghcr.io/wekan/wekan-ondra` up to v6.99.2,
`quay.io/wekan/wekan-gantt-gpl` to v4.41 and `wekanteam/wekan-gantt-gpl` to
v5.62 keep working for whoever pinned them. They stop gaining versions. The
**snaps** keep both names and are still built and published, which is the point
of having them.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/18b881262">A path that stops resolving when the step changes directory, and the last bare downloads</a>. Thanks to xet7.</summary>

The v10.89 run failed four more jobs, all of them the same two mistakes one step
further along.

**The Windows jobs.** They check this repository out to `path: src`, so the
scripts were addressed as `src/releases/…` — correct until the bcrypt step does
`pushd "$TMP"`, after which a relative path resolves against a temp directory:

```
bash: src/releases/npm-retry.sh: No such file or directory,
```

The location is fixed now BEFORE anything moves — `SRC="$PWD/src"` at the top of
the step, then `"$SRC/releases/…"` — in all eighteen blocks that need it, and
the same for the UCS job's `univention/`.

**The downloads that are not in a workflow.** `snapcraft.yaml` builds the snap
in its own container, and `sandstorm-src/build-deps.sh` runs on the runner; both
still used a bare `curl`, and github.com's 503s took them out:

```
:: curl: (56) Connection died, tried 5 times before giving up
:: caddy: no linux/arm64 archive in Caddy 2.11.4 - nothing left to try.
==> [4/7] FerretDB v1 (amd64) at deps root
curl: (56) Connection died, tried 5 times before giving up
```

Both go through `releases/fetch.sh` now — the snap parts reach it through
`CRAFT_PROJECT_DIR`, since snapcraft mounts the project into the build — so the
caddy, MongoDB, mongod 4.2/5.0 and OpenSSL downloads, the meteor-spk and Node.js
tarballs and the FerretDB binary all wait an outage out. The Caddy version
lookup stays a plain `curl`: when it fails the pinned version is used, which
is what it is for. `curl https://install.sandstorm.io | sudo bash` became a download and a
run, because a pipe cannot be retried.

`tests/workflowRepoScripts.test.cjs` grew the two checks that would have caught
these: a repo-script path that is relative in a step which changes directory,
and a bare download in the snap build or the Sandstorm deps.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bdacff80e">A release script the job cannot see, and an hour of build thrown away at the push</a>. Thanks to xet7.</summary>

The v10.88 run lost seven jobs to two mistakes of the same kind: a step that
needs something and does not check whether it is there.

**The scripts were not on disk yet.** Moving the downloads and the package
installs behind `releases/fetch.sh` and `releases/apt-install.sh` turned steps
that needed nothing into steps that need this repository:

```
bash: /home/runner/work/wekan/wekan/releases/apt-install.sh:
        No such file or directory,
bash: D:\a\wekan\wekan/releases/npm-retry.sh: No such file or directory,
```

The first is `build-extra-arches`, where "Install dependencies" was the FIRST
step of the job, before `actions/checkout` — fine while it was a plain
`apt-get`. The second is the Windows jobs, which check this repository out to
`path: src`, so `$GITHUB_WORKSPACE/releases` is a directory that does not exist
there; they already called the other scripts as `src/releases/…`. The same two
shapes were in the Flatpak job (no checkout at all), Release All Missing's
extra-arches and its charts job (`path: wekan`), and the UCS job
(`path: univention`).

`tests/workflowRepoScripts.test.cjs` now reads every workflow and reports a step
that runs `releases/…` before its job checks out, or through a prefix that does
not match where that job put the repository. It also checks that every script a
workflow names exists here.

**And the push that was never going to work.** The docker job built every
architecture, emulated, for the best part of an hour, and threw it all away on
the last line:

```
ERROR: failed to push quay.io/wekan/wekan-ondra:v10.88:
  unauthorized: access to the requested resource is not authorized
```

The credentials were fine — the login check passed. Quay grants push **per
repository**, and `wekan-ondra` had just been created, so the account that
pushes `wekan` and `wekan-gantt-gpl` had no rights on it. A registry will say
whether it would grant a push token in one request, so the job now asks — for
all nine images, before building anything — and fails in seconds with what to
change, naming the per-repository setting. A registry that does not answer is a
warning: that is the network, not the rights.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v10.88 2026-08-12 WeKan ® release

**In short:** the rest of the **afternoon github.com spent returning `503`**,
and one repository that had nothing to do with WeKan at all. Two more release
runs died: one **downloading FerretDB**, where `curl --retry 5 --retry-delay
10` is fifty seconds of patience, and one on `apt-get update`, which fails as a
**whole** when any configured repository — the runner's **Google Chrome** one,
here — serves an index mid-republish. Both wait the outage out now. The other
half of both fixes is that a real failure is still immediate: a **`404` is an
answer, not an outage**, and an existence check that reads a `503` as "that
binary was never published" would drop an architecture that is sitting right
there on the release.

The binaries below are carried over from v10.87 and have NOT been checked
against a newer build; `releases/provenance-table.sh` prints the real table
from the provenance each build job records.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-amd64) | v1.49.0 | `7c74941ff043f26aa4411ef5065d6b2d0766e369fc2a4458364c2f5571c12762` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-arm64) | v1.49.0 | `092132531555a39eac12566240a5f1ed02f62148b2dca0540a74c68e5957f6b5` |
| armhf | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armhf) | v24.19.0 | `b55350f3071b765a98ed66fdc410657ff168a937935057077fd7ab33cb30b9aa` |
| armhf | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armhf) | v1.49.0 | `144404fb9793dc8e039874812f4e2cb3e6d8b1df0ffdbe50254e7790a342a2f4` |
| armv6 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armv6) | v24.19.0 | `128ded0cda638c1f144eadb23ad249889515df017d298fd49c8faf3db110f0f1` |
| armv6 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armv6) | v1.49.0 | `7c27b2c15448709a24eace9b3c951c62fbe33413f7d20d56cb5520f4436efe2d` |
| armv7 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armv7) | v24.19.0 | `8dbe0a9aa8550ad5275c5538ebf868eb2037f0c4d9cccbe319f63b7e5854cd45` |
| armv7 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armhf) | v1.49.0 | `144404fb9793dc8e039874812f4e2cb3e6d8b1df0ffdbe50254e7790a342a2f4` |
| i386 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-i386) | v24.19.0 | `3b0b3bbfe27daf583b3a0f432efacc508407a012cdd9e8847250e7c015565bac` |
| i386 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-i386) | v1.49.0 | `1f70cb1687411b2a0fa9ac3b5bfc8c4ed9ce25ec2ddfa17e6fd3efb38136a39c` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-mac-arm64) | v1.49.0 | `576364db59dfce3ba564b9a3e484496eb57f95d76d2007b9f83241acdbd2f4fa` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-mac-amd64) | v1.49.0 | `37d70cd90aad6d3867b6686507ff1888f1edf6791818c31d014d130e8f39fc14` |
| ppc64le | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-ppc64le.tar.xz) | v24.19.0 | `c510c6ce12f07010f771e6edb22a3fe23f4f2e6f40b1ffd4941aed0646a0d8b3` |
| ppc64le | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-ppc64le) | v1.49.0 | `7c61d4853d5163ad8761449d693fd458ebbb8611a2351c718014876242c5b1fb` |
| riscv64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-riscv64.tar.xz) | v24.19.0 | `cd1f14af2812148002f58b58a5f9af512a50e3b8e8c148e0db44019dcb68edfd` |
| riscv64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-riscv64) | v1.49.0 | `bd4912da70f5e6c1475ab989668c76b4ab7db4ee06c44357693df64f5e1d0e0b` |
| s390x | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-s390x.tar.xz) | v24.19.0 | `a4792e65962ffa0af42627aacf1122a60c3c88dbf4e4184f06820d66f9da8ba4` |
| s390x | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-s390x) | v1.49.0 | *no checksum published* |
| win-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-arm64.zip) | v24.19.0 | `8502f4a50b458d4cc38ed8f2001556c2cd239d464920f74017926ccb1e1c157f` |
| win-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-win-arm64.exe) | v1.49.0 | `792166623e774b0af2aced31ed3ae39f545ca5268dc4c2b8d1a329228ff52cbc` |
| win64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip) | v24.19.0 | `57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73` |
| win64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-win64.exe) | v1.49.0 | `f42c50aa84095a9616b00f27a584c66b7bf79e3b109450c62a5f146ba3c85478` |

This release fixes the following release-tooling bugs:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a6edf86bc">A package index that is mid-republish no longer ends a release</a>. Thanks to xet7.</summary>

The `bump` job of the same afternoon died on a repository the release does not
use:

```
E: Failed to fetch https://dl.google.com/linux/chrome-stable/deb/dists/stable/main/binary-amd64/Packages.gz  Hash Sum mismatch
E: Some index files failed to download.
Error: Process completed with exit code 100.
```

It was installing `python3` and `curl`. A GitHub runner comes with
google-chrome, microsoft-prod, azure-cli and docker repositories configured,
and `apt-get update` fails as a **whole** when any one of them serves an index
that does not match its own hashes - which is what a mirror looks like while it
is being republished.

`releases/apt-install.sh` installs the packages instead. It retries the update,
clearing the cached lists first - a Hash Sum mismatch is a cached index
disagreeing with the server, so re-reading it reports the same thing - and if
it still fails it moves the third-party lists aside and updates from the
distribution archive alone, which is where every package a release job installs
comes from. Both steps say what they did: a silent change of package sources
would be worse than the failure. A mirror that never comes back still fails the
job, saying it is the mirror.

Every `apt-get update` + `apt-get install` pair in Release All, Release All
Missing, the Sandstorm, meteor-spk and Flatpak workflows, and the emulated
build container, goes through it. `tests/releaseAptInstall.test.cjs` drives it
with a fake `apt-get` that mismatches on demand and a fake `sudo` that records
rather than runs - a test must not move the package sources of the machine it
runs on.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e771f8c66">A download that 503s is retried for a quarter of an hour, and a 404 still fails at once</a>. Thanks to xet7.</summary>

The second run of the same afternoon died one step later than the first, in
`build-amd64`, on the FerretDB binary:

```
curl: (22) The requested URL returned error: 503
Warning: Problem : HTTP error. Will retry in 10 seconds. 5 retries left.
...
curl: (56) Connection died, tried 5 times before giving up
```

Nothing was wrong with WeKan, and nothing was wrong with nodejs.org either -
the bundled Node.js downloaded and verified in the same step, seconds earlier.
It was github.com, and `--retry 5 --retry-delay 10` gives it fifty seconds.

`releases/fetch.sh` is now what downloads a file in a release. It retries
`5xx`, `429`, `408` and the connection errors on a backoff that adds up to
about fifteen minutes, and every download in Release All, Release All Missing,
the preflight scripts and the emulated build containers goes through it - with
the `Dockerfile` carrying it alongside `resolve-node-source.sh`, which now asks
it which Node.js builds exist.

The distinction it adds is the one a longer `--retry` cannot: **a `404` is not
an outage.** Several callers here legitimately ask "is this published for this
CPU?" and get "no" - the preflight that skips an architecture with no Node.js
build yet, the MongoDB Database Tools that are not built for every platform,
the `.sha256sum` a source may not publish. Those fail immediately and quietly.
Everything else waits.

And an existence check now has **three** answers instead of two: present,
absent, or *the server would not say*. That third one used to be
indistinguishable from "absent", which is how an outage could silently drop a
platform from the Docker image or skip an architecture whose binary was
published all along - a `::warning::` nobody reads until somebody on ppc64le
asks where their image went. It now stops the job and says to re-run it.

`tests/releaseDownloads.test.cjs` runs the script against a local server that
503s, 404s and 429s on demand, and reads the workflows for a download that
still goes straight to `curl`.

</details>

and has the following test-tooling fix:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4c68a8a49">One browser test logging in no longer logs the other tabs out</a>. Thanks to xet7.</summary>

The last WeKan test run failed one test in **all three browsers** - a test that
had passed for a month:

```
02-cards-open-view.e2e.js:66 copy-link button produces a URL that
opens the card in full-screen view
  Error: Token login failed: You've been logged out by the server.
```

Driving the running server over DDP with a token seeded the way the fixtures
seed one shows what it is:

```
session A: ok           tokens: [CfgBWImyytla]
session B: ok           tokens: [CfgBWImyytla]  <- two sessions, one token
after B logged out      tokens: []              <- logout removed it
session C (same token): ERROR You've been logged out by the server.
```

A seeded test user has **one** resume token, and `Meteor.logout()` deletes it on
the SERVER — for every session using it. The login helper called it when a page
was logged in as somebody else, so switching users in one page stranded every
other page of that test. Only the copy-link test logs a second page in, which is
why it was the one that failed.

The helper now ends the previous session in the CLIENT instead: it drops the
three `Accounts` keys and reloads, which the helper already knows how to do for
its own first load. The token is untouched, and the page still arrives with no
user on it. `logout()` stays as its own helper, because logging out is a real
thing to test — 05-admin-users logs out and back in with a password.

Two pages are two browsers, so they now get two tokens: `db.addResumeToken()`
adds one to an existing user, and the second tab uses it. That tab also stopped
waiting for `networkidle` before looking for the card — a card is rendered when
the subscriptions land, which is not a network event a browser can be idle
about, and on a loaded machine the wait ended before the card existed.

`tests/e2eSessionTokens.test.cjs` pins both rules, including a scan of every
spec for two logins sharing one token.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v10.87 2026-08-12 WeKan ® release

**In short:** the **release workflow** stops throwing a release away when
somebody else's server has a bad minute. Every download in it already retried;
the **`npm install`s did not**, so five minutes of `503 Service Unavailable`
from github.com ended a release run in its first job and skipped everything
derived from it — eleven bundles, the Docker images, the snap. They now retry
with backoff, and a real npm error still fails on the first attempt.

The binaries below are carried over from v10.86 and have NOT been checked
against a newer build; `releases/provenance-table.sh` prints the real table
from the provenance each build job records.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-amd64) | v1.49.0 | `7c74941ff043f26aa4411ef5065d6b2d0766e369fc2a4458364c2f5571c12762` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-arm64) | v1.49.0 | `092132531555a39eac12566240a5f1ed02f62148b2dca0540a74c68e5957f6b5` |
| armhf | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armhf) | v24.19.0 | `b55350f3071b765a98ed66fdc410657ff168a937935057077fd7ab33cb30b9aa` |
| armhf | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armhf) | v1.49.0 | `144404fb9793dc8e039874812f4e2cb3e6d8b1df0ffdbe50254e7790a342a2f4` |
| armv6 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armv6) | v24.19.0 | `128ded0cda638c1f144eadb23ad249889515df017d298fd49c8faf3db110f0f1` |
| armv6 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armv6) | v1.49.0 | `7c27b2c15448709a24eace9b3c951c62fbe33413f7d20d56cb5520f4436efe2d` |
| armv7 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armv7) | v24.19.0 | `8dbe0a9aa8550ad5275c5538ebf868eb2037f0c4d9cccbe319f63b7e5854cd45` |
| armv7 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armhf) | v1.49.0 | `144404fb9793dc8e039874812f4e2cb3e6d8b1df0ffdbe50254e7790a342a2f4` |
| i386 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-i386) | v24.19.0 | `3b0b3bbfe27daf583b3a0f432efacc508407a012cdd9e8847250e7c015565bac` |
| i386 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-i386) | v1.49.0 | `1f70cb1687411b2a0fa9ac3b5bfc8c4ed9ce25ec2ddfa17e6fd3efb38136a39c` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-mac-arm64) | v1.49.0 | `576364db59dfce3ba564b9a3e484496eb57f95d76d2007b9f83241acdbd2f4fa` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-mac-amd64) | v1.49.0 | `37d70cd90aad6d3867b6686507ff1888f1edf6791818c31d014d130e8f39fc14` |
| ppc64le | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-ppc64le.tar.xz) | v24.19.0 | `c510c6ce12f07010f771e6edb22a3fe23f4f2e6f40b1ffd4941aed0646a0d8b3` |
| ppc64le | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-ppc64le) | v1.49.0 | `7c61d4853d5163ad8761449d693fd458ebbb8611a2351c718014876242c5b1fb` |
| riscv64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-riscv64.tar.xz) | v24.19.0 | `cd1f14af2812148002f58b58a5f9af512a50e3b8e8c148e0db44019dcb68edfd` |
| riscv64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-riscv64) | v1.49.0 | `bd4912da70f5e6c1475ab989668c76b4ab7db4ee06c44357693df64f5e1d0e0b` |
| s390x | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-s390x.tar.xz) | v24.19.0 | `a4792e65962ffa0af42627aacf1122a60c3c88dbf4e4184f06820d66f9da8ba4` |
| s390x | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-s390x) | v1.49.0 | *no checksum published* |
| win-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-arm64.zip) | v24.19.0 | `8502f4a50b458d4cc38ed8f2001556c2cd239d464920f74017926ccb1e1c157f` |
| win-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-win-arm64.exe) | v1.49.0 | `792166623e774b0af2aced31ed3ae39f545ca5268dc4c2b8d1a329228ff52cbc` |
| win64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip) | v24.19.0 | `57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73` |
| win64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-win64.exe) | v1.49.0 | `f42c50aa84095a9616b00f27a584c66b7bf79e3b109450c62a5f146ba3c85478` |

This release fixes the following release-tooling bug:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/644e61f6a">A five-minute outage at github.com no longer costs a whole release</a>. Thanks to xet7.</summary>

The v10.86 run failed in `build-amd64`, installing the bundle's server modules:

```
npm error code E503
npm error 503 Service Unavailable - GET https://github.com/meteor/node-source-map-support/tarball/81bce1f9...
```

Nothing was wrong with WeKan. github.com was returning 503 for a few minutes,
and `npm install` gave up: npm's own `fetch-retries` is two quick attempts, and
it does not cover a git tarball fetch at all. Because every other Linux bundle
is repacked from the amd64 one, that one job took the whole release with it —
eleven architectures, the Docker images, the snap, all skipped — and it had to
be started again by hand. Every `curl` in that workflow has carried
`--retry 5 --retry-delay 10` for years; the npm installs carried nothing.

`releases/npm-retry.sh` runs an npm command and retries it on backoff (15s, 30s,
60s, 120s, five attempts), and every `npm install`, `npm pack` and
`meteor npm install` in Release All now goes through it — including the two that
run inside `docker run`, which get the script mounted the way the arch builds
already mount `releases/`. Release All Missing repacks through that same
container script, so it inherits the retry.

The half that keeps it honest is what is NOT retried. A dependency conflict, a
404 for a package that does not exist, a `gyp` compile error: those fail on the
first attempt with `not for a network reason`, because five attempts at an
emulated arm64 install that was never going to work is half an hour spent to
print the same message. Only HTTP 5xx/429 and the socket errors — `ECONNRESET`,
`ETIMEDOUT`, `EAI_AGAIN`, `socket hang up`, a git clone whose remote hung up —
count as transient. An outage that outlasts all five attempts still fails the
job, saying it is an outage rather than WeKan.

The Meteor installer is fetched to a file and then run, instead of
`curl https://install.meteor.com/ | sh`: a pipe cannot be retried, because by
the time the download fails `sh` is already half way through the script.

`tests/npmRetry.test.cjs` runs the script against a fake npm to pin both halves,
and reads the workflow for a bare `npm install` — one unretried install is all
it took the first time.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v10.86 2026-08-12 WeKan ® release

**In short:** a **snap** release and a batch of reported bugs. The snap half is
one theme in four places: a copy made at one moment being used as if it were
current. A **MongoDB to FerretDB migration** interrupted weeks ago and finished
by an update copied only what was left, so an overnight refresh could serve
boards and cards as they stood weeks earlier; an instance already **running on
FerretDB** was dragged back to the old MongoDB files it was migrated from, and
shown "Wekan cannot open the existing database" instead of its own working site;
a **MongoDB 3.x database on any CPU without the 3.2 reader** waited for a
database that was never coming, with the reason only in `snap logs`; and the
upgrade documentation let an admin copy the old database directory back over a
**running** database, which destroys the restore they had just made. Two copies
of one database are also **reconciled automatically** now — the newer is served
and the older is merged into its history — so an instance being shown the wrong
copy repairs itself instead of waiting for somebody to type two commands. Then:
a **`file://` link no longer makes a card impossible to open**, a **Worker** can
finally move a card and assign themselves to it, an **archived card is still
named** in its own history, the **PDF export** writes umlauts instead of
question marks and no longer prints markdown at a reader, **minicards** follow
the Member Settings font size, and unchecking **"Show on minicard"** on a
checklist finally hides it. Below that: dependency updates, the **Helm chart**
moving to FerretDB with the release that publishes it, a repo-wide guard that
asks whether an already-fixed vulnerability exists anywhere ELSE - which found
one - and the tests for all of it. The binaries below are carried over from
v10.85 and have NOT been checked against a newer build;
`releases/provenance-table.sh` prints the real table from the provenance each
build job records.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-amd64) | v1.49.0 | `7c74941ff043f26aa4411ef5065d6b2d0766e369fc2a4458364c2f5571c12762` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-arm64) | v1.49.0 | `092132531555a39eac12566240a5f1ed02f62148b2dca0540a74c68e5957f6b5` |
| armhf | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armhf) | v24.19.0 | `b55350f3071b765a98ed66fdc410657ff168a937935057077fd7ab33cb30b9aa` |
| armhf | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armhf) | v1.49.0 | `144404fb9793dc8e039874812f4e2cb3e6d8b1df0ffdbe50254e7790a342a2f4` |
| armv6 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armv6) | v24.19.0 | `128ded0cda638c1f144eadb23ad249889515df017d298fd49c8faf3db110f0f1` |
| armv6 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armv6) | v1.49.0 | `7c27b2c15448709a24eace9b3c951c62fbe33413f7d20d56cb5520f4436efe2d` |
| armv7 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armv7) | v24.19.0 | `8dbe0a9aa8550ad5275c5538ebf868eb2037f0c4d9cccbe319f63b7e5854cd45` |
| armv7 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armhf) | v1.49.0 | `144404fb9793dc8e039874812f4e2cb3e6d8b1df0ffdbe50254e7790a342a2f4` |
| i386 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-i386) | v24.19.0 | `3b0b3bbfe27daf583b3a0f432efacc508407a012cdd9e8847250e7c015565bac` |
| i386 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-i386) | v1.49.0 | `1f70cb1687411b2a0fa9ac3b5bfc8c4ed9ce25ec2ddfa17e6fd3efb38136a39c` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-mac-arm64) | v1.49.0 | `576364db59dfce3ba564b9a3e484496eb57f95d76d2007b9f83241acdbd2f4fa` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-mac-amd64) | v1.49.0 | `37d70cd90aad6d3867b6686507ff1888f1edf6791818c31d014d130e8f39fc14` |
| ppc64le | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-ppc64le.tar.xz) | v24.19.0 | `c510c6ce12f07010f771e6edb22a3fe23f4f2e6f40b1ffd4941aed0646a0d8b3` |
| ppc64le | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-ppc64le) | v1.49.0 | `7c61d4853d5163ad8761449d693fd458ebbb8611a2351c718014876242c5b1fb` |
| riscv64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-riscv64.tar.xz) | v24.19.0 | `cd1f14af2812148002f58b58a5f9af512a50e3b8e8c148e0db44019dcb68edfd` |
| riscv64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-riscv64) | v1.49.0 | `bd4912da70f5e6c1475ab989668c76b4ab7db4ee06c44357693df64f5e1d0e0b` |
| s390x | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-s390x.tar.xz) | v24.19.0 | `a4792e65962ffa0af42627aacf1122a60c3c88dbf4e4184f06820d66f9da8ba4` |
| s390x | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-s390x) | v1.49.0 | *no checksum published* |
| win-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-arm64.zip) | v24.19.0 | `8502f4a50b458d4cc38ed8f2001556c2cd239d464920f74017926ccb1e1c157f` |
| win-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-win-arm64.exe) | v1.49.0 | `792166623e774b0af2aced31ed3ae39f545ca5268dc4c2b8d1a329228ff52cbc` |
| win64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip) | v24.19.0 | `57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73` |
| win64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-win64.exe) | v1.49.0 | `f42c50aa84095a9616b00f27a584c66b7bf79e3b109450c62a5f146ba3c85478` |

This release updates the following dependencies:

- **aldeed:collection2 4.2.1 → 4.2.2** — the Meteor package that validates every
  write against a collection's schema. It is the one that formats the error a
  list with no title used to crash inside.
- **rspack 1.2.0 → 1.2.1** — the Meteor build plugin that bundles the client.
  Build-time only.
- **@aws-sdk/client-s3 3.1105.0 → 3.1108.0**, with the eighteen
  `@aws-sdk/*` credential, signing and presigner packages it pulls in — the
  optional S3 attachment storage. Unused unless S3 is configured.
- **@smithy/core 3.31.1 → 3.32.0** and its HTTP handler, IMDS credential and
  signature-v4 packages — the transport layer under those AWS clients.
- **@google-cloud/storage 7.21.0 → 7.22.0** — the other optional attachment
  backend.
- **bson 7.3.1 → 7.3.2** — the BSON codec the MongoDB driver speaks to MongoDB
  and to FerretDB with.
- **ws 8.21.2 → 8.21.3** — the WebSocket implementation Meteor's DDP connection
  runs over.
- **nanoid 3.3.17 → 3.3.18** — id generation inside the build toolchain.
- **terser 5.49.2 → 5.50.0**, **browserslist 4.28.7 → 4.28.8**,
  **electron-to-chromium 1.5.402 → 1.5.405**, **baseline-browser-mapping
  2.11.12 → 2.11.13**, **update-browserslist-db 1.3.0 → 1.3.1** — the minifier
  and the browser-support tables it targets. Build-time only.
- **eslint 10.8.0 → 10.8.1** and the **@typescript-eslint 8.66.0 → 8.67.0**
  family — linting, development only.
- **puppeteer 25.5.0 → 25.6.0** (with `puppeteer-core` and
  `@puppeteer/browsers 3.1.0 → 3.2.0`) — the headless browser some tests drive.
  It ships in no WeKan bundle.
- **memfs 4.68.0 → 4.68.1** and the eight **@jsonjoy.com/fs-\* 4.68.0 →
  4.68.1** packages it is built from — the in-memory filesystem the build uses.
- **modern-tar 0.7.7 → 0.8.4**, **markdown-it-math 6.0.0 → 6.0.1**,
  **bare-url 2.4.7 → 2.5.2**, **@babel/helper-validator-identifier 7.29.7 →
  8.0.4**, **@types/node 26.1.2 → 26.2.0** — transitive updates that came with
  the rest.

Thanks to dependabot.

and fixes the following bugs:

**The snap** - which database it serves, and what it says when it cannot.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c78382982">A migration interrupted weeks ago no longer resumes onto a database MongoDB has outgrown</a>. Thanks to Alishara and xet7.</summary>

"Our snap updated automatically from 10.81 yesterday to 10.85 this morning. Data
in the DB is from about 2 - 3 weeks ago. Many cards and work is lost."

Nothing was lost. The MongoDB data lives in `$SNAP_COMMON` and was untouched;
what the update completed was a migration that had been interrupted weeks
before.

The migration is resumable because it has to be: it can run for hours, and a
snap refresh, a `snap stop` or a reboot part-way through is normal rather than
exceptional. So the importer records every finished collection in
`migration-progress.json` and skips those on the next start. That checkpoint was
only ever checked against the TARGET - it is deleted whenever a partial FerretDB
is discarded, so it can never name collections that are not there. Nothing
checked it against the SOURCE, and between an interruption and the retry the
snap hands WeKan back to MongoDB and people go on using it. A migration
interrupted in July and resumed in August therefore skipped every collection it
had finished in July, copied only the rest, and switched the snap onto the
result.

A new snap revision is usually what sets a stalled resume going again, because
the per-revision failure counter starts at zero - which is why this reads as
"the update lost my data". The update is when the weeks-old copy finally got
served. It is the same family as
[#6583](https://github.com/wekan/wekan/issues/6583) and has the same answer: a
copy made at one time may not be used as if it were current.

Two checks now stand in the way, because they fail differently. Before the
migration starts, and before it starts a mongod of its own - starting one
rewrites the files the question is asked of - the checkpoint is compared against
the MongoDB data files' timestamps. Newer MongoDB means the collections listed
as done are copies of an older database, so that half of the checkpoint is
dropped and they are copied again. The FILE half is kept: attachments are
written once and re-verified on disk, and re-extracting gigabytes is the slowest
part of a resume. Afterwards, when both databases are quiet, each collection is
COUNTED on both sides; one whose copy holds fewer documents is copied again from
the source as it is now. Only a shortfall is acted on - a copy holding more
documents is a resume carrying documents deleted from MongoDB since, and
deleting on that evidence is the guess this whole family of bugs is made of -
and a shortfall that survives the second copy is reported rather than fatal, so
one document FerretDB will not accept cannot leave the snap in a migration it
can never finish.

The tests run the detector against synthesised `$SNAP_COMMON` directories - the
reported case, an ordinary resume minutes later, the margin that covers the
migration stopping its own temporary mongod, and a `mongodb.log` that must not
count as somebody having used the database - and exercise the count check
extracted from both importers.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4b99fa701">A snap already running on FerretDB is not stopped by the old MongoDB files beside it</a>. Thanks to mueschel and xet7.</summary>

"It somehow tries to access Mongodb again instead of Ferretdb. I don't even have
an old version, but just this" - and the screenshot is the page from
[#6471](https://github.com/wekan/wekan/issues/6471), "Wekan cannot open the
existing database", on a snap whose data was in FerretDB and perfectly readable.

The migration never deletes what it copied from, so a migrated snap keeps its
old MongoDB files in `$SNAP_COMMON` forever. Two places treated their presence
as something WeKan had to act on. The migration was called "pending" for any
`$SNAP_COMMON` holding those files without the completed-migration marker - the
database setting was never consulted - so an instance whose marker is gone (a
forced re-migration cleared it, or it was migrated by a snap old enough never to
have written one) probed the old files on every start, and when no reader could
open them the site was replaced by an explanation of a database it does not use.

Both now ask what the snap is actually running, and "already on FerretDB" means
the setting AND real data: `database=ferretdb` with an empty `files/db` is
exactly the case the migration exists for and must still run. Nothing is
switched automatically - [#6583](https://github.com/wekan/wekan/issues/6583) is
what choosing between two copies on the snap's own initiative costs - but where
a FerretDB copy exists, the page now says so and gives the one command that
serves it, the one that undoes it, and the warning that a migrated copy is only
as new as the migration that made it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3811c528">A MongoDB this snap has no reader for stops and says so, on every CPU</a>. Thanks to Philippe-Bentegeac, JDeepix and xet7.</summary>

"It turns out the mongodb version on my installation was even older. It was
running on mongodb 3.2, this is why your 4.2 check was not doing anything."
Their site never showed the explanatory page either - it waited for MongoDB
forever, which is the loop [#6471](https://github.com/wekan/wekan/issues/6471)
was opened about.

The MongoDB 3.2 tools are staged for amd64 only, because MongoDB published no
3.2 build for anything else. So on every other architecture a MongoDB 3.x
database has no reader in this snap at all - and that case was handed back to
mongod 7, the binary that has already refused the files. It fails, the migration
re-runs, and the site sits on "MongoDB not ready yet, retrying in 5 seconds..."
with the reason only in `snap logs`.

A missing reader and an unreadable database are not the same thing, and only one
of them can usefully be retried. Where mongod has already said "too recent to
start up on the existing data files", the reader not being in this snap is a
final answer: stop, keep every byte, serve the page. The page also stops leaving
the way out as an exercise - it gives the four steps in this snap's own paths,
ending in `snap run wekan.database-restore`, rather than "move the data across
with a MongoDB that can read it".

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/40ff8151e">Two copies of one database are reconciled automatically: the newer is served, the older merged into history</a>. Thanks to xet7.</summary>

An email report, on an instance being served the older of its two copies: "some
users are unable to log in (error: 'user not found'), and boards created after
mid-July appear to be missing." That is what serving a copy looks like from the
outside — the accounts and boards made after the copy was taken are simply not
there.

Until now the snap handled that by handing it back to the admin.
[#6583](https://github.com/wekan/wekan/issues/6583) taught it not to switch on a
guess, so when both MongoDB and the migrated FerretDB have been written to since
the migration it printed the two `snap set wekan database=...` commands and
stayed where it was. That message lives in `snap logs`; most people never see
it, and their site meanwhile shows the wrong copy.

A file timestamp cannot answer "which copy holds the work" — an mtime says when
a file was touched, and starting a database touches its files. But both copies
can be READ. Each is started on a temporary port, asked how many documents it
holds and what the newest moment in its data is, and the copy holding the work
is served. Where both hold something the other does not, the documents that
exist only in the other one are copied across, and where the two cannot be told
apart nothing is changed and the old message stands.

The merge is what makes this safe to do automatically, and WeKan's own design is
what makes the merge safe: the history is append-only, so activities, comments
and the coming change-history rows can only be ADDED to. Every document whose
`_id` is absent from the chosen copy is inserted and nothing else happens — what
is already there is never overwritten, so a card edited on both sides keeps the
newer version; nothing is deleted on either side; and the copy that was not
chosen stays on disk, so switching back is still one command, now a choice
rather than a repair. The work done on the copy that is not being served becomes
readable in the served copy's card History instead of sitting in a database
nobody opens.

For the reported symptoms that means the missing users and boards are inserted
rather than left behind. Reconciling two edits of the same field is still not
attempted: that is a decision about somebody's work. `WEKAN_AUTOPICK=false`
turns the whole thing off and `database-autopick --dry-run` shows what it would
do.
[docs/Features/Reports/History/History.md](https://github.com/wekan/wekan/blob/main/docs/Features/Reports/History/History.md)
gains the section that states the append-only invariant this depends on.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/440062906">Copying the old snap common directory back is what destroys the restore</a>. Thanks to xet7.</summary>

From an upgrade report by email. The admin upgraded 6.09 to 10.85 exactly by the
documented route - dump, move `/var/snap/wekan/common` aside, refresh, restore -
and it worked: the boards were back. Then, to get their attachments, they undid
that step the way it reads, with `cp -pR /root/common/*
/var/snap/wekan/common/`, and seconds later `mongod` aborted (`status=134/n/a`).
"After that, Wekan was still running, but all the boards were missing."

Everything beside `files/` in that directory is the raw database, and copying it
over a RUNNING mongod replaces the files it has open underneath it. The
documentation is where this is decided, because the mistake is made before any
WeKan code runs: the step already said to copy back only `files`, and it now
says what the obvious inversion costs, which files those are, and what the
failure looks like in `snap logs wekan.mongodb` so somebody who has already done
it recognises their own log. `mongodb-control` recognises that abort too - exit
134 gets a case of its own beside the AVX one, naming the cause and the one way
out.

</details>

**The board** - what a card looks like, and what an export says.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7b35cb5f0">A Worker can move a card and assign themselves to it, which is what the role is for</a>. Thanks to rptl and xet7.</summary>

"User with Worker permission can't assignee card if it has been assigned to
someone else before" — and in fact could not assign themselves at all. The card
showed their name for a moment and then showed the previous assignee again,
which is what a rejected optimistic write looks like.

The board schema defines the role as "only allowed to move card, assign himself
to card and comment". Both of those are card updates, and the capability table
gives Worker no write access — so the role defined by two specific writes was
allowed neither, while the client already offered the UI for it: the assignee
popup shows a Worker exactly one name, their own.

Widening write access was never the fix; that hands a Worker every field of
every card. Moving and self-assigning are their own capability now, enforced
field by field on the server: a Worker may write `listId`, `swimlaneId`, `sort`
and their OWN id in `assignees`, and nothing else. The policy allows only what
it recognises, so a title, a label, somebody else's name, a whole-document
replacement or an operator added by a future MongoDB are all refused by default.
[Roles.md](https://github.com/wekan/wekan/blob/main/docs/Features/Members/Roles.md)
gains the column, and its "Known gaps" section is now empty.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f2e58945f">An archived card is still named in its own history</a>. Thanks to rptl and xet7.</summary>

"Activities for archived card displayed as undefined on board settings." Move a
card around, archive it, open the board sidebar — and the sentences that named
that card name nothing.

The feed asked for the card document and rendered its title, and an archived
card is not published to the client: a card that still exists, still has a
title, and whose activities are right there on the page went nameless in its own
history. The activity itself already recorded the title in most cases, so that
is what is read now — the card's current title when the card is here, marked
`[archived]` when it says it is, the recorded title when it is not, and "this
card" when neither exists, rather than a gap in the middle of a sentence. The
link survives all of it, because a card URL can be built from the ids the
activity carries.

The two activities that were NOT recording a title were the two about archiving,
which are exactly the ones guaranteed to be about a card the client can no
longer look up. They record it now. A card that is merely absent is not called
archived: with lazy card loading it may just be outside the window this client
was sent, and that would be a claim the feed cannot support.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/75a23b76a">A file:// link in a card no longer makes the card impossible to open</a>. Thanks to rmb82 and xet7.</summary>

"A card whose description or a comment contains a `file://` URL cannot be
opened. Clicking the minicard plays the open animation but the card details
panel never mounts." There was no visible error, because Blaze swallows a render
exception; captured, it was `TypeError: this.__schemas__[...].validate is not a
function`, thrown out of markdown-it's linkify pass.

WeKan registers eight custom URL schemes — `file:`, `thunderlink:`, `onenote:`
and five more — and registered them the linkify-it 4/5 way, passing the string
`'http:'` to mean "behave like that one". linkify-it 6 removed string aliases
and builds the definition by spreading it, so that string became
`{0:'h',1:'t',2:'t',3:'p',4:':'}` — an entry with no `validate` — and the
recogniser then called `.validate(...)` on it. Every one of those schemes was a
landmine in any card's text.

Each scheme carries a validate of its own now, which is all the alias stood for.
The guarantee behind the fix is worth more than the fix: nothing a card contains
may make that card impossible to open, so the render is wrapped and a throw from
any future plugin, formula or upgrade shows the text as written — escaped,
sanitised, unformatted and readable — instead of a panel that never mounts.

The schemes still do not produce clickable links, and never did: markdown-it's
own link validation refuses `file:`, and the viewer's sanitiser allows only
http/https/ftp/ftps/mailto/tel/callto/cid/xmpp. Making them clickable means
relaxing both for schemes that launch local applications, which is the security
decision [#3218](https://github.com/wekan/wekan/issues/3218) asks for; it is in
TODO Later, and the tests pin today's answer so that changing it is a decision.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f7b0a4d1d">A board's type now follows Member Settings / Font size</a>. Thanks to CCmesch and xet7.</summary>

"The font size setting in the user menu (Settings - Font Size) has no effect on
mini cards, while it correctly applies to other UI elements."

Two halves, and both had to be wrong for this. The preset was applied to
`<body>`, and `rem` is measured against the ROOT element, so anything sized in
rem never heard about the setting. And a board's type is sized in px - the list
heading, the minicard title and the "Add card" link were pinned to 16/14/13px in
[#6465](https://github.com/wekan/wekan/issues/6465) - which follows nothing at
all, so the board was the part of the UI the setting could not reach whichever
element carried it.

The preset moves to `<html>` and those sizes become rem: the same 16/14/13px at
the default root size, so the type scale is unchanged, but a 130% preset now
scales it and 80% shrinks it. The size goes on one element only, because on both
html and body a 130% preset compounds to 169%.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/32b61f186">Unchecking "Show on minicard" on a checklist now hides it</a>. Thanks to xet7.</summary>

Reported by email with a screenshot: the switch is off and the checklist is on
the minicard anyway. It was off for everybody, because the minicard asked
`board.allowsChecklistsOnMinicard || checklist.showChecklistAtMinicard` and the
board flag defaults to true. An OR cannot be argued with: while the board
setting is on, no value of the checklist's own field changes the answer. The
popup made it look like a working switch - it drew the state from the raw field,
which starts false, so it read OFF beside a checklist that was plainly showing,
and clicking it changed nothing visible in either direction.

The two settings are a DEFAULT and an OVERRIDE now, which needs three states:
the field loses its `defaultValue: false`, because with every checklist born
false "hidden" and "not chosen" are the same value. Checklists written under the
old default carry a false that meant "follow the board", so a schema-upgrade
step clears exactly those - once ever, not once per version, since afterwards a
stored false is somebody's choice.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eb1416889">The PDF export writes umlauts instead of question marks, and no longer prints markdown</a>. Thanks to Heart1010 and xet7.</summary>

"the umlauts (german, ä, ü, ö,...) are corrupt", "all the text in this PDF file
is markdown formatted - this doesn't make sense in a pdf file, does it?", and "I
can't see in which swimlane a card is in that export, no tags".

The umlauts were removed on purpose, one line before anything was written: every
character outside printable ASCII became a question mark, so "Grüße" left the
server as "Gr??e". That was a workaround rather than a choice - text in a PDF is
bytes plus an encoding, and the exporter declared neither, so there was nothing
safe to write those letters into. The font now declares `WinAnsiEncoding`, the
text is encoded to those single bytes, and the file is assembled as binary; the
cross-reference offsets are measured in bytes for the same reason, since
measured as UTF-8 every offset after the first accented character is wrong.

Markdown is flattened to its words instead of printed as syntax, list headings
and card titles are drawn in the bold font rather than with `##`, and the board
export now names swimlanes, labels, members, assignees and dates. What
Windows-1252 has no room for is transliterated rather than erased; a script the
base-14 fonts cannot draw at all still degrades to `?`, and an embedded Unicode
font for those is in TODO Later.

</details>

and changes what the Helm chart installs and how it is published:

**The Helm chart** - the database it installs, and the index that lists it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5d1c9d0a3">This release switches the Helm chart to FerretDB, and its release job is what publishes it</a>. Thanks to salcinad, ouvry-ems and xet7.</summary>

[wekan/charts](https://github.com/wekan/charts) drops its bundled MongoDB for
FerretDB (`ghcr.io/wekan/ferretdb`), installed by the chart itself as one
StatefulSet and one ClusterIP Service. That answers
[charts#55](https://github.com/wekan/charts/issues/55) — WeKan runs on FerretDB
and the chart did not — and
[charts#54](https://github.com/wekan/charts/issues/54): the chart built its
`MONGO_URL` out of a different chart's naming, Bitnami's per-pod
`<release>-mongodb-0.<release>-mongodb-headless` against the services
groundhog2k actually creates, so WeKan dialled a host that does not exist. The
database is the chart's own now, so the Service in the URL is the Service the
chart creates.

**The chart reaches people with THIS release, not before it.** The charts job of
the Release All workflow publishes chart `<version>.0` from the charts repo's
`main` branch, and that branch now holds the FerretDB chart — so the release
publishes it, with an image that exists and an index entry written by the script
that owns the index. Nothing was published out of band, and no existing entry in
the index is touched: charts already in it keep their package and their digest.

The image is one that can be PULLED, which took finding out. Artifact Hub's scan
of the chart said `error scanning image ghcr.io/wekan/ferretdb:latest: image not
found` — because a GHCR package is private until somebody makes it public, and
the WeKan organisation had public packages disabled entirely, so the setting was
greyed out. In a cluster that is `ImagePullBackOff`, not a scanner complaint.
The organisation policy and the package are public now, so
`ghcr.io/wekan/ferretdb` is the default, with `quay.io/wekan/ferretdb` and
Docker Hub's `wekanteam/ferretdb` beside it — all three verified to serve the
full multi-arch set. The chart keeps the story, because "check the package's
visibility" is the first thing to try if a pull ever fails that way again.
Chart.yaml also declares its images and its changes to Artifact Hub now, written
at release time from the version being released, so the scanner reads a list
instead of inferring one.

The chart carries what WeKan needs on FerretDB rather than what it needed on
MongoDB — polling reactivity, `sockjs`, `WRITABLE_PATH`, `WITH_API`, no
`MONGO_OPLOG_URL`, and `directConnection=true` in the URL
([#6582](https://github.com/wekan/wekan/issues/6582)) — and each of those says,
where the setting is, what it would be on MongoDB instead, with both of WeKan's
compose files linked and the production notes
([docs/Platforms/FOSS/Container/Docker/Meteor3](https://github.com/wekan/wekan/tree/main/docs/Platforms/FOSS/Container/Docker/Meteor3))
pointed at from `values.yaml`, the README and the URL helper. The image comment
names the three registries that carry FerretDB and the Docker Hub `mongo:7` it
replaced. Plus every setting `docker-compose.yml` documents, commented, so a
Helm user has the same reference a Docker user has.

Two release-path guards come with it. The version bump a release performs cannot
touch `tag: latest`, so a WeKan version bump can never rewrite the database
image tag. And filling holes in the index for OLD releases
(`releases/backfill-charts.sh`) stops at WeKan 10.00, the release FerretDB
became the default in: it packages today's chart, and giving a v6.09 image a
FerretDB chart would publish an install nobody has ever run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1d76e0d43">The two variant images are published on all three registries by the release itself</a>. Thanks to xet7.</summary>

`wekan-ondra` and `wekan-gantt-gpl` are the same WeKan as `wekan`: those
repositories are byte-identical to `wekan/wekan` apart from the snap `name:` in
`snapcraft.yaml`. Their Docker images have therefore never been rebuilt — they
were retags of the released manifest, published when somebody remembered to
start `docker-variant.yml` by hand, which is how an image comes to name a
version newer than the bits inside it.

They are now tagged in the release's own `docker buildx build --push`, beside
`wekan` itself, on GHCR **and** Docker Hub **and** Quay — eighteen tags from one
build. Being in the same build is the point: the variant tags carry the
release's own digests for every architecture, there is no second emulated build
to go wrong, and there is no window in which a variant image can differ from the
release it names. `docker-variant.yml` stays, for republishing one out of band
when a registry was down or a repository was created after the fact, and that is
work a human should start.

Two guards, because a tag that is pushed is not a tag that anyone else can pull.
The existing verification asks the registry about all nine images with the
release's own credentials; a new step then asks for each one **anonymously**,
the way a user does, and a `401`/`404` there fails the job with what to fix. It
matters on the first release after this: Quay creates a new repository
**private**, so `quay.io/wekan/wekan-ondra` will exist, will pull for the
pusher, and will not pull for anybody else until its visibility is changed —
the same trap `ghcr.io/wekan/ferretdb` fell into. A registry that cannot be
reached at all is a warning, not a failure: that is the network, not the
release.

Release All Missing has no Docker part to change: its jobs are plan,
extra-arches, appimage, flatpak, charts and done, and it fills in artifacts for
versions whose image already exists.

If a variant repository ever stops being identical to `wekan/wekan`, those two
tags become a lie and that variant needs its own build — which is written where
the tags are, and in
[Snap-Ondra-Gantt.md](https://github.com/wekan/wekan/blob/main/docs/Design/Autoupdate/Snap-Ondra-Gantt.md).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ad02cccc">A version bump cannot rewrite the database image, and old releases are not backfilled onto FerretDB</a>. Thanks to xet7.</summary>

Two guards on the release path, found by checking the Release All and Release
All Missing workflows against the chart change rather than assuming they still
fit.

A release rewrites exactly three things in the chart: `appVersion`, the chart
version, and the WeKan image tag. That last substitution matches `tag:
v<digits>` and every other image in the chart is `tag: latest` — FerretDB and
the two busybox images — so a WeKan version bump cannot reach the database
image. The test asserts that against the pattern itself rather than a copy of
it, and the whole release was simulated for a hypothetical 10.86: no
dependencies, FerretDB enabled, both its templates in the package, and the
FerretDB URL helper.

`releases/backfill-charts.sh` fills holes in the published index by packaging
TODAY's chart with an old release's numbers on it, and today's chart installs
FerretDB — which WeKan did not default to until v10.00. A backfilled chart for
v6.09 would pair that image with a database nobody ever ran it against,
published under a version number that says it is that release's chart. It now
stops at 10.00, reports the older ones rather than dropping them silently, and
`CHART_FERRETDB_FLOOR` overrides it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/de8a29385">A chart package whose container image was deleted cannot come back into the index</a>. Thanks to xet7.</summary>

From an Artifact Hub scan report of the chart repository:

    error scanning image ghcr.io/wekan/wekan:v9.62: image not found
      (package wekan:9.62.0)

and six more like it. Checked against the live registry, the index itself is
already clean — every one of its 230 entries points at an image that exists,
because `releases/reindex-charts.py` asks the registry about every image a
package pins and leaves out the ones whose image is gone.

The hole was in the backfill: it rebuilt the index with `helm repo index
--merge`, and helm indexes what it FINDS. 135 packages on that branch have an
image that no longer exists — six WeKan images that were never published, and
129 charts vendoring a Bitnami MongoDB image Bitnami has since deleted — so one
run would have put all of them back and produced the same report again. It now
uses `reindex-charts.py`, so "a package whose image is gone stays out of the
index" is one rule in one place rather than two tools that disagree. A registry
that cannot be REACHED is still never read as "image gone": that would drop good
entries on a network hiccup.

The duplicate-entry repair that followed the merge went with it — `--merge` was
what produced the duplicates, and one entry per package cannot duplicate.

</details>

and has the following test coverage work:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eb47e0465">A guard that asks whether an already-fixed mistake exists anywhere else</a>. Thanks to xet7.</summary>

Every entry in the [Hall of Fame](https://wekan.fi/hall-of-fame/) has a suite
pinning the place it was found, and none of them could answer the other half of
the question: is the same MISTAKE somewhere else, in WeKan or in the FerretDB
fork WeKan ships as its default database? A per-site regression test knows one
file, and the next occurrence is written months later by somebody who never read
the advisory.

The new guard asks it as a class, over the whole tree and over `.tools/FerretDB`
when the clone is there: an archive entry naming its own destination, a client
selector carrying operators that execute JavaScript, TLS verification switched
off (including Go's `InsecureSkipVerify`), `eval`, an SVG served inline
unsanitised, and a secret from a non-cryptographic source or folded onto an
alphabet with a biased `%`. Comments and strings are stripped before matching,
or the notes explaining a fix would trip the check enforcing it, and every check
was confirmed to FAIL on the mistake before being kept.

It found one immediately: the selector guard rejected `$where` and nothing else,
but `$where` stopped being the only way a find filter runs JavaScript in MongoDB
4.4 - `$expr` with `$function`, and `$accumulator`, do the same through the same
client-supplied selector. Both are rejected now. A release entry that had
shipped with no test at all - the two Admin Panel / Problems database bugs -
gets one too.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.85 2026-08-12 WeKan ® release

**In short:** one fix, and it is to the **browser console** rather than to
anything a user sees. Firefox logged a warning for every **Font Awesome** glyph
whose stored bounding box was tighter than its own outline, on every page load -
**819 of 2163 glyphs** across the four font files - which buried anything else
worth reading there. The boxes are recomputed, with a script to redo it after a
font upgrade and a guard so the warnings cannot come back unnoticed. The
binaries below are carried over from v10.83 and have NOT been checked against a
newer build; `releases/provenance-table.sh` prints the real table from the
provenance each build job records.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-amd64) | v1.49.0 | `7c74941ff043f26aa4411ef5065d6b2d0766e369fc2a4458364c2f5571c12762` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-arm64) | v1.49.0 | `092132531555a39eac12566240a5f1ed02f62148b2dca0540a74c68e5957f6b5` |
| armhf | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armhf) | v24.19.0 | `b55350f3071b765a98ed66fdc410657ff168a937935057077fd7ab33cb30b9aa` |
| armhf | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armhf) | v1.49.0 | `144404fb9793dc8e039874812f4e2cb3e6d8b1df0ffdbe50254e7790a342a2f4` |
| armv6 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armv6) | v24.19.0 | `128ded0cda638c1f144eadb23ad249889515df017d298fd49c8faf3db110f0f1` |
| armv6 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armv6) | v1.49.0 | `7c27b2c15448709a24eace9b3c951c62fbe33413f7d20d56cb5520f4436efe2d` |
| armv7 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armv7) | v24.19.0 | `8dbe0a9aa8550ad5275c5538ebf868eb2037f0c4d9cccbe319f63b7e5854cd45` |
| armv7 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armhf) | v1.49.0 | `144404fb9793dc8e039874812f4e2cb3e6d8b1df0ffdbe50254e7790a342a2f4` |
| i386 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-i386) | v24.19.0 | `3b0b3bbfe27daf583b3a0f432efacc508407a012cdd9e8847250e7c015565bac` |
| i386 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-i386) | v1.49.0 | `1f70cb1687411b2a0fa9ac3b5bfc8c4ed9ce25ec2ddfa17e6fd3efb38136a39c` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-mac-arm64) | v1.49.0 | `576364db59dfce3ba564b9a3e484496eb57f95d76d2007b9f83241acdbd2f4fa` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-mac-amd64) | v1.49.0 | `37d70cd90aad6d3867b6686507ff1888f1edf6791818c31d014d130e8f39fc14` |
| ppc64le | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-ppc64le.tar.xz) | v24.19.0 | `c510c6ce12f07010f771e6edb22a3fe23f4f2e6f40b1ffd4941aed0646a0d8b3` |
| ppc64le | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-ppc64le) | v1.49.0 | `7c61d4853d5163ad8761449d693fd458ebbb8611a2351c718014876242c5b1fb` |
| riscv64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-riscv64.tar.xz) | v24.19.0 | `cd1f14af2812148002f58b58a5f9af512a50e3b8e8c148e0db44019dcb68edfd` |
| riscv64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-riscv64) | v1.49.0 | `bd4912da70f5e6c1475ab989668c76b4ab7db4ee06c44357693df64f5e1d0e0b` |
| s390x | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-s390x.tar.xz) | v24.19.0 | `a4792e65962ffa0af42627aacf1122a60c3c88dbf4e4184f06820d66f9da8ba4` |
| s390x | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-s390x) | v1.49.0 | *no checksum published* |
| win-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-arm64.zip) | v24.19.0 | `8502f4a50b458d4cc38ed8f2001556c2cd239d464920f74017926ccb1e1c157f` |
| win-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-win-arm64.exe) | v1.49.0 | `792166623e774b0af2aced31ed3ae39f545ca5268dc4c2b8d1a329228ff52cbc` |
| win64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip) | v24.19.0 | `57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73` |
| win64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-win64.exe) | v1.49.0 | `f42c50aa84095a9616b00f27a584c66b7bf79e3b109450c62a5f146ba3c85478` |

This release fixes the following bug:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f368c1a2a">Font Awesome: state the bounding box each glyph actually has</a>. Thanks to xet7.</summary>

Firefox logged one warning per glyph, on every page load, for every Font Awesome
file WeKan serves:

    downloadable font: glyf: Glyph bbox was incorrect; adjusting (glyph 19)
    (font-family: "Font Awesome 6 Free" ...) source: .../fa-regular-400.woff2

819 of the 2163 glyphs were affected - 540 in `fa-solid-900`, 204 in
`fa-brands-400`, 59 in `fa-regular-400`, 16 in `fa-v4compatibility` - so the
console filled with hundreds of lines and stopped being useful for spotting
anything else.

Every TrueType glyph stores its own bounding box in the `glyf` table. Font
Awesome ships boxes that are TIGHTER than the outline: they bound the on-curve
points only, while the box has to bound the control points too, because a
quadratic curve can bulge past its endpoints. Firefox's OpenType sanitiser
notices, corrects each box in memory and says so. Nothing rendered wrongly - the
warning was the whole of the damage - but the numbers in the file were wrong,
and they are wrong upstream, in Font Awesome's own build.

`releases/fix-font-bboxes.py` recomputes them, and writes the `.ttf` and the
`.woff2` from one corrected font so the pair cannot drift. Only `head` and
`hhea` differ from what Font Awesome shipped, and both follow from the boxes;
every other table compiles identically, which the script verifies by reading
back what it wrote. It keeps Font Awesome's own `head.modified`, so two runs
over the same input agree byte for byte rather than churning a committed binary.

`tests/fontGlyphBounds.test.cjs` parses the fonts with its own reader rather
than the tool that wrote them, and that guard matters more than the fix: these
fonts are VENDORED, so the next Font Awesome upgrade drops fresh upstream files
straight back into the tree and the warnings would return silently, months from
anything that would explain them. The failure message names the script to
re-run.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.84 2026-08-12 WeKan ® release

**In short:** one fix, to the **snap**, and it is a fix to the previous
release's fix. The guard v10.82 added so an out-of-date FerretDB copy could not
be served had the opposite failure of the bug it fixed: it decided which copy
was newer by comparing MongoDB's file timestamps against the migration marker,
and STARTING mongod rewrites those files - so a single service start during a
refresh made a frozen MongoDB look newer than the **FerretDB that had been live
for two weeks**, and the snap was switched onto the frozen one. It now asks the
question of BOTH copies, and when both have been written to since the migration
it switches nothing and says so, because a timestamp says when a file was
touched and not how much is in it. Below that, the three newest interface
strings are translated into **133 languages**. The binaries below are carried
over from v10.83 and have NOT yet been checked against this release's own build;
`releases/provenance-table.sh` prints the real table from the provenance each
build job records, and it heads this release's GitHub release notes.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-amd64) | v1.49.0 | `7c74941ff043f26aa4411ef5065d6b2d0766e369fc2a4458364c2f5571c12762` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-arm64) | v1.49.0 | `092132531555a39eac12566240a5f1ed02f62148b2dca0540a74c68e5957f6b5` |
| armhf | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armhf) | v24.19.0 | `b55350f3071b765a98ed66fdc410657ff168a937935057077fd7ab33cb30b9aa` |
| armhf | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armhf) | v1.49.0 | `144404fb9793dc8e039874812f4e2cb3e6d8b1df0ffdbe50254e7790a342a2f4` |
| armv6 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armv6) | v24.19.0 | `128ded0cda638c1f144eadb23ad249889515df017d298fd49c8faf3db110f0f1` |
| armv6 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armv6) | v1.49.0 | `7c27b2c15448709a24eace9b3c951c62fbe33413f7d20d56cb5520f4436efe2d` |
| armv7 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armv7) | v24.19.0 | `8dbe0a9aa8550ad5275c5538ebf868eb2037f0c4d9cccbe319f63b7e5854cd45` |
| armv7 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armhf) | v1.49.0 | `144404fb9793dc8e039874812f4e2cb3e6d8b1df0ffdbe50254e7790a342a2f4` |
| i386 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-i386) | v24.19.0 | `3b0b3bbfe27daf583b3a0f432efacc508407a012cdd9e8847250e7c015565bac` |
| i386 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-i386) | v1.49.0 | `1f70cb1687411b2a0fa9ac3b5bfc8c4ed9ce25ec2ddfa17e6fd3efb38136a39c` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-mac-arm64) | v1.49.0 | `576364db59dfce3ba564b9a3e484496eb57f95d76d2007b9f83241acdbd2f4fa` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-mac-amd64) | v1.49.0 | `37d70cd90aad6d3867b6686507ff1888f1edf6791818c31d014d130e8f39fc14` |
| ppc64le | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-ppc64le.tar.xz) | v24.19.0 | `c510c6ce12f07010f771e6edb22a3fe23f4f2e6f40b1ffd4941aed0646a0d8b3` |
| ppc64le | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-ppc64le) | v1.49.0 | `7c61d4853d5163ad8761449d693fd458ebbb8611a2351c718014876242c5b1fb` |
| riscv64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-riscv64.tar.xz) | v24.19.0 | `cd1f14af2812148002f58b58a5f9af512a50e3b8e8c148e0db44019dcb68edfd` |
| riscv64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-riscv64) | v1.49.0 | `bd4912da70f5e6c1475ab989668c76b4ab7db4ee06c44357693df64f5e1d0e0b` |
| s390x | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-s390x.tar.xz) | v24.19.0 | `a4792e65962ffa0af42627aacf1122a60c3c88dbf4e4184f06820d66f9da8ba4` |
| s390x | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-s390x) | v1.49.0 | *no checksum published* |
| win-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-arm64.zip) | v24.19.0 | `8502f4a50b458d4cc38ed8f2001556c2cd239d464920f74017926ccb1e1c157f` |
| win-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-win-arm64.exe) | v1.49.0 | `792166623e774b0af2aced31ed3ae39f545ca5268dc4c2b8d1a329228ff52cbc` |
| win64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip) | v24.19.0 | `57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73` |
| win64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-win64.exe) | v1.49.0 | `f42c50aa84095a9616b00f27a584c66b7bf79e3b109450c62a5f146ba3c85478` |

This release fixes the following bug:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1993d7d3c">Snap: a started mongod is not a used mongod, so stop calling the live copy stale</a>. Thanks to lukechao, markusst1982 and xet7.</summary>

The staleness guard added for
[#6583](https://github.com/wekan/wekan/issues/6583) had the opposite failure of
the bug it fixed:

> A couple of weeks ago, I did a snap revert ... but then completed the
> migration successfully. Today, my database suddenly reverted to an old version
> from what looks like weeks ago. Upgrading to 10.83 did not fix the problem
> automatically.

Their FerretDB was the live database and had been for two weeks; MongoDB was the
frozen one. The guard decided otherwise because it compared exactly two things:
the newest mtime under the MongoDB data directory, and the migration marker.
Starting `mongod` rewrites those files - recovery, and the checkpoint it writes
on startup - so one service start during a refresh put MongoDB's newest mtime at
today against a marker from two weeks ago. The guard called the live copy stale,
`wekan-control` set `database=mongodb`, and what came up was the data as it
stood on the day of the migration. Upgrading could not help, because the upgrade
was the cause: this runs at every start, so every start re-applied it.

An mtime cannot tell *somebody used this database* from *this database was
started*, so asking it of one copy cannot answer the question. Asking it of both
can, because the case the guard exists for has a shape the mistaken one does
not. The migrated copy untouched since the migration while MongoDB moved on is
STALE - nothing has been using FerretDB. The migrated copy moved on while
MongoDB did not is CURRENT, the normal state after a successful switch. Both
moved on is AMBIGUOUS: two databases have been written to since they were copies
of each other, and there is no answer there, only a choice, and it is the
admin's.

Only the first may be acted on automatically. The ambiguous case switches
nothing, prints both databases' last-written times and the two commands to look
at each, and says that nothing was changed or deleted - both copies live in
`$SNAP_COMMON`, which `snap revert` does not roll back. That restraint matters
most in the branch of `mongodb-control` that DELETES `files/db` to migrate again
when `mongod` cannot start at all: on ambiguity the SQLite holds work of its
own, so wiping it would destroy the very copy in doubt.

The message has no `database=ferretdb` condition on it, deliberately. An
instance the old guard already moved to `database=mongodb` is sitting on the
wrong copy now and that setting persists, so speaking up only when FerretDB is
selected would leave it there silently. Whichever side is selected, the admin
hears that the other one holds writes of its own.

`tests/ferretdbMigrationStale.test.cjs` gains the reported regression - a
two-week-old migration, a FerretDB written to a minute ago, a `mongod` started
an hour ago - and pins that ambiguity can never reach the deletion.

</details>

and improves the translations:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/639214574">The three new Version-pane and checklist strings, in 133 languages</a>. Thanks to xet7.</summary>

`invalid-year`, `collapse-checklist` and `expand-checklist` shipped in
`en.i18n.json` with the card-date fix and the collapsible checklists; every
other language file carried them as English placeholders. Translated directly,
as `CLAUDE.md` requires - no external translation service, API or key - from
each language's OWN existing strings, so the wording matches what that file
already says rather than being invented beside it.

Three anchors did most of the work. `checklist` and `collapse` / `uncollapse`
give each language its established terms, and `invalid-domain` is the same shape
of sentence as the new one - a rejection, then an instruction with an example -
so its phrasing, punctuation and register carried over directly.

Where an anchor was itself wrong the correct term was used instead of copying
the mistake forward. Several files have terms that drifted in from another
language: Italian *Non collassare* in the Greek and Romanian files, Russian in
the Georgian and Mongolian ones, Vietnamese in the Thai one, Serbian in the
Slovenian and Bulgarian ones. Others use a literal sense of "collapse" that is
not the UI one - Azerbaijani *Yıxılma*, Estonian *Kokkupõrge*, Khmer *ដួលរលំ*
and Chinese *崩溃* are structural collapse, a building falling down. The new
strings use the folding sense each language actually uses for this control.

Nine languages are deliberately left as English placeholders rather than guessed
at: Klingon, Volapük, Tamazight, Walloon, Wolof, Uzbek in Arabic script, and the
three `ve` files, whose contents disagree with their own locale tags - `ve-CC`
reads as Venetian and `ve-PP` as Veps, so which language to write is a question
about the file, not about the string. A placeholder says "nobody has translated
this yet", which is true; a fabrication would say something false in a shipped
product.

Applied with `fill-translations.mjs --apply`, which writes ONLY into
placeholders: every language reported *filled 3, skipped 0 existing human
translation(s)*, so no human translation was touched. Key order and the 2-space
indent are preserved, all 154 files still parse, and
`verify-human-preference.mjs` passes 10/10.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.83 2026-08-11 WeKan ® release

**In short:** a **CRITICAL SECURITY ISSUE**, **PassBleed**: the single-card
Excel export authorised against the board named in the URL and then read the
card named in the URL, with nothing tying the two together. Any authenticated
user could create their own public board, name it as the board, and export any
card from any private board on the instance - including the bytes of its image
attachments. The identically shaped PDF route had always resolved its card
correctly, which is what showed this was an omission rather than a decision, and
it is what the Excel exporter now does. It also fixes **broken avatar images**,
seen after upgrading from v6 but never actually working: the route that serves
them asked `Meteor.userId()`, which throws in a plain HTTP handler rather than
answering "nobody", and the handler turned that into a 500 - and, once that was
fixed, that the same route had always ignored the `boardId` the client appends
so a **public board** can show its members' pictures to visitors.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-amd64) | v1.49.0 | `7c74941ff043f26aa4411ef5065d6b2d0766e369fc2a4458364c2f5571c12762` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-arm64) | v1.49.0 | `092132531555a39eac12566240a5f1ed02f62148b2dca0540a74c68e5957f6b5` |
| armhf | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armhf) | v24.19.0 | `b55350f3071b765a98ed66fdc410657ff168a937935057077fd7ab33cb30b9aa` |
| armhf | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armhf) | v1.49.0 | `144404fb9793dc8e039874812f4e2cb3e6d8b1df0ffdbe50254e7790a342a2f4` |
| armv6 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armv6) | v24.19.0 | `128ded0cda638c1f144eadb23ad249889515df017d298fd49c8faf3db110f0f1` |
| armv6 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armv6) | v1.49.0 | `7c27b2c15448709a24eace9b3c951c62fbe33413f7d20d56cb5520f4436efe2d` |
| armv7 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-armv7) | v24.19.0 | `8dbe0a9aa8550ad5275c5538ebf868eb2037f0c4d9cccbe319f63b7e5854cd45` |
| armv7 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-armhf) | v1.49.0 | `144404fb9793dc8e039874812f4e2cb3e6d8b1df0ffdbe50254e7790a342a2f4` |
| i386 | Node.js | [wekan/node-patches](https://github.com/wekan/node-patches/releases/download/v24.19.0/node-i386) | v24.19.0 | `3b0b3bbfe27daf583b3a0f432efacc508407a012cdd9e8847250e7c015565bac` |
| i386 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-i386) | v1.49.0 | `1f70cb1687411b2a0fa9ac3b5bfc8c4ed9ce25ec2ddfa17e6fd3efb38136a39c` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-mac-arm64) | v1.49.0 | `576364db59dfce3ba564b9a3e484496eb57f95d76d2007b9f83241acdbd2f4fa` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-mac-amd64) | v1.49.0 | `37d70cd90aad6d3867b6686507ff1888f1edf6791818c31d014d130e8f39fc14` |
| ppc64le | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-ppc64le.tar.xz) | v24.19.0 | `c510c6ce12f07010f771e6edb22a3fe23f4f2e6f40b1ffd4941aed0646a0d8b3` |
| ppc64le | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-ppc64le) | v1.49.0 | `7c61d4853d5163ad8761449d693fd458ebbb8611a2351c718014876242c5b1fb` |
| riscv64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-riscv64.tar.xz) | v24.19.0 | `cd1f14af2812148002f58b58a5f9af512a50e3b8e8c148e0db44019dcb68edfd` |
| riscv64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-riscv64) | v1.49.0 | `bd4912da70f5e6c1475ab989668c76b4ab7db4ee06c44357693df64f5e1d0e0b` |
| s390x | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-s390x.tar.xz) | v24.19.0 | `a4792e65962ffa0af42627aacf1122a60c3c88dbf4e4184f06820d66f9da8ba4` |
| s390x | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-s390x) | v1.49.0 | *no checksum published* |
| win-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-arm64.zip) | v24.19.0 | `8502f4a50b458d4cc38ed8f2001556c2cd239d464920f74017926ccb1e1c157f` |
| win-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-win-arm64.exe) | v1.49.0 | `792166623e774b0af2aced31ed3ae39f545ca5268dc4c2b8d1a329228ff52cbc` |
| win64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip) | v24.19.0 | `57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73` |
| win64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.49.0/ferretdb-win64.exe) | v1.49.0 | `f42c50aa84095a9616b00f27a584c66b7bf79e3b109450c62a5f146ba3c85478` |

This release fixes the following CRITICAL SECURITY ISSUE of
[PassBleed](https://wekan.fi/hall-of-fame/passbleed/):

**The single-card Excel export** - which card it is allowed to read.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5269d0ba5">PassBleed: the export authorised against one board and read a card from another</a>. Thanks to TWPaMWang and xet7.</summary>

[PassBleed](https://wekan.fi/hall-of-fame/passbleed/) -
[GHSA-6p5m-f9p2-wqm5](https://github.com/wekan/wekan/security/advisories/GHSA-6p5m-f9p2-wqm5),
Moderate, CWE-639, CVSS 6.5. `GET
/api/boards/:boardId/lists/:listId/cards/:cardId/exportExcel` checked whether
the caller could see the board in `:boardId`, then resolved the card by
`:cardId` alone. Nothing confirmed that the card was on that board, so the two
identifiers came apart: one decided the authorisation, the other decided the
data.

The pass is self-service. `POST /api/boards` takes `permission` straight from
the request body, so any authenticated user could mint their own PUBLIC board,
name it as `:boardId`, and pass the id of a card in somebody else's private
board as `:cardId`. `:listId` was never used in a query at all and could be any
string.

What came back was the card: title, full description, members and assignees,
every comment with its author, checklists and checklist items, subtask titles,
attachment metadata - and, because image attachments are read through
`getReadStream()` and embedded with `workbook.addImage`, the attachment BYTES.
The same board could be reused while `:cardId` was substituted, which made it a
scriptable bulk read rather than a single disclosure. The REST API is on by
default in the shipped Docker configuration.

The fix was already in the codebase one file away: the identically shaped PDF
route has always resolved `getCard({ _id, boardId, listId })` and 404s a
cross-board id. That control is what shows the Excel exporter's omission was a
defect rather than a decision, and it is what the Excel exporter now does.
Constraining the QUERY matters more than a check after it - the exporter fans
out on the same card id for checklists, subtasks, comments and attachments, none
of which carry a board constraint of their own, so a card that cannot resolve
outside the authorised board makes all of them safe by construction.

The route binds the two identifiers as well, before either branch builds -
deliberate duplication, because that is where both arrive together and it covers
the public-board branch, which skips authentication entirely. A card that is not
on the named board is a 404 rather than a 403, so the difference does not reveal
whether a card id exists.

</details>

and fixes the following bugs:

**Avatars** - the routes that serve a profile picture, and who they serve it to.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bf047d53c">Ask the request who it is, because Meteor.userId() cannot</a>. Thanks to markusst1982 and xet7.</summary>

Following the same upgrade as [#6583](https://github.com/wekan/wekan/issues/6583),
profile pictures came back as broken images - initials rendered fine, and the
Admin Panel showed a user's picture while a board showed the missing-picture
icon for the same person.

Nothing was lost, and the migration is not at fault. The avatar files migrate,
and the Meteor-Files record made from a CollectionFS filerecord even reuses its
`_id`, so a 6.x URL still names the right object. What broke is the request for
it. A 6.x install stores `profile.avatarUrl` as `/cfs/files/avatars/<id>`; that
route serves the legacy bytes if they are still there and otherwise redirects to
`/cdn/storage/avatars/<id>`, which asked who was asking with `Meteor.userId()`.

That reads the current DDP invocation's environment, which exists inside a
method or a publication and NOT in a WebApp handler - where it does not return
"nobody", it THROWS. The handler wraps its body in a `try`/`catch` that answers
500, so the throw was swallowed into a broken image, and no avatar served
through that route ever reached anybody on any install. The upgrade did not
cause it; it moved every avatar URL onto the route where it already applied.
`server/routes/legacyAttachments.js` had the identical call, so legacy
attachment URLs failed the same way.

An HTTP request carries its identity in the request: a bearer token, an
`X-Auth-Token` header, an `?authToken=` parameter, or the login cookie - and on
Sandstorm, a platform-injected user id and no Meteor token at all.
`server/routes/universalFileServer.js` has always resolved it that way and
serves attachments correctly today. `server/lib/requestUser.js` lifts that
resolution out so the two routes that were guessing share it rather than grow a
third copy. It never throws: a caller deciding whether to serve a file wants an
answer, not an exception its own `catch` will turn back into a 500.

`tests/requestUserAuth.test.cjs` pins that neither route calls
`Meteor.userId()`, that both `await` the resolver - an unawaited Promise is
truthy and would authorise everybody - that all four token carriers and the
Sandstorm path are handled, and that the migration still reuses the id the old
URL names. Confirming the served image needs an upgraded instance.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/484eae736">Honour the boardId parameter the client has been sending all along</a>. Thanks to markusst1982 and xet7.</summary>

Found while checking why the Admin Panel showed a picture that a board did not.
The two URLs differ in one thing: the `avatarUrl` helper in
`client/components/users/userAvatar.js` appends `?boardId=<id>`, and says why in
its own comment - *"so public viewers can access avatars on public boards"*. The
Admin Panel uses `profile.avatarUrl` raw.

`/cdn/storage/avatars/:fileName` never read that parameter. It required a
signed-in user and nothing else, so on a public board every visitor who was not
logged in got a 401 and the missing-picture icon - the exact case the parameter
was added for. Fixing `Meteor.userId()` alone would have left that half broken.

The named board must now exist, be public, AND have the avatar's owner as a
member. The last part is not ceremony: without it, naming any public board would
unlock any avatar on the instance, and a public board publishes its own members,
not everybody.

The legacy redirect keeps the query string too. `/cfs/files/avatars/<id>` 301s
to `/cdn/storage/avatars/<id>`, and that is the path EVERY migrated 6.x avatar
URL takes, so dropping `?boardId=` there would 401 exactly the installs the
entry above sets out to fix.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.82 2026-08-11 WeKan ® release

**In short:** a **CRITICAL SECURITY ISSUE**, **WhereBleed**: eight Admin Panel
handlers took a query selector from the client and checked only its type, so a
`$where` in one made the database run the caller's JavaScript - a repeatable
denial of service, reachable by a per-tenant admin. The detector for it was
already in the codebase and wired into one publication; the eight siblings never
called it, and now share the one copy. Then **the snap**, where two permanent
markers meant an instance that had failed on an older revision never retried on
the fixed one, so the MongoDB 4.2 reader added for it never ran.
**Notifications** grew an unbounded array inside the user document that SQLite
was rewriting on every addition, which is the slow login and the pinned CPU.
**Clicking an open card** closes it again, and a focused Admin Panel checkbox is
no longer drawn as a diamond. It also adds the first new feature in this
release: **checklists and card feature groups fold away**, on the opened card
and on the minicard, asked for since 2018. Below that: a typed two-digit year
refused rather than stored as the year 26, the **Helm chart index** listing only
charts that can be installed, and a way to remove the Templates containers made
for accounts that never used them. And two developer-facing fixes: the
database-conformance stage no longer opens a debug port nothing in it uses - one
taken by an unrelated FerretDB made every backend report a database problem that
was not one - and two more snap give-up paths that deleted the directory their
own stage filter names. The binaries below are v10.81's: nothing here rebuilds
them.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-amd64) | v1.48.0 | `2737687fd29a8a761cd960e45f300b68cf7b4a87d50c4cc5280bcbd42b6aa163` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-arm64) | v1.48.0 | `5ae705dd49515a4ecd4e295c3b9aa4f3b454fad78613ec60fb99316bd7c34e3f` |
| loong64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-loong64.tar.xz) | v24.19.0 | `c24f224726f2d785bd18a1fd09f5e6d1fecf0269928451a60c5da9eac8e92e68` |
| loong64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-loong64) | v1.48.0 | `06ec86263455a7b598d22a87df0e044ea73ab5a3b72e96ad12ebed03c1374ac2` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-mac-arm64) | v1.48.0 | `9b15f4c10e473cd0a2c4feb4cb43e18042bd60c7035ec66cab3cfbe13edaabab` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-mac-amd64) | v1.48.0 | `4e188246dfa33bccef4cdd86701bc498b037cb3e91f579ff0dccb93aa0ef03ad` |
| ppc64le | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-ppc64le.tar.xz) | v24.19.0 | `c510c6ce12f07010f771e6edb22a3fe23f4f2e6f40b1ffd4941aed0646a0d8b3` |
| ppc64le | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-ppc64le) | v1.48.0 | `0400cd6dfc3d10d987a0fe80d75baa86c03c19170770fa2e602c92d558c3cfa6` |
| riscv64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-riscv64.tar.xz) | v24.19.0 | `cd1f14af2812148002f58b58a5f9af512a50e3b8e8c148e0db44019dcb68edfd` |
| riscv64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-riscv64) | v1.48.0 | `d37c35af988670b9ed182b8c5966c06a06362f6c6ace6aebd93ccdfa32c9a26b` |
| s390x | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-s390x.tar.xz) | v24.19.0 | `a4792e65962ffa0af42627aacf1122a60c3c88dbf4e4184f06820d66f9da8ba4` |
| s390x | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-s390x) | v1.48.0 | `6c7d61fbb8c79b2e8733be8f71910f710e8c5cd25208c451bdc513c8313b0340` |
| win64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip) | v24.19.0 | `57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73` |
| win64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-win64.exe) | v1.48.0 | `ea57e1bcd153b51d2065ab01515b21ec05d8f615444c15603ab8158b8a661dd2` |

This release fixes the following CRITICAL SECURITY ISSUE of
[WhereBleed](https://wekan.fi/hall-of-fame/wherebleed/):

**The Admin Panel's People, Org, Team and Translation panes** - what a query
from the client is allowed to be.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b4ebe48d7">WhereBleed: eight Admin Panel handlers ran the caller's selector unchecked</a>. Thanks to TungNGo02 and xet7.</summary>

[WhereBleed](https://wekan.fi/hall-of-fame/wherebleed/) -
[GHSA-phm4-4v26-j2vq](https://github.com/wekan/wekan/security/advisories/GHSA-phm4-4v26-j2vq),
Moderate, CWE-943, CVSS 5.8. The people, org, team and translation publications
and their companion count/page methods take a query selector from the client and
validate only its TYPE - `check(query, Match.OneOf(Object, null))` - which is
not validation, because a MongoDB selector is executable data. `$where` makes
the database run the caller's JavaScript once per document scanned, so
`Meteor.subscribe('team', { $where: 'while(true){}' }, 25, 0)` pins a database
worker for as long as the caller likes, repeatably: denial of service for every
tenant on the instance from one narrowly-scoped account.

The reporter demonstrated both halves on v10.81 against a real MongoDB 7:
`$where: 'sleep(2000) || true'` made the subscription take 2.03s and return the
document, `$where: 'false'` returned nothing in 0.00s - the caller deciding, in
JavaScript, which documents come back.

It needs an authenticated admin session, so no board member or visitor can reach
it. It matters at this severity because the people and org surfaces are open to
a **per-tenant Global Admin**, a role meant to be confined to one Organization,
and those two wrap the caller's selector as `{ $and: [query, restriction] }`
rather than stripping execution operators out of it - so merging the tenant
restriction never removed the `$where`, and a role scoped to one tenant reached
instance-wide impact.

What makes this one particular is that **the defence was already in the
codebase**. `classifySelector` and `hasWhere` were written for exactly this
class, are unit-tested, and were wired into the card-window publication. Eight
sibling handlers taking the identical shape of selector simply never called
them. So the fix adds no new detection logic: that publication's own helper
moves unchanged into a shared module and all nine call sites use the one copy -
a second copy would be the same bug set up to happen again.

Each handler refuses with the "match nothing" selector the card window already
uses in production, `{ _id: { $in: [] } }`, so a refused request returns an
empty result instead of throwing at an admin mid-page. Ordinary behaviour is
untouched: none of the searches, filters, regexes,
`$or`/`$and`/`$in`/`$elemMatch` or date ranges those panes send carries an
execution operator.

FerretDB, WeKan's default database, rejects `$where` itself, so this degrades to
a rejected query there; the supported MongoDB path is where it was reproduced.
MongoDB 7 also happens to reject `$where` inside the aggregation pipeline the
count methods use - but that is an engine accident for one operator on one call
path, so those methods are guarded like the rest rather than left to it.

</details>

and adds the following new feature:

**Cards** - folding away what you are not reading.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1cef5ede9">Checklists and card feature groups collapse, on the opened card and on the minicard</a>. Thanks to czinkos, MikeRatcliffe, JannetGen and xet7.</summary>

Asked for in 2018: "It would be great to have collapsable checklists on cards",
and again this week - "Long checklists can make a card pretty cluttered, so
being able to collapse them and expand only when needed would keep the board
much cleaner."

WeKan had something adjacent and it was not this. A checklist carries
`hideAllChecklistItems`, reachable through a toggle switch inside the checklist
actions popup - but that is a field ON THE CHECKLIST, so flipping it changes
what everyone on the board sees, and it is an edit to the card rather than a
view preference. It is untouched; it has its own uses.

Collapsing is per-user, which WeKan already says twice in its own models for
lists and swimlanes, so this follows them: one map in the user profile keyed by
card. A feature group uses its own section name, an individual checklist uses a
key of its own - which is why folding a checklist on the opened card folds it on
the minicard too.

The control is a caret on the title rather than another entry in a menu, since
the point is to fold at a glance while reading the card. It carries
aria-expanded and answers Enter and Space. For the sixteen feature groups on the
opened card it is done once, with a delegated handler and CSS: they all open
with a title but only three wrap what follows in a content element, so folding
hides every sibling after the title, which works whatever a section puts there.

A checklist's progress bar stays visible when folded - it is the summary of what
was folded away - and the fold survives reopening the card.

</details>

and fixes the following bugs:

**The snap, upgrading from an old MongoDB** - and why a fixed version changed
nothing. 
<details>
<summary><a href="https://github.com/wekan/wekan/commit/097ad9160">A new snap revision is a new chance, so the MongoDB 4.2 reader actually gets to run</a>. Thanks to Philippe-Bentegeac, JDeepix, imlit and xet7.</summary>

Reported against 10.81: "I still have the exact same issue, MongoDB cannot
start. The web interface is still unreachable, and I do not see the messages you
added in the last commits." The messages were missing because the code that
prints them never ran.

Two markers in `$SNAP_COMMON` stop the snap doing work, and both were PERMANENT.
`.mongodb-data-too-old` is written when no reader in the snap could open the
data, after which mongod is not started at all; `.mongod-start-failures` is a
counter that, past three, stops the migration being re-run so a migration/mongod
restart loop cannot form. Both are right, and both record a conclusion about
what THAT snap could do.

An instance that had already failed on 10.79 or 10.80 - before mongod 4.2 was
bundled - carried a marker saying "no reader can open this" and a counter far
past three. So 10.81 never started mongod, never attempted the migration, and
printed nothing new. Upgrading to the version with the fix changed nothing,
which is exactly what their log shows: the database-selection line, then
"Waiting for MongoDB replica set primary..." forever.

Each marker now records the revision that wrote it, and one from a different
revision is ignored and cleared - a marker with no revision recorded at all is
stale by definition, which is precisely what the affected instances carry.
Within one revision nothing changes, so the loop protection still holds; and not
knowing the revision is never taken as evidence that it changed.

</details>

**Notifications** - and the database write behind a slow login.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/184e1713d">The notification tray is capped, so SQLite is not rewriting an ever-growing array</a>. Thanks to Nissulya and xet7.</summary>

An instance reports FerretDB at 737% CPU, logins over a minute, boards not
appearing, and logs full of `database is locked (5) (SQLITE_BUSY)`. The stack
names the same write every time: `addNotification`.

That is an `$addToSet` on `profile.notifications`, an array inside the user
document - so adding one entry reads the whole document, scans the array and
writes the document back, at a cost proportional to the array. FerretDB on
SQLite has a single writer, so those rewrites queue and start failing, and
login, which also writes to the user document, queues behind them.

It grows without limit because the existing cleanup only removes notifications
that have been READ. A user who never clears their tray accumulates entries
forever. The same pass now also keeps the newest
`NOTIFICATION_TRAY_MAX_PER_USER` (default 1000) and drops the rest. It is
applied to what is left after the expiry pull, a user needing no change is not
written to at all, and it stays one write per user. This bounds the array; it
does not make SQLite a multi-writer engine, and a busy instance still wants the
PostgreSQL backend.

</details>

**Cards and the Admin Panel** - two things people asked for in the same thread.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6420819cf">Clicking an open card closes it, and a focused checkbox is not drawn as a diamond</a>. Thanks to csonkaoszimt, Heart1010 and xet7.</summary>

Closing a card by clicking it again was not a missing feature - it was an
unreachable one. The handler already ended with a branch that closed the open
card, but the TITLE branch above it returned first, and a minicard's title
covers most of the minicard. So the second click almost always re-opened the
card that was already open, and the toggle worked only if you managed to miss
the title. The title branch now makes the same decision, and on a phone, where
the card is a popup, the second click closes that.

The Problems page glitch in the screenshot is the focus ring. The Admin Panel
draws its checkboxes as a square that morphs into a tick, and the tick IS a
40-degree rotation of the element - so a browser draws its focus ring around a
rotated box, and a checkbox that is both checked and focused (which is what one
you just clicked is) comes out as a blue diamond. The ring moves to the row that
contains it, which is not rotated; keyboard focus stays visible.

</details>

**Card dates** - what a typed date actually becomes.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c5cb99b7">A typed two-digit year is refused instead of stored as the year 26</a>. Thanks to xet7.</summary>

From email feedback: "If i write the expiration date with the keyboard it turns
red, if i choose it with the date picker it is yellow. Can you please tell me
the difference?" The colour was never the difference - the YEAR was.

`<input type="date">` reports its value as YYYY-MM-DD, but a browser lets the
year sub-field be typed as two digits and reports exactly that: entering
31-12-26 gives "0026-12-31", the year 26 AD. That is a valid Date, so nothing
refused it, and the card was saved with a due date two thousand years in the
past. Red is what an overdue date looks like. The attached screenshot shows it:
the yellow badges read "31-12-2026" and the red ones "31-12-26".

Saving now refuses a year outside 1000-9999 and says which digits are missing.
It refuses rather than silently correcting 0026 to 2026, because that would be a
guess about a date other people's reminders hang off.

</details>

**Old template containers** - the boards nobody asked for.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/80f551872">Remove the Templates containers that were made for accounts which never used them</a>. Thanks to xet7.</summary>

From email feedback: FerretDB at 190-350% CPU on an instance with 14490 boards,
of which 13404 are template containers, for 9264 accounts of which 478 have ever
logged in.

Before v10.00 every new account got a "Templates" container board at signup
whether or not the person ever saved a template. v10.00 made that lazy
(\#2339, \#5850), so no new account creates one - but nothing removed the ones
already made, and they are not visible enough for anybody to delete by hand. On
that instance they are 13x the boards collection, and every query that touches
boards carries it.

Because this deletes boards, the rule for what may go is narrow: only a
container nobody ever used. A template saved into it, a list, swimlane or card,
a second member, a rename, a star or a manual archive all keep it, and every
board that is kept reports why. A rename is judged only against the titles the
app itself used, so a container whose default name is in another language is not
deleted for it. The default is a dry run showing what WOULD go; deleting takes a
second, explicit request.

</details>

**The snap database** - which copy of the data it serves.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b1e7b1e53">A FerretDB copy older than the MongoDB beside it is never served</a>. Thanks to markusst1982 and xet7.</summary>

After upgrading from v6 the reporter saw *"the state of the data from days ago"*
and suspected a `snap revert` done four weeks earlier. They were right about the
cause, and nothing was lost.

The MongoDB to FerretDB migration copies MongoDB into SQLite **once** and writes
`.migration-to-ferretdb-done`. That copy is a snapshot; nothing keeps it in
step. Revert the snap to a revision that runs `mongod` and WeKan carries on
writing to MongoDB - for four weeks here - while the finished SQLite sits frozen
at the date it was made. Refresh forward again and the snap saw a marker plus a
non-empty SQLite, called that a completed migration and switched onto it. Every
board and card written during the revert was still on disk and simply not being
served.

The data was never in danger: it lives in `$SNAP_COMMON`, which is shared across
revisions and is **not** rolled back by a revert (unlike `$SNAP_DATA`, which is
per-revision). What was wrong was *which* of the two copies got served, and
nothing compared their ages.

A new check answers exactly that: `mongod` rewrites its WiredTiger files on
every commit, so the newest mtime among them is when MongoDB was last written
to, and later than the marker means the copy is behind. It counts data files
only - a newer `mongodb.log` means the snap was started, not that the database
changed - and allows a margin, because the migration stops its own temporary
source `mongod` moments after writing the marker. Anything it cannot tell is
reported as NOT stale, since the callers act on a yes.

Where `mongod` runs, the snap now stays on MongoDB, which has the newest data.
Where `mongod` cannot start at all - the case that forces the migration in the
first place - it migrates again from scratch rather than serve the old copy; the
migration reads with its own temporary `mongod` and the 4.2/3.2 readers, so it
still reaches everything written since. And `wekan-control` gains the second
half of a guard it already had: it refused to start an *empty* FerretDB while
MongoDB had data, and a *full but out-of-date* one looks worse, because WeKan
comes up with everything present except the last weeks.

</details>

**Board and card drag** - what scrolls while a card is held.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8456170d4">Dragging a card down scrolls the list, not the whole board</a>. Thanks to markusst1982 and xet7.</summary>

*"Upwards is no problem, the Line scrolls automaticly up, but this does not work
downwards. The whole Page/Site scrolls down and not ne Line"*.

The card drag auto-scrolls at the edges. Horizontally it picks the lane under
the pointer ([#443](https://github.com/wekan/wekan/issues/443)); vertically it picked
nothing, and always scrolled `.board-canvas` - which holds the swimlanes -
rather than the `.list-body` under the pointer, which is `overflow-y: scroll`
and holds the cards. Scrolling the canvas moves the whole board.

The asymmetry is what makes it reproducible. Dragging **up**, the canvas is
usually already at the top, so the handler did nothing and jQuery UI's own
scroll option - which acts on the placeholder's scroll parent, the list body -
scrolled the list, which is why up always worked. Dragging **down**, the canvas
nearly always has room left, so the handler fired first and scrolled the board
instead.

The list under the pointer is scrolled first now, and the board only once that
list cannot go further - so a drag down a long list scrolls the list, and a drag
past the end of it moves on to the board, which is what dragging a card into
another swimlane needs.

</details>

**The Helm chart index** - which charts it lists.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a442959dd">List only the charts whose container images still exist</a>. Thanks to xet7.</summary>

Backfilling the index taught this within the hour: Artifact Hub scans every
entry and mailed a list of errors.

```
error scanning image ghcr.io/wekan/wekan:v9.62: image not found error scanning
image docker.io/bitnami/mongodb:7.0.14-debian-12-r3: image not found
```

That was this side's doing. The rebuild listed every package on gh-pages, and a
chart is a POINTER TO CONTAINER IMAGES - one whose images have been deleted
installs and then fails at the pull, so listing it says the repository is broken
when the repository is fine and the images are gone. 135 of the 360 packages are
in that state, from two unrelated causes: **six WeKan images were never pushed**
(v8.30, v9.12, v9.14, v9.38, v9.39, v9.62 - releases whose own docker job
failed, and exactly the six Artifact Hub named), and **129 older charts vendor
the Bitnami mongodb subchart** and pin tags Bitnami has since deleted. Charts
from 8.41 on vendor groundhog2k's mongodb, which uses the official `mongo` image
and is unaffected.

The index now holds 225 entries: every one of the 216 that were listed before -
none dropped - plus the 9 backfilled packages whose images all resolve. The
exclusions are recorded in `unindexed.txt` beside the packages, not decided per
run, so a rebuild during a release cannot depend on reaching two registries, and
an image that comes back is one deleted line away from being listed again. The
`.tgz` files stay, so direct URLs keep working.

Two things this shook out. `--check-images` asks each registry with ITS OWN 401
challenge instead of a hard-coded token URL per host - the first attempt
reported every quay.io image as missing, including `quay.io/wekan/wekan:latest`,
which plainly exists. And an image that cannot be checked is never treated as
missing, only a definite 404, so a registry hiccup cannot silently unpublish
charts. `release-charts.sh` now refuses to publish a chart at all when
`ghcr.io/wekan/wekan:v<version>` does not exist, which is what created these six
in the first place.

</details>

and has the following developer-facing fixes:

**The test run** - a stage that failed for a reason that was not about WeKan.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/09a525ae8">The database-conformance run no longer opens a debug port nothing in it uses</a>. Thanks to xet7.</summary>

Every backend of the conformance stage failed before a single query was
compared: "Failed to create debug handler ... listen tcp 127.0.0.1:8088: bind:
address already in use", then "FerretDB did not start on this backend" for each
of them.

FerretDB opens a debug handler for metrics and profiling at 127.0.0.1:8088 by
default and EXITS when that address is taken, so an unrelated FerretDB running
on the machine made the whole stage report a database problem that was nothing
of the sort - as it would for anyone with anything on that port.

The script already takes this seriously for the two ports it knows about: it
picks a free wire port, makes both overridable, and says in its own comment that
they are chosen so it can run while something else is running. The debug port
was simply never passed. Nothing in the run queries it, so it is not opened at
all - which is also what FerretDB's own integration tests effectively do,
choosing a random debug port rather than the default.

</details>

**The snap build** - the part that could end it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b6d0be0f4">Two more mongo42 give-up paths deleted the directory their stage filter names</a>. Thanks to xet7.</summary>

The earlier fix for this covered one of the three ways the mongo42 part gives up
- the unsupported-architecture exit. The other two removed the whole staged
directory and exited 0, which leaves `stage: mongo42` naming a path that is not
there, and snapcraft ends the build on that rather than skipping it.

Those two are reached on amd64 and arm64, where the binary IS downloaded:
OpenSSL 1.1 unavailable for the architecture, or the staged mongod 4.2 failing
the check that it actually runs. Either would have ended the snap build for the
two architectures that matter most, the same way it ended all four Launchpad
ones. Both now clear the CONTENTS and keep the directory; an empty one still
means "no 4.2 reader", because every use is guarded on the binary rather than
the directory.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.81 2026-08-11 WeKan ® release

**In short:** the release pipeline, and two bugs that stopped WeKan starting at
all. **FerretDB** advertises its own listen address as the member list of a
one-node replica set, so the MongoDB driver threw away the host in `MONGO_URL`
and dialled `0.0.0.0:27017` instead - a fresh `docker compose up` could not
reach its database, and every FerretDB compose file now says
`directConnection=true`. **All Boards on a phone** could not be scrolled to its
last boards, its Table view could not be scrolled at all, single rows of board
icons were drawn several times their proper height, and the icons sat too close
together - four separate causes, one of them a `calc(100dvh - 48px)` in
`layouts.css` that guessed at a header height which is measured at runtime
precisely because it is never one number. On the release side: the **Mac x64
bundle** has never once been built, because its runner label was retired by
GitHub and a retired label queues forever instead of failing - and cancelling
that queue is what silently skipped the **charts**, **ucs** and **nextcloud**
jobs. The **armv6 bundle** was being assembled in a soft-float ARMv5 userland
that its own hard-float Node.js cannot start in, and **every Launchpad snap**
was ended by an optional MongoDB-migration part that stages a path it does not
build outside amd64 and arm64. Below that: a report of the WeKan releases the
Helm chart index is missing, and the duplicate entries found in it. The
binaries below are v10.80's: nothing here rebuilds them.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-amd64) | v1.48.0 | `2737687fd29a8a761cd960e45f300b68cf7b4a87d50c4cc5280bcbd42b6aa163` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-arm64) | v1.48.0 | `5ae705dd49515a4ecd4e295c3b9aa4f3b454fad78613ec60fb99316bd7c34e3f` |
| loong64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-loong64.tar.xz) | v24.19.0 | `c24f224726f2d785bd18a1fd09f5e6d1fecf0269928451a60c5da9eac8e92e68` |
| loong64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-loong64) | v1.48.0 | `06ec86263455a7b598d22a87df0e044ea73ab5a3b72e96ad12ebed03c1374ac2` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-mac-arm64) | v1.48.0 | `9b15f4c10e473cd0a2c4feb4cb43e18042bd60c7035ec66cab3cfbe13edaabab` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-mac-amd64) | v1.48.0 | `4e188246dfa33bccef4cdd86701bc498b037cb3e91f579ff0dccb93aa0ef03ad` |
| ppc64le | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-ppc64le.tar.xz) | v24.19.0 | `c510c6ce12f07010f771e6edb22a3fe23f4f2e6f40b1ffd4941aed0646a0d8b3` |
| ppc64le | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-ppc64le) | v1.48.0 | `0400cd6dfc3d10d987a0fe80d75baa86c03c19170770fa2e602c92d558c3cfa6` |
| riscv64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-riscv64.tar.xz) | v24.19.0 | `cd1f14af2812148002f58b58a5f9af512a50e3b8e8c148e0db44019dcb68edfd` |
| riscv64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-riscv64) | v1.48.0 | `d37c35af988670b9ed182b8c5966c06a06362f6c6ace6aebd93ccdfa32c9a26b` |
| s390x | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-s390x.tar.xz) | v24.19.0 | `a4792e65962ffa0af42627aacf1122a60c3c88dbf4e4184f06820d66f9da8ba4` |
| s390x | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-s390x) | v1.48.0 | `6c7d61fbb8c79b2e8733be8f71910f710e8c5cd25208c451bdc513c8313b0340` |
| win64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip) | v24.19.0 | `57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73` |
| win64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-win64.exe) | v1.48.0 | `ea57e1bcd153b51d2065ab01515b21ec05d8f615444c15603ab8158b8a661dd2` |

This release fixes the following bugs:

**FerretDB** - the default database, and how WeKan is told to reach it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e1c6221f2">Connect with directConnection=true, so a fresh docker compose up starts</a>. Thanks to Dandrass and xet7.</summary>

A new install with nothing changed but the port and `ROOT_URL` could not reach
the database:

```
MongoServerSelectionError: connect ECONNREFUSED 0.0.0.0:27017
reason: TopologyDescription { type: 'ReplicaSetNoPrimary',
        servers: Map(1) { '0.0.0.0:27017' => [ServerDescription] },
        setName: 'rs0', ... }
```

`0.0.0.0` is in no compose file. It is FerretDB's own listen address, and the
driver was handed it by the server. The `ferretdb` service runs with
`--repl-set-name=rs0` - added in
[#6480](https://github.com/wekan/wekan/issues/6480) so Meteor can tail an OpLog
instead of poll-and-diff - so FerretDB answers the `hello` handshake as a
one-member replica set and fills `hosts`, `me` and `primary` with its
`--listen-addr`. A driver not in direct-connection mode reads that as an
invitation to do replica-set discovery: it adopts the advertised member list and
drops the seed it was given, because the server reports a name other than the
one that was dialled. `mongodb://ferretdb:27017` became `0.0.0.0:27017`, which
inside the `wekan-app` container is that container itself.

Measured against FerretDB v1.49.0 with the driver the bundle ships:
without the parameter the topology ends up `ReplicaSetWithPrimary` with the seed
discarded, with it the topology is `Single` on the host that was given.
It costs nothing else - the handshake still reports `setName: rs0`, the only
thing Meteor checks before it will tail an OpLog. All five FerretDB v1 compose
files carry it; the MongoDB ones deliberately do not, being real replica sets
whose members are reachable under the names they advertise.

</details>

**All Boards on a phone** - the scroll, the tiles and the spacing between them.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c0a5c2b7c">The board list scrolls to its last board, the Table view scrolls at all, and the tiles are their own size</a>. Thanks to mimZD and xet7.</summary>

Four things at once, in an issue reopened against 10.10, 10.37, 10.38, 10.72 and
10.77.

THE SCROLL. Every earlier fix removed viewport arithmetic from `boardsList.css`.
The last piece of it was in `layouts.css`:
`body.mobile-mode #content { height: calc(100dvh - 48px) }`. 48px is a guess at
the height of the header, and the header is not 48px and is not any one number -
`--wekan-header-height` is published from a `ResizeObserver` for exactly this
reason. On a phone whose bar wraps, `#content` was taller than the room under
the header, its bottom sat below the screen, and `body.mobile-mode` is
`position: fixed` and `overflow: hidden`, so that strip is unreachable. Nothing
needs computing: `body` is a flex column of one viewport and `#content` is its
`flex: 1` item.

THE TABLE VIEW. The right column has two branches - the board icons and
`+tablePage` - and only the icons were ever given a scroller, so in Table view
the rows past the fold were clipped with nothing to scroll.

THE 4x-TALL TILES. A grid defaults to `align-content: stretch`, so a list
shorter than its column has the leftover height divided among its rows and each
tile grown into it - and a board tile paints its colour over the whole cell.
This was fixed once, but only on `.board-list.mobile-view`; the phone media
query builds a grid too, and a narrow window that is not a mini screen took
that path.

THE SPACING. An 8px grid gap plus a `margin-bottom: 0.5rem` per tile: 16px
between rows and 8px between columns, which reads as crowded sideways. One value
now, in both directions. The mobile full-screen popup had the same class of bug
as the first and states `dvh` now too. Desktop is unaffected.

</details>

and fixes the following release-pipeline failures:

**The release workflow** - which jobs run, and on what.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7b8c37709">The retired Mac runner, the jobs a cancellation skipped, and the armv6 userland</a>. Thanks to xet7.</summary>

`build-mac-x64` asked for `macos-13`, and GitHub has retired that image -
`actions/runner-images` publishes macos-14, macos-15 and macos-26 only. A
retired label does not fail: the job QUEUES, for a runner that is never coming.
It has been sitting there every release until cancelled by hand, and no WeKan
release has ever carried a `wekan-<version>-mac-x64.zip` because of it. Intel
macOS was renamed, not removed: `macos-15-intel`, which is what TSC already
builds on.

Cancelling it is what skipped `charts`, `ucs` and `nextcloud`: a cancelled job
cancels the run, and a cancelling run skips every job that has not started - so
all three were skipped the second the `docker` job they wait on succeeded, after
everything had already shipped. A job whose `if` is `always()` still runs while
a run is cancelling, so the three now say `always()` and name the needs that
must have succeeded.

The armv6 bundle died on
`qemu-arm: Could not open '/lib/ld-linux-armhf.so.3'`. Debian has no ARMv6 port
- `debian:trixie` publishes arm/v5 and arm/v7 - and containerd treats a lower
ARM variant as compatible, so `--platform linux/arm/v6` quietly resolved to
arm/v5: Debian armel, soft-float, with no hard-float loader in it. The preflight
compared the architecture and ignored the variant, so it never said so; it
compares both now, and armv6 is built in Debian's arm/v7 container, which is
armhf and runs node-armv6 fine. Nothing ARMv7 reaches the bundle - the container
compiles nothing, and node, FerretDB and the MongoDB tools are all downloaded
already built for ARMv6 - except the bundled qemu-user, which is copied out of
the container and is therefore skipped for that one bundle.

</details>

**The snap** - what the four Launchpad architectures were really failing on.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/18da0d261">An optional part was ending every Launchpad build</a>. Thanks to xet7.</summary>

armhf, s390x, ppc64el and riscv64 all failed, three attempts each, and the job
reported it as a Launchpad problem: "often an OOM in the Meteor npm install, or
a transient build-farm reset; re-run". It was neither. The build log said the
same deterministic thing every time:

```
Staging mongo42
Failed to copy '/build/.../parts/mongo42/install/mongo42': no such file or
directory. Build failed
```

The `mongo42` part downloads MongoDB 4.2 so a database from an old MongoDB snap
can still be migrated ([#6471](https://github.com/wekan/wekan/issues/6471)), and
MongoDB publishes 4.2 for amd64 and arm64 only. Everywhere else the part prints
"nothing to migrate from there; skipping" and exits 0 having created nothing -
its own comment calls that optional by design. It was not: the part also carries
`stage: [mongo42]`, and snapcraft does not skip a filter whose path is missing,
it ends the build. So a migration helper no exotic architecture has ever needed
took the whole snap down on exactly the four that can only be built on
Launchpad. The directory is created before anything can decide to skip; the
binary is still downloaded only where it exists.

riscv64 additionally lost its last attempt to `npm ERR! code ECONNRESET` on one
tarball, after half an hour of building - every request there goes through
Launchpad's proxy - so that `npm install` is retried three times. The
`::error::` no longer guesses: it sends the reader to the build log printed
above it.

</details>

and improves the release tooling:

**The Helm chart index** - which WeKan releases it lists.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8248892e3">Report the releases the chart index is missing, and repair its duplicates</a>. Thanks to xet7.</summary>

A chart entry is written once, during the release it belongs to, so a release
whose `charts` job did not run leaves a hole nothing ever fills. Counted against
the live index: 216 of 690 WeKan releases have a chart entry.

`releases/backfill-charts.sh` answers which releases the index should list - the
ones that exist and can be installed. 216 are kept (never repackaged; that would
change a digest helm clients have seen), 369 could be built, and 162 are OMITTED
because they have no container image on ghcr: a chart is a pointer to an image,
so an entry for one of those is an install that fails at the pull. The index is
rebuilt from the packages actually present, so omission needs no bookkeeping.

It also found something already wrong: the published index has four entries for
9.36.0 and two for 10.30.0, each with a different digest and the same url,
because the release script prepends an entry every time it runs. At most one of
those digests can be the one of the package really served, and a helm client
that picks another fails the integrity check on a good file. The rebuild keeps
the entry whose digest matches the package, falling back to the newest only when
there is no package to compare against. Nothing is written without `--apply` and
nothing is pushed without `--push`; the charts job runs it in plan mode only,
into the run summary.

</details>

- [The chart-index report is a Release menu entry in build.sh and build.bat](https://github.com/wekan/wekan/commit/01f691ba3). Thanks to xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1a2ec0633">Rebuild the Helm index.yaml from the chart packages it actually serves</a>. Thanks to xet7.</summary>

With the charts repository cloned it became clear the index had drifted from its
own packages in four ways at once, all from the same habit: an entry was written
by COPYING the previous entry and substituting a few fields, so the index was
being kept as the record rather than as a description of the `.tgz` files beside
it.

**146 packages had no entry at all** - 362 packages, 220 entries. They are
downloadable by URL but invisible to `helm search`, to
`helm install wekan --version 9.63.0` and to Artifact Hub. **9.36.0 had four
entries and 10.30.0 two**, each copy with a different digest and the same url,
so a client could pick a digest matching no file and fail integrity on a good
package. **appVersion was the CHART version on every entry** - `10.79.0` where
the package says `10.79`, which is the WeKan version a reader is looking for.
And **every entry claimed the mongodb subchart was 0.7.2**, a field nobody
substituted, while the packages had long since moved to 0.7.6.

`releases/reindex-charts.py` derives the index from the packages, reading each
one's `Chart.yaml` out of the archive, so an entry cannot describe a package
wrongly. Nothing is invented: `created` is preserved exactly on every entry
whose digest matches its package, and a package being added takes the date
it was committed to `gh-pages`, which is when it was really published. Two 2023
packaging slips - `wekan-1.2.7.tgz` containing chart 1.2.6, and `wekan-6.96.tgz`
containing 6.9.6 - are reported and left out rather than making one version mean
two files; both files stay on the server.

The index went from 220 entries to 360, and was checked after writing: no
repeated version, every digest equal to the sha256 of its file, every file
present, and no version that was listed before missing.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a434bb4bd">Both release workflows publish the chart, and the index is derived rather than edited</a>. Thanks to xet7.</summary>

The charts repository keeps the chart SOURCE on `main` and the published
packages plus `index.yaml` on `gh-pages`, and its own two scripts move between
them: `release.sh` commits the source, tars `wekan/` into
`wekan-<version>.0.tgz`, checks out gh-pages and drops the package there;
`release2.sh` commits and pushes. `release-charts.sh` drives both and owns the
index in between - and that middle part is what changes here.

**The index is now rebuilt from the packages** instead of being edited. It used
to copy the newest entry, substitute a few fields and prepend the result, and
all four of the index's defects came from exactly that. Deriving it makes them
impossible rather than fixed: one entry per package, digest computed from the
file, fields read out of the archive, and any package that was missed picked up
on the next run.

**The package is checked against its own filename before it is indexed.**
`release.sh` names the tarball from its argument while the version INSIDE comes
from the `Chart.yaml` that was just edited, so when those drift the repository
gains a file called one version that declares another - which is how
`wekan-1.2.7.tgz` (containing 1.2.6) and `wekan-6.96.tgz` (containing 6.9.6)
came to exist. Both are now removed, and a package like them stops the release
with a message instead of being published.

**Release All Missing publishes a chart too.** It could rebuild any missing
bundle but not a missing chart, so a release that never got one never would -
its header even said the charts were out of scope. It has a charts job now,
guarded twice: nothing happens without a token that can push to wekan/charts,
and nothing happens if the chart for that version is already published, because
re-publishing would re-tar the package and change the digest of a chart people
have already pulled.

</details>


Thanks to above GitHub users for their contributions and translators for their translations.

# v10.80 2026-08-10 WeKan ® release

**In short:** the **Admin Panel**, in the two panes v10.79 had just changed.
**Version** is one table again rather than five: five tables sized their columns
independently, so the values started at a different x in every category. The
categories are rows inside one table now - bold, spanning both columns - over
two equal 50% columns. **Problems / Filesystem integrity** drew a blank page:
the one piece of its wiring that was missing was a template helper, and Blaze
reads an undefined helper as false rather than complaining. The binaries below
are v10.79's: nothing here rebuilds them.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-amd64) | v1.48.0 | `2737687fd29a8a761cd960e45f300b68cf7b4a87d50c4cc5280bcbd42b6aa163` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-arm64) | v1.48.0 | `5ae705dd49515a4ecd4e295c3b9aa4f3b454fad78613ec60fb99316bd7c34e3f` |
| loong64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-loong64.tar.xz) | v24.19.0 | `c24f224726f2d785bd18a1fd09f5e6d1fecf0269928451a60c5da9eac8e92e68` |
| loong64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-loong64) | v1.48.0 | `06ec86263455a7b598d22a87df0e044ea73ab5a3b72e96ad12ebed03c1374ac2` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-mac-arm64) | v1.48.0 | `9b15f4c10e473cd0a2c4feb4cb43e18042bd60c7035ec66cab3cfbe13edaabab` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-mac-amd64) | v1.48.0 | `4e188246dfa33bccef4cdd86701bc498b037cb3e91f579ff0dccb93aa0ef03ad` |
| ppc64le | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-ppc64le.tar.xz) | v24.19.0 | `c510c6ce12f07010f771e6edb22a3fe23f4f2e6f40b1ffd4941aed0646a0d8b3` |
| ppc64le | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-ppc64le) | v1.48.0 | `0400cd6dfc3d10d987a0fe80d75baa86c03c19170770fa2e602c92d558c3cfa6` |
| riscv64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-riscv64.tar.xz) | v24.19.0 | `cd1f14af2812148002f58b58a5f9af512a50e3b8e8c148e0db44019dcb68edfd` |
| riscv64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-riscv64) | v1.48.0 | `d37c35af988670b9ed182b8c5966c06a06362f6c6ace6aebd93ccdfa32c9a26b` |
| s390x | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-s390x.tar.xz) | v24.19.0 | `a4792e65962ffa0af42627aacf1122a60c3c88dbf4e4184f06820d66f9da8ba4` |
| s390x | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-s390x) | v1.48.0 | `6c7d61fbb8c79b2e8733be8f71910f710e8c5cd25208c451bdc513c8313b0340` |
| win64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip) | v24.19.0 | `57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73` |
| win64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-win64.exe) | v1.48.0 | `ea57e1bcd153b51d2065ab01515b21ec05d8f615444c15603ab8158b8a661dd2` |

This release reorganises the Admin Panel:

**Admin Panel / Settings** - the Version pane, and how it lays itself out.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aed26c677">Version is one table with combined category rows, over two 50% columns</a>. Thanks to xet7.</summary>

The pane arrived at v10.79 as five tables, one per category. Five tables size
their columns independently: "WeKan ® Version" made the first one's label column
wide and "OS Type" made the next one's narrow, so the values started at a
different x in every group and the pane read as five unrelated things.

One table now, and each category is a **row** in it — a `th` with `colspan=2`,
bold and start-aligned, so it says what the rows under it are about instead of
being a label with an empty cell beside it. A `colgroup` of two 50% columns plus
`table-layout: fixed` puts every label and every value in the same place down
the whole pane; the 240px header cap the other admin tables carry is undone for
this one, since its width is now stated outright and the cap would fight it.

The category title keeps the table's own font size deliberately: at the pane
title's size, five of them would read as five pane titles and "Version" would
be lost among them.

Two of the repository's own guards caught mistakes on the way, which is what
they are for. The jade compile check refused `th(colspan=2)` — the Meteor jade
dialect wants the value quoted, and an unquoted one is a build failure rather
than a rendering difference — and the RTL check refused `text-align: left`,
because the label column is on the RIGHT in Arabic and Hebrew, so it is
`start`.

</details>

and fixes the following bugs:

**Admin Panel / Problems** - a pane that drew nothing, and said nothing about
it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/01c36852d">Problems / Filesystem integrity showed a blank page</a>. Thanks to xet7.</summary>

The pane drew its title and then empty space, while Summary went on reporting
*"7 new problems"* for it.

Everything about it looked right, which is why it survived: the menu has a
`report-integrity` entry, clicking it is handled, the handler sets
`tmpl.showIntegrity`, and the template has `else if showIntegrity.get` with an
integrity event stream under it. The missing piece was the **helper**.
`showIntegrity()` was never added beside `showDatabase()` and the eight others,
and in Blaze **an undefined helper is not an error — it is falsy**. So the
branch never ran, the page was blank, and nothing anywhere said why.

The guard added with it is the class rather than this one pane: every
`show*.get` branch in a settings template must have a helper of that name in
that template's own `.js`, and a `ReactiveVar` behind it. The templates are
FOUND rather than listed, so a pane added later is covered without editing the
test.

</details>

**The snap** - what it does when it cannot read the database it was upgraded
onto.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/562fa0271">A database this snap cannot read stops and says so, instead of serving 502 forever</a>. Thanks to Philippe-Bentegeac, JDeepix, imlit and xet7.</summary>

A snap upgraded onto a database left by a **MongoDB 4.x or 5.x** snap served 502
Bad Gateway indefinitely, with the reason only in `snap logs`:

```
This version of MongoDB is too recent to start up on the existing data files.
Try MongoDB 4.2 or earlier.
```

The snap carries **two** readers — mongod 7, the server it runs, and the MongoDB
3.2 tools for a 6.09-era database — and nothing in between, so 4.x data opens in
neither. What the code did then is the one thing that cannot work: the migration
found that neither reader could open it and handed back to `mongodb-control`,
which started mongod, which failed the same way, which re-ran the migration —
three times by its own counter — and then exited for snapd to restart. Nothing
in that loop can succeed, because reading those files needs a binary the snap
does not have.

**It stops now.** The migration tells "no reader for this vintage" from
"unreadable or corrupt" by mongod's own words, records the version mongod named
as still able to read the data, pauses auto-migration and exits **0** — zero,
because snapd restarts a failing service forever and no restart can help here.
`mongodb-control` will not start a mongod it knows cannot start, and WeKan
serves an explanatory page on the web port, both at startup and from inside the
database wait loop, so an instance already waiting switches over without a
restart.

The page names the MongoDB version that can still read the files and gives the
two ways forward — go back to the revision that worked, or dump with a MongoDB
that can read it and restore into this version — says plainly that **nothing was
changed** and that attachments and avatars are files on disk, and drops the
auto-refresh and the spinner the other two maintenance pages carry: this is a
stop, not a wait, and the page should not promise that something is happening.

Nothing is deleted or modified on this path: the source data is exactly as it
was, the marker file is the only thing written, and removing it lets the snap
try again. The snap documentation gains the section an admin searching for that
mongod line will find, with the commands.

The test covers the wiring in all three scripts and then RUNS the page — it is
standalone Node with no dependencies — to check what an admin actually sees:
503, the version, "untouched", both remedies, no refresh, no spinner.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/71ba0c2dc">A third MongoDB reader, so a 4.x database migrates instead of stopping</a>. Thanks to Philippe-Bentegeac, JDeepix, imlit and xet7.</summary>

The entry above stopped the crash loop and explained it. This removes the reason
for it in the case that was actually reported.

A MongoDB server only starts on data whose `featureCompatibilityVersion` is at
most one major behind it, so what the snap can READ is decided by which servers
it carries: mongod 7 (FCV 6.0, 7.0) and the MongoDB 3.2 tools (3.2). Everything
in between was unreadable — and the WeKan snap has shipped 3.6, 4.0, 4.2, 4.4
and 5.0 over the years. The reported error names the gap exactly: *"Try
MongoDB 4.2 or earlier"*, which is FCV 4.0.

**mongod 4.2 is now bundled as a third reader**, used only to read the old data
during a migration and never as the running database. It opens FCV 4.0 and 4.2,
and the modern importer reads it with the bundled driver, which supports servers
from 4.2 up — the same importer that reads a 6/7 source, not a second copy of
it. The probes run newest-first: 7, then 4.2, then the 3.2 tools, then the page.

**amd64 and arm64 only.** MongoDB publishes no 4.2 for the others, and they have
been FerretDB from their first boot, so there is nothing there to migrate from.

**It carries its own OpenSSL 1.1.** The 4.2 build links `libssl.so.1.1` and
`libcrypto.so.1.1`, and core24 is Ubuntu 24.04, which ships OpenSSL 3 — without
them the binary does not even load. Both come from one Debian `libssl1.1`
package, staged beside the binary and put on `LD_LIBRARY_PATH` exactly as the
3.2 tools already are, with the filename resolved by listing the pool rather
than pinned, because point releases roll and a pinned name 404s the day they
do.

Optional by design: every failure in that part — download, checksum, OpenSSL, or
the binary not running — ends it with a message and no binary, and the migration
simply does not find one. A release is never failed over a migration aid.

Verified as far as a machine without a snap allows: mongod 4.2.25 aarch64 was
downloaded, staged with the Debian libssl1.1 and RUN — *"db version v4.2.25,
OpenSSL version: OpenSSL 1.1.1w"* — then started on a dbpath, forked and
listened on a port. That is the whole mechanism, on a 2026 system. The build
repeats the check and unstages the binary if it fails.

Still unreadable, and still answered by the page rather than a migration: 3.4,
3.6, 4.4 and 5.0. Bundling mongod 5.0 beside this one would close 4.4 and 5.0
the same way, at the same cost in size.

</details>

and improves the translations:

**Translations** - the new strings, and the languages that keep the English
placeholder.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/132a64484">The Version pane's new strings, translated into 113 languages</a>. Thanks to xet7.</summary>

The pane's five category labels and the packaging row arrived in English only,
so every other language showed them in English. Three of the six needed
translating at all: **Platform**, **package** ("Package") and **OS**. `Database`
was already translated in 131 languages — the key existed before and this
revived it — and **Meteor** and **Node** are product names that stay as they
are in every language, which is also why the filler ignores a value equal to the
English source.

Translated directly, with no external service, using each language's own
existing strings as the reference. Its `OS_Type` and `OS_Platform` show the
form that language's translators use — *"Typ des Betriebssystems"*, *"Tipo
SO"*, *"Тип ОС"*, *"Käyttöjärjestelmän tyyppi"* — so OS is `Betriebssystem` in
German, `SO` in Italian and Portuguese, `ОС` in Russian and
`Käyttöjärjestelmä` in Finnish, rather than one spelling imposed on all of them.

Two files were deliberately NOT copied from: Greek's `OS_Type` and `OS_Platform`
hold Italian, and Korean's hold Japanese. Propagating that would have spread
somebody else's mistake into three more strings, so those two got proper Greek
and Korean instead.

Applied through `fill-translations.mjs --apply`, which writes **only** into a
placeholder, so no human translation could be overwritten even by accident — and
the diff shows it: 292 changed lines across 106 files, every one of them
`Platform`, `package` or `OS`. Key order and indentation are unchanged, every
file still parses, and `verify-human-preference.mjs` passes 10/10.

**40 files keep the English placeholder on purpose** — ace, ary, br, gu-IN, ig,
km, mn, oc, or_IN, pa, tk_TM, tlh, ug, ve, vl-SS, vo, wa, wo, xh, yi, yo, zgh,
zu and the `en-*` variants, which are English by design. A placeholder that
says so is better than a translation nobody can stand behind, and Transifex can
still replace any of them with a human one: nothing here is pushed there.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.79 2026-08-10 WeKan ® release

**In short:** two **new platforms** and the **snap** jobs. WeKan now builds a
**win-arm64** bundle - Windows on ARM - which needed no new work anywhere else,
because nodejs.org, FerretDB and the MongoDB tools all publish that
architecture already and nothing here had asked for it. **armv6** - Raspberry
Pi 1 and Zero - was the opposite: nobody publishes a Node.js for it any more,
so **wekan/node-patches** gained an armv6 target, and FerretDB and the MongoDB
tools gained `GOARM=6` ones beside their armhf builds. It ships as a bundle zip
and **no snap**, because the Snap Store has no armv6 architecture at all; the
**Docker** image is wired for it too, but stays gated until a base image
publishes `linux/arm/v6` — Debian has no ARMv6 port, and a request for one
silently resolves to soft-float armel rather than failing. (armv5
and armel still cannot be added at all: V8's accepted `--arm-arch` list stops at
armv6, so there is no Node.js to build.) On the snap
side, one thing had been quietly failing for months: **armhf** asked Caddy for
a `linux_armhf` archive that has never existed - Caddy is built by Go and its
assets carry Go's architecture names -
and **riscv64**, **ppc64el** and **s390x** each built a perfectly good snap that
the Snap Store then refused while processing it, with an error about its own
duplicate check; the upload is retried now, and the message no longer blames
credentials. Beside that, the **amd64** bundle had never recorded where its
Node.js and FerretDB came from - not because the directory was wrong, which was
last release's fix, but because the scripts themselves were never found, and the
`|| true` meant for release notes swallowed the error every run. Below that, the
**CPU platforms** of the image and of the snap now have a page each, and the
FerretDB v1 page lists every architecture its binary is built for. The binaries
in the table below are v10.78's: nothing here rebuilds them.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-amd64) | v1.48.0 | `2737687fd29a8a761cd960e45f300b68cf7b4a87d50c4cc5280bcbd42b6aa163` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-arm64) | v1.48.0 | `5ae705dd49515a4ecd4e295c3b9aa4f3b454fad78613ec60fb99316bd7c34e3f` |
| loong64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-loong64.tar.xz) | v24.19.0 | `c24f224726f2d785bd18a1fd09f5e6d1fecf0269928451a60c5da9eac8e92e68` |
| loong64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-loong64) | v1.48.0 | `06ec86263455a7b598d22a87df0e044ea73ab5a3b72e96ad12ebed03c1374ac2` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-mac-arm64) | v1.48.0 | `9b15f4c10e473cd0a2c4feb4cb43e18042bd60c7035ec66cab3cfbe13edaabab` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-mac-amd64) | v1.48.0 | `4e188246dfa33bccef4cdd86701bc498b037cb3e91f579ff0dccb93aa0ef03ad` |
| ppc64le | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-ppc64le.tar.xz) | v24.19.0 | `c510c6ce12f07010f771e6edb22a3fe23f4f2e6f40b1ffd4941aed0646a0d8b3` |
| ppc64le | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-ppc64le) | v1.48.0 | `0400cd6dfc3d10d987a0fe80d75baa86c03c19170770fa2e602c92d558c3cfa6` |
| riscv64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-riscv64.tar.xz) | v24.19.0 | `cd1f14af2812148002f58b58a5f9af512a50e3b8e8c148e0db44019dcb68edfd` |
| riscv64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-riscv64) | v1.48.0 | `d37c35af988670b9ed182b8c5966c06a06362f6c6ace6aebd93ccdfa32c9a26b` |
| s390x | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-s390x.tar.xz) | v24.19.0 | `a4792e65962ffa0af42627aacf1122a60c3c88dbf4e4184f06820d66f9da8ba4` |
| s390x | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-s390x) | v1.48.0 | `6c7d61fbb8c79b2e8733be8f71910f710e8c5cd25208c451bdc513c8313b0340` |
| win64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip) | v24.19.0 | `57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73` |
| win64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-win64.exe) | v1.48.0 | `ea57e1bcd153b51d2065ab01515b21ec05d8f615444c15603ab8158b8a661dd2` |

This release adds the following new features:

**Windows on ARM** - a bundle whose every binary was already published.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8bb7b9ba6">Build a win-arm64 bundle</a>. Thanks to xet7.</summary>

WeKan could always have shipped this and simply did not. All three suppliers
publish the architecture: nodejs.org builds `node-v24.19.0-win-arm64.zip`
itself, [wekan/FerretDB](https://github.com/wekan/FerretDB) publishes
`ferretdb-win-arm64.exe`, and
[wekan/mongo-tools-patches](https://github.com/wekan/mongo-tools-patches)
publishes every tool as `-win-arm64.exe`.

`releases/resolve-node-source.sh` gains the platform and resolves it to
nodejs.org with a published SHA256, so it needs no node-patches build at all.
The job is the win64 one with the architecture changed: it builds on the x64
Windows runner exactly as win32 does, because the Meteor bundle is JavaScript,
the native modules are installed with `--ignore-scripts` and are not compiled
for the runner's architecture either way, and the only architecture-specific
things in the zip are the three binaries above, which are downloaded rather
than built.

**What cannot be added, checked at the same time: armv5 and armel.** FerretDB
and the MongoDB tools publish `armel` - they are Go, and Go still targets it -
but **Node.js does not exist for either**, and it cannot be built either: V8's
accepted `--arm-arch` list stops at armv6. No Node.js means no bundle, so no
Docker image and no snap either. armv6 was checked in the same pass and looked
like the same answer - nodejs.org publishes no 32-bit ARM at all for v24.19.0
and unofficial-builds has no `armv6l` - but there the SUPPORT was still in the
source and only the build was missing, which is what the next entry does.

</details>

**Raspberry Pi 1 and Zero** - the platform whose Node.js had to be built first.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d9e4cd57c">Build an armv6 bundle</a>. Thanks to xet7.</summary>

Every piece of the chain exists now, and the piece that was missing was
Node.js. nodejs.org dropped its ARMv6 binaries after Node 11 and
unofficial-builds has none, so
[wekan/node-patches](https://github.com/wekan/node-patches) gained an armv6
target - V8 still accepts `--arm-arch=armv6` and `configure.py` still carries
`is_arch_armv6()` with `vfp` among its valid ARM FPUs, so only the build was
missing - and [wekan/FerretDB](https://github.com/wekan/FerretDB) and
[wekan/mongo-tools-patches](https://github.com/wekan/mongo-tools-patches)
gained `GOARM=6` targets beside their armhf ones.

Their `armel` is `GOARM=5` and WOULD run on these boards, which is exactly why
it looks like a substitute and is not one: `GOARM=5` does floating point in
software, and an ARMv6 board has VFPv2.

The bundle builds in a `linux/arm/v6` container and takes `node-armv6`, and
`releases/resolve-node-source.sh` resolves it - naming `linux-armv6l` as the
upstream spelling even though nothing upstream will ever answer to it, so the
search it prints is honest about where it looked.

**No snap, and that is not an oversight.** The Snap Store has no armv6
architecture at all - its only 32-bit ARM is `armhf`, which is ARMv7-A
hard-float and will not run on an ARMv6 board. So armv6 ships as a bundle zip
and a `linux/arm/v6` Docker image, and `models/lib/snapArchitectures.js`
records that reason in `NOT_SNAP_ARCHITECTURES` beside i386's and armv7's.

Four tests found the four places a new platform has to be registered, which is
what they are for: `releases/expected-assets.sh` (or "Release all missing"
never notices the asset is absent), the resolver's mapping table, the
non-native bundle list, and the snap-platform exemption. Each list was updated
rather than the guard loosened.

**What is not verified: none of these binaries has been built yet.** The
Node.js one is a multi-hour ARM cross compile and the first CI run is its test.
Everything checkable from source was checked - V8's accepted `--arm-arch`
values, `configure.py`'s ARM handling, Go's `GOARM` semantics, and that zlib's
ARM SIMD is gated on `arm_fpu == "neon"`, so an armv6 build selects the scalar
code by itself and needs none of the NEON patching armv7 does.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f342d54d1">The Docker image gains it as a candidate platform, gated on a base that publishes linux/arm/v6</a>. Thanks to xet7.</summary>

**`TARGETARCH` does not identify a 32-bit ARM platform.** `linux/arm/v6` and
`linux/arm/v7` both arrive in the `Dockerfile` as `TARGETARCH=arm`; the CPU
generation is in `TARGETVARIANT`. The architecture `case` mapped `arm` straight
to `armhf`, so the moment armv6 existed as a bundle, an ARMv6 build would have
been handed the armhf zip — ARMv7-A instructions for a CPU that cannot execute
them. It now branches on the variant: `v6` takes the `armv6` bundle, `v7` and an
unset variant take `armhf`, and anything else exits. `v5` is armel: FerretDB and
the MongoDB tools publish it, but Node.js does not exist for ARMv5, so there is
no bundle and refusing is the only honest answer.

`linux/arm/v6` is in the docker job's optional platform list beside the others,
and the release then asks a question it never asked before: **does the base
image publish this platform?** For every other architecture that question is
uninteresting, because a base that lacks one fails the build. For 32-bit ARM it
does not fail — containerd treats a **lower** ARM variant as compatible, so a
`linux/arm/v6` request against a base with `arm/v5` and `arm/v7` quietly
resolves to `arm/v5`, Debian **armel**, soft float. The image would build on a
userland whose loader cannot start the hard-float `node-armv6` inside the
bundle. A silent downgrade is worse than a dropped platform.

So the job reads the base name out of the `Dockerfile` — no second copy of it —
asks `docker buildx imagetools inspect` what that base publishes, and drops a
candidate it lacks with a warning saying why. Today `debian:trixie` is `386`,
`amd64`, `arm64/v8`, `arm/v5`, `arm/v7`, `ppc64le`, `riscv64`, `s390x`: **no
`arm/v6`**, because Debian has no ARMv6 port — its 32-bit ARM ports are armel
and armhf, and ARMv6 hard-float is Raspberry Pi OS territory. **The armv6
bundle zip is unaffected**, and that is how an ARMv6 board runs WeKan today; the
image platform is wired end to end and turns itself on the day a base publishes
the variant, with nothing else to change.

Checked against the real registry rather than assumed: `debian:trixie`'s
manifest list was read, and the decide step was run against both that list
(armv6 drops, the other seven build) and a base that does publish `arm/v6`
(armv6 is included, paired with the `armv6` bundle).
`tests/releaseDockerPlatforms.test.cjs` pins the variant split, the refusal of
`v5`, the platform-to-bundle pairing, and that both loops ask the base — the
last one so that "just delete the check" cannot quietly become an image whose
Node.js will not start.

</details>

and reorganises the Admin Panel:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dcc6c8fe5">Version is five tables with a heading each, and says what WeKan is installed as</a>. Thanks to xet7.</summary>

Admin Panel / Settings / Version was ONE table of 38 rows, in which the WeKan
version, the OS load average, the DDP transport and a V8 heap counter were the
same kind of thing: a flat list read top to bottom, with no way to jump to the
part you came for.

It is five tables now, each under a small heading, in the order somebody
debugging reads them — **Platform** (what this is), **OS** (what it runs on),
**Meteor** (how it talks to the client), **Database** and **Node**. Reactivity,
reactivity order and the DDP transport moved to Meteor, where they belong: they
are how the client is fed, and they were the rows most often read as database
settings. Whether an OpLog *exists* stays with the database, because that is a
property of it. Nothing was dropped — a test lists all 38 rows by name and
requires each to still be shown.

**The new row is what WeKan is installed as: `bundle.zip`, `Snap`, `Docker` or
`Sandstorm`.** It is the first thing a support answer turns on and the pane
never said it: the same version keeps its data somewhere else, carries a
different database and gives the admin different reach in each of the four.
The row's label is translated (`package`, "Package"); **the four values never
are**, and none of them is a translation key — they are the names of the things
themselves, not words describing them, so what an admin reads is the same string
they can put in an issue, search the docs for and grep a log with, in every
language.
`models/lib/platformPackaging.js` decides it most-specific-first — an explicit
`WEKAN_PACKAGING` wins, then Sandstorm, then snapd's own `SNAP`/`SNAP_NAME`,
then a container runtime's marker file, then the bundle. Sandstorm and Snap are
asked BEFORE the container markers on purpose: a grain **is** a container and a
confined snap can look like one, so the other order answers "Docker" for both.
It claims nothing it cannot know: there is no "source checkout" answer, because
a `meteor run` and an unpacked bundle are identical from inside the process.

The detection is a pure function — it takes the environment, the Sandstorm flag
and a file-exists callback — so all nine of its tests run in a sandbox with no
snap, no container and no grain: that an empty `SNAP` is not a snap, that an
empty `WEKAN_PACKAGING` falls through instead of blanking the field, and that an
unreadable filesystem root answers `bundle.zip` rather than throwing away an
admin's Version page.

The headings are deliberately smaller than the pane title above them, and a test
compares the two font sizes instead of trusting the CSS to stay that way: five
headings at the pane title's size read as five pane titles, and "Version" is
lost among them.

</details>


and fixes the following bugs:



**The snap builds** - what they download, and what the store does with the
result.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e9be22f9">Caddy has no armhf archive, and a store hiccup is not a bad snap</a>. Thanks to xet7.</summary>

Two failures in the v10.78 snap jobs, neither of them a problem with WeKan.

**armhf asked for a Caddy architecture that does not exist.** With the
`libcurl4t64` fix in, the armhf build got past the stage-packages and died
further along:

```
:: Downloading Caddy 2.11.4 (linux/armhf) from GitHub releases...
:: curl: (22) The requested URL returned error: 404
'override-build' in part 'caddy' failed with code 1.
```

Caddy is built by Go and its release assets carry **Go's** architecture names,
not Debian's. There is no `linux_armhf` archive and there never has been - the
32-bit ARM ones are `armv5`, `armv6` and `armv7` - and the case statement had no
armhf branch, so it fell through to a default that passed the Debian name
straight into the URL. The "fall back to the pinned version" path then retried
the same wrong name, so the failure read as *"Caddy stopped publishing this
architecture"* when it was this file's mapping all along.

armhf maps to `armv7`, not `armv6`: Debian armhf's baseline is ARMv7-A with
VFPv3-D16 hard-float, and Go's armv7 build is `GOARM=7`, which is exactly that.
This is **not** the armhf/armv7 distinction that matters for Node.js in
[wekan/node-patches](https://github.com/wekan/node-patches) - that one is about
NEON, and `GOARM=7` does not use NEON. Checked against the actual release: all
six mapped URLs answer and `linux_armhf` 404s. The default branch now names the
problem and stops, instead of guessing a name and letting a 404 blame the wrong
project.

**Three good snaps were lost to a store hiccup.** riscv64, ppc64el and s390x
each built on Launchpad, downloaded, and were then refused:

```
Status: error while processing
Issues while processing snap:
- binary_sha3_384: Error checking upload uniqueness.
```

That is the store failing its **own** duplicate check on a digest it had just
computed - a server-side error, not a bad snap - while the message the job
printed was about *"is not a valid file"*, credentials and ACLs, none of which
applied. The upload is retried three times with a backoff now, and the give-up
message says the snap is fine and nothing here needs changing. The retry stays
narrow on purpose: a rejected file, unparseable credentials or a missing ACL
will be rejected identically three times, and retrying those only buries the one
message that says what to fix - so the classifier is tested against all four,
not just the one that happened.

</details>

**The snap on the next base** - what `snapcraft-core26.yaml` builds.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/664b8fde6">The next base declares all six architectures too, armhf included</a>. Thanks to xet7.</summary>

`snapcraft.yaml` declares six platforms — amd64, arm64, armhf, ppc64el, riscv64,
s390x — and every one is built: two natively, four on Launchpad.
`snapcraft-core26.yaml` declared **five**. armhf was missing, and nothing could
notice: that file is not built by any release, it is the next base kept so the
move can be tested before it is made. The day core26 becomes the base, armhf
would simply stop being published, and the only symptom would be a store column
going stale — exactly as `wekan-ondra`'s armhf did at 0.22.

Adding the platform alone would have been nominal. The same file still carried
the **pre-t64** stage-package names — `libssl3`, `libcurl4`,
`libgoogle-perftools4` — and those are precisely what failed armhf on core24
twice: Ubuntu's 64-bit `time_t` transition renamed them, the 64-bit
architectures kept a compatibility `Provides` so the old spelling resolves
there, and armhf did not. armhf on core26 would have failed on the first thing
it tried, in the way this repository has already debugged. It has the t64 names
now, and its Caddy branch — which already mapped armhf to Go's `armv7` — no
longer claims to be unreachable.

Two guards, both checked in the failing direction as well: the two snapcraft
files must declare the SAME set of architectures, and the stage-package check
runs over BOTH files instead of only the one the release builds.

Nothing here changes what the release builds today. core24 stays the built base,
and `wekan`'s armhf snap is still waiting on the Caddy armhf fix above.

</details>

**The release notes** - what the provenance table can say about amd64.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e59680519">The amd64 provenance scripts were never found, only never complained</a>. Thanks to xet7.</summary>

The amd64 build failed with exit 127, after the bundle had been zipped and
checksummed:

```
a95d331b…  wekan-10.78-amd64.zip
bash: releases/record-provenance.sh: No such file or directory,
bash: releases/ferretdb-latest-tag.sh: No such file or directory,
```

The step runs `cd .build` first, so nothing relative in it means what it looks
like it means - and that is **two** bugs, of which only the second had ever been
visible. `bash releases/record-provenance.sh` resolves against `.build/`, which
has no `releases/`, so it had printed *"No such file or directory"* on every run
since it was written and the `|| true` on the end swallowed it. amd64 had
therefore never recorded any provenance at all, and the only symptom was its
absence from the table - so the missing-directory fix above repaired the half
that showed and left the half that did not.

What made it loud is that the FerretDB tag lookup added alongside it is an
**assignment**. Under `set -e`, and every GitHub `run:` is `bash -e`,
`VAR="$(cmd)"` ends the step when the command fails - so a line that had been
quietly doing nothing for months became a hard failure of the whole amd64 build.

Every path in that step is absolute now, and every `FERRET_TAG` assignment
across all seven sites ends `|| true`: the bundle is the deliverable, and which
version string reaches a markdown cell is not worth failing a good build for.
Only amd64's step `cd`s - the other six run from the workspace root, which is
exactly what the v10.77 run showed, since all six uploaded provenance and amd64
did not.

The guard added with it is the general form rather than this one line: it walks
back from every provenance call to its step header and requires an absolute path
whenever a `cd` runs inside that step.

</details>

and documents which CPU platforms each package is built for:
**The Docker image and the snap** - a page each for what they are built for.


<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ec9f3ae5">A page for the Docker image's CPU platforms, beside the one the snap already had</a>. Thanks to xet7.</summary>

"Which CPUs is this published for, and why not that one" was answerable for the
snap and nowhere else, so the same page now exists for the image:
`docs/Platforms/FOSS/Container/Docker/CPU-platforms.md`. It carries the
platform matrix with each platform's `TARGETARCH`, `TARGETVARIANT` and bundle,
how the set is decided on every release from what the base image publishes and
which bundles landed, the three names that differ between Docker, Debian and the
WeKan bundles, and one section per platform that is deliberately NOT an image:
loong64 (no base image exists at any tag), armv6 (gated on a base with
`arm/v6`), armv7 (the one 32-bit ARM slot must carry the armhf baseline) and the
Windows and macOS bundles. It ends with why the FerretDB image covers more
platforms than the WeKan one — `FROM scratch` around a static Go binary needs no
userland at all.

The snap's page gains the matching armv6 section — the Snap Store has no armv6
architecture, and its only 32-bit ARM is armhf, which an ARMv6 board cannot
run — and a table of all fifteen bundles against which six become snaps, so
"it is missing" and "it cannot be there" stop looking alike. The two pages link
each other, because the answer differs between them.

`docs/Databases/FerretDB/1/README.md` said the per-architecture FerretDB binary
was embedded in the bundles "for ppc64le, s390x, riscv64". Every bundle carries
one; those three are part of a longer list of platforms where it is the DEFAULT
because MongoDB publishes no server. It now lists all seventeen built binaries
and separates the three 32-bit ARM builds that are not variants of each other:
`armhf` is `GOARM=7`, `armv6` is `GOARM=6`, `armel` is `GOARM=5` software
floating point.

</details>


**The snap store** - what it actually holds, and what it cannot.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cf0c347b2">The snap page says what the store holds at 10.78, and why the empty squares differ</a>. Thanks to xet7.</summary>

The table of what each snap has was "as of 10.76" and marked every empty square
the same way: *built by snapcraft.yaml but that snap has no revision for it yet;
uploading one is all that is needed*. For eight of the twelve squares that is
not true, and it sends whoever reads it at the wrong job.

Three marks now, because there are three situations. `wekan`'s **armhf** is
BUILT by the release and missing from the store: snapcraft.yaml declares it,
`snap-launchpad` builds it, and it has been failing - most recently on Caddy,
which publishes no `linux_armhf` archive because its asset names are Go's.
The exotic squares of `wekan-ondra` and `wekan-gantt-gpl` are **not pending
uploads at all**: the `snap-variants` job has four matrix entries, each variant
on amd64 and arm64, and the ppc64el/s390x/riscv64/armhf builds come from
`snap-launchpad`, which builds only the `wekan` name. And `wekan-ondra`'s
armhf **0.22 is a fossil**: there is no newer revision to promote, and nothing
currently builds one.

riscv64 moved from missing to published since 10.76, so `wekan` is five of six.
Every published architecture is on all four channels, which is the
release-to-every-channel work holding.

</details>

and documents how to work on these repositories:

**CLAUDE.md and AGENTS.md** - who maintains them, what is in `.tools/`, and how
each repository's changelog is written.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/35dd10b89">They say who maintains these repositories and who commits, before any identity check</a>. Thanks to xet7.</summary>

Both files opened with an identity CHECK - *"maintainer mode only when the
identity is exactly Lauri Ojansivu"* - which says what to do with an identity
but never says whose repositories these are. They are xet7's: WeKan, the
FerretDB v1 fork, node-patches and mongo-tools-patches. That is now the first
thing both files say, and the commit author follows from it rather than from a
conditional.

Two rules are spelled out under it. **No commit, pull-request body or CHANGELOG
line ever attributes work to an AI** - no `Co-Authored-By`, no "Generated with",
no assistant or model name - and CODE_OF_CONDUCT.md is cited as where that comes
from: *"mention only those participants that are human"*. And **a missing or
wrong git identity in one of these checkouts is to be SET, not worked around**:
the `.tools/` clones can come up with no `user.name`/`user.email` at all -
mongo-tools-patches did - which would author a commit as whatever the machine's
default is.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d07794811">What is in .tools/, and the changelog format of every repository under it</a>. Thanks to xet7.</summary>

`.tools/` was one sentence naming three clones. It is now the two kinds of thing
that directory holds, because they are treated differently: **companion git
repositories** - wekan/FerretDB on `main-v1`, node-patches and
mongo-tools-patches on `main`, Secretchronicles/TSC on `devel`,
sandstorm-io/sandstorm - each with their own history, branches, changelog and
release flow, cloned on demand by `build.sh`'s `ensure_tool_repo`; and
**unpacked toolchains** that are downloads rather than repositories -
`node-v<version>-linux-<arch>`, `go` with its caches, `.meteor`, the TSC
AppImage - to be deleted and re-fetched freely.

**No CLAUDE.md or AGENTS.md under `.tools/`.** node-patches and
mongo-tools-patches each had a pair, and they were removed: the rules are
identical for all of these repositories and a second copy drifts from the first.
A fact true of one repository only belongs in that repository's own README or
docs - and an instruction file found there is to be removed rather than updated.

**Each repository's changelog is written in the format its own file already
uses**, as a table: WeKan, node-patches and mongo-tools-patches use the WeKan
format; wekan/FerretDB keeps upstream FerretDB's; and TSC uses **GNU ChangeLog**
- a `YYYY-MM-DD  Name  <email>` header over tab-indented `* Fix:` entries in a
file called `CHANGELOG` with no extension. The reason is the reader: a FerretDB
release is read beside upstream's, and a TSC entry beside a decade of GNU
entries.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bf1f7aea4">TSC is xet7's too, under another organisation</a>. Thanks to xet7.</summary>

The commit above read Secretchronicles/TSC's remote, saw it was not a `wekan/`
repository, and concluded it was somebody else's project xet7 contributes to. It
is his: the organisation is Secretchronicles rather than wekan, and that is the
only difference. His GitHub profile says it in three words - *"WeKan and TSC
maintainer"* - and the files cite it, so the next reader checks a source instead
of inferring from a remote URL as that one did.

So maintainer mode covers it - commit directly to `devel`, no pull request, same
author, no AI attribution - and the files name the one `.tools/` repository that
really is somebody else's: `sandstorm-io/sandstorm`, cloned for reference. What
does NOT follow from maintaining it is WeKan's house style: TSC keeps its own
GNU ChangeLog and its own release process.

</details>


Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.78 2026-08-09 WeKan ® release

**In short:** the **AppImage** workflow. It built both AppImages, started them,
waited for WeKan to answer on port 8080, uploaded them as artifacts - and then
attached nothing to the release, because the job that does the attaching never
checks the repository out and its two `gh` calls were the only ones in the file
without `--repo`. Fixed, and the matrix grows from two architectures to
**four**: `i686` and `armhf` are the other two an AppImage runtime exists for.
The **Flatpak** workflow had the same one-line bug and a second beside it - it
was attaching the ostree repository along with the bundles - and it stays at two
architectures, because a flatpak needs a published runtime and only x86_64 and
aarch64 have one. Beside that, the **Docker** images now carry full SLSA
**provenance** at every one of the four sites that pushes one, and a test pins
that every **bundled binary** - FerretDB, the MongoDB Database Tools, Node.js -
is still fetched as the NEWEST one everywhere it is fetched, which is what makes
those projects' security fixes arrive without a commit here - and the table
below is that working: **FerretDB v1.48.0** replaces v10.77's v1.45.0 on every
platform, with no change in this repository, because `latest` now resolves to
it. That is the release carrying `go1.25.11` and `x/sys v0.46.0`, which answers
the Go advisories a Quay scan reported against the v10.77 image. Node.js stays
v24.19.0, the newest 24.x. The rest of this release is the same theme - what a
build REPORTS versus what it did. The **armhf snap** failed three times on a
package name that has not existed since Ubuntu 24.04 renamed it, while the
message blamed a transient build-farm reset; three snaps that BUILT were
reported FAILED by the step that saves their logs; and the provenance table
printed every row twice, left **amd64** out entirely, and gave six platforms the
version "latest".

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-amd64) | v1.48.0 | `2737687fd29a8a761cd960e45f300b68cf7b4a87d50c4cc5280bcbd42b6aa163` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-arm64) | v1.48.0 | `5ae705dd49515a4ecd4e295c3b9aa4f3b454fad78613ec60fb99316bd7c34e3f` |
| loong64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-loong64.tar.xz) | v24.19.0 | `c24f224726f2d785bd18a1fd09f5e6d1fecf0269928451a60c5da9eac8e92e68` |
| loong64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-loong64) | v1.48.0 | `06ec86263455a7b598d22a87df0e044ea73ab5a3b72e96ad12ebed03c1374ac2` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-mac-arm64) | v1.48.0 | `9b15f4c10e473cd0a2c4feb4cb43e18042bd60c7035ec66cab3cfbe13edaabab` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-mac-amd64) | v1.48.0 | `4e188246dfa33bccef4cdd86701bc498b037cb3e91f579ff0dccb93aa0ef03ad` |
| ppc64le | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-ppc64le.tar.xz) | v24.19.0 | `c510c6ce12f07010f771e6edb22a3fe23f4f2e6f40b1ffd4941aed0646a0d8b3` |
| ppc64le | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-ppc64le) | v1.48.0 | `0400cd6dfc3d10d987a0fe80d75baa86c03c19170770fa2e602c92d558c3cfa6` |
| riscv64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-riscv64.tar.xz) | v24.19.0 | `cd1f14af2812148002f58b58a5f9af512a50e3b8e8c148e0db44019dcb68edfd` |
| riscv64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-riscv64) | v1.48.0 | `d37c35af988670b9ed182b8c5966c06a06362f6c6ace6aebd93ccdfa32c9a26b` |
| s390x | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-s390x.tar.xz) | v24.19.0 | `a4792e65962ffa0af42627aacf1122a60c3c88dbf4e4184f06820d66f9da8ba4` |
| s390x | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-s390x) | v1.48.0 | `6c7d61fbb8c79b2e8733be8f71910f710e8c5cd25208c451bdc513c8313b0340` |
| win64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip) | v24.19.0 | `57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73` |
| win64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.48.0/ferretdb-win64.exe) | v1.48.0 | `ea57e1bcd153b51d2065ab01515b21ec05d8f615444c15603ab8158b8a661dd2` |

This release adds the following new features:

**AppImage** - which CPUs get one.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/97e57e531">Build the other two architectures an AppImage runtime exists for</a>. Thanks to xet7.</summary>

x86_64 and aarch64 become four, with **i686** and **armhf**. That is the whole
set: an AppImage BEGINS with a runtime binary the kernel executes, and runtimes
exist for exactly those four. `ppc64le`, `s390x`, `riscv64` and `loong64` have
none, so they cannot have an AppImage however the job is written - they are
served by the bundle zip and the .deb, and the matrix now says so where somebody
would otherwise try.

The two are not equally safe and are not treated as though they were. **i686**
builds on the x86_64 runner, which runs 32-bit x86 natively: no emulation, no
multiarch, `appimagetool-i686` runs as-is. **armhf** builds on the aarch64
runner, which runs 32-bit ARM only if the kernel has `CONFIG_COMPAT` and the
32-bit loader is installed - GitHub promises neither - so it is
`continue-on-error`, the same treatment TSC gives its emulated armhf job. It
cannot decide whether the other three reach the release.

The smoke test needed the distinction too. It starts the AppImage and waits for
port 8080, which a 64-bit runner cannot do for a 32-bit build it cannot execute.
A check that cannot RUN is not a failed check: when the binary will not execute
at all AND it is not this machine's architecture, it warns, says the AppImage is
uploaded unchecked, and moves on. A build that DOES start and then does not
answer still fails - that is the bug the step exists for.

</details>

**Docker images** - what an image records about how it was built.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b3169534">Attach full build provenance at every site that pushes an image</a>. Thanks to xet7.</summary>

BuildKit attaches MINIMAL provenance on its own, which is where the
`unknown on unknown` rows beside each real platform on quay.io come from - that
is the OCI marker for "not a runnable image", so `docker pull` never selects
one. Minimal is a build id and a timestamp, which answers nothing anybody asks
of a supply chain. `mode=max` records what does: which commit, which base
image, which build arguments, which frontend.

The hazard is not getting it wrong once, it is that WeKan pushes images from
FOUR places - `docker-publish.yml`, two sites in `release-all.yml`, and
`releases/docker-build.sh` - and a fifth added later would silently fall back to
the default. So the test finds the call sites by searching the repository
instead of from a list, and fails when a pushing one lacks the flag.

SBOM stays off, deliberately: it enumerates every OS package and npm
dependency, so the attestation grows from tens of kilobytes to megabytes per
platform. Turning it on is a decision rather than a default to drift into.

The `--load` build in `docker-build.sh` must NOT ask for it - the docker
exporter cannot carry an attestation at all - and that is a test of its own, so
the flag is not added there by symmetry one day.

One more thing the test pins, because it was written the wrong way twice while
this was being done: a `#` comment sitting among a continued command's
arguments. `docker buildx build \` followed by a comment line comments out the
REST OF THE JOINED LINE, so the command becomes a bare `docker buildx build`
with every platform, tag and flag swallowed. `bash -n` accepts it - it is valid
syntax, just a different command - and a YAML `run:` block is a shell script,
which is where it happened the first time.

</details>

and fixes the following bugs:

**The snap builds** - what the Launchpad jobs build, and what they report.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a820b056b">libcurl4 does not exist on armhf, so name the package noble ships</a>. Thanks to xet7.</summary>

The armhf snap failed all three attempts in v10.77 while s390x, ppc64el and
riscv64 each built on attempt 1. The Launchpad build log says why, one line into
the mongodb part:

```
Stage package not found in part 'mongodb': libcurl4.
Build failed
```

Ubuntu 24.04's 64-bit `time_t` transition renamed the library, and `libcurl4` is
not a real package on **any** architecture in noble - the binary is
`libcurl4t64` everywhere. On the 64-bit architectures the renamed package keeps
the old name alive, `Provides: libcurl4 (= 8.5.0-2ubuntu10)`, and the armhf
`libcurl4t64` has no `Provides` line at all, because there the ABI really
changed. That is what makes this class of bug reach exactly one architecture -
which is also what makes it look like flakiness on that architecture.

It had already happened, to `libssl3` and `libgoogle-perftools4` in v10.71, and
the comment above this list describes it exactly; `libcurl4` was the same
transition and was left behind. All fourteen stage-packages were checked against
the noble armhf main+universe indices this time, and it was the only one that
did not resolve.

The workflow's own guidance made it worse. snapcraft ends a missing
stage-package as a *Stopped* build with no artifact, which from the outside is
indistinguishable from Launchpad cancelling a build, so the message offered "an
OOM in the Meteor npm install, or a transient build-farm reset - re-run" for a
failure that will never succeed on a re-run. The step now looks for that line
first, names the missing package, says it is not transient, explains the
`Provides` asymmetry, and gives the one-line archive query that checks a name.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6dce9dda7">Three good snaps were reported as FAILED by the step that saves their logs</a>. Thanks to xet7.</summary>

s390x, ppc64el and riscv64 each printed *"Remote build &lt;arch&gt; succeeded on
attempt 1"* and downloaded their `.snap` - and each job then ended FAILED,
because the step that saves the build log could not upload it:

```
The path for one of the files in artifact is not valid:
/snapcraft-wekan-f82a93c2…_s390x_2026-08-09T11:39:05.txt.
Contains the following character:  Colon :
```

snapcraft names a remote-build log after the recipe and an ISO timestamp, and
`upload-artifact` refuses a colon because NTFS cannot hold one. The colons
become dashes now, so the timestamp is kept rather than the name thrown away -
and the upload is `continue-on-error`, because a **diagnostic** upload must
never be able to fail the build it is diagnosing. The snap is the deliverable,
and the renaming is not the last thing that could ever make a log unuploadable.

</details>

**The release notes** - what the provenance table says each bundle carries.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6dce9dda7">Every row appeared twice, amd64 appeared not at all, and six platforms said "latest"</a>. Thanks to xet7.</summary>

Three things wrong at once in the v10.77 table, and every one of them silent -
nothing errored, the table was simply not what it claimed to be.

**Every row appeared twice.** `provenance-table.sh` globbed
`provenance/**/*.tsv provenance/*.tsv`, and with `globstar` a `**/` matches
**zero** or more directories, so the first pattern already covered the second
and every file was read twice. It is one pattern now, and rows are also
deduplicated on the WHOLE line - a retried step records an identical line and
nothing tells the copies apart. Deliberately not `sort -u -k1,1 -k2,2`: two rows
sharing a bundle and a binary but differing elsewhere are not a duplicate, they
are a real disagreement about which Node.js went into a bundle, and hiding one
at random is worse than showing both.

**amd64 was missing** - the platform most people download. Its step runs
`cd .build` before `mkdir -p provenance`, so the rows went to
`.build/provenance` while the upload looked at `provenance/` from the workspace
root and found nothing. Every other build job records from the workspace root,
which is why only this one was affected. That turned out to be half the story:
the scripts themselves were not being found either, which the next release
fixes.

**Six platforms said Version `latest`.** amd64, arm64, win64, win32, mac-arm64
and mac-x64 passed the literal string; only the extra-architecture job asked
what `latest` actually was, with its own inline `curl`. "Which FerretDB did
v10.77 ship" is the one question that column exists to answer. All seven sites
now call `releases/ferretdb-latest-tag.sh`, which asks once per job and caches,
authenticates when there is a token so a shared 60/hour limit is not what makes
it fail, checks the answer is shaped like a tag before printing it into a
markdown cell, and prints nothing and exits 0 when it cannot find out - a
release note must never fail a build that produced a good bundle.

The table's prose also linked `wekan/node`; the binaries come from
[wekan/node-patches](https://github.com/wekan/node-patches), which is what the
rows themselves already linked.

</details>

**The release upload** - what reaches the release page.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fa296d0c8">Attach the built AppImages to the release again</a>. Thanks to xet7.</summary>

Both AppImages built. Both passed the smoke test that starts them and waits for
WeKan to answer. Both uploaded as artifacts, and both were downloaded by the
attaching job with matching SHA256 digests. Then:

```
gh release upload 'v10.77' assets/* --clobber
failed to run git: fatal: not a git repository
```

That job does not check the repository out - it has no reason to, it only
downloads artifacts - so `gh` had no git remote to infer the repository from.
Every other `gh` call in the workflow already passed `--repo`; those two did
not.

Every call passes it now, including the ones in jobs that DO check out: a call
relying on an inferred remote breaks the day somebody removes the checkout, and
the error it gives names neither `gh` nor the workflow.

Worth recording for whoever reads that failed run, because the log looks far
worse than the bug: `::error::` lines appear in the build jobs for the
bundle-file check and the port check, and in the attaching job for "no
architecture produced an AppImage - every build job failed". None of them fired.
They carry the escape codes of the `##[group]` header - they are the SCRIPT
being echoed, not output - and a few lines below them `ls -lh assets` shows both
AppImages sitting there at 225M and 227M. One line in the whole run was a real
error.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/04fb6e338">Flatpak: attach the bundles to the release, and only the bundles</a>. Thanks to xet7.</summary>

The same one-line bug as the AppImage workflow above, from the same cause: the
job that attaches the bundles does not check the repository out - it only
downloads artifacts - so `gh` had no git remote to infer the repository from and
`gh release upload` failed with *"fatal: not a git repository"*. Both flatpaks
had built and uploaded as artifacts; nothing reached the release. Every `gh`
call in that workflow passes `--repo` now too.

And a second one beside it: `assets/*` was not the bundles. The artifacts also
carry the **ostree repository** the flatpak was exported through - `config`,
`objects/`, `refs/`, `summaries/`, `summary`, `summary.idx` - which is build
scaffolding, and attaching it would have put a few hundred directories on the
release beside the two files anyone wants. The upload names the bundles and
their checksums instead.

No architectures could be added here, and the workflow header now says why
rather than leaving it to be rediscovered. A flatpak runs against a RUNTIME, not
the host's libraries, so an architecture exists only if freedesktop.org
publishes `org.freedesktop.Platform` for it: x86_64 and aarch64, the i386 and
arm runtimes having been discontinued. That is the difference from the AppImage
work above, which could grow from two architectures to four - an AppImage
carries its own runtime binary, and those exist for i686 and armhf as well.

</details>

and has the following developer-facing change:

**Bundled binaries** - keeping "newest" true everywhere it is claimed.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ce69db8c5">Pin that every bundled binary is fetched as the newest one</a>. Thanks to xet7.</summary>

WeKan ships binaries other projects publish - FerretDB, the MongoDB Database
Tools, Node.js - and fetches each from a release URL. There are many such URLs,
across workflows, release scripts and compose files, and they must all agree:
one that names a fixed version stops receiving that project's security fixes
silently, and nothing about the build fails when it does.

That is not hypothetical. A Quay scan of the v10.77 image reported Go
advisories in the FerretDB binary baked into the bundle - `stdlib 1.25.9`
wanting 1.25.11, `golang.org/x/sys v0.38.0` wanting 0.44.0. The source was
already fixed and v1.48.0 was already published carrying `go1.25.11` and
`x/sys v0.46.0`; the image had simply captured an older `latest` at build time.
Had any of these URLs been pinned instead, the rebuild would not have fixed it
either.

The URLs are found by searching the repository rather than from a list, so a
build site added later is checked too, and three shapes are accepted:
`latest/download/<asset>`, the bare `latest` API endpoint that `release-all.yml`
asks which version `latest` resolved to so the provenance table can record it,
and `${VAR}` whose default is separately asserted to be `latest` - that is
`FERRETDB_RELEASE` in the compose files, which an operator may pin for their own
reasons but which must not freeze everybody who does not.

Node.js is a different mechanism with the same effect, so it is pinned too:
`NODE_VERSION` is the bare major `24`, and `releases/resolve-node-source.sh`
answers with that CPU's newest 24.x from whichever of nodejs.org,
unofficial-builds or [wekan/node-patches](https://github.com/wekan/node-patches)
has one.

What makes `latest` safe rather than merely convenient is the provenance table
above: rebuilding an old release would embed a different FerretDB than it
shipped with, and the only reason that is a trade rather than a hole is that
every release RECORDS the versions and SHA256s it actually shipped. So that is
asserted here as well - `releases/record-provenance.sh` exists, and the
CHANGELOG still carries the table it produces.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.77 2026-08-09 WeKan ® release

**In short:** the **snap** side, which had three problems that looked like one.
The helper that put a build on channels released ONE snap, ONE revision, to
THREE channels - and a revision number is per architecture, so it could only
ever
be right for one of them. The page documenting the CPU platforms listed five
architectures and omitted **armhf**, which has been built all along. And the two
architectures that are release bundles but NOT snaps - **i386** and **armv7** -
were nowhere, so "missing" and "cannot be there" looked identical. The binaries
below are v10.76's: nothing here rebuilds them.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-amd64) | v1.45.0 | `94713f605167abb45a3717482d35de4824cb4a8f199c1400e826a8a2b04f3893` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-arm64) | v1.45.0 | `275ae50ac97e6a70eee72e6de37766c458775c5997c896352db5189c6cf1f04b` |
| loong64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-loong64.tar.xz) | v24.19.0 | `c24f224726f2d785bd18a1fd09f5e6d1fecf0269928451a60c5da9eac8e92e68` |
| loong64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-loong64) | v1.45.0 | `28bf67981168dfc4bd67698b41dd62628aafe347a77f2b1e6ffcadf009d575e0` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-mac-arm64) | v1.45.0 | `639ed58b84820b3d588f4161c64d0ab940d0cc6e7d022088d60c2b0b97f99f8e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-mac-amd64) | v1.45.0 | `fd519903f5630e881e38e7c5814f00c0e89ad26f6785f1ddcbab4058356fc9f3` |
| ppc64le | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-ppc64le.tar.xz) | v24.19.0 | `c510c6ce12f07010f771e6edb22a3fe23f4f2e6f40b1ffd4941aed0646a0d8b3` |
| ppc64le | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-ppc64le) | v1.45.0 | `de4518c7774d302533369c477759ddd866785d6741d98d399388eb8de3df175a` |
| riscv64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-riscv64.tar.xz) | v24.19.0 | `cd1f14af2812148002f58b58a5f9af512a50e3b8e8c148e0db44019dcb68edfd` |
| riscv64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-riscv64) | v1.45.0 | `7dc2952f554e8800c4029577901999e06e10272da686f7e402177080067028f9` |
| s390x | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-s390x.tar.xz) | v24.19.0 | `a4792e65962ffa0af42627aacf1122a60c3c88dbf4e4184f06820d66f9da8ba4` |
| s390x | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-s390x) | v1.45.0 | `0ae2e2f2cffdc5dd2ea4f125281a5e12eea216fbe49b5561d9c001700c3fc0c1` |
| win64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip) | v24.19.0 | `57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73` |
| win64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-win64.exe) | v1.45.0 | `f6337994368a52d011d438c82b914b0cedb3178fd030acac8db3dab8017cee85` |

This release adds the following new feature:

**Snap publishing** - getting every snap onto every channel without typing a
revision number.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a5d8a1fd9">Release every snap, every architecture, to all four channels</a>. Thanks to xet7.</summary>

The helper this replaces was `snapcraft release wekan $1 edge,beta,candidate`,
which is wrong three ways at once. It names only `wekan`, leaving `wekan-ondra`
and `wekan-gantt-gpl` to be done by hand. It takes ONE revision number, and
revisions are PER ARCHITECTURE - the store shows `wekan` at 3601 on amd64 and
3600 on arm64 for the same 10.76 - so one number can only ever be right for one
of them. And it leaves out `stable`, so a build reached three channels of four
and somebody had to remember the fourth.

`releases/snap-release-all-channels.sh` resolves the revision per (snap,
architecture) from the store itself, so no revision number is ever typed, and
releases it to all four channels in ONE call - a revision reaches all of them or
none. A pair with no revision is reported and skipped rather than failing the
run: the three snaps genuinely have different architecture sets today.

The mapping is the hazard, and it lives in one place now
(`models/lib/snapArchitectures.js`) with both directions tested. `ppc64le` and
`ppc64el` ARE the same hardware - the bundles use the kernel's name, the store
uses Debian's - and it is the only rename. Nothing warns when the wrong one is
used: an unrecognised architecture is simply one the store has never heard of,
so it looks like it worked.

Pass the version to pin it. Without one the newest revision of each architecture
is promoted, and edge is often ahead of stable, so a bare run publishes edge
builds to stable users; `--dry-run` prints the plan first.

</details>

and improves the following documentation:

**Snap CPU platforms** - which six, why not the other two, and how the names
differ.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3c9291338">Say which six architectures are snaps, and why i386 and armv7 are not</a>. Thanks to xet7.</summary>

`docs/Platforms/FOSS/Container/Snap/CPU-platforms.md` listed five architectures
and omitted **armhf**, which `snapcraft.yaml` has built all along. It said the
release publishes candidate, beta and edge and that stable "is published
manually
later" - no longer true, and the reason a build reached three channels of four.

The matrix is now the six `build-for:` entries with the bundle name beside each,
and a new section explains the three ways the two naming systems differ.

**armhf and armv7 are not a rename**, and getting it wrong ships a snap that
crashes. [node-patches](https://github.com/wekan/node-patches) builds `armhf` to
the Debian baseline - hard-float, VFPv3-D16, assuming no NEON - so it runs on
any
ARMv7-A, and `armv7` with NEON for boards that have it. The Snap Store has ONE
32-bit ARM architecture serving every such device, so it must carry the BASELINE
build: the NEON one would be an illegal instruction on a board without NEON. So
armv7 ships as a bundle only, and a test cross-checks that explanation against
node-patches' own workflow so it cannot drift from the binaries.

**i386 cannot have a new snap at all**, and it is categorically different from a
missing Node.js build. node-patches patches SOURCE so a binary can be built;
here
the BASE SNAP does not exist, because Ubuntu 24.04 has no i386 port - no patch
set produces a base Canonical does not publish. The last base with one was
`core18`, end-of-life. The store still shows an i386 column for `wekan-ondra`
because it keeps whatever was ever uploaded; that revision is `0.X-ci` and
nothing can replace it.

The page also records what each snap has in the store today and what is still to
upload, including the two fossils channel promotion cannot fix - `wekan-ondra`'s
armhf at 0.22 and its i386 at 0.X-ci, which have no newer revision to promote.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.
