# Supported databases

WeKan stores its data in a MongoDB-compatible database. Which ones work, and how
each was checked:

| Database | Status | How it is checked |
| --- | --- | --- |
| **FerretDB v1 + SQLite** | **Default** on every platform: bundle, Docker, Snap, Kubernetes | Conformance catalogue; WeKan with a real Meteor 3 client ([#6509](https://github.com/wekan/wekan/issues/6509)) |
| FerretDB v1 + PostgreSQL | Works | Conformance catalogue; WeKan with a real Meteor 3 client ([#6509](https://github.com/wekan/wekan/issues/6509)) |
| FerretDB v1 + MySQL | Experimental | Conformance catalogue |
| FerretDB v1 + MariaDB | Experimental | Conformance catalogue |
| FerretDB v1 + SAP HANA | Experimental, amd64 only | Conformance catalogue only when asked (`WEKAN_CONFORMANCE_HANA=1`) |
| FerretDB 2 + PostgreSQL/DocumentDB | Not tested | — |
| **MongoDB 9** | Works for the queries WeKan makes | Conformance catalogue (9.0.2) |
| **MongoDB 8** | Works | Conformance catalogue (8.0.32); WeKan's Mocha tests and dev server run on Meteor's bundled MongoDB 8.0.29 |
| **MongoDB 7** | Works | Conformance catalogue (7.0.43); [docker-compose-mongodb-v7.yml](../../docker-compose-mongodb-v7.yml) runs WeKan on it |
| **MongoDB 6** | Works for the queries WeKan makes | Conformance catalogue (6.0.28) |
| MongoDB 3.x – 5.x | Not tested with current WeKan | Use only to dump an old database, then restore it into a supported one |

FerretDB v1 is [wekan/FerretDB](https://github.com/wekan/FerretDB), the fork
WeKan ships. A Snap that still has MongoDB data reads it with MongoDB and
[migrates itself to FerretDB](../Platforms/FOSS/Container/Snap/Migration-to-FerretDB.md).

## The conformance catalogue

[releases/db-conformance.sh](../../releases/db-conformance.sh) runs one catalogue
of 110 queries - operators, projection, sorting, paging, counting, aggregation,
updates, indexes, capped collections - against every database above that has an
image for the machine's CPU, and fails when any of them answers differently.
EVERYTHING in `build.sh` and `build.bat` runs it. MongoDB 6, 7, 8 and 9 are
queried directly, with no FerretDB in between, so a fault that every FerretDB
backend shares still shows up as a difference: the first run with MongoDB found
three such faults in FerretDB's `$group`, `$min`/`$max` and capped collections,
fixed in wekan/FerretDB.

The run of 2026-10-10: SQLite, PostgreSQL, MySQL and MariaDB through FerretDB,
and MongoDB 6.0.28, 7.0.43, 8.0.32 and 9.0.2, answered all 110 cases the same.
See [FerretDB/1/Conformance.md](FerretDB/1/Conformance.md) for how it works.

The catalogue checks the database queries WeKan depends on. The whole WeKan
application - its browser tests - runs on Meteor's bundled MongoDB 8 and on
FerretDB, not on every MongoDB version.

## Things to know about MongoDB versions

- **Linux kernel 6.19 to 7.0.13.** MongoDB refuses to start on these kernels
  ("Linux kernel versions 6.19 and newer has a known incompatibility"), Ubuntu
  26.04's `7.0.0-N` kernels included. MongoDB 8.0.35 and 9.0.4 recognise Ubuntu
  kernels that have the fix
  ([SERVER-131779](https://jira.mongodb.org/browse/SERVER-131779)); otherwise
  upgrade to kernel 7.0.14 or later, or use FerretDB, which is not affected. The
  conformance run records such a machine as a skip with the reason.
- **AVX.** MongoDB 5 and newer need a CPU with AVX; see [avx-qemu.md](MongoDB/avx-qemu.md)
  and [raspi4-qemu.md](MongoDB/raspi4-qemu.md).
- **Driver.** Meteor 3.6 connects with its bundled Node.js MongoDB driver 6.16
  (`npm-mongo`); see [Driver-System.md](MongoDB/Driver-System.md).
- **Upgrading MongoDB.** MongoDB 9.0 upgrades only from 8.0 or 8.3, one major
  version at a time; take a `mongodump` first.
