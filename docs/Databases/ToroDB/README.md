# ToroDB

ToroDB was a MongoDB proxy that stored the data in PostgreSQL or MySQL, written
in Java. **It is not developed anymore**, and WeKan does not run on it — what is
kept here is the historical setup and the note about what to use instead.

| Directory | What is in it |
| --- | --- |
| [PostgreSQL](PostgreSQL) | The ToroDB + PostgreSQL compose file, its README, changelog and licence |

Use [FerretDB](../FerretDB) instead: it is the same idea — the MongoDB wire
protocol on top of an SQL database — but maintained, written in Go, and it is what
WeKan runs on by default.
