# WeKan database speed test results

Run 2026-10-23 on Intel(R) Core(TM) i7-8750H CPU @ 2.20GHz, 12 threads, 30 GiB RAM, Linux 7.2.6-070206-generic, by
[speedtest.sh](speedtest.sh). How it works, and what was improved because of it:
[the README](.).

The data is twice a production WeKan: 30,116 users, 92,306 boards, 221,038 lists, 222,546 swimlanes, 615,070 cards (production: 307,535 cards). Every database got identical
documents and WeKan's own indexes, and was asked identical questions.

## Speed

Milliseconds for one call - smaller is faster. Each query is asked with 15 parameters (the
3 biggest boards or busiest users and 12 ordinary ones, see below); a cell is the average of
the 15 per-parameter medians. **Total** is the sum of a row, and the table is ordered by it:
fastest database at the top.

| Database | Total | Login | User by id | All Boards count | All Boards page | Board by id | Board lists | Board swimlanes | Board cards | Card window | Card count | Cards per list | Card by id | Card search | Due Cards | People page | Edit card | Move card | Add card |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| MongoDB 9.0.4 | **495** | 0.75 | 0.66 | 5.76 | 16.4 | 0.68 | 1.06 | 0.98 | 47.7 | 0.77 | 1.61 | 2.62 | 0.66 | 5.34 | 394 | 13.6 | 0.77 | 1.16 | 1.00 |
| MongoDB 6.0.28 | **562** | 0.78 | 0.73 | 5.49 | 21.0 | 0.83 | 1.01 | 0.93 | 48.2 | 0.89 | 2.01 | 4.38 | 0.74 | 4.76 | 447 | 20.9 | 0.83 | 0.90 | 0.77 |
| MongoDB 7.0.45 | **565** | 0.86 | 0.74 | 6.29 | 23.7 | 0.79 | 1.07 | 1.00 | 48.9 | 0.87 | 2.00 | 4.35 | 0.72 | 5.52 | 445 | 20.7 | 0.79 | 0.77 | 0.76 |
| MongoDB 8.0.34 | **577** | 0.81 | 0.69 | 6.83 | 16.8 | 0.77 | 1.19 | 1.01 | 48.5 | 0.88 | 1.90 | 2.87 | 0.69 | 6.28 | 470 | 15.6 | 0.78 | 0.89 | 0.78 |
| FerretDB v1.98.0 (324811f9) + SQLite (modernc.org/sqlite v1.61.0) | **16,568** | 1.08 | 0.94 | 1,388 | 1,408 | 0.98 | 1.87 | 1.53 | 222 | 69.9 | 87.1 | 120 | 0.83 | 65.9 | 12,777 | 408 | 4.21 | 8.58 | 3.58 |
| FerretDB v2.7.0 + PostgreSQL 17.6 with DocumentDB | **88,884** | 1.35 | 1.03 | 183 | 241 | 1.15 | 1.72 | 1.68 | 113 | 53.5 | 43.5 | 46.0 | 0.93 | 46.1 | 88,013 | 118 | 7.89 | 6.09 | 6.20 |
| FerretDB v1.98.0 (202e6c9e) + PostgreSQL 18.6 | **111,542** | 1.25 | 1.23 | 8,020 | 7,924 | 1.34 | 1.93 | 1.60 | 211 | 1.30 | 124 | 129 | 1.15 | 133 | 93,540 | 1,414 | 12.6 | 13.3 | 11.2 |
| FerretDB v1.98.0 (6bd826af) + MySQL 9.7.4 | **151,633** | 152 | 44.3 | 9,267 | 9,392 | 1,053 | 685 | 531 | 3,530 | 3,484 | 3,526 | 3,538 | 3,436 | 3,523 | 100,434 | 1,587 | 3,705 | 3,734 | 12.8 |
| FerretDB v1.98.0 (6bd826af) + MariaDB 12.3.3 | **253,833** | 555 | 550 | 9,245 | 9,258 | 4,580 | 2,778 | 1,819 | 19,053 | 19,092 | 19,070 | 19,028 | 18,673 | 19,055 | 72,803 | 768 | 18,740 | 18,760 | 6.48 |

### The slowest parameter

The same, for the slowest of the 15 parameters - nearly always the biggest board or the
busiest user. This is how long the person who waits longest waits. Same row order.

| Database | Total | Login | User by id | All Boards count | All Boards page | Board by id | Board lists | Board swimlanes | Board cards | Card window | Card count | Cards per list | Card by id | Card search | Due Cards | People page | Edit card | Move card | Add card |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| MongoDB 9.0.4 | **1,110** | 0.78 | 0.69 | 28.1 | 187 | 0.72 | 1.89 | 1.63 | 297 | 0.83 | 4.48 | 9.99 | 0.68 | 28.1 | 525 | 19.9 | 0.85 | 1.48 | 1.02 |
| MongoDB 6.0.28 | **1,257** | 0.80 | 0.78 | 29.6 | 256 | 0.95 | 1.82 | 1.43 | 300 | 0.98 | 7.77 | 22.4 | 0.78 | 24.9 | 585 | 21.1 | 0.87 | 1.11 | 0.79 |
| MongoDB 7.0.45 | **1,303** | 0.88 | 0.77 | 34.1 | 291 | 0.83 | 1.83 | 1.65 | 304 | 0.89 | 7.95 | 22.1 | 0.77 | 29.6 | 583 | 20.8 | 0.84 | 1.04 | 0.79 |
| MongoDB 8.0.34 | **1,212** | 0.87 | 0.71 | 33.7 | 184 | 0.82 | 2.09 | 1.66 | 301 | 0.93 | 5.14 | 11.0 | 0.73 | 33.8 | 611 | 22.1 | 0.84 | 1.12 | 0.80 |
| FerretDB v1.98.0 (324811f9) + SQLite (modernc.org/sqlite v1.61.0) | **30,828** | 1.14 | 1.06 | 4,609 | 4,801 | 1.09 | 6.09 | 4.01 | 1,412 | 443 | 549 | 770 | 0.87 | 409 | 17,310 | 490 | 4.87 | 11.1 | 4.18 |
| FerretDB v2.7.0 + PostgreSQL 17.6 with DocumentDB | **136,362** | 1.39 | 1.07 | 190 | 252 | 1.22 | 2.90 | 2.50 | 451 | 113 | 90.2 | 90.2 | 0.98 | 90.0 | 134,900 | 147 | 13.8 | 7.81 | 6.78 |
| FerretDB v1.98.0 (202e6c9e) + PostgreSQL 18.6 | **136,863** | 1.28 | 1.29 | 8,219 | 8,190 | 1.57 | 4.93 | 3.37 | 1,333 | 1.46 | 790 | 832 | 1.20 | 854 | 115,057 | 1,534 | 13.5 | 13.9 | 11.9 |
| FerretDB v1.98.0 (6bd826af) + MySQL 9.7.4 | **175,499** | 168 | 45.0 | 9,662 | 9,705 | 1,124 | 716 | 552 | 3,866 | 3,618 | 3,730 | 3,920 | 3,606 | 3,756 | 121,835 | 1,657 | 3,751 | 3,775 | 13.5 |
| FerretDB v1.98.0 (6bd826af) + MariaDB 12.3.3 | **278,412** | 559 | 556 | 9,466 | 9,482 | 4,710 | 2,854 | 1,870 | 19,545 | 19,672 | 19,349 | 19,419 | 18,847 | 19,389 | 94,100 | 897 | 18,854 | 18,835 | 6.97 |

## Loading the data

Inserting the documents in batches of 1,000, then creating every index WeKan creates.

| Database | users | boards | lists | swimlanes | cards | Indexes | Index errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| MongoDB 9.0.4 | 0.8 s | 3.4 s | 4.5 s | 4.1 s | 17.0 s | 43.6 s | none |
| MongoDB 6.0.28 | 0.8 s | 3.3 s | 4.6 s | 4.2 s | 17.7 s | 41.6 s | none |
| MongoDB 7.0.45 | 0.8 s | 3.3 s | 4.7 s | 4.2 s | 17.3 s | 42.8 s | none |
| MongoDB 8.0.34 | 0.8 s | 3.2 s | 4.9 s | 4.3 s | 17.9 s | 45.3 s | none |
| FerretDB v1.98.0 (324811f9) + SQLite (modernc.org/sqlite v1.61.0) | 10.2 s | 65.8 s | 59.5 s | 40.8 s | 316.6 s | 1167.1 s | none |
| FerretDB v2.7.0 + PostgreSQL 17.6 with DocumentDB | 1.5 s | 6.0 s | 7.7 s | 6.9 s | 32.3 s | 219.2 s | none |
| FerretDB v1.98.0 (202e6c9e) + PostgreSQL 18.6 | 14.3 s | 80.5 s | 79.5 s | 70.6 s | 369.6 s | 116.8 s | none |
| FerretDB v1.98.0 (6bd826af) + MySQL 9.7.4 | 13.1 s | 59.7 s | 61.2 s | 52.6 s | 251.6 s | 1190.3 s | cards {"boardId":1,"archived":1,"listId":1,"swimlaneId":1,"sort":1,"_id":1}, cards {"boardId":1,"archived":1,"type":1,"dueAt":1}, users {"services.accounts-lockout.unlockTime":1}, users {"profile.emailBuffer.0":1} |
| FerretDB v1.98.0 (6bd826af) + MariaDB 12.3.3 | 8.0 s | 35.7 s | 36.2 s | 28.9 s | 154.7 s | 2432.5 s | cards {"boardId":1,"archived":1,"listId":1,"swimlaneId":1,"sort":1,"_id":1}, cards {"boardId":1,"archived":1,"type":1,"dueAt":1} |

## Same data

Every answer of every query, for every parameter, and the cards the writes left behind,
compared with **MongoDB 8.0.34**. Answers are compared as typed values with
sorted keys; a query whose order WeKan relies on must also return the same order.

| Database | Same answers | Different |
| --- | --- | --- |
| MongoDB 9.0.4 | 19 of 19 | none |
| MongoDB 6.0.28 | 19 of 19 | none |
| MongoDB 7.0.45 | 19 of 19 | none |
| MongoDB 8.0.34 | 19 of 19 | none |
| FerretDB v1.98.0 (324811f9) + SQLite (modernc.org/sqlite v1.61.0) | 19 of 19 | none |
| FerretDB v2.7.0 + PostgreSQL 17.6 with DocumentDB | 19 of 19 | none |
| FerretDB v1.98.0 (202e6c9e) + PostgreSQL 18.6 | 19 of 19 | none |
| FerretDB v1.98.0 (6bd826af) + MySQL 9.7.4 | 19 of 19 | none |
| FerretDB v1.98.0 (6bd826af) + MariaDB 12.3.3 | 19 of 19 | none |

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
then repeated for up to 5 passes or 10 seconds; 15-90 calls per query were timed.
A query too slow to be repeated in that time keeps its warm-up time.
Raw results: `.tools/log/test-db-speedtest/2026-10-23_19-33-27/speedtest-<database>.json`.

