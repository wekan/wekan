The upcoming WeKan release and the 5 newest, in short. Everything
each one changed and the project status are in
[CHANGELOG-big.md](CHANGELOG-big.md), and older releases in [old-CHANGELOG](old-CHANGELOG/).

Written by `node releases/changelog-short.mjs` from CHANGELOG-big.md:
make changes there.

# v12.84 2026-11-02 WeKan ® release

GitHub code scanning's **code-quality** findings are fixed: a
promise formatted as text, undeclared globals, an upload that hung on an
unreadable file, and the lint around them. `npm run lint:promises`
now finds promises that are not awaited or handled.

[All changes in v12.84](CHANGELOG-big.md#v1284-2026-11-02-wekan--release)

# v12.83 2026-11-02 WeKan ® release

An **LDAP** login with a reused login name no longer opens the
previous owner's account, and existing accounts record their directory
identifier.

[All changes in v12.83](CHANGELOG-big.md#v1283-2026-11-02-wekan--release)

# v12.82 2026-11-02 WeKan ® release

A card moved to another board, restored from the archive or given
a number no longer takes a **card number** another card on that board has.

[All changes in v12.82](CHANGELOG-big.md#v1282-2026-11-02-wekan--release)

# v12.81 2026-11-02 WeKan ® release

The **database health** probe reports a finding once, not once
per server.

[All changes in v12.81](CHANGELOG-big.md#v1281-2026-11-02-wekan--release)

# v12.80 2026-11-02 WeKan ® release

**minimatch** is updated to 11.0.4 for GHSA-g3hv-75wg-m249, a
glob pattern that used up CPU and memory.

[All changes in v12.80](CHANGELOG-big.md#v1280-2026-11-02-wekan--release)
