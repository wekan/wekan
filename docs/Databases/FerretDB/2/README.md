# FerretDB 2

Upstream FerretDB 2. It speaks the MongoDB wire protocol like v1, but stores into
**PostgreSQL with the DocumentDB extension** and nothing else — every other
backend was dropped after v1.

| File | What is in it |
| --- | --- |
| [PostgreSQL.md](PostgreSQL.md) | Installing WeKan on FerretDB 2 + PostgreSQL, step by step |

The compose file for it is
[docker-compose-ferretdb-v2-postgresql.yml](https://github.com/wekan/wekan/blob/main/docker-compose-ferretdb-v2-postgresql.yml):

```sh
docker compose -f docker-compose-ferretdb-v2-postgresql.yml up -d
```

It runs two containers — `ghcr.io/ferretdb/postgres-documentdb` and
`ghcr.io/ferretdb/ferretdb:2` — where [FerretDB v1](../1) runs one, or two when a
separate SQL server is used.

## See also

- [../1](../1) — FerretDB v1, WeKan's default, and its five backends
- <https://blog.ferretdb.io/building-project-management-stack-wekan-ferretdb/>
