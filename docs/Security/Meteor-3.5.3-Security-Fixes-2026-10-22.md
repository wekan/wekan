# Meteor 3.5.3 security fixes on Meteor 3.6-rc.0

On 2026-10-16 Meteor published the same six security fixes as **3.3.3**,
**3.4.2** and **3.5.3**
([announcement](https://forums.meteor.com/t/meteor-security-releases-3-3-3-3-4-2-and-3-5-3/64836),
[release notes](https://github.com/meteor/meteor/releases/tag/release/METEOR@3.5.3)).
WeKan is on **Meteor 3.6-rc.0**, and that release does not have them: its tag
is 15 commits behind 3.5.3 - exactly the security commits - and neither the
3.6-rc.0 tag nor Meteor's `devel` branch contains the fixed code.

Going back to 3.5.3 would also mean going back from Node.js 26 to 24 and from
Rspack 2 to 1, so WeKan carries the fixes itself until a Meteor 3.6 release
has them.

## How

A package in the app's `packages/` directory overrides the Meteor release's
package of the same name. These six are Meteor 3.6-rc.0's own packages with
Meteor's 3.5.3 patch applied unchanged (it applied cleanly; only the version
lines differed):

| Package | Fix | Fork version |
| --- | --- | --- |
| `ddp-server` | A DDP message named `__proto__`, `toString` or not a string, and an async protocol handler that rejected, crashed the server. Only the server's own handlers, by string name, are dispatched, and a rejection is caught. | `3.4.1-rc360.0_1` |
| `allow-deny` | A top-level `__proto__` in an update was left out of the field list the `allow`/`deny` validators saw. Every modified top-level field is in it now. | `2.1.1-rc360.0_1` |
| `dynamic-import` | `import()` requests had no bound on size or complexity. Bodies over 1 MiB get HTTP 413; trees too deep, too wide or malformed get HTTP 400; large legitimate graphs are batched by the client; failed module reads and their logging are limited. | `0.7.5-rc360.0_1` |
| `google-oauth` | A direct-token login accepted an access token issued to ANOTHER Google application, and took identity fields from the client. The token's audience must be this application (or a client in `additionalClientIds`), and identity comes from Google. | `1.4.6-rc360.0_1` |
| `facebook-oauth` | The same for Facebook: the token must be valid and issued to this app, and a verification error no longer carries the app secret. | `1.11.7-rc360.0_1` |
| `shell-server` | `meteor shell` history and its compile cache were readable by other users of the machine. Both are private now, and the shell keeps working when they cannot be. | `0.7.1-rc360.0_1` |

The `_1` wrap number marks each as a fork of the 3.6-rc.0 package. The sixth
fix in Meteor's list, deploy-server discovery, is in `meteor-tool` - the
`meteor deploy` command - which an app cannot replace. WeKan is never
deployed with `meteor deploy`, and `tests/meteor353SecurityFixes.test.cjs`
fails if a script starts doing it.

`ddp-server`'s fork leaves out `uWebSockets.js`: Meteor's own published
3.4.1-rc360.0 package carries no copy of it, it is only loaded for the opt-in
`uws` DDP transport, and it would be fetched from a git URL at build time.

## Beyond 3.5.3: keys from the crypto RNG

GitHub CodeQL, scanning the forks as WeKan code, found one more thing that
Meteor 3.5.3 and 3.6-rc.0 both have (alert 591, `js/insecure-randomness`,
CWE-338):

- `dynamic-import`'s server key - whoever sends it as `?key=` to
  `/__meteor__/dynamic-import/fetch` reads the SERVER's dynamic modules - came
  from `Math.random()`, whose xorshift128+ state can be recovered from earlier
  outputs, and was compared with `===`.
- `meteor shell`'s connection key, which lets a connection run code in the
  server process, was made the same way and compared with `!==`.

Both forks now take their keys from `crypto.randomBytes` (160 and 128 bits)
and compare them with `crypto.timingSafeEqual`.
`tests/meteorForkRandomKeys.test.cjs` runs both, and fails on any
`Math.random()` in the forks and on a key, secret, token, nonce, salt,
password or code made from `Math.random()` anywhere in the tree.

A wrong key is not recorded in Admin Panel → Problems. A request with a key
that is not this process's own is answered as an ordinary browser request, and
one WeKan instance's server-side import can reach another instance behind the
same load balancer with its own key, so a mismatch is not evidence of an
attempt. The shell listens only on a local socket.

## Admin Panel → Problems

A refused attempt is recorded, never ordinary use. The packages cannot import
WeKan's code, so each calls `globalThis.__wekanSecurityRecord`, which
`server/lib/meteorSecurityHook.js` points at `securityLog.record`.
`models/lib/meteorSecurityEvent.cjs` lets through only these keys, and none of
them blocks an account:

| Key | Shown as | Recorded when |
| --- | --- | --- |
| `dos.ddp-protocol-handler` | Meteor DDP | a DDP message name is not a string, or is inherited from `Object.prototype`. An unknown ordinary name is refused without a row: a newer client could send one. |
| `authz.allow-deny-proto-field` | Meteor allow-deny | an update names a top-level `__proto__`. No WeKan client writes one. |
| `dos.dynamic-import-request` | Meteor dynamic-import | an `import()` request is not JSON or exceeds its limits. An OVERSIZED body is refused without a row: a client still running older code may send one during an upgrade. |
| `authn.oauth-token-audience` | Meteor OAuth | a Google or Facebook token issued to another application (or a Google ID token of another user) is offered. A network failure is refused without a row. |

`meteor shell` and deploy have nothing to record: one is a local developer
tool, the other a build-time command.

## When Meteor is upgraded

`tests/meteor353SecurityFixes.test.cjs` fails as soon as `.meteor/release` is
no longer `METEOR@3.6-rc.0`, because a fork overrides the release's package
silently and would keep 3.6-rc.0's code under the new release. Then, for each
of the six: if the new release's notes list the 3.5.3 fix (or a later one),
delete `packages/<name>` and its `_1` line in `.meteor/versions`; otherwise
rebase the fork onto the new release's package. When all six are gone, delete
the test, the hook and this note's forks section.

## Tests

- `tests/meteor353SecurityFixes.test.cjs` runs each fix's code cut out of the
  fork: DDP dispatch, the allow/deny field list, dynamic-import's tree limits,
  Google's and Facebook's token checks, and the shell's private cache. Its
  negative tests search `packages/`, `server/`, `models/`, `imports/` and
  `client/` for the shape of each fault, and every one of them fails on the
  unfixed 3.6-rc.0 packages.
- `tests/playwright/specs/meteor-353-security.e2e.js` sends each attack to a
  running WeKan: the server keeps answering, the request is refused, and the
  attempt is in Admin Panel → Problems.
