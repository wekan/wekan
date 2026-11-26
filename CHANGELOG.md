The upcoming WeKan release and the 5 newest, in short. Everything
each one changed and the project status are in
[CHANGELOG-big.md](CHANGELOG-big.md), and older releases in [old-CHANGELOG](old-CHANGELOG/).

Written by `node releases/changelog-short.mjs` from CHANGELOG-big.md:
make changes there.

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

# v13.31 2026-11-25 WeKan ® release

A person can **download everything WeKan holds about them**
and **be erased everywhere**; an operator publishes a **privacy notice, terms
and imprint**, can **require accepting them**, and limits how long records are
kept. Administrators **export their lists as CSV**, see **who downloaded what**,
check a **Compliance** checklist; the pages pass **WCAG 2.2 AA** checks, and
every
release carries a **CycloneDX SBOM**, with **security.txt** from the security
contact. **Problems / Summary** groups **sign-in refusals by reason** with the
fix for each, the **delay after a wrong password** is applied at last, the
**Docker image is distroless**, and the server tests pass again.

[All changes in v13.31](CHANGELOG-big.md#v1331-2026-11-25-wekan--release)

# v13.30 2026-11-23 WeKan ® release

The **wekan-ondra** and **wekan-gantt-gpl** snaps are published on
every architecture the wekan snap has, on all four channels, and each **Snap
Store page** shows what is new in the newest release. **Time tracking**
works again on imported cards whose spent time was stored empty, and the
**Admin Panel recovery list** no longer fills up with old cancelled
notifications.

[All changes in v13.30](CHANGELOG-big.md#v1330-2026-11-23-wekan--release)
