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
| 6 | FerretDB v1.105.0 (9030e55c) + SQLite (modernc.org/sqlite v1.61.0) | 68.3 | 4.1x | 219 | 4.9x |
| 7 | FerretDB v1.105.0 (0db7b801) + MySQL 9.7.2 | 103 | 6.2x | 415 | 9.2x |
| 8 | FerretDB v1.105.0 (0c784f2c) + PostgreSQL 18.6 | 145 | 8.7x | 483 | 11x |
| 9 | FerretDB v1.105.0 (0c784f2c) + pgrust 0.4-beta (PostgreSQL 18.6 compatible) | 174 | 10x | 594 | 13x |
| 10 | FerretDB v1.105.0 (0db7b801) + TiDB v7.5.1 | 240 | 14x | 877 | 19x |
| 11 | FerretDB v1.105.0 (0db7b801) + MariaDB 12.3.3 | 290 | 17x | 1,063 | 24x |
| 12 | FerretDB v1.105.0 (0db7b801) + Dolt 2.6.2 | 20,470 | 1,230x | 20,904 | 464x |

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
| FerretDB v1.105.0 (9030e55c) + SQLite (modernc.org/sqlite v1.61.0) | **68.3** | 0.29 | 0.23 | 4.35 | 3.40 | 0.28 | 0.42 | 0.37 | 4.91 | 0.72 | 1.69 | 2.36 | 0.22 | 1.01 | 40.7 | 3.90 | 1.36 | 1.39 | 0.67 |
| FerretDB v1.105.0 (0db7b801) + MySQL 9.7.2 | **103** | 0.92 | 0.87 | 6.13 | 6.40 | 0.91 | 0.97 | 0.88 | 7.79 | 1.04 | 5.05 | 5.13 | 0.85 | 5.75 | 35.9 | 16.9 | 2.65 | 2.87 | 2.08 |
| FerretDB v1.105.0 (0c784f2c) + PostgreSQL 18.6 | **145** | 0.76 | 0.67 | 5.84 | 6.14 | 0.59 | 0.57 | 0.55 | 7.70 | 0.70 | 4.54 | 4.57 | 0.50 | 5.20 | 83.8 | 16.1 | 2.34 | 2.27 | 1.66 |
| FerretDB v1.105.0 (0c784f2c) + pgrust 0.4-beta (PostgreSQL 18.6 compatible) | **174** | 0.75 | 0.62 | 6.00 | 6.39 | 0.70 | 0.68 | 0.61 | 7.49 | 0.73 | 4.75 | 4.70 | 0.57 | 5.29 | 112 | 15.3 | 2.59 | 2.58 | 1.95 |
| FerretDB v1.105.0 (0db7b801) + TiDB v7.5.1 | **240** | 2.00 | 1.48 | 32.7 | 33.0 | 1.44 | 1.95 | 1.68 | 10.4 | 2.96 | 7.61 | 7.59 | 1.50 | 8.35 | 97.2 | 18.4 | 4.32 | 4.81 | 2.71 |
| FerretDB v1.105.0 (0db7b801) + MariaDB 12.3.3 | **290** | 1.06 | 0.90 | 11.6 | 11.6 | 1.20 | 1.13 | 0.96 | 7.68 | 1.28 | 6.63 | 6.77 | 0.91 | 6.90 | 216 | 9.12 | 2.52 | 2.48 | 1.43 |
| FerretDB v1.105.0 (0db7b801) + Dolt 2.6.2 | **20,470** | 42.6 | 1.87 | 852 | 847 | 2.09 | 188 | 84.7 | 2,876 | 2,846 | 2,857 | 2,836 | 2.06 | 2,834 | 4,126 | 56.6 | 6.94 | 6.92 | 4.75 |

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
| FerretDB v1.105.0 (9030e55c) + SQLite (modernc.org/sqlite v1.61.0) | **219** | 0.34 | 0.30 | 21.6 | 11.2 | 0.35 | 0.82 | 0.67 | 44.0 | 3.71 | 13.9 | 20.6 | 0.24 | 5.43 | 85.6 | 6.88 | 1.53 | 1.49 | 0.77 |
| FerretDB v1.105.0 (0db7b801) + MySQL 9.7.2 | **415** | 1.00 | 0.93 | 36.7 | 38.9 | 1.05 | 1.43 | 1.11 | 61.6 | 1.26 | 36.6 | 37.1 | 0.93 | 41.5 | 128 | 18.3 | 3.26 | 3.21 | 2.63 |
| FerretDB v1.105.0 (0c784f2c) + PostgreSQL 18.6 | **483** | 0.87 | 0.73 | 38.3 | 39.1 | 0.68 | 0.97 | 0.79 | 66.7 | 1.22 | 36.7 | 37.0 | 0.57 | 41.4 | 193 | 16.9 | 2.65 | 2.86 | 1.91 |
| FerretDB v1.105.0 (0c784f2c) + pgrust 0.4-beta (PostgreSQL 18.6 compatible) | **594** | 0.88 | 0.67 | 36.5 | 38.8 | 0.80 | 1.13 | 0.92 | 62.5 | 1.19 | 36.4 | 36.1 | 0.60 | 40.3 | 314 | 15.8 | 2.78 | 2.77 | 2.12 |
| FerretDB v1.105.0 (0db7b801) + TiDB v7.5.1 | **877** | 2.12 | 1.52 | 77.1 | 77.7 | 1.58 | 2.64 | 2.11 | 76.4 | 4.03 | 51.1 | 49.9 | 1.62 | 55.6 | 442 | 18.9 | 4.53 | 5.05 | 2.86 |
| FerretDB v1.105.0 (0db7b801) + MariaDB 12.3.3 | **1,063** | 1.19 | 0.98 | 104 | 104 | 1.39 | 1.66 | 1.34 | 54.4 | 1.39 | 49.9 | 50.7 | 0.98 | 51.3 | 622 | 9.26 | 2.84 | 2.63 | 1.61 |
| FerretDB v1.105.0 (0db7b801) + Dolt 2.6.2 | **20,904** | 43.8 | 1.99 | 875 | 887 | 2.36 | 192 | 88.5 | 2,912 | 2,890 | 2,895 | 2,908 | 2.57 | 2,860 | 4,262 | 61.4 | 8.81 | 8.48 | 4.91 |

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
| FerretDB v1.105.0 (0db7b801) + MySQL 9.7.2 | 0.2 s | 0.5 s | 0.4 s | 0.4 s | 2.0 s | 1.7 s | none |
| FerretDB v1.105.0 (0db7b801) + MariaDB 12.3.3 | 0.1 s | 0.3 s | 0.3 s | 0.2 s | 1.3 s | 7.2 s | none |
| FerretDB v1.105.0 (9030e55c) + SQLite (modernc.org/sqlite v1.61.0) | 0.1 s | 0.5 s | 0.3 s | 0.2 s | 1.9 s | 7.4 s | none |
| FerretDB v1.105.0 (0db7b801) + TiDB v7.5.1 | 0.3 s | 0.6 s | 0.5 s | 0.5 s | 2.2 s | 7.9 s | none |
| FerretDB v1.105.0 (0c784f2c) + PostgreSQL 18.6 | 0.1 s | 0.7 s | 0.5 s | 0.4 s | 3.0 s | 16.0 s | none |
| FerretDB v1.105.0 (0c784f2c) + pgrust 0.4-beta (PostgreSQL 18.6 compatible) | 0.1 s | 0.7 s | 0.5 s | 0.4 s | 3.2 s | 38.0 s | none |
| FerretDB v1.105.0 (0db7b801) + Dolt 2.6.2 | 0.2 s | 0.8 s | 0.8 s | 0.6 s | 4.2 s | 105.7 s | none |

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
| FerretDB v1.105.0 (9030e55c) + SQLite (modernc.org/sqlite v1.61.0) | 19 of 19 | none |
| FerretDB v1.105.0 (0db7b801) + MySQL 9.7.2 | 19 of 19 | none |
| FerretDB v1.105.0 (0c784f2c) + PostgreSQL 18.6 | 19 of 19 | none |
| FerretDB v1.105.0 (0c784f2c) + pgrust 0.4-beta (PostgreSQL 18.6 compatible) | 19 of 19 | none |
| FerretDB v1.105.0 (0db7b801) + TiDB v7.5.1 | 19 of 19 | none |
| FerretDB v1.105.0 (0db7b801) + MariaDB 12.3.3 | 19 of 19 | none |
| FerretDB v1.105.0 (0db7b801) + Dolt 2.6.2 | 19 of 19 | none |

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
then repeated for up to 5 passes or the time budget (WEKAN_SPEEDTEST_BUDGET_MS); 15-90 calls per query were timed.
A query too slow to be repeated in that time keeps its warm-up time.
Raw results: `.tools/log/test-db-speedtest/2026-11-03_22-10-05/speedtest-<database>.json`.

