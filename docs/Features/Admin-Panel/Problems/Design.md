# Design: Admin Panel → Problems — summaries, actors, API report, and blocking

Status: **partly shipped** · Owner: xet7 · Related:
[README.md](README.md) (what this pane shows),
[Locked-Users.md](../People/Locked-Users.md),
[Security/Remediation/WeKan.md](../../../Security/Remediation/WeKan.md) (the
`eventlog` collection and the Reports UI this builds on),
[hall-of-fame](https://wekan.fi/hall-of-fame/).

It lives here rather than under `docs/Design/` because it describes what WeKan
already does: a design that has been built belongs with the feature it
describes, filed the way the menu is. All six are shipped now, so what follows
is description rather than proposal - kept in one document because the six
decisions only make sense together.

This document covers six changes to Admin Panel → Problems, written before they
are built so the shape can be argued with rather than discovered afterwards.
They are implemented **one at a time**, in the order below, each with its own
tests.

| # | Change | State |
| --- | --- | --- |
| 1 | Summaries: one row per problem, not per event | **done** |
| 2 | Per-actor tally inside the row: `username1 25, 100.100.100.100 30` | **done** |
| 3 | IPv4 and IPv6 in their own columns, in every report | **done** |
| 4 | An **API report**: username, API name, count, window, IPv4, IPv6 | **done** |
| 5 | Per-address login tally on the user, shown in People | **done** |
| 6 | Blocking the ACCOUNT, and increasing delays after a wrong password | **done** |

---

## The problem all of this is solving

A guard on a path an attacker controls fires as fast as they can send. The
original design wrote **one document per event**, so:

- the database grew with the attack;
- Admin Panel → Problems became a scroll of near-identical lines;
- and the one event that mattered was buried under ten thousand that did not.

An administrator never asks *list every attempt*. They ask **what is happening,
how much, since when, and who** — and then *is this one address, or is it
everywhere*. Every change here follows from that.

---

## 1. One row per problem  *(done)*

`models/lib/eventLogSummary.js`, written through `server/lib/eventLogFold.js`,
shared by the security, speed and test loggers.

```
{ stream, bleed, category, action, source, severity, cwe,
  count: 1043, firstAt: <first seen>, at: <last seen>, … }
```

**What makes two events the same problem** is the design. Identity is the KIND
of thing that happened — stream, `bleed`, category, action, source, severity,
CWE, and `type`/`db`/`kind` for the database stream. The actor is **not** part
of it: a username or an address in the key gives a row per attacker per attempt,
which is the cost being removed.

Legacy per-event rows are folded in place at startup
(`server/lib/eventLogSummaryMigration.js`): batched, in JS so FerretDB behaves
like MongoDB, idempotent — a row with `firstAt` is already a summary.

## 2. Who tried, and how many times each  *(done)*

Inside the same row:

```
actors: { <key>: { kind: 'user'|'ip', value: 'username1', count: 25, at: … } }
```

read out as `username1 25, 100.100.100.100 30`.

- **A username and an address are tallied SEPARATELY**, not as a pair. They
  answer different questions — which account, and where from — and an
  unauthenticated attempt has an address and no name. Pairing them splits one
  attacker across a line per address and answers neither.
- **The tally is CAPPED** (`MAX_ACTORS`, 50), with the remainder in
  `actorsOverflow`. Otherwise an attacker rotating addresses grows the row with
  the attack — the same bug one level down. And *"and 9,412 others"* is itself
  the signal that the source is spread rather than single.
- The cap needs to know whether an actor is new to a row, so the row's actor
  keys are **cached per process**. Reading the row on every attempt would double
  the database work of the thing being made cheap, and under attack the same few
  actors repeat.

## 3. IPv4 and IPv6 columns  *(in progress)*

`models/lib/ipAddress.js`. One request arrives from one address, so a row has
one or the other — never both. Two columns is still right: somebody scanning for
a `10.0.0.0/8` range and somebody scanning for a `/64` are looking for
different-shaped things, and a mixed column makes both harder. A row leaves the
other column empty.

**The trap this exists for** is the IPv4-mapped IPv6 address. A dual-stack
socket reports an IPv4 client as `::ffff:203.0.113.9`, so without unwrapping:

- the same client counts as two different actors depending on which listener it
  reached;
- it lands in the IPv6 column, where somebody looking for IPv4 will not find it;
- and an admin blocking `203.0.113.9` does not match what was recorded.

So a mapped address is **normalised to the IPv4 it is** before it is stored or
counted, and only a genuine IPv6 address is recorded as one. This applies to
**every** report, not only the new one — the security, speed, test, CPU and
database streams all record addresses through the same fold.

## 4. The API report  *(done)*

[API.md](API.md) is the page; what follows is why it is shaped this way.

A new `api` stream and a table with columns:

| Username | API | Count | Window | IPv4 | IPv6 |
| --- | --- | --- | --- | --- | --- |
| alice | `POST /api/boards` | 34 | 2026-02-02 … 2026-05-05 | 100.100.100.100 | |
| alice | `GET /api/boards/:boardId` | 210 | 2026-02-02 … 2026-05-05 | 100.100.100.100 | |
| | `POST /api/users` | 812 | 2026-05-04 … 2026-05-05 | | 2001:db8::1 |

The API name is the **route pattern**, which this document originally sketched
as an operation name (`add-board`). The pattern is what the router already
knows, so it needs no second list of names to keep in step, and it is what makes
the row count bounded: `/api/boards/:boardId` is one endpoint however many
boards exist.

**Identity here DOES include the username**, which is a deliberate exception to
§1. For every other stream the question is "what is happening"; for this one it
is "**who** called **what**, how often" — that is the report. The cardinality is
bounded by real users times real endpoints, not by attackers, because an
unauthenticated call has no username and falls into the row for that endpoint
with no user (the third line above), where the addresses are what identifies it.

The window is the row's `firstAt … at`, the same field pair as every other
summary.

Recording hooks into the REST API's existing middleware, so a route cannot be
added without being counted. Calls are accumulated in memory and folded on a
timer rather than written one by one - the one place on this page where that is
right, because ordinary API traffic is not the rare event every other stream
records.

## 5. Per-address login tally on the user  *(done)*

`100.100.100.100 25, 122.122.122.122 50` on the user document, shown as a column
in Admin Panel → People → People. Successful logins only — failures are the
lockout's business (§6) and are already counted there.

Capped the same way as §2 and for the same reason: an account attacked from a
botnet must not grow its own document without bound.

## 6. Blocking, and increasing delays  *(done)*

Two mechanisms, deliberately separate:

- **Increasing delay after a wrong password.** The current lockout is a step
  function: three failures, then sixty seconds of nothing. A delay that grows
  with each failure costs a guesser far more than it costs somebody who
  mistyped, and it degrades gracefully rather than slamming shut. Per (user,
  source address), like the lockout itself — an attacker must not be able to
  slow down the account's owner.
- **Blocking the ACCOUNT that attempts a vulnerability while logged in.** A
  security event that names both a user and an address is a much stronger signal
  than a failed password: it is somebody who is already authenticated reaching
  for something the guards refuse. The **account** is blocked, the block is
  visible in Admin Panel → People with the reason, and an admin can lift it.

  This is a correction to what this document first said, which was to block the
  ADDRESS. An address that several accounts log in from is an office, a VPN or a
  carrier's NAT, so blocking it would take everybody behind it off WeKan at once
  and the admin would see *"one address blocked"* rather than *"eighty people
  locked out"*. §5's tally is what shows the shape of an instance's own users,
  and Problems → Offices is where an admin reads it.

Both must satisfy the rule that broke the lockout in the first place
([JamBleed](https://wekan.fi/hall-of-fame/jambleed/)): **nothing an attacker can
do from their own address may degrade service for anybody else's**, and a
correct password always wins over a delay or a lock.

---

## Rules that apply to all six

- **A summary, never a row per event.** A logger that writes per event is a bug
  to fix, not a style.
- **The actor is never part of a problem's identity** — except §4, where the
  report *is* per actor, and the cardinality is bounded by real use. There the
  account is stored by its **id**, so a rename does not split its history.
- **Every cap has an overflow counter.** A cap that silently drops data answers
  "how many" wrongly; `actorsOverflow` is itself a signal.
- **A display field is never a decision field.** `lockedUntil` exists so an
  admin screen can query "which accounts are locked"; the lockout decision stays
  per address, and a test fails if the decision reads it.
- **Recording must never break the thing it records.** Every logger call is
  fire-and-forget, wrapped, and unable to throw into the guard that called it.
