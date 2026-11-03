# WeKan database speed test results

Run 2026-11-03 on Apple M2 Max, 12 threads, 32 GiB RAM, Darwin 27.2.0, by
[speedtest.sh](speedtest.sh). How it works, and what was improved because of it:
[the README](.).

The data is 1/20 of a production WeKan: 753 users, 2,308 boards, 5,526 lists, 5,564 swimlanes, 15,377 cards (production: 307,535 cards). Every database got identical
documents and WeKan's own indexes, and was asked identical questions.

## At a glance

One number per database: the time of one call of each of the common WeKan queries below,
added together. **Times slower** is that sum divided by the fastest database's. Ordered
from fastest to slowest. The second pair of columns is the same for the slowest parameter -
the biggest board or the busiest user, who waits longest.

| # | Database | Total (ms) | Times slower | Slowest user (ms) | Times slower |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | MongoDB 9.0.2 | 16.6 | 1.0x | 45.1 | 1.0x |
| 2 | MongoDB 8.0.32 | 17.4 | 1.0x | 48.8 | 1.1x |
| 3 | MongoDB 6.0.28 | 18.0 | 1.1x | 50.2 | 1.1x |
| 4 | MongoDB 7.0.43 | 18.1 | 1.1x | 50.1 | 1.1x |
| 5 | FerretDB v2.7.0 + PostgreSQL 17.6 with DocumentDB | 57.9 | 3.5x | 154 | 3.4x |
| 6 | FerretDB v1.105.0 (f459ae07) + SQLite (modernc.org/sqlite v1.61.0) | 82.7 | 5.0x | 240 | 5.3x |
| 7 | FerretDB v1.105.0 (0c784f2c) + MySQL 9.7.2 | 99.3 | 6.0x | 399 | 8.8x |
| 8 | FerretDB v1.105.0 (0c784f2c) + PostgreSQL 18.6 | 145 | 8.7x | 483 | 11x |
| 9 | FerretDB v1.105.0 (0c784f2c) + pgrust 0.4-beta (PostgreSQL 18.6 compatible) | 174 | 10x | 594 | 13x |
| 10 | FerretDB v1.105.0 (0c784f2c) + MariaDB 12.3.3 | 280 | 17x | 1,051 | 23x |

## Speed

Milliseconds for one call - smaller is faster. Each query is asked with 15 parameters (the
3 biggest boards or busiest users and 12 ordinary ones, see below); a cell is the average of
the 15 per-parameter medians. **Total** is the sum of a row, and the table is ordered by it:
fastest database at the top.

| Database | Total | Login | User by id | All Boards count | All Boards page | Board by id | Board lists | Board swimlanes | Board cards | Card window | Card count | Cards per list | Card by id | Card search | Due Cards | People page | Edit card | Move card | Add card |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| MongoDB 9.0.2 | **16.6** | 0.48 | 0.41 | 0.89 | 0.87 | 0.43 | 0.42 | 0.43 | 2.08 | 0.42 | 0.45 | 0.53 | 0.35 | 0.60 | 6.23 | 0.68 | 0.39 | 0.52 | 0.48 |
| MongoDB 8.0.32 | **17.4** | 0.46 | 0.41 | 0.86 | 0.85 | 0.39 | 0.48 | 0.45 | 2.14 | 0.42 | 0.49 | 0.52 | 0.35 | 0.63 | 7.09 | 0.78 | 0.38 | 0.40 | 0.34 |
| MongoDB 6.0.28 | **18.0** | 0.44 | 0.46 | 0.71 | 0.96 | 0.43 | 0.44 | 0.41 | 2.13 | 0.39 | 0.43 | 0.50 | 0.36 | 0.60 | 7.42 | 0.82 | 0.49 | 0.49 | 0.53 |
| MongoDB 7.0.43 | **18.1** | 0.45 | 0.41 | 0.71 | 0.91 | 0.41 | 0.46 | 0.41 | 2.05 | 0.40 | 0.42 | 0.51 | 0.36 | 0.55 | 7.81 | 0.76 | 0.46 | 0.52 | 0.48 |
| FerretDB v2.7.0 + PostgreSQL 17.6 with DocumentDB | **57.9** | 0.67 | 0.55 | 2.10 | 2.82 | 0.69 | 0.71 | 0.56 | 3.21 | 1.12 | 1.06 | 1.29 | 0.52 | 1.42 | 33.8 | 1.91 | 1.87 | 1.77 | 1.85 |
| FerretDB v1.105.0 (f459ae07) + SQLite (modernc.org/sqlite v1.61.0) | **82.7** | 0.28 | 0.32 | 6.30 | 5.35 | 0.29 | 0.41 | 0.38 | 5.00 | 0.75 | 1.71 | 2.37 | 0.21 | 1.05 | 50.9 | 3.85 | 1.34 | 1.45 | 0.72 |
| FerretDB v1.105.0 (0c784f2c) + MySQL 9.7.2 | **99.3** | 0.93 | 0.90 | 6.05 | 6.30 | 0.93 | 0.97 | 0.89 | 7.75 | 1.02 | 4.80 | 4.91 | 0.83 | 5.56 | 34.7 | 15.8 | 2.50 | 2.71 | 1.82 |
| FerretDB v1.105.0 (0c784f2c) + PostgreSQL 18.6 | **145** | 0.76 | 0.67 | 5.84 | 6.14 | 0.59 | 0.57 | 0.55 | 7.70 | 0.70 | 4.54 | 4.57 | 0.50 | 5.20 | 83.8 | 16.1 | 2.34 | 2.27 | 1.66 |
| FerretDB v1.105.0 (0c784f2c) + pgrust 0.4-beta (PostgreSQL 18.6 compatible) | **174** | 0.75 | 0.62 | 6.00 | 6.39 | 0.70 | 0.68 | 0.61 | 7.49 | 0.73 | 4.75 | 4.70 | 0.57 | 5.29 | 112 | 15.3 | 2.59 | 2.58 | 1.95 |
| FerretDB v1.105.0 (0c784f2c) + MariaDB 12.3.3 | **280** | 0.92 | 0.87 | 11.2 | 11.3 | 0.96 | 1.01 | 1.01 | 8.02 | 1.22 | 6.65 | 6.61 | 0.84 | 6.82 | 207 | 9.02 | 2.34 | 2.54 | 1.36 |

### The slowest parameter

The same, for the slowest of the 15 parameters - nearly always the biggest board or the
busiest user. This is how long the person who waits longest waits. Ordered by its own
total, so the order can differ from the table above.

| Database | Total | Login | User by id | All Boards count | All Boards page | Board by id | Board lists | Board swimlanes | Board cards | Card window | Card count | Cards per list | Card by id | Card search | Due Cards | People page | Edit card | Move card | Add card |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| MongoDB 9.0.2 | **45.1** | 0.59 | 0.47 | 2.54 | 4.03 | 0.48 | 0.50 | 0.50 | 13.9 | 0.45 | 0.64 | 0.90 | 0.37 | 1.87 | 15.6 | 0.71 | 0.42 | 0.59 | 0.54 |
| MongoDB 8.0.32 | **48.8** | 0.52 | 0.44 | 2.63 | 4.09 | 0.42 | 0.59 | 0.55 | 14.6 | 0.44 | 0.66 | 0.91 | 0.40 | 2.08 | 18.4 | 0.83 | 0.40 | 0.45 | 0.37 |
| MongoDB 7.0.43 | **50.1** | 0.51 | 0.46 | 2.41 | 5.25 | 0.44 | 0.54 | 0.48 | 14.3 | 0.42 | 0.64 | 1.26 | 0.40 | 1.83 | 18.7 | 0.80 | 0.52 | 0.60 | 0.54 |
| MongoDB 6.0.28 | **50.2** | 0.48 | 0.52 | 2.49 | 5.59 | 0.49 | 0.52 | 0.50 | 14.6 | 0.42 | 0.66 | 1.33 | 0.39 | 2.05 | 17.6 | 0.87 | 0.54 | 0.55 | 0.59 |
| FerretDB v2.7.0 + PostgreSQL 17.6 with DocumentDB | **154** | 0.74 | 0.59 | 2.40 | 3.22 | 0.88 | 0.91 | 0.65 | 20.4 | 1.65 | 1.43 | 2.17 | 0.57 | 2.74 | 107 | 2.01 | 2.28 | 2.17 | 2.06 |
| FerretDB v1.105.0 (f459ae07) + SQLite (modernc.org/sqlite v1.61.0) | **240** | 0.36 | 0.47 | 26.8 | 15.9 | 0.47 | 0.82 | 0.62 | 45.1 | 3.42 | 14.0 | 20.4 | 0.24 | 5.80 | 94.9 | 6.55 | 1.45 | 1.58 | 0.80 |
| FerretDB v1.105.0 (0c784f2c) + MySQL 9.7.2 | **399** | 1.01 | 0.97 | 36.3 | 37.9 | 0.98 | 1.36 | 1.18 | 61.3 | 1.23 | 33.6 | 35.4 | 0.92 | 39.9 | 122 | 16.8 | 2.66 | 3.04 | 2.03 |
| FerretDB v1.105.0 (0c784f2c) + PostgreSQL 18.6 | **483** | 0.87 | 0.73 | 38.3 | 39.1 | 0.68 | 0.97 | 0.79 | 66.7 | 1.22 | 36.7 | 37.0 | 0.57 | 41.4 | 193 | 16.9 | 2.65 | 2.86 | 1.91 |
| FerretDB v1.105.0 (0c784f2c) + pgrust 0.4-beta (PostgreSQL 18.6 compatible) | **594** | 0.88 | 0.67 | 36.5 | 38.8 | 0.80 | 1.13 | 0.92 | 62.5 | 1.19 | 36.4 | 36.1 | 0.60 | 40.3 | 314 | 15.8 | 2.78 | 2.77 | 2.12 |
| FerretDB v1.105.0 (0c784f2c) + MariaDB 12.3.3 | **1,051** | 1.01 | 0.93 | 102 | 102 | 1.08 | 1.46 | 1.39 | 56.0 | 1.40 | 50.7 | 51.4 | 0.89 | 51.1 | 613 | 9.33 | 2.68 | 2.76 | 1.60 |

## Loading the data

Inserting the documents in batches of 1,000, then creating every index WeKan creates.
Ordered by the whole time, fastest first.

| Database | users | boards | lists | swimlanes | cards | Indexes | Index errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| MongoDB 9.0.2 | 0.0 s | 0.0 s | 0.1 s | 0.0 s | 0.2 s | 0.6 s | none |
| MongoDB 7.0.43 | 0.0 s | 0.0 s | 0.1 s | 0.0 s | 0.2 s | 0.6 s | none |
| MongoDB 6.0.28 | 0.0 s | 0.0 s | 0.1 s | 0.0 s | 0.2 s | 0.6 s | none |
| MongoDB 8.0.32 | 0.0 s | 0.0 s | 0.1 s | 0.0 s | 0.2 s | 0.7 s | none |
| FerretDB v2.7.0 + PostgreSQL 17.6 with DocumentDB | 0.0 s | 0.1 s | 0.1 s | 0.1 s | 0.3 s | 1.3 s | none |
| FerretDB v1.105.0 (0c784f2c) + MySQL 9.7.2 | 0.2 s | 0.5 s | 0.4 s | 0.3 s | 1.9 s | 1.7 s | none |
| FerretDB v1.105.0 (0c784f2c) + MariaDB 12.3.3 | 0.1 s | 0.4 s | 0.3 s | 0.2 s | 1.3 s | 7.1 s | none |
| FerretDB v1.105.0 (f459ae07) + SQLite (modernc.org/sqlite v1.61.0) | 0.1 s | 0.5 s | 0.3 s | 0.2 s | 1.9 s | 7.4 s | none |
| FerretDB v1.105.0 (0c784f2c) + PostgreSQL 18.6 | 0.1 s | 0.7 s | 0.5 s | 0.4 s | 3.0 s | 16.0 s | none |
| FerretDB v1.105.0 (0c784f2c) + pgrust 0.4-beta (PostgreSQL 18.6 compatible) | 0.1 s | 0.7 s | 0.5 s | 0.4 s | 3.2 s | 38.0 s | none |

## Same data

Every answer of every query, for every parameter, and the cards the writes left behind,
compared with **MongoDB 8.0.32**. Answers are compared as typed values with
sorted keys; a query whose order WeKan relies on must also return the same order.

| Database | Same answers | Different |
| --- | --- | --- |
| MongoDB 9.0.2 | 19 of 19 | none |
| MongoDB 8.0.32 | 19 of 19 | none |
| MongoDB 6.0.28 | 19 of 19 | none |
| MongoDB 7.0.43 | 19 of 19 | none |
| FerretDB v2.7.0 + PostgreSQL 17.6 with DocumentDB | 19 of 19 | none |
| FerretDB v1.105.0 (f459ae07) + SQLite (modernc.org/sqlite v1.61.0) | 19 of 19 | none |
| FerretDB v1.105.0 (0c784f2c) + MySQL 9.7.2 | 19 of 19 | none |
| FerretDB v1.105.0 (0c784f2c) + PostgreSQL 18.6 | 19 of 19 | none |
| FerretDB v1.105.0 (0c784f2c) + pgrust 0.4-beta (PostgreSQL 18.6 compatible) | 19 of 19 | none |
| FerretDB v1.105.0 (0c784f2c) + MariaDB 12.3.3 | 19 of 19 | none |

## The queries

Each is the query WeKan itself sends; see [queries.cjs](queries.cjs).

| Column | Query | Asked for |
| --- | --- | --- |
| Login | users.findOne({ username }) - Meteor accounts-base at sign-in | the 3 users on most boards + 12 others |
| User by id | users.findOne({ _id }) - every method and publication asks who is calling | the 3 users on most boards + 12 others |
| All Boards count | boards.countDocuments(All Boards selector) | the 3 users on most boards + 12 others |
| All Boards page | boards.find(All Boards selector).sort({ title, _id }).limit(30), ids only | the 3 users on most boards + 12 others |
| Board by id | boards.findOne({ _id }) - opening a board | the 3 biggest boards + 12 others |
| Board lists | lists.find({ boardId, archived: false }).sort({ sort, _id }) | the 3 biggest boards + 12 others |
| Board swimlanes | swimlanes.find({ boardId, archived: false }).sort({ sort, _id }) | the 3 biggest boards + 12 others |
| Board cards | cards.find({ boardId, archived: false }) - the board publication, every card | the 3 biggest boards + 12 others |
| Card window | cards.find({ boardId, archived: false, listId, swimlaneId }).sort({ sort, _id }).limit(25), ids - lazy loading | the 3 biggest boards + 12 others |
| Card count | cards.countDocuments({ boardId, archived: false }) | the 3 biggest boards + 12 others |
| Cards per list | aggregate $match { boardId, archived: false } + $group by listId - All Boards card counters | the 3 biggest boards + 12 others |
| Card by id | cards.findOne({ _id }) - opening a card | the 3 biggest boards + 12 others |
| Card search | cards.find({ boardId, archived: false, title: /word/i }).sort({ sort, _id }).limit(50) | the 3 biggest boards + 12 others |
| Due Cards | the dueCards publication: visible boards, then their due cards sorted by dueAt | the 3 users on most boards + 12 others |
| People page | users.find({}).sort({ createdAt: -1 }).skip(n).limit(10) + count - Admin Panel / People | pages 1, 2, the middle and the last |
| Edit card | cards.updateOne({ _id }, { $set: { title, modifiedAt } }) | the 3 biggest boards + 12 others |
| Move card | cards.updateOne({ _id }, { $set: { listId, swimlaneId, sort, modifiedAt } }) | the 3 biggest boards + 12 others |
| Add card | cards.insertOne({ ...a new card }) | the 3 biggest boards + 12 others |

Each query is first run once per parameter to warm up (those answers are the ones compared),
then repeated for up to 5 passes or the time budget (WEKAN_SPEEDTEST_BUDGET_MS); 20-90 calls per query were timed.
A query too slow to be repeated in that time keeps its warm-up time.
Raw results: `.tools/log/test-db-speedtest/2026-11-03_22-10-05/speedtest-<database>.json`.

