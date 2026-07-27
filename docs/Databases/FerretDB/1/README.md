# FerretDB v1 — the five backends

FerretDB speaks the MongoDB wire protocol and stores the data in something else.
WeKan uses the [wekan/FerretDB](https://github.com/wekan/FerretDB) fork of
FerretDB v1, which keeps the four v1 backends upstream dropped in v2, and this is
the **default database of WeKan**: `docker-compose.yml` runs FerretDB v1 on its
embedded SQLite, so there is no separate database server to install at all.

Whichever backend is used, WeKan talks only to FerretDB
(`MONGO_URL=mongodb://ferretdb:27017/wekan`) — nothing in WeKan knows what is
behind it.

## Which one to use

| Backend | Compose file | Status |
| --- | --- | --- |
| SQLite (embedded) | [docker-compose.yml](https://github.com/wekan/wekan/blob/main/docker-compose.yml) | **Default.** Confirmed working with Meteor 3 |
| PostgreSQL | [docker-compose-ferretdb-v1-postgresql.yml](https://github.com/wekan/wekan/blob/main/docker-compose-ferretdb-v1-postgresql.yml) | Confirmed working with Meteor 3 ([#6509](https://github.com/wekan/wekan/issues/6509)) |
| MySQL | [docker-compose-ferretdb-v1-mysql.yml](https://github.com/wekan/wekan/blob/main/docker-compose-ferretdb-v1-mysql.yml) | Experimental |
| MariaDB | [docker-compose-ferretdb-v1-mariadb.yml](https://github.com/wekan/wekan/blob/main/docker-compose-ferretdb-v1-mariadb.yml) | Experimental |
| SAP HANA | [docker-compose-ferretdb-v1-sap-hana.yml](https://github.com/wekan/wekan/blob/main/docker-compose-ferretdb-v1-sap-hana.yml) | Experimental |

**Experimental** means: complete enough to run, with the range / `$in` pushdowns
and the OpLog `ts` index in place, but never verified against a live server with
the integration suite the way SQLite has been. Use those three to try the
backend, not to bet on it.

## Starting one

Every compose file says at its top how to start it. The default needs no `-f`:

```sh
docker compose up -d
```

Any other backend names its file:

```sh
docker compose -f docker-compose-ferretdb-v1-postgresql.yml up -d
docker compose -f docker-compose-ferretdb-v1-postgresql.yml logs -f
docker compose -f docker-compose-ferretdb-v1-postgresql.yml down
```

`./build.sh` → *Docker* offers the same list, and so does `build.bat` on Windows.

The files differ **only** in the database: the same WeKan image and the same
settings, with the same comments explaining them, so a setting learned from one
of them is the same setting in all of them. That is checked by
`tests/dockerComposeBackends.test.cjs`, which compares each file's WeKan service
against the default one line for line.

## How the binary gets there

The compose files do not use a FerretDB image: a small Debian container downloads
the `ferretdb-<arch>` binary for its own architecture from the newest
[wekan/FerretDB release](https://github.com/wekan/FerretDB/releases), caches it on
the volume and runs it. Pin a version with `FERRETDB_RELEASE=download/v1.24.2`.
The same per-arch binaries are embedded in the WeKan bundles for the platforms
MongoDB has no server build for — ppc64le, s390x, riscv64.

The `hana` handler is behind the `ferretdb_hana` build tag; the released binaries
are built with it, so `--handler=hana` exists. A FerretDB built elsewhere without
that tag answers "unknown handler".

## The OpLog

FerretDB v1 can emulate a replica set (`--repl-set-name=rs0`), so Meteor *can*
tail an OpLog instead of polling. On the SQLite backend that tail keeps FerretDB's
CPU pinned and stalls loading
([#6503](https://github.com/wekan/wekan/issues/6503)); on the other backends it is
unverified. So every compose file defaults to **polling**, and both
`METEOR_REACTIVITY_ORDER=oplog,polling` and `MONGO_OPLOG_URL` are commented out —
merely setting `MONGO_OPLOG_URL` starts a tail regardless of the reactivity order
([#6498](https://github.com/wekan/wekan/issues/6498)).

FerretDB has no MongoDB change streams at all, in either version.

## Do they all answer the same?

[Conformance.md](Conformance.md) — `./build.sh` → Tests → **All databases
(sequential)** builds the newest FerretDB v1 from source and runs one catalogue of
every query type against every database that has an image for this CPU, then
compares that they all answered the same. Results land in `../log/<datetime>/`
with every other test run's.

## Other databases

[Alternatives.md](Alternatives.md) — which databases publish images for ppc64le,
s390x and riscv64 at all (PostgreSQL is the only widely-portable one, and MongoDB
itself is amd64 + arm64 only), and what a new FerretDB v1 backend would have to
implement before WeKan could store into one of them.

## See also

- [../2/PostgreSQL.md](../2/PostgreSQL.md) — FerretDB 2, which is PostgreSQL-only
- [../../MongoDB/Oplog-Configuration.md](../../MongoDB/Oplog-Configuration.md) — what the OpLog does for WeKan
- [wekan/FerretDB](https://github.com/wekan/FerretDB) — the fork, its CHANGELOG and its releases
