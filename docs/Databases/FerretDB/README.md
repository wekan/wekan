# FerretDB

FerretDB speaks the MongoDB wire protocol and stores the data in something else,
so WeKan runs unchanged on top of it — WeKan only ever connects to
`mongodb://ferretdb:27017/wekan?directConnection=true` and knows nothing about
what is behind it. The `directConnection=true` is required, not decoration:
without it the driver follows FerretDB's replica-set handshake to the wildcard
address FerretDB listens on and the stack cannot start
([#6582](https://github.com/wekan/wekan/issues/6582), explained in
[1/README.md](1/README.md#why-the-url-says-directconnectiontrue)).

There are two versions, and they are different products:

| Directory | Version | Stores into |
| --- | --- | --- |
| [1](1) | FerretDB v1, the [wekan/FerretDB](https://github.com/wekan/FerretDB) fork — **WeKan's default database** | SQLite (embedded), PostgreSQL, MySQL, MariaDB, SAP HANA |
| [2](2) | FerretDB 2, upstream | PostgreSQL with the DocumentDB extension, only |

Upstream dropped every backend except PostgreSQL in v2. The fork keeps v1 alive
because the embedded SQLite backend is what makes a WeKan install self-contained —
no database server at all — and because it is the database WeKan ships for the
platforms MongoDB has no server build for: ppc64le, s390x and riscv64.

## See also

- [../MongoDB](../MongoDB) — the classic database, if you prefer MongoDB itself
- [wekan/FerretDB](https://github.com/wekan/FerretDB) — the fork, its releases and its CHANGELOG
