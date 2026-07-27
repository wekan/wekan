# Databases

WeKan stores its data in a MongoDB-compatible database. That can be MongoDB
itself, or FerretDB — which speaks the MongoDB wire protocol and stores the data
in SQLite, PostgreSQL, MySQL, MariaDB or SAP HANA. The **default** is FerretDB v1
with its embedded SQLite, so a fresh `docker compose up -d` needs no database
server at all.

| Directory | What is in it |
| --- | --- |
| [FerretDB/1/](FerretDB/1/) | FerretDB v1 — the default. SQLite, PostgreSQL, MySQL, MariaDB, SAP HANA |
| [FerretDB/2/](FerretDB/2/) | FerretDB 2 — PostgreSQL with the DocumentDB extension |
| [MongoDB/](MongoDB/) | MongoDB itself: drivers, versions, the OpLog, and old CPUs |
| [Migrations/](Migrations/) | WeKan's own schema migrations and how they are verified |
| [ToroDB/](ToroDB/) | ToroDB — a MongoDB proxy to PostgreSQL. No longer developed |

## FerretDB

Replacing MongoDB with FerretDB. Both of the v1 backends WeKan ships by default
are confirmed working with a real Meteor 3 client — the embedded SQLite and
vanilla PostgreSQL ([#6509](https://github.com/wekan/wekan/issues/6509)); MySQL,
MariaDB and SAP HANA are experimental.

- [FerretDB v1 — the five backends](FerretDB/1), and how to start each
- [FerretDB 2 + PostgreSQL install](FerretDB/2/PostgreSQL.md)
- <https://forums.meteor.com/t/ferretdb-1-18-now-has-oplog-support-trying-replace-mongodb-6-x-with-ferretdb-postgresql-or-ferretdb-sqlite/61092>

## MongoDB

- [Driver-System.md](MongoDB/Driver-System.md) — which Node driver is used for which server version
- [Version-Management.md](MongoDB/Version-Management.md) — detecting the server version and switching binaries
- [Compatibility-Guide.md](MongoDB/Compatibility-Guide.md) — MongoDB 3.0 … 8.0 with Meteor
- [Oplog-Configuration.md](MongoDB/Oplog-Configuration.md) — why the OpLog matters, and how to enable it
- [OpLog-Enablement.md](MongoDB/OpLog-Enablement.md) — its status per deployment platform
- [avx-qemu.md](MongoDB/avx-qemu.md) — MongoDB 5+ on a CPU without AVX
- [raspi4-qemu.md](MongoDB/raspi4-qemu.md) — MongoDB 5+ on a Raspberry Pi 4 and older

## Migrations

- [Migrations/](Migrations/) — the schema-migration system, its review notes and
  `verify-migrations.sh`

## ToroDB

ToroDB is not developed anymore. ToroDB was about adding a MongoDB proxy to
PostgreSQL or MySQL.

- [ToroDB/PostgreSQL/](ToroDB/PostgreSQL/) — the compose file and notes kept here
