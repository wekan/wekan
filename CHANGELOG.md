The upcoming WeKan release and the 5 newest, in short. Everything
each one changed and the project status are in
[CHANGELOG-big.md](CHANGELOG-big.md), and older releases in [old-CHANGELOG](old-CHANGELOG/).

Written by `node releases/changelog-short.mjs` from CHANGELOG-big.md:
make changes there.

# v13.36 2026-11-27 WeKan ® release

Filtering a board by **yourself as assignee** now survives a page
refresh, as filtering by anybody else already did.

[All changes in v13.36](CHANGELOG-big.md#v1336-2026-11-27-wekan--release)

# v13.35 2026-11-27 WeKan ® release

A **due date that is not due soon is grey** again, on the card
and the minicard, instead of a yellow that looked almost like the amber of
"due soon".

[All changes in v13.35](CHANGELOG-big.md#v1335-2026-11-27-wekan--release)

# v13.34 2026-11-26 WeKan ® release

The **Docker image runs on musl** for amd64 and arm64, on a root
of Alpine packages only, without the glibc and GCC runtime that held every
finding of its security scan. WeKan's default database runs on **FerretDB
v1.116.0**, whose one static binary is also **mongosh, sh and bash, written in
Go**, so `docker exec -it wekan-ferretdb mongosh wekan` works again. The
**wekan-gantt-gpl** snap and Docker image are no longer published, and
**wekan-ondra** users get one script that moves them to the wekan snap.
**Minicards are compact again**, and a board sets its own **due date
colours**.

[All changes in v13.34](CHANGELOG-big.md#v1334-2026-11-26-wekan--release)

# v13.33 2026-11-26 WeKan ® release

The Docker entrypoint logs **no value read from the environment**
(two GitHub CodeQL alerts). A **board export without archived items** moves a
board to another WeKan without its archive, the **UCS App Center** publisher
works with the distroless FerretDB image again, and **Walloon** is Walloon
instead of French and invented words. Omi gets its Gitea orphan strings in every
language, and the Azure Blob test no longer hangs.

[All changes in v13.33](CHANGELOG-big.md#v1333-2026-11-26-wekan--release)

# v13.32 2026-11-25 WeKan ® release

Every bundle, snap and Docker image is **about 220 MiB
smaller**: translations are one copy on the server, and neither a test build's
files, the TypeScript compiler nor Azure's sign-in libraries ship any more.
Languages that are a copy of another, such as en-IT, no longer fail on the
server. Minicards are **compact again**, and their caret and menu can be
hidden; the health checks survive odd data and a nightly **mongodump**. The
Docker image's start no longer logs paths read
from the environment, as **GitHub CodeQL** found, and the documentation says
the license rule plainly: **permissive licenses, no GPL**.

[All changes in v13.32](CHANGELOG-big.md#v1332-2026-11-25-wekan--release)
