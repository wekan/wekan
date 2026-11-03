# Opening a WeKan board: where the time goes

The [speed test](../) asks the database alone. This asks what a person waits for: the
whole of opening a board in WeKan, with WeKan on FerretDB (SQLite) and on MongoDB 8,
and how much of it is the database. [board-open.cjs](board-open.cjs) seeds a board of
N cards, logs in, opens it in Chromium and records

- the wall clock to the first minicard and until the DDP WebSocket has been quiet for
  1.5 s (**settled**), and what crossed the WebSocket;
- the Meteor server's CPU, by who spends it (a Node inspector profile of the server);
- FerretDB's CPU (its pprof), against what it spends with nobody in the browser.

```sh
# WeKan on FerretDB: MONGO_URL=mongodb://127.0.0.1:27040/wekan?directConnection=true,
# DEFAULT_METEOR_REACTIVITY_ORDER=polling (as WeKan is deployed), meteor run --inspect=9229,
# and FerretDB with --debug-addr=127.0.0.1:8098
WEKAN_BASE_URL=http://localhost:3310 WEKAN_MONGO_URL=mongodb://127.0.0.1:27040/wekan \
  node docs/Databases/FerretDB/1/SpeedTest/app/board-open.cjs --sizes 200,2000,5000 \
    --inspect 9229 --ferret-pprof http://127.0.0.1:8098 --label ferretdb-sqlite
```

Run on 2026-11-03/04, Apple M2 Max, **the development build of Meteor** (so the browser's
own part is larger than in production), one user, `polling` reactivity, FerretDB v1.105.0
with the SQLite membership-test change, MongoDB 8.0 in Docker. Each board is opened
twice (the second is warm), and the whole measurement was run **twice** (run 1 / run 2
below), because one run is not enough: the same board's "settled" time moved by up to
300 ms between runs.

## Result: the database is not what you wait for on a small board, and is on a big one

Milliseconds, first open of a board with this many cards (run 1 / run 2). WeKan loads
cards lazily, so the browser gets **the same ~210 KB and draws 70-120 minicards at every
size**.

| Cards | FerretDB (SQLite): first card | settled | MongoDB 8: first card | settled |
| ---: | ---: | ---: | ---: | ---: |
| 200 | 750 / 764 | 966 / 880 | 752 / 698 | 865 / 813 |
| 2,000 | 931 / 1,031 | 1,763 / 1,555 | 829 / 856 | 1,457 / 1,582 |
| 5,000 | 1,331 / 1,334 | 2,166 / 2,065 | 938 / 899 | 1,562 / 1,622 |

What is the same in both runs:

- **5,000 cards: FerretDB is 400-600 ms slower**, to the first card by 42-48% and until
  settled by 27-39%.
- **2,000 cards: within the noise** for "settled" (-30 to +300 ms), and 100-175 ms
  slower to the first card.
- **200 cards: 70-100 ms**, which is 9-12%.

The warm second open of run 2: 5,000 cards 1,321 against 865 ms to the first card
and 1,946 against 1,594 ms settled; 2,000 cards 904 against 824 and 1,628 against
1,446; 200 cards 721 against 689 and 934 against 805.

The Meteor server's CPU is the same on both databases within the noise (first open, run
1 / run 2: 102 / 119, 276 / 421 and 470 / 517 ms on FerretDB; 178 / 93, 245 / 342 and
521 / 483 ms on MongoDB), so the difference is **time spent waiting for the database**,
and it grows with the size of the board while the data the browser receives does not.

For a board of a few hundred cards, 0.7-0.75 s to the first card is nearly the same on
both: that is the application (the development bundle, Blaze, the DDP round trips), not
the database.

## Where the Meteor server spends its CPU (5,000 cards, first open, run 2)

| | FerretDB (517 ms) | MongoDB 8 (483 ms) |
| --- | ---: | ---: |
| Garbage collector | 31% | 24% |
| MongoDB driver (wire, decode, encode) | 19% | 22% |
| Meteor mongo (observers, polling, diff) | 12% | 13% |
| Node internals | 11% | 12% |
| WeKan code | 11% | 10% |
| Other Meteor packages and dependencies | 8% | 9% |
| Native, EJSON, DDP server (publish, mergebox) | 8% | 10% |

The DDP server itself, publish and mergebox, is 1%. The largest single functions are
the garbage collector, `CollectionDocument` (WeKan's model class), `replaceTypes`
(Meteor's BSON-to-EJSON step) and the BSON decoder.

## Where FerretDB spends its CPU

With nobody in the browser FerretDB uses 110-510 ms of CPU in the 14 s window the
profile covers. Opening a board adds, net: about nothing at 200 cards, **about 1.6 s at
2,000 and about 3.9-4.1 s at 5,000** - eight times the Meteor server's CPU for the same
open. For the 5,000-card board, of 4.41 s (run 2):

- the SQLite engine, 1.72 s (39%), a good part of it moving through the pages of the
  cards table (`btreeInitPage` 18% by itself);
- 34% is `filterIterator.Next`: documents read from SQLite and filtered again in Go;
- by MongoDB command: `find` 0.79 s, `getMore` 0.74 s, `aggregate` 0.68 s (a `$group`
  done in Go over the documents it read);
- the Go garbage collector, 0.57 s (13%).

Which WeKan query sends the `aggregate` during the open was **not identified**; the
debug log of a 2,000-card open contains none, so the 5,000-card profile may have
included the All Boards page's card counters (`getAllBoardsTileData`, a `$group` over
the user's boards) that the login lands on first. Treat that line as a lead.

## What this does and does not say

- It says the database layer is the part of opening a board that **scales with the board
  size**, and that on FerretDB (SQLite) a 5,000-card board takes 400-600 ms longer than on
  MongoDB, with the same data sent to the browser.
- It says the **Meteor server is not the bottleneck**: 0.1-0.5 s of CPU, the same on both
  databases, and the DDP server is about 1% of it. A backend rewritten in another language
  could save a part of that, and would not change the database or the browser.
- It does not separate the browser's own time from the wait for the server: the first
  card at 0.7 s on a small board is mostly the development bundle and rendering.
- Single machine, the development build, one user, two runs, two opens per board, `settled`
  meaning 1.5 s without a DDP frame. A production build and a loaded server would differ.
