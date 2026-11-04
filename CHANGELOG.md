The upcoming WeKan release and the 5 newest, in short. Everything
each one changed and the project status are in
[CHANGELOG-big.md](CHANGELOG-big.md), and older releases in [old-CHANGELOG](old-CHANGELOG/).

Written by `node releases/changelog-short.mjs` from CHANGELOG-big.md:
make changes there.

# v12.94 2026-11-04 WeKan ® release

On an iPad the **opened card covers the header bar** instead of
sitting
behind it, and the speed test measures where the time goes when a WeKan board is
opened, on FerretDB and on MongoDB.

[All changes in v12.94](CHANGELOG-big.md#v1294-2026-11-04-wekan--release)

# v12.93 2026-11-04 WeKan ® release

The database **speed test** has a new small-scale result, ordered
from fastest to slowest with how many times slower each database is, and two
more databases: **pgrust** (PostgreSQL in Rust) and **TiDB**. Noria, YugabyteDB
and CockroachDB were looked at and cannot be used, for reasons the README gives.

[All changes in v12.93](CHANGELOG-big.md#v1293-2026-11-04-wekan--release)

# v12.92 2026-11-03 WeKan ® release

A missing **REST checklist** answers a JSON 404 instead of an
empty 500.

[All changes in v12.92](CHANGELOG-big.md#v1292-2026-11-03-wekan--release)

# v12.91 2026-11-03 WeKan ® release

A **GitHub CodeQL** finding in a test is fixed, and the guard
against
replacing text with itself now also sees patterns with a `^` or `$` anchor.

[All changes in v12.91](CHANGELOG-big.md#v1291-2026-11-03-wekan--release)

# v12.90 2026-11-03 WeKan ® release

The login page can have its own **background color**, Member
Settings
has a per-member switch, **Show focus outline**, to hide the blue focus ring,
and
**Escape closes the add-list composer**.

[All changes in v12.90](CHANGELOG-big.md#v1290-2026-11-03-wekan--release)
