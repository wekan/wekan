# WeKan ® 2026-08 releases, part 4

Moved out of [CHANGELOG.md](../../CHANGELOG.md) to keep that
file small enough to open (wekan/wekan#6580). Nothing here has been changed:
a release section is a record, and it reads the same as it did there.

This is part 4 of 4, newest first: [1](08.md), [2](08-part2.md), [3](08-part3.md), 4.

Releases per day:

| 2026-08 | Releases |
| --- | --- |
| 02 | 3 |
| 03 | 1 |
| 04 | 11 |
| 05 | 2 |
| 06 | 1 |
| 08 | 2 |
| 09 | 3 |

# v10.76 2026-08-09 WeKan ® release

**In short:** three round-trip counts that were linear in the input, and are not
any more. The **bulk label** endpoint asked the database twice per card - a
thousand sequential round-trips at its 500-card cap - **global search** resolved
each named user with its own lookup before the search could start, and
**FerretDB** skipped every top-level `$or` when building a WHERE clause, so the
board-list query narrowed nothing in SQL and filtered every row in Go. None of
them was a wrong answer; each was the right question asked one document at a
time. The binaries below are v10.75's: nothing here rebuilds them.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-amd64) | v1.45.0 | `94713f605167abb45a3717482d35de4824cb4a8f199c1400e826a8a2b04f3893` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-arm64) | v1.45.0 | `275ae50ac97e6a70eee72e6de37766c458775c5997c896352db5189c6cf1f04b` |
| loong64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-loong64.tar.xz) | v24.19.0 | `c24f224726f2d785bd18a1fd09f5e6d1fecf0269928451a60c5da9eac8e92e68` |
| loong64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-loong64) | v1.45.0 | `28bf67981168dfc4bd67698b41dd62628aafe347a77f2b1e6ffcadf009d575e0` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-mac-arm64) | v1.45.0 | `639ed58b84820b3d588f4161c64d0ab940d0cc6e7d022088d60c2b0b97f99f8e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-mac-amd64) | v1.45.0 | `fd519903f5630e881e38e7c5814f00c0e89ad26f6785f1ddcbab4058356fc9f3` |
| ppc64le | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-ppc64le.tar.xz) | v24.19.0 | `c510c6ce12f07010f771e6edb22a3fe23f4f2e6f40b1ffd4941aed0646a0d8b3` |
| ppc64le | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-ppc64le) | v1.45.0 | `de4518c7774d302533369c477759ddd866785d6741d98d399388eb8de3df175a` |
| riscv64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-riscv64.tar.xz) | v24.19.0 | `cd1f14af2812148002f58b58a5f9af512a50e3b8e8c148e0db44019dcb68edfd` |
| riscv64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-riscv64) | v1.45.0 | `7dc2952f554e8800c4029577901999e06e10272da686f7e402177080067028f9` |
| s390x | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-s390x.tar.xz) | v24.19.0 | `a4792e65962ffa0af42627aacf1122a60c3c88dbf4e4184f06820d66f9da8ba4` |
| s390x | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-s390x) | v1.45.0 | `0ae2e2f2cffdc5dd2ea4f125281a5e12eea216fbe49b5561d9c001700c3fc0c1` |
| win64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip) | v24.19.0 | `57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73` |
| win64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-win64.exe) | v1.45.0 | `f6337994368a52d011d438c82b914b0cedb3178fd030acac8db3dab8017cee85` |

This release makes the following faster:

**The REST API** - how many times one request talks to the database.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/90a41dbb2">Bulk label changes read every card in one query, and write them together</a>. Thanks to xet7.</summary>

`PUT .../cards/labels` awaited a `getCard` per id and then an update per id. At
the `BULK_CARDS_MAX` of 500 that is **one thousand sequential round-trips** for
a single request, each starting only once the last one finished.

The reads are all the same question, so they are one `$in` query indexed into a
Map. The writes genuinely differ - each card merges its own `labelIds` - so they
stay individual updates, but they are issued together and awaited once instead
of each waiting for the last.

Two details had to survive. The loop still iterates the caller's `cardIds`
rather than the query result, because a batch read comes back in the database's
order and without the ids that matched nothing: iterating it would silently
reorder `updated` and lose `notFound`. And every write is awaited before the 200
is sent, so the response still means what it says.

The bulk DELETE beside it is deliberately left alone. Its per-card work is real
- `cardRemover` runs the sub-item hooks and each card gets its own activity - so
batching the reads would save one query inside a loop that does far more than
query.

</details>

**Global search** - what happens before the search itself starts.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/90a41dbb2">Every username a query names is resolved in one lookup</a>. Thanks to xet7.</summary>

Each `user:`, `member:`, `assignee:` and `creator:` predicate resolved its name
with its own awaited `findOne`, so `member:ann member:bob member:carol` was
three serial round-trips before the search could begin.

They are all the same question - which of these names is an account - so it is
asked once, with `$in`, and answered from a map. A name typed under two
operators is one lookup now rather than two.

An unknown name is still reported against the operator it was typed under: "ann
is not a user" is not useful without saying where ann was typed.

</details>

**The database** - what SQLite is asked, and what is filtered afterwards.

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/dab729eb">FerretDB pushes a top-level $or down to SQL when every branch can be</a>. Thanks to xet7.</summary>

FerretDB skipped every top-level `$`-key when building its WHERE clause, so a
selector whose only SELECTIVE terms sit inside an `$or` produced a clause that
narrowed nothing: SQLite returned the rows, and every one was decoded and
filtered in Go to return a handful.

That is the shape of WeKan's "which boards may this user see" query, and the
worst possible one for it - `archived = false` and `type = 'board'` push down
and match nearly everything, while the membership clauses that actually select
stayed in Go. On an instance with ten thousand boards where a user belongs to
five, that decoded ten thousand documents to return five, on every All Boards
load.

It is all or nothing, and that is the whole subtlety. Every other pushdown
NARROWS: a condition that cannot be expressed is dropped, the WHERE returns a
superset, and the Go filter removes the rest. An OR that drops a branch REMOVES
rows that match it, and the Go filter never sees them. So one unpushable branch
refuses the whole `$or`, as does a nested-operator branch and an empty one.

See [the FerretDB CHANGELOG](https://github.com/wekan/FerretDB/blob/main-v1/CHANGELOG.md)
for the database side.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.75 2026-08-09 WeKan ® release

**In short:** two things the full test run turned up, one in WeKan and one in
the scripts that run it. A **linked-card cache** that could not see a card
added after the first time a subscription asked, and the **build script parity**
guard that was the one red suite - right twice over, because `build.bat` really
was missing the two entries and the guard really could not tell a shell function
from a script. The binaries below are v10.74's: nothing here rebuilds them.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-amd64) | v1.45.0 | `94713f605167abb45a3717482d35de4824cb4a8f199c1400e826a8a2b04f3893` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-arm64) | v1.45.0 | `275ae50ac97e6a70eee72e6de37766c458775c5997c896352db5189c6cf1f04b` |
| loong64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-loong64.tar.xz) | v24.19.0 | `c24f224726f2d785bd18a1fd09f5e6d1fecf0269928451a60c5da9eac8e92e68` |
| loong64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-loong64) | v1.45.0 | `28bf67981168dfc4bd67698b41dd62628aafe347a77f2b1e6ffcadf009d575e0` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-mac-arm64) | v1.45.0 | `639ed58b84820b3d588f4161c64d0ab940d0cc6e7d022088d60c2b0b97f99f8e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-mac-amd64) | v1.45.0 | `fd519903f5630e881e38e7c5814f00c0e89ad26f6785f1ddcbab4058356fc9f3` |
| ppc64le | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-ppc64le.tar.xz) | v24.19.0 | `c510c6ce12f07010f771e6edb22a3fe23f4f2e6f40b1ffd4941aed0646a0d8b3` |
| ppc64le | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-ppc64le) | v1.45.0 | `de4518c7774d302533369c477759ddd866785d6741d98d399388eb8de3df175a` |
| riscv64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-riscv64.tar.xz) | v24.19.0 | `cd1f14af2812148002f58b58a5f9af512a50e3b8e8c148e0db44019dcb68edfd` |
| riscv64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-riscv64) | v1.45.0 | `7dc2952f554e8800c4029577901999e06e10272da686f7e402177080067028f9` |
| s390x | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-s390x.tar.xz) | v24.19.0 | `a4792e65962ffa0af42627aacf1122a60c3c88dbf4e4184f06820d66f9da8ba4` |
| s390x | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-s390x) | v1.45.0 | `0ae2e2f2cffdc5dd2ea4f125281a5e12eea216fbe49b5561d9c001700c3fc0c1` |
| win64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip) | v24.19.0 | `57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73` |
| win64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-win64.exe) | v1.45.0 | `f6337994368a52d011d438c82b914b0cedb3178fd030acac8db3dab8017cee85` |

This release fixes the following bug:

**The board publication** - what a subscriber is sent, and when.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ada480c93">Linked-card ids are no longer cached for the life of a subscription</a>. Thanks to xet7.</summary>

The helper the five linked-card cursors share memoized its result per board, to
spare them the duplicate queries the five copies of that preamble used to make.
That is wrong: `publishComposite` re-runs a child's `find()` when the parent
document changes, and a cache living for the whole subscription then serves the
ids computed the FIRST time forever - a linked card added later would never be
published, and one removed would go on being published.

The five cursors each ran these same queries before the helper existed, so
computing per call is exactly the cost they always had, and it is correct. The
guard that pinned the memoization now pins its absence, with the reason, so the
next reader does not put it back.

</details>

and has the following developer-facing change:

**The build scripts** - what each menu offers, and what the guard between them
compares.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/114d6c059">git pull and git push work on Windows too, and the parity guard knows what a function entry is</a>. Thanks to xet7.</summary>

The one red suite in the full test run, and it was right twice over.

The commit that replaced `Update git` with a `git pull` and a `git push` that
finish the job added both to `build.sh`'s menu and left `build.bat` behind, so
`build.bat git-pull` answered nothing. It answers to both names now, with its
own `:gitpull` / `:gitpush` labels - the ones its interactive menu already used.

The guard also had to learn what a `!` entry is. It marks something `build.sh`
runs ITSELF rather than by executing a file in `releases/`. Most are raw
commands and the `.bat` runs those the same way, so those still compare as
before; the exception is an entry naming a `build.sh` FUNCTION, which is shell
the `.bat` has no way to call. Comparing those as scripts is what made the suite
fail the moment `Update git` was replaced. A function entry is exempt from the
script comparison now and checked separately: `build.bat` must implement a label
of the same name, so one dropping out of a menu still fails.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.74 2026-08-09 WeKan ® release

**In short:** four security reports from **Alpastx**, all of them the same
mistake in four places - a rule that exists, is correct, and is not asked.
**PathBleed** let an avatar's owner write the on-disk path of their own avatar
and have board export read that file back out, because the guard attachments
have was never copied to avatars. **RevokeBleed** left a revoked organization,
team or domain share working in the `board` publication, because that
publication had its own copy of the visibility query and the copy ignored
`isActive`. **ParentBleed** let a card on one board name a parent on a private
one and had the publication deliver that private card to everybody, because
nothing checked who may see the parent's board. **CommentBleed** let any board
member delete anyone's comment over REST, because the object-level rule lived in
a collection hook that cannot see an HTTP caller. Each fix puts the rule in ONE
place that both callers use, and each comes with a plain-node suite that pins
the attack and the negatives. Auditing for more of the same found **five more
cursors** leaking cross-board content the way ParentBleed did, three more
hand-written copies of the visibility query, and a **comment reaction** anybody
on the board could put in somebody else's name.

The features under them are two answers to "and then what": **canary tokens**,
which record WHO tried a permission override and from WHERE without telling them
they were seen, and a daily **filesystem integrity** check that asks whether
every stored file is still the file WeKan stored - name, date, md5, sha256,
sha512 and an ed25519 signature - and warns when one changed with no record
saying why. Below that: dependency updates, the two bugs Admin Panel / Problems
was itself reporting, and the security tests, which now say WHICH published
vulnerability they guard so a new guard can check the whole Hall of Fame list
against them - **33 of 58** covered, the other 25 recorded gaps with reasons.
The binaries below are v10.73's: nothing here rebuilds them.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-amd64) | v1.45.0 | `94713f605167abb45a3717482d35de4824cb4a8f199c1400e826a8a2b04f3893` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-arm64) | v1.45.0 | `275ae50ac97e6a70eee72e6de37766c458775c5997c896352db5189c6cf1f04b` |
| loong64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-loong64.tar.xz) | v24.19.0 | `c24f224726f2d785bd18a1fd09f5e6d1fecf0269928451a60c5da9eac8e92e68` |
| loong64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-loong64) | v1.45.0 | `28bf67981168dfc4bd67698b41dd62628aafe347a77f2b1e6ffcadf009d575e0` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-mac-arm64) | v1.45.0 | `639ed58b84820b3d588f4161c64d0ab940d0cc6e7d022088d60c2b0b97f99f8e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-mac-amd64) | v1.45.0 | `fd519903f5630e881e38e7c5814f00c0e89ad26f6785f1ddcbab4058356fc9f3` |
| ppc64le | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-ppc64le.tar.xz) | v24.19.0 | `c510c6ce12f07010f771e6edb22a3fe23f4f2e6f40b1ffd4941aed0646a0d8b3` |
| ppc64le | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-ppc64le) | v1.45.0 | `de4518c7774d302533369c477759ddd866785d6741d98d399388eb8de3df175a` |
| riscv64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-riscv64.tar.xz) | v24.19.0 | `cd1f14af2812148002f58b58a5f9af512a50e3b8e8c148e0db44019dcb68edfd` |
| riscv64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-riscv64) | v1.45.0 | `7dc2952f554e8800c4029577901999e06e10272da686f7e402177080067028f9` |
| s390x | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-s390x.tar.xz) | v24.19.0 | `a4792e65962ffa0af42627aacf1122a60c3c88dbf4e4184f06820d66f9da8ba4` |
| s390x | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-s390x) | v1.45.0 | `0ae2e2f2cffdc5dd2ea4f125281a5e12eea216fbe49b5561d9c001700c3fc0c1` |
| win64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip) | v24.19.0 | `57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73` |
| win64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-win64.exe) | v1.45.0 | `f6337994368a52d011d438c82b914b0cedb3178fd030acac8db3dab8017cee85` |

This release fixes the following CRITICAL SECURITY ISSUES:

**Avatars and board export** - where an uploaded picture lives on disk, and
what an export is allowed to read.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0a9eb0ef4fb3600917ef8b55d4c6afb089873e98">PathBleed: an avatar could name any file on disk, and board export read it</a>. Thanks to Alpastx and xet7.</summary>

[PathBleed](https://wekan.fi/hall-of-fame/pathbleed/) -
[GHSA-4mxf-m8pq-xc9p](https://github.com/wekan/wekan/security/advisories/GHSA-4mxf-m8pq-xc9p),
High, CWE-22 and CWE-73. Attachments blocked client-supplied
`versions.*.path`; avatars did not. The avatar allow rule was the single line
`update: isOwner` - being the owner let you write ANY field of your own avatar
document, `versions.original.path` included. That field is server-managed: it
says where on disk the bytes are.

Board export then read it. For every member whose avatar is a local WeKan file
the exporter opens that path and embeds the bytes as base64 in
`profile.avatarFile`, so an authenticated user could point their own avatar at
`/etc/passwd` - or anything else under `WRITABLE_PATH` - export a board they
are a member of, and decode the file out of the JSON. Arbitrary file read as
the WeKan OS user, from any account that can own an avatar.

Both halves are closed. The WRITE: the guards attachments had now live in one
module and BOTH permission files import it - avatars had gone without them
precisely because each collection wrote its own copy. Avatars refuse an insert
carrying `versions.*.path` or `.storage`, refuse any update touching the
versions subtree, and restrict updates to the same field whitelist attachments
use; being the owner is still required and no longer sufficient. The READ:
nothing is read from a stored path unless it RESOLVES to somewhere inside
WeKan's own storage. That half also holds when a path is poisoned some other way
- a document written before this fix, a restored backup, a bad migration - and
it sits at the one place export turns a stored path into bytes, for attachments
and avatars alike. The download path had always checked containment this way;
its private copy of the function is gone, so download and export ask the same
question. The streaming attachment export, which read a stored path with
nothing but an `existsSync`, was the last place left and takes the same check -
not the reported hole, since the attachment allow rule refuses a client-supplied
path, but a path is only as trustworthy as every way it could have been written.

</details>

**The board publication** - who is sent a board, and which of its cards.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/08baf7fd1b76a9bb889de2220bdc10c36aad6a65">RevokeBleed: revoking an org, team or domain share did not revoke it</a>. Thanks to Alpastx and xet7.</summary>

[RevokeBleed](https://wekan.fi/hall-of-fame/revokebleed/) -
[GHSA-gwc4-fw7p-gw58](https://github.com/wekan/wekan/security/advisories/GHSA-gwc4-fw7p-gw58),
Moderate, CWE-639 and CWE-863. `isActive: false` is how a board admin REVOKES a
share with an organization, a team or an email domain. All Boards honoured it -
it matches shares with `$elemMatch: { ..., isActive: true }` - so the board
disappeared from the revoked user's list and everything looked correct.

The `board` publication did not. That is the publication that sends the board
document and its lists, swimlanes, cards, comments and attachments, and it
matched shares with `'orgs.orgId': { $in: orgsIds }` instead. A dotted path
matches an element of the array without saying anything about that element's
other fields, so `isActive` was never consulted: anyone who still knew the
boardId - a bookmark, a browser tab, a note - could subscribe and receive the
whole private board after their access had been taken away. A revoke the
primary data publication does not honour is not a revoke.

The rule was written out twice and the two copies disagreed, so it is written
once now: one builder makes the `$or`, both `Boards.userBoards` and the `board`
publication call it, and every share kind is matched with `$elemMatch`
requiring `isActive: true`. `includePublic: false` still drops the public clause
and only that clause, which is what the search over all boards needs.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/35daaaa2795e83da9a23172d6279a9ba63ef1b0f">ParentBleed: one card id bridged a private board into another board's feed</a>. Thanks to Alpastx and xet7.</summary>

[ParentBleed](https://wekan.fi/hall-of-fame/parentbleed/) -
[GHSA-jvv9-498p-hxrg](https://github.com/wekan/wekan/security/advisories/GHSA-jvv9-498p-hxrg),
Moderate, CWE-200 and CWE-862. A card's `parentId` may name a card on ANOTHER
board, and setting it was authorized only against the CHILD board's write ACL.
Nothing asked whether the person setting it, or the people subscribed to the
child board, were allowed to see the other board at all.

The board publication walks the whole ancestor chain, because the
prefix-with-full-path subtask setting renders a subtask's complete path
(\#3453), and it published the complete ancestor card DOCUMENTS to every
subscriber of the child board. A member who could write on shared board B and
knew a card id on private board A could point a card at it and have A's card -
title, description, custom fields - delivered over DDP to people who are not
members of A.

Closed at both ends, because either alone leaves half the hole open. The WRITE
refuses a parent whose board the actor cannot see - one question, asked in one
place with the same selectors the publication and All Boards use, so an ACTIVE
org, team or domain share counts and a revoked one does not. It is enforced on
the REST card create, on the REST card update, and on DDP by a deny rule
covering insert as well as update, beside the cross-board MOVE deny that
[GHSA-gm7v-pc38-53jr](https://wekan.fi/hall-of-fame/boardbleed/) added. The
PUBLICATION sends only the ancestors whose board the subscriber may see; the
board being published is its own answer, so an ordinary same-board subtask path
is unchanged. This is the shape of check the linked-card path already made -
creating a linked card requires read access to the source card's board -
applied to the field that did not have it.

[Auditing for more of the same](https://github.com/wekan/wekan/commit/2c4e81ae3)
found the LINKED-CARD cursors beside the ancestor one with the identical hole
and a wider blast radius: five of them, publishing the linked card, its
comments, its attachments, its checklists and its checklist items. A
`cardType-linkedCard` names a card by id exactly as `parentId` does,
and that card may live on any board. They take the same answer - a linked card
whose source board the subscriber cannot see is not sent - and they share one
helper now instead of repeating the same fifteen-line preamble five times, which
is what stops the sixth from being written without the check.

</details>

**The REST API** - what an HTTP caller may do to somebody else's content.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a8fa6cfa3fb6c519245a4425399da3a9838bea95">CommentBleed: the REST API let any board member delete anyone's comment</a>. Thanks to Alpastx and xet7.</summary>

[CommentBleed](https://wekan.fi/hall-of-fame/commentbleed/) -
[GHSA-pqr4-rxgp-hv2m](https://github.com/wekan/wekan/security/advisories/GHSA-pqr4-rxgp-hv2m),
Moderate, CWE-639 and CWE-863. Over DDP, deleting a comment is
author-or-board-admin, and a board that sets `restrictCommentEditing` takes even
the admin's ability away (\#5906). That rule was enforced in a collection hook
keyed off the Meteor userId, with an early return for the genuine
server-internal callers - board copy, cleanup, migrations - that run with no
authenticated user.

An HTTP request carries no Meteor userId into the invocation context. So
`DELETE /api/boards/:boardId/cards/:cardId/comments/:commentId`, which checked
only board MEMBERSHIP, reached the collection with no user, the hook took its
"server-internal, trust it" path, and any normal member could delete any comment
on the board: HTTP 200, the comment gone, `restrictCommentEditing` or not, while
the same deletion over DDP was correctly refused. Harassment and evidence
destruction on a shared board.

The fix does not rely on the hook seeing something it cannot see. The handler
loads the comment - 404 when there is none - and applies the same rule itself,
with the REST caller's id, before removing anything. That rule is now an
exported function the hooks and the handler both call, so DDP and HTTP cannot
enforce different things, and it carries a 403 so a refusal answers Forbidden
rather than 500. The no-userId path stays, documented for the internal callers
it was written for.

</details>

and adds the following new features:

**Admin Panel / Problems / Security** - what an admin is told when somebody
probes.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d577f0770">Canary tokens record who tried to override permissions, and from where</a>. Thanks to xet7.</summary>

The security event log said what a guard DID - a request blocked, a filename
sanitized - which answers "is WeKan defending itself" and not the question an
admin asks next: **who did that, and from where**. It also could not tell a
browser that got confused from somebody working through the
[Hall of Fame](https://wekan.fi/hall-of-fame/) one entry at a time.

A **canary** is a tripwire at a point that only a permission-override attempt
reaches. Ordinary use never gets there, so a trip is not noise. Three properties
define one, and each is enforced by a test.

**Silent.** Tripping one changes nothing the caller can observe: `tripCanary()`
always returns `false` and `tripCanaryDeny()` always `true`, so a call site
reads as the refusal it replaces, and the REST handler re-throws the ORIGINAL
error. This is not politeness - a canary that announces itself is a map of which
paths are watched, and a probe would avoid them.

**Bounded.** A canary sits where an attacker can loop, so one database row per
attempt would be a denial of service they get for free. The first trip of a
(canary, actor) pair is recorded at once, the rest of the window are COUNTED,
and one summary carrying the total is written when the window closes; a pair
that never gives up stops writing after sixty summaries. The tracked-pair map is
capped and evicts the least RECENTLY seen, so a long-running attacker is not
pushed out by a passing one. A thousand attempts in a minute cost **one row**,
and a suppressed trip costs one map lookup.

**Attributed.** Every event carries the account, the **username**, the **IP
address** and the attempt count. The username is stored at write time on purpose
- it is what the account was called when it tried, so a rename does not rewrite
history. The address uses the same spoofing-safe rule as the login throttle, or
an attacker could write a colleague's address into the security log by sending a
header.

Seventeen canaries sit at the permission checks that refuse the attempts behind
BoardBleed, ParentBleed, ChecklistBleed, PathBleed and CommentBleed, and nine
more cover **NoSQL injection** (an execution operator in a client selector, or
`{"$ne": null}` where a typed value belongs), **SQL injection** (the database's
own guard now marks its refusal so the attempt reaches the admin instead of a
log file), **sanitization that removed something dangerous** rather than merely
tidying, a **forged forwarded-for header**, and a **login lockout**. All
server-side: no browser, nothing to install.

Admin Panel / Problems / Security gains **Username**, **IP address** and
**Attempts** columns, both new ones searchable - the thing an admin does with
one security event is pivot on it.

</details>

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/a260a53e">The database marks the operations WeKan never issues, so an operator sees them</a>. Thanks to xet7.</summary>

FerretDB is reached over a local socket by one application, whose driver is a
Meteor 3 one. That makes a class of operations interesting by their mere
presence: server-side JavaScript (`$where`, `eval`, `$function`), an aggregation
writing into a collection (`$out`, `$merge`), dropping a database, a
server-administration command. The driver does not send them, so a request that
does is either a bug or somebody who reached the socket and is looking around.

`internal/util/canary` refuses them with the ordinary *"operation not supported
by this build"* - the same answer an unimplemented command gets - and appends
`canary:<id>`, which WeKan reads off the error and records with the account and
the address. The package **writes nothing**: no file, no table, no counter, so
hammering it costs one string comparison per request. The **SQL guard** marks
its refusals the same way; it already refused a statement carrying what only
injection produces, but a line in the database's own log is not somewhere
anybody looks.

On MongoDB there is no FerretDB to mark anything and these operations simply
never appear, so the feature degrades to nothing rather than misbehaving.

</details>

**Admin Panel / Problems / Filesystem integrity** - whether the stored files
are still the files WeKan stored.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2cc0d42dd">A daily paced check of every stored file's name, date and four hashes</a>. Thanks to xet7.</summary>

Attachments and avatars are files under `WRITABLE_PATH`, and the database holds
one document per file. **Nothing checked that the two still agree.** A file can
be replaced, truncated, back-dated or deleted by anything that reaches the
filesystem - a bad restore, a sync tool, a container rebuild, a shell on the
volume - and WeKan would keep serving whatever is there now.

A baseline per file now lives in the existing WeKan database (no new files under
`WRITABLE_PATH`): path, size, modification time and **md5, sha256 and sha512**.
Three, because md5 is what other tools print - so an admin can compare with a
backup using what they already have - and because two digests over the same
bytes cannot disagree: when they do, the bytes were not read the same way twice,
which is a failing disk rather than a substitution, and is its own critical
finding. **ed25519** is the fourth check and is not a hash but a signature,
answering what the digests cannot: *who says these are the right hashes?*
Anybody who can rewrite a file can rewrite a row of hashes, so each entry is
signed and verified on every scan.

The scan runs **once a day**, never at or above **60% CPU**, with a **pause
between every file** (50 ms, plus 20 ms per megabyte) and a **fifteen-minute
budget** after which it stops and continues tomorrow - and reads each file
**once** for all three digests. A run that stopped early does not report what it
never reached as missing.

The finding is a change **with no record saying why**. A change WeKan made is
reported once and re-baselined; a change nothing accounts for keeps showing
until somebody looks. Crashes and downtime are in the same stream, from a
heartbeat the next start reads: a first run and a clean stop record nothing, and
a long gap with no clean-shutdown mark says so, with how long the server was
down.

</details>

and updates the following dependencies:

- **@aws-sdk/lib-storage 3.1085.0 → 3.1104.0** — the S3 multipart uploader the
  optional S3 attachment storage uses.
- **markdown-it 15.0.0** — the markdown renderer behind card descriptions and
  comments. A major version; its breaking changes are in plugin APIs WeKan does
  not use.
- **@playwright/test 1.62.0 → 1.62.1** — the browser test runner, in
  `tests/playwright` only; it ships in no WeKan bundle.
- **actions/checkout 4 → 7**, **actions/download-artifact 4 → 8**,
  **actions/upload-artifact 4 → 7** — the GitHub Actions steps every release
  workflow starts and ends with. Build-time only.

Thanks to dependabot.

and fixes the following bugs:

**Comment reactions** - who a reaction says it belongs to.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/156121c4bc0428a5a1edf5db9fbda6cac916d3ea">React as yourself, not as somebody else</a>. Thanks to xet7.</summary>

The same shape as CommentBleed, one collection over. A `CardCommentReactions`
document holds
`{ cardCommentId, reactions: [ { reactionCodepoint, userIds } ] }` and the whole
array is ONE field, whose allow rule was board membership for
insert, update and remove alike. So any member could `$set` `reactions` to
anything: add a colleague's userId to a reaction they never made, or remove one
they did. `toggleReaction()` only ever touches the caller's own id, so no
legitimate client sends anything else - the rule simply never said so.

Integrity rather than confidentiality, since reactions are visible to the whole
board already, but it puts words in another person's mouth. A deny rule now
refuses an update that changes any OTHER user's presence in any reaction. The
decision compares MEMBERSHIP rather than array order, because the client
rebuilds the array on every toggle and a reordered array with the same
membership is the same set of reactions. The modifier forms that cannot be
checked that way - `$push`, `$pull`, `$addToSet`, `$unset`, a dotted
`reactions.0.userIds` - are refused outright. Read-only and no-comment members
still may not react at all, as before.

</details>

**Admin Panel / Problems / Database problems** - two of its own reports, acted
on.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/30e8e38f6">Fix the two bugs the Database problems page was reporting</a>. Thanks to xet7.</summary>

The page was doing its job and nobody had acted on it. `moveSwimlane` threw
*"update is not available on the server. Please use updateAsync()"* four times
in
a week, because the default-swimlane self-heal called the synchronous
`Swimlanes.upsert()` that Meteor 3 removed on the server; it starts the async
one
without waiting now, since the getter around it cannot await. `moveList` threw
*"ValidationError: Failed validation, Cannot read properties of undefined
(reading 'title')"* when a list had no title: the insert failed schema
validation and collection2's error formatter then crashed on the undefined
field, so the admin saw neither the list nor the real problem. It now says
"This list has no title, so it cannot be moved to another board" before the
insert, and the two `console.log` lines that printed the title to a log nobody
reads are gone.

Both errors also gained a classifier rule, so neither reads as *unknown /
unclassified* again: they say plainly that this is WeKan's bug rather than the
database's or the admin's, and where to report it.

</details>

and has the following developer-facing changes:

**The test suite** - what it claims to guard, and what it actually does.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a4a9c03b1fc75d61760a35c87decbaf7a3081973">Security tests say which vulnerability they guard, and the list is checked</a>. Thanks to xet7.</summary>

"Are the security tests enough to prevent what is in the Hall of Fame" was
unanswerable. WeKan publishes 58 named vulnerabilities; some suites named the
one they belong to, most did not, and the Hall of Fame lives in a different
repository that CI never checks out - so answering it meant reading 58 pages
against 300 suites by hand, which means it was never answered. A regression test
that quietly stops existing is worth nothing, which is the failure mode
`tests/testsAreRegistered.test.cjs` already caught once, when two \*bleed suites
had drifted out of the mocha index.

The list lives in the repository that has the tests now, and
`tests/securityRegressionCoverage.test.cjs` keeps the two in step. Every
published vulnerability is either GUARDED - named by a suite that still exists -
or RECORDED, a gap with a written reason, which is this CHANGELOG's `TODO Later`
pattern applied to tests. The gap count is pinned, so a vulnerability cannot be
published with neither a test nor a note; a gap that turns out to be guarded
after all fails too, so coverage is never understated; and a file that merely
REGISTERS suites is not accepted as coverage, or the guard would pass itself.

Getting there meant naming vulnerabilities in the suites that already guarded
them. `tests/securityMeifukun.test.cjs` guards eight reports and named one: its
sections are RedirectBleed, SourceBleed, LiveBleed, CasBleed, OidcBleed,
MetricsBleed, ImpersonateBleed and InviteBleed - seven vulnerabilities that
looked untested and were not. `tests/noIdentityReplacement.test.cjs` guards
IdentityBleed and PatternBleed. ExportBleed, CrashBleed, MimeBleed and the four
LockoutBleed suites now say so too, and the cross-board suite also checks
BoardBleed's move deny on Lists and Swimlanes, not only Cards.

The count that comes out of it: **29 of 58 published vulnerabilities have a
named regression test, and 29 are recorded gaps** - mostly older fixes from
before WeKan tested its security fixes at all. They are not known to be
unprotected; they are known to be unchecked, which is a different and more
honest statement, and each one now says what it would take to close it.

</details>

**The release and setup scripts** - what the build menu offers, and what it
still carries.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6def3a14d">Setup: "git pull" and "git push" that finish the job, replacing "Update git"</a>. Thanks to xet7.</summary>

The build menu's `Update git` did a `git pull` and left it there, so a
contributor who used it still had to know the other half by heart. It is two
entries now - one that pulls and one that pushes - and each does the whole
thing, submodules included, rather than the first step of it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8c2565e99">releases/: delete two superseded scripts, and two exemptions that outlived them</a>. Thanks to xet7.</summary>

Two scripts in `releases/` had been replaced by the release workflow and were
kept only because guards had been written to exempt them. Both the scripts and
their exemptions are gone, so the guards now describe what is really there -
an exemption that outlives its reason is how a check quietly stops checking.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.73 2026-08-08 WeKan ® release

**In short:** a **GitHub CodeQL** finding fixed after v10.72 was tagged -
**PatternBleed**, a string replacement that replaced a hyphen with itself, so an
escape that looked like one was not there - and a guard that catches the whole
class in WeKan's own test run rather than days later in a web interface. The
binaries below are v10.72's: nothing here rebuilds them.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-amd64) | v1.45.0 | `94713f605167abb45a3717482d35de4824cb4a8f199c1400e826a8a2b04f3893` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-arm64) | v1.45.0 | `275ae50ac97e6a70eee72e6de37766c458775c5997c896352db5189c6cf1f04b` |
| loong64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-loong64.tar.xz) | v24.19.0 | `c24f224726f2d785bd18a1fd09f5e6d1fecf0269928451a60c5da9eac8e92e68` |
| loong64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-loong64) | v1.45.0 | `28bf67981168dfc4bd67698b41dd62628aafe347a77f2b1e6ffcadf009d575e0` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-mac-arm64) | v1.45.0 | `639ed58b84820b3d588f4161c64d0ab940d0cc6e7d022088d60c2b0b97f99f8e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-mac-amd64) | v1.45.0 | `fd519903f5630e881e38e7c5814f00c0e89ad26f6785f1ddcbab4058356fc9f3` |
| ppc64le | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-ppc64le.tar.xz) | v24.19.0 | `c510c6ce12f07010f771e6edb22a3fe23f4f2e6f40b1ffd4941aed0646a0d8b3` |
| ppc64le | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-ppc64le) | v1.45.0 | `de4518c7774d302533369c477759ddd866785d6741d98d399388eb8de3df175a` |
| riscv64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-riscv64.tar.xz) | v24.19.0 | `cd1f14af2812148002f58b58a5f9af512a50e3b8e8c148e0db44019dcb68edfd` |
| riscv64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-riscv64) | v1.45.0 | `7dc2952f554e8800c4029577901999e06e10272da686f7e402177080067028f9` |
| s390x | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-s390x.tar.xz) | v24.19.0 | `a4792e65962ffa0af42627aacf1122a60c3c88dbf4e4184f06820d66f9da8ba4` |
| s390x | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-s390x) | v1.45.0 | `0ae2e2f2cffdc5dd2ea4f125281a5e12eea216fbe49b5561d9c001700c3fc0c1` |
| win64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip) | v24.19.0 | `57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73` |
| win64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-win64.exe) | v1.45.0 | `f6337994368a52d011d438c82b914b0cedb3178fd030acac8db3dab8017cee85` |

This release fixes the following SECURITY ISSUE found by GitHub CodeQL code
scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f3a12533d756a01472e0d1904eaafb39ec776880">PatternBleed: a string replacement that replaced a hyphen with itself, and a guard for the whole class</a>. Thanks to GitHub CodeQL code scanning and xet7.</summary>

[PatternBleed](https://wekan.fi/hall-of-fame/patternbleed/) - code scanning
alert #431, rule `js/identity-replacement` (CWE-116), in
`tests/releaseNodeSources.test.cjs`: a platform name was interpolated into a
regex through `p.replace('-', '-')`, which replaces a hyphen with a hyphen. It
reads as "escape this before putting it in a pattern" and does nothing at all,
so the value went in raw.

Nothing failed, because a hyphen outside a character class needs no escaping -
but the guard it looked like was not there, and a platform name carrying a `.`
or a `+` would have matched the wrong row or thrown. CodeQL is right to flag the
shape: its usual cause is a mistyped backslash escape, where a replacement meant
to double a character silently is that character. The name is escaped for real
now, with the same `escapeRegExp` the other guards in `tests/` use.

`tests/noIdentityReplacement.test.cjs` catches the class rather than the
instance - code scanning reports these days later in a web UI, the node suites
report in fifteen seconds. Three things it took to make it honest: it compares
the two sides as VALUES rather than as source text, since an escaped quote and a
plain one are the same value and a text comparison would miss the very mistake
it exists for; the two quote styles are separate alternatives rather than one
character class excluding both, because CodeQL's own example puts a double quote
inside a single-quoted literal and the first shape of the pattern could not
match it; and comments are stripped, with the guard skipping its own file,
because this file and the one it was written for both quote the bad line to
explain it. Verified in both directions - the repository is clean, and the same
scan against the previous commit reports the offending line.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.72 2026-08-08 WeKan ® release

**In short:** a **GitHub CodeQL** finding is fixed - a string replacement that
replaced a hyphen with itself, so an escape that looked like one was not there -
with a guard that now catches the whole class in the test run rather than days
later in a web UI. Then: the prereleases WeKan was running on become finals -
**Meteor
3.5.1** and **@meteorjs/rspack 2.1.0** - and two dependencies take a major
version: **jQuery 4** and **@babel/parser 8**. jQuery 4 stopped the server from
starting at all. It throws `jQuery requires a window with a document` the moment
it is loaded outside a browser, and the **CSV importer** carried an unused
jQuery import that the server bundle pulled in, so every start died before the
first route existed. That import is gone, and a new guard walks the server's
import graph so no browser-only package can reach it again. The **snap** builds
are the other half: v10.71 published no snap for **armhf**, **s390x**,
**ppc64el** or **riscv64** and no **wekan-gantt-gpl** amd64, for three unrelated
reasons - a **Caddy** version lookup rate-limited by the GitHub API, two
**MongoDB** library packages under names Ubuntu 24.04 does not publish on armhf,
and a `bin` that is staged when it is not a directory - and the
**snap-launchpad** job now keeps the whole build log and outlives its own
retries, which is what made those three take two attempts to find. On a board,
**picking up a card** no longer stretches every list to fill the window: a card
drag switches the board's panning off by removing a class, and in lists view
that same class was the only thing holding the lists at their width. **Moving a
card to another board** failed for everyone with a 403 from Meteor's
insecure-write rule, and the REST route offered as a workaround left the card
pointing at a list on a board it was not on; both are fixed. Below that: an npm
dependency refresh, `Tests -> EVERYTHING` in **build.sh** and **build.bat**
growing the one check it never ran and one browser log per browser on Windows,
companion repositories moving into **.tools/** with the build scripts cloning
them on demand, an **LDAP** group base for directories that keep users and
groups apart, a **REST** answer for when a list last changed, guards pinning
what a **board export** contains, and the usual documentation and translation
work.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-amd64) | v1.45.0 | `94713f605167abb45a3717482d35de4824cb4a8f199c1400e826a8a2b04f3893` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-arm64) | v1.45.0 | `275ae50ac97e6a70eee72e6de37766c458775c5997c896352db5189c6cf1f04b` |
| loong64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-loong64.tar.xz) | v24.19.0 | `c24f224726f2d785bd18a1fd09f5e6d1fecf0269928451a60c5da9eac8e92e68` |
| loong64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-loong64) | v1.45.0 | `28bf67981168dfc4bd67698b41dd62628aafe347a77f2b1e6ffcadf009d575e0` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-mac-arm64) | v1.45.0 | `639ed58b84820b3d588f4161c64d0ab940d0cc6e7d022088d60c2b0b97f99f8e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-mac-amd64) | v1.45.0 | `fd519903f5630e881e38e7c5814f00c0e89ad26f6785f1ddcbab4058356fc9f3` |
| ppc64le | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-ppc64le.tar.xz) | v24.19.0 | `c510c6ce12f07010f771e6edb22a3fe23f4f2e6f40b1ffd4941aed0646a0d8b3` |
| ppc64le | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-ppc64le) | v1.45.0 | `de4518c7774d302533369c477759ddd866785d6741d98d399388eb8de3df175a` |
| riscv64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-riscv64.tar.xz) | v24.19.0 | `cd1f14af2812148002f58b58a5f9af512a50e3b8e8c148e0db44019dcb68edfd` |
| riscv64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-riscv64) | v1.45.0 | `7dc2952f554e8800c4029577901999e06e10272da686f7e402177080067028f9` |
| s390x | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-s390x.tar.xz) | v24.19.0 | `a4792e65962ffa0af42627aacf1122a60c3c88dbf4e4184f06820d66f9da8ba4` |
| s390x | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-s390x) | v1.45.0 | `0ae2e2f2cffdc5dd2ea4f125281a5e12eea216fbe49b5561d9c001700c3fc0c1` |
| win64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip) | v24.19.0 | `57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73` |
| win64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-win64.exe) | v1.45.0 | `f6337994368a52d011d438c82b914b0cedb3178fd030acac8db3dab8017cee85` |

This release updates the following dependencies:

- **Meteor 3.5.1-beta.0 → 3.5.1** — the framework WeKan is built on, now on the
  final release instead of the prerelease it was tracking. The four packages
  that were on `-beta351.0` builds move to their finals with it: `ecmascript`
  0.19.0, `rspack` 1.2.0, `mongo` 2.5.0 and `accounts-password` 3.3.1.
  [Update](https://github.com/wekan/wekan/commit/65984b912ee0857a49f240cbaa5b74965b57eb3c).
  Thanks to Meteor developers and xet7.
- **@meteorjs/rspack 2.1.0-beta.0 → 2.1.0** — the bundler Meteor builds the
  client with, the counterpart of the Meteor release above and off its
  prerelease for the same reason. Fifteen packages leave the lockfile with it:
  `node-polyfill-webpack-plugin` and the browser shims it carried
  (`crypto-browserify`, `browserify-sign`, `elliptic`, `node-stdlib-browser`
  and their dependencies). `body-parser` moves 1.20.5 → 1.20.6 in the same
  install.
  [Update](https://github.com/wekan/wekan/commit/0878de010e418a613df3e19b9e171d31eaf6016c).
  Thanks to developers of dependencies and xet7.
- **jquery 3.7.1 → 4.0.0** — the DOM library the whole client is written
  against, a major version. It drops Internet Explorer and the long-deprecated
  helpers `$.isArray`, `$.isFunction`, `$.isNumeric`, `$.type`, `$.trim`,
  `$.proxy`, `$.now` and `$.parseJSON` - gone from
  `node_modules/jquery/dist/jquery.js`, and none of them called anywhere in
  WeKan's own client code - and it no longer tolerates being loaded where there
  is no document, which is the boot crash fixed below.
  [Update](https://github.com/wekan/wekan/commit/459ea80d041f4e542bb26cdbad1ff84a75bc409d).
  Thanks to dependabot, jQuery developers and xet7.
- **@babel/parser 7.29.7 → 8.0.4** — the parser Babel reads JavaScript source
  with, also a major version. Nothing in WeKan's source imports it; it is
  declared in `package.json` so the build resolves a single version of it.
  [Update](https://github.com/wekan/wekan/commit/7727e5129682d09e807af40c1769c60f16010927).
  Thanks to dependabot and xet7.
- **An npm dependency refresh** — 926 → 903 packages in the lockfile, moving the
  AWS S3 client 3.1095.0 → 3.1105.0, `dompurify` 3.4.12 → 3.4.13, `markdown-it`
  14.2.0 → 14.3.0, `markdown-it-emoji` 3.0.0 → 3.1.0, `temml` 0.13.3 → 0.13.4,
  `@rsdoctor/rspack-plugin` 1.5.11 → 1.6.1, `puppeteer` 25.3.0 → 25.5.0 and both
  halves of `typescript-eslint` 8.65.0 → 8.66.0. Only the lockfile changes: the
  version ranges in `package.json` stay as they are.
  [Update](https://github.com/wekan/wekan/commit/e30eb57e1a6435d5b151c01dc0bc6cf2e4e8a603).
  Thanks to developers of dependencies and xet7.

and fixes the following bugs:

**Signing in with LDAP** - where WeKan looks for the groups.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8b2e0038df5513c6cd9b409e063f1c9e3183514c">Groups may live in their own subtree, not only under the user base</a>. Thanks to leandro-cyberproject and xet7.</summary>

[#5539](https://github.com/wekan/wekan/issues/5539): WeKan could not
authenticate LDAP users whose groups sit in a different `ou` than the users.
Both group searches - `getUserGroups`, which feeds the login restriction, admin
status sync, group-to-role sync and org/team sync, and `isUserInGroup` -
searched `BaseDN`, which is the USER base. A directory that keeps `ou=groups`
beside `ou=people` has no groups under it, so every group search came back
empty; with `LDAP_GROUP_FILTER_ENABLE` on, `isUserInGroup` concluded "not a
member" and refused the login. Nothing in the package could say where the groups
were.

`LDAP_GROUP_BASEDN` says where, and falls back to `BaseDN` when unset or blank,
so a directory with one subtree behaves exactly as before - a present-but-empty
variable is one somebody meant to fill in, and searching `""` would silently
search the directory root. The three USER searches keep `BaseDN`: pointing those
at a group subtree would break login for everyone, so the guard pins which
searches moved and which did not. Documented in `docs/Login/LDAP.md` and
`docker-compose.yml`, because a setting nobody can find is one that does not
exist.

</details>

**The REST API** - what a list can be asked about.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/50083104c74f4b6ea2c55431e1c0cece2074442c">A list says when it changed, and when its cards last did</a>. Thanks to mimZD and xet7.</summary>

[#5251](https://github.com/wekan/wekan/issues/5251) asked for a list's last
change date, to build an offline client that syncs only what moved. Neither half
existed: the list endpoint returned `{_id, title}` and no dates, and while the
single-list endpoint returns the whole document, its `modifiedAt` answers the
wrong question - it moves when the LIST changes (title, sort, archived), and a
card being added, edited or archived does not touch it.

`GET /api/boards/:boardId/lists` reports both now: `modifiedAt` for the list
itself, and `cardsModifiedAt` for the newest change among its cards, null when
there is none. One query for the board and a reduction in memory, not a query
per list - which is what made this expensive enough to ask about - and archived
cards count, since archiving is one of the changes named. The reduction is a
pure helper: it reads the legacy `dateLastActivity` as well as `modifiedAt` and
takes whichever is newer, skips a card with no usable date rather than counting
it as now, and leaves a list with no dated cards ABSENT so the endpoint reports
null instead of an invented time - a client polling on a wrong date either never
syncs or syncs forever.

</details>

**Controls and the things they belong to** - five reports, five causes.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c687daadf4d357e5653c7807320e3161302a798e">Two misplaced checkboxes, a crowded Save button, and the WIP counter back on the list title line</a>. Thanks to Alishara and xet7.</summary>

The screenshots in
[#6465](https://github.com/wekan/wekan/issues/6465#issuecomment-5187985815),
each with the fault circled.

*"Checkbox is misplaced"* - the Admin Panel people table. The select-all box and
the "all users" it labels were two loose inline nodes in a centred table
heading: the box is replaced content with its own baseline, and at that column's
width it landed on the word. One `<label for>` now, an inline-flex row with a
gap that cannot collapse - which also makes the word click the box.

*"This checkbox is crazy"* - Member settings. That row carried a `b &nbsp;`
spacer and `.left`, which is `float: inline-start`. A float inside a flex
container is ignored and the spacer became a stray flex item, so the box drifted
up beside the "Card settings" heading instead of sitting with its own text. It
is the same shape every other checkbox row in that file uses now.

*"(2/5) move this up here"* and *"make this same height as the lanes left and
right"* - one cause, not two. The WIP counter is already inside the heading
right after the title; the title is a `+viewer`, and `.viewer` is `display:
block` with a 22px `min-height`, so it pushed everything after it onto a second
line AND reserved a band under it, which is what made that list's header taller
than its neighbours'. Inline, the counter stays where the markup already puts
it.

*"Please move the button down. This is too close"* - the backup schedule's Save
sat directly under the 1-28 day buttons, close enough to hit while aiming for a
date. The gap is on the group that FOLLOWS the day grid, so it applies where
that grid is and nowhere else. And *"the alignment is out of place"* - the
attachment move button - is normalisation rather than a measured fix: the row
aligns at the bottom, so a margin of the button's own offsets it from the
controls it acts on; that is zeroed and the alignment made explicit. Whether
that is the whole of what was circled needs a browser, and the guard says so.

</details>

**Outgoing webhooks** - who a webhook says did something.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b83e8e256ca1fc77db4bd42e530d1249e63ffb2">A webhook sends the username as well as the display name</a>. Thanks to xet7.</summary>

[#3113](https://github.com/wekan/wekan/issues/3113): an outgoing webhook said
who did something by DISPLAY name, and had no field for the login name.
`params.user` comes from `getActivityUserName()`, which prefers `getName()`
because the same params feed the e-mail notification text - "Lauri Ojansivu
commented on ..." is what a person wants to read there. A webhook consumer needs
the identifier instead: it received the full name where it needed `xet7`, and
matching users by display name is wrong the moment two people share one.

Changing what `user` means would break every consumer already reading it, which
is why this sat in TODO Later as needing a decision. It needs none: the username
travels as its own field. `user` is untouched, `username` is beside it in the
default `WEBHOOKS_ATTRIBUTES` list, and a deployment that pinned its own list
still gets exactly the fields it asked for.

Two more left the backlog with it.
[#6542](https://github.com/wekan/wekan/issues/6542) - "Users imported: 60, but
only 25 are listed" - is already true in this source: the People pane paginates
and shows its total beside the rows, which is what the report was about.
[#6500](https://github.com/wekan/wekan/issues/6500) was closed upstream and was
only sitting there. The rest of the backlog stays, each with its reason - an
SMTP server, an LDAP directory, a container, a browser to drag in, or a decision
on an intended contract, none of which a source reading settles.

</details>

**Logging in with OIDC** - what happens when the provider says no.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a50b483ff92786886acf2faf99e7072e6b2c9607">A provider that refuses the request says so, instead of "Cannot read property 'ocs' of null"</a>. Thanks to Esther125 and xet7.</summary>

[#5174](https://github.com/wekan/wekan/issues/5174): an OIDC login against a
provider that rejected the request failed with `Error in OAuth Server: Cannot
read property 'ocs' of null`, which says nothing about the refusal that caused
it - the reporter's actual problem was a scope the provider did not allow.

`getTokenContent()` returns NULL for a token it cannot parse, and the ADFS/B2C
branch assigns that straight into `userinfo`. The next line was the Nextcloud
hack, `if (userinfo.ocs)`, so the first thing to touch the failed response was a
property read on null. Every claim read after it had the same problem; that line
was first only by accident of ordering. So the fix is not one null check but an
order: the provider's answer is validated once, as a whole, before anything
reads a field off it, and each failure names what failed.

Checked now: that the token response is an object; that it carries an
`access_token` or an `id_token`, with a 200 carrying neither reported by listing
the fields that DID come back - keys only, because the values are secrets; that
`userinfo` is a non-null object, saying which path produced nothing and pointing
at `OAUTH2_REQUEST_PERMISSIONS`; that the `ocs` and `metadata` hacks unwrap to
something, since `ocs` without `ocs.data` used to set `userinfo` to undefined
and fail one line later; that Azure AD B2C's `emails` claim is an array before
it is indexed; and that `expires_in` parses to a finite number, since
`parseInt(undefined)` is NaN and NaN propagated into the account's expiry
silently. The guard pins the ORDER, because an edit that reads a claim earlier
would restore the bug without touching a check.

</details>

**The size of things on a board** - what is bigger than what.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a95451c67b65eb459d0ad94d3ea7ccec7e4319ed">A list heading is bigger than the cards under it again, and the Add button is a control</a>. Thanks to xet7.</summary>

Reported by email with a screenshot: the *Add card* link and the *Add* button
are too big, and things should be sized in relation to each other the way an h1
is bigger than an h2.

The measurements agreed. A list heading was 14px, while a minicard title and the
*Add card* link set no size at all and inherited the document's 16px, and the
composer's Add button was a 50px-tall slab. The column was labelled in fine
print, the affordance for making a card was as loud as the cards themselves, and
the biggest thing on screen while typing was a button.

The scale is heading 16 > card title 14 >= add-card link 13 now, each stating
its own size instead of inheriting, and the Add button is a 34px control. Mobile
keeps its own larger sizes - the `.mobile-view` rules and the `@media` blocks -
because a phone is read at arm's length. The guard pins the ORDER rather than
the numbers, since that is what "in relation to each other" means, and that each
of the three states a size of its own: an inherited size is exactly how the link
and the card title both landed on 16px, level with each other and above their
heading.

</details>

**Moving a card to another board** - the card dialog, and the REST route.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/24927c3a7a2d114dc3813068bbe2380082ba8458">A cross-board move no longer fails with "Untrusted code may only updateAsync documents by ID"</a>. Thanks to jullbo and xet7.</summary>

[#6572](https://github.com/wekan/wekan/issues/6572): every cross-board move
failed immediately with `Not permitted. Untrusted code may only updateAsync
documents by ID. [403]` - whether or not the card had any dependencies, and
before the move itself ever ran, so the card stayed where it was.

`models/cards.js` is isomorphic, so its helpers run in the client bundle, and
client code calls `card.move()` directly. Meteor lets untrusted code update only
BY ID - a bare id, or an `{ _id: ... }` selector. The cross-board branch of
`move()` cleaned up inbound *Red Strings*
([#3392](https://github.com/wekan/wekan/issues/3392)) with a compound selector
and `multi: true`, which the client rejects every time, including when it would
have matched nothing. `addDependency`, `setDependencyProps` and
`removeDependency` in the same file each carry a comment saying updates must be
by `_id` only - this was the one place that did not follow it.

The card's own dependencies are still cleared by the move; that rides along in
the by-id update. The inbound half - the links pointing AT the card from the
board it left - is a `Cards.after.update` hook in `server/models/cards.js` now,
where a selector is allowed, and being server-side it also covers the REST API
and import paths, which never called the helper at all. It pulls both stored
shapes: the `{ cardId, ... }` objects, and the bare id strings older data still
holds, which `normalizeDependencies` hides on read.

The report also says the REST workaround corrupts the card, and it does. A PUT
of `boardId`/`listId`/`swimlaneId` naming the DESTINATION board is not a board
move - that needs `newBoardId`, `newSwimlaneId` and `newListId` - so the
board-move branch never ran, while the same-board swimlane and list branches
did: the card kept its old `boardId` and got the other board's `listId` and
`swimlaneId` written onto it, pointing at a list and a swimlane on a board it
was not on. It showed on neither board and took a hand-written database update
to undo. Both branches now check that the target belongs to the board in the URL
and otherwise refuse with a 400 naming the parameters to use, and they are
skipped during a board move - they would rewrite `listId` before the board-move
update, whose selector pins the card's original `listId`, so that update would
match nothing and silently do nothing: the same broken card by another route.

</details>

**Dragging a card** - what the rest of the board does while one is in the air.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6b0af16ebae40005f19f28a8bf4dac2c00b0081">Picking up a card no longer stretches every list to fill the window</a>. Thanks to yulqen and xet7.</summary>

[#6573](https://github.com/wekan/wekan/issues/6573): the moment a card was
picked up, every list on the board expanded horizontally to fill the page, and
dropping it snapped them all back - which makes landing a card in the intended
list a guess. It happened when dragging inside one list too.

Two changes that are each correct alone met. A list's custom width is an inline
`--list-width` custom property, and what turns that property into an actual
width is a rule in `list.css` whose selector needs an ancestor: `.js-swimlane`,
`.dragscroll`, or a `swimlane-<id>` id. In **lists view** the container is
`.swimlane.list-group.js-lists.dragscroll` - it has no `js-swimlane` class and
no such id - so `.dragscroll` was the only one of the three that matched, and
every list's width on that view hung on that one class. Then
[#6558](https://github.com/wekan/wekan/issues/6558) taught a card drag to stop
the board panning under the same pointer, and the way it does that is to REMOVE
the `dragscroll` class from the board for the duration of the drag and put it
back on drop.

So the drag deleted the class the width rule was matching on: `flex: none` and
the three width declarations switched off, the lists fell back to the flex rules
and re-flowed to fill the window, for exactly as long as the drag lasted. It
explains the workaround in the report too - dragging a list's edge first sets
that list's width through the resize path, which is why that one column stopped
jumping while the others still did.

A layout rule may not hang on a class that an interaction removes. `.js-lists`
is on the container in BOTH views and nothing takes it off, so the width rules,
their mobile-mode counterpart and the resize rules now name it.
`tests/listWidthDuringDrag.test.cjs` pins that every width rule still matches in
lists view with `dragscroll` gone - it fails on the previous CSS, and it also
pins the premise, that suspending the pan really does remove that class.

</details>

**The server bundle** - what a client-side import may drag into it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6cada892d9bff5775995e90e70df027f5bc4e1f3">An unused jQuery import in the CSV importer crashed the server at boot under jQuery 4</a>. Thanks to xet7.</summary>

jQuery 4 changed what loading it outside a browser does. Its CommonJS entry
point runs the factory as soon as the module is required - `module.exports =
factory( global, true )` - and the factory's first statement throws when
`window.document` is missing. Under jQuery 3 the same import did not stop the
server: it had been sitting in `models/csvCreator.js` since the CSV importer was
written and WeKan started with it in place every time. Line 3 was `import {
isEmptyObject } from 'jquery'`, and the file never called `isEmptyObject`
anywhere - the import was unused from the day it was added.

`server/imports.js` loads `/models/csvCreator`, because the server is what
imports a CSV or TSV board, so that unused import put jQuery in the server
bundle - where there is no window and no document. The bump to jQuery 4 turned
it into a boot crash: the bundle threw while it was still being evaluated,
before a single route, publication or method existed, so there was no error page
and no log entry, only a stack trace ending in `Object../models/csvCreator.js`
and `Module../server/imports.js`, and `Exited with code: 1`.

The import is removed, and nothing else changes, because nothing used it. It was
the only jQuery import anywhere under `models/`, `server/`, `imports/` and
`config/`, and the rebuilt `_build/main-dev/server-rspack.cjs` now contains the
csvCreator module with no reference to `node_modules/jquery` left in it.

The new `tests/serverBundleBrowserImports.test.cjs` keeps it that way. It walks
the import graph from `server/main.js` - 410 files - and fails if any file it
reaches names a package that needs a DOM: jquery, jquery-ui, the touch-punch and
dragscroll add-ons, blaze, bootstrap. Its negative tests pin that the bug as it
actually was is reported, that a deep path such as `jquery/dist/jquery.js`
counts as the same package, and that an ordinary server package is not flagged.
An unused import is invisible in review and free on the client, so a guard is
what catches the next one.

</details>

and has the following developer-tooling fixes:

**What the snap is built from** - the parts in `snapcraft.yaml`.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3c7926662c5e14dde16465d6a5380746cf298708">The Caddy part stops asking the GitHub API which version to download</a>. Thanks to xet7.</summary>

The `caddy` part resolved the newest Caddy release through
`api.github.com/repos/caddyserver/caddy/releases/latest`. That API rate-limits
unauthenticated callers by IP address, and a CI runner shares its address with
every other job on the same host, so it answers 403 whenever the neighbours have
been busy. In v10.71 it did, and one line failed the whole wekan-gantt-gpl amd64
snap: `curl: (22) The requested URL returned error: 403`, then `'override-build'
in part 'caddy' failed with code 22`.

There was already a pinned fallback for exactly this, on the very next line, and
it never ran. snapcraft executes a scriptlet under `set -o pipefail` as well as
`set -e`, so the 403 failed the *assignment* and ended the part one line above
its own safety net - which is why the job log shows `CADDY_VERSION=` being set
to nothing and then nothing more. A fallback that the failure it covers skips
over is not a fallback.

The version now comes from `github.com/caddyserver/caddy/releases/latest`, which
is a redirect to the newest tag rather than an API call and is not rate-limited
the same way; the tag is read out of the URL it lands on. The lookup is allowed
to fail (`|| true` keeps the substitution's status 0), an empty answer selects
the pin, and a release that publishes no archive for this architecture falls
back to the pin as well instead of failing the snap. Setting `CADDY_VERSION` in
the environment still overrides everything, for a reproducible build. Verified
by running the scriptlet: it resolves 2.11.4 from the redirect, falls back to
the pin with the lookup pointed at an unreachable host, honours an explicit
`CADDY_VERSION` - and the old line, under the same shell options, dies before
its fallback exactly as it did in the release.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3c7926662c5e14dde16465d6a5380746cf298708">The mongodb part asks for the package names Ubuntu 24.04 really publishes</a>. Thanks to xet7.</summary>

The armhf snap never got as far as building anything: `Stage package not found
in part 'mongodb': libssl3.` and, on the next attempts, the same for
`libgoogle-perftools4`. Ubuntu 24.04's 64-bit `time_t` transition renamed both
packages to `libssl3t64` and `libgoogle-perftools4t64`. On the 64-bit
architectures the renamed package also *provides* the old name, so the old
spelling resolves there and the mistake stays invisible; on armhf the ABI
genuinely changed, there is no compatibility provide, and the old name does not
exist at all. One architecture failing on a name every other architecture
accepts is what that looks like from the outside.

Both are now spelled the way the archive spells them. Checked against the noble
archive rather than assumed: `libssl3t64` is published for amd64, arm64, armhf,
i386, ppc64el, riscv64 and s390x, and `libgoogle-perftools4t64` for every one of
those except i386 - which builds no snap, because core24 has no i386 port.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3c7926662c5e14dde16465d6a5380746cf298708">The mongodb part makes bin a real directory whatever it was before</a>. Thanks to xet7.</summary>

The s390x, ppc64el and riscv64 snaps died in the stage step, right after
`Staging mongodb`: `/build/.../stage/bin: Is a directory`, `IsADirectoryError`.
The part is staged last of the ones that carry a `bin/`, so `stage/bin` is
already a real directory by then, and staging something that is *not* a
directory on top of it fails the whole snap rather than that one part.

This was fixed once, in v10.70, by replacing a `bin` **symlink** with a real
directory - the shape the first failure had. The v10.71 logs show that guard
running, its `[ -L ... ]` test coming out **false**, and the build dying in the
identical way immediately afterwards. So `bin` was something else that is not a
directory, the symlink was only one shape of the problem, and a guard written to
one shape passes while the build breaks.

The condition is now the invariant rather than the diagnosis: when this part
carries no `mongod` - the FerretDB-only architectures, where MongoDB ships no
server and the build exits early - `bin` becomes an empty real directory,
whatever it was, since `rm -rf` takes a symlink, a regular file or a directory,
where the old `rm -f` took neither of the last two, and removing a symlink
leaves what it pointed at alone. An empty real directory merges into `stage/bin`
and changes nothing. Where `mongod` really is there, amd64 and arm64, nothing is
touched.

It also prints `ls -ld` of `bin` before and after, because the reason this
needed two attempts is that no log ever recorded what the thing actually was.
Verified by running the scriptlet against each shape - symlink, regular file,
missing, empty directory, and a directory holding `mongod` - and checking what
it leaves behind, including that the symlink case does not delete the directory,
it points at.

</details>

**The test suite itself** - guards that described the world before a change.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/55480290884fc3891083b83fbb6b1de4113a66be">Five guards catch up with the companion-repo move and the cross-board card fix</a>. Thanks to xet7.</summary>

A whole-run found five failures, all of them consequences of the two changes
before it, and every one a guard doing its job.

Three broke on the companion-repo move. Two of them - the `.meteorignore` scan
scope and the swc helper guard - listed the foreign checkouts BY NAME, one
ignore entry each: FerretDB, node, mongo-tools, TSC, gitea, the two WeKan
variants. A list of names is a list of history; it fails for the ones that moved
and says nothing about the next repo somebody clones. They ask the property now
- `.tools` is excluded, and nothing at the top of the checkout that is its own
git repository is left for Meteor to walk - and the variant check became the
stronger version of itself: no directory holding `client/`, `server/` and
`models/` is reachable from the top, since a second WeKan is loaded EAGERLY
rather than merely scanned. The third reads FerretDB's Go source and still
opened the old path; it reads `.tools/FerretDB`, and skips with a note when the
clone is not there, because that is another repository and not every checkout
has it.

The compose guard caught a real omission: the `LDAP_GROUP_BASEDN` block went
into `docker-compose.yml` only, and every compose file's `wekan` service must be
identical - what a user reads while editing their settings must not depend on
which backend they picked.

The mocha failure is the one worth reading twice. Its test pinned `move()`
issuing the inbound dependency cleanup itself: a multi-document update with a
compound selector - exactly what the cross-board move fix removed, because that
helper runs in the client bundle where Meteor allows updates only by id. **The
test was pinning the bug.** It asserts the contract that replaced it now:
`move()` clears the card's own dependencies and makes no update that is not by
id, with `{ _id: x }` still counting as by id - the rule is "by id", not "not an
object".

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96daaac3dbf988b72d3af2bc184333c3a4de49ee">A retry loop that outlived its own test, and an ignore entry that explains itself</a>. Thanks to xet7.</summary>

Two left over, and the second is not a flake.

The swc guard also required the `.gitignore` comment naming each clone - `-
node/ : clone of the Node.js ...` - which went with the entries it described.
`.gitignore` says what `.tools/` holds now, naming the entries it replaced so
the change is legible, and the guard requires that: an ignore of a whole
directory with no explanation is the kind nobody dares remove later.

One WebKit test of 243 failed, in the shared `boardPage` fixture rather than in
an assertion: *Test timeout of 60000ms exceeded while setting up "boardPage"*,
then *Target page, context or browser has been closed*. `openBoard` retries five
times, waiting up to 20s for a list each time with a second between - about 105
seconds, against a 60 second test timeout. The loop could never reach its own
error: Playwright killed the test first, so the report said the page had closed
instead of saying the board never rendered. Retrying past the point where the
result can still be used is not resilience, it is a worse error message.

It is bounded by a deadline now - 45s, leaving room for the rest of the fixture
inside the 60s timeout. The first attempt keeps its full 20s look, later
attempts get whatever is left, and it stops rather than starting a wait it
cannot finish, so a slow board still gets one long look and a board that will
not render fails with "did not render any lists within 45s". Simulated across
never-renders, renders-at-4s and renders-at-19s: all inside the test timeout,
where the old shape overran it by 45 seconds. The run after it was green - 328
node suites, 518 mocha tests, 249/243/243 in the three browsers, 98 conformance
cases with none differing, and FerretDB's own suites.

</details>

**The build scripts** - what `Tests -> 1` runs, on both platforms.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/40fff29d08ead7306911e112e97d381eb2f296c5">Companion repos live in .tools/, and the build scripts clone them there</a>. Thanks to xet7.</summary>

`wekan/FerretDB` is a separate git repository that WeKan's test runs need - the
conformance run builds it from source, and "Run all FerretDB tests" runs its own
suites. It was cloned as a subdirectory of the repo root, which is why
`.gitignore` and `.meteorignore` carried an entry per companion repo: nine of
them, each one a chance for a clone to reach a commit or a Meteor rebuild. They
live in `.tools/` now, one directory both files already exclude.

`build.sh` gains `ensure_tool_repo`: it returns the path to `.tools/<name>`,
cloning `wekan/<name>` if it is not there - SSH first, since a maintainer
pushes, HTTPS after, so everyone else still gets a working clone. Its messages
go to stderr, because the path is what it prints, and the directory comes from
the script's own location rather than the caller's cwd. EVERYTHING's FerretDB
stage calls it rather than assuming an earlier stage cloned already - a
whole-run must not depend on the order of its own stages - and `build.bat`
clones into `.tools\FerretDB` with the same fallback instead of printing
instructions and stopping.

The other half is that a repo inside `.tools` still has to find its way back
out. FerretDB's own `build.sh` writes its logs where WeKan writes its own, and
reached them with `$ROOT/../../log` - correct from `wekan/FerretDB`, one level
short from `wekan/.tools/FerretDB`, where it means `wekan/log` and nothing else
looks. It walks up until it recognises a WeKan checkout now, then applies
WeKan's own rule: `../log` when that is writable, `log/` inside the checkout
otherwise. Verified against five layouts, including the old one.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6b0af16ebae40005f19f28a8bf4dac2c00b0081">EVERYTHING runs the floating-promises guard too, and Windows gets one log per browser</a>. Thanks to xet7.</summary>

`./build.sh` -> Tests -> **EVERYTHING (sequential)** is what a maintainer runs
before a release, so a check that is in the Tests menu but not in EVERYTHING is
a check that runs only when somebody remembers it. The **floating-promises
guard** was exactly that: it is menu entry 12 and was in no whole-run. It is now
the first stage of four - it takes seconds, so an unawaited permission check is
reported before an hour of browsers rather than after it - and its return code
is part of the verdict like every other stage's.

What it runs there is checks only. The menu entry may install ripgrep and the
`@typescript-eslint` packages and write the rule into `.eslintrc.json`, which is
a person setting the guard up; EVERYTHING runs unattended, must not call `sudo`,
and must not modify the tree it is testing - a run that rewrites
`.eslintrc.json` is no longer testing the commit it started from. So the two
checks themselves - the rule is configured, and every
`Authentication.checkBoardAccess` / `checkBoardWriteAccess` in `server/models`
is awaited - are one function that both callers share, and it uses `grep` rather
than ripgrep so it also works where nothing may be installed to make it work. An
unawaited permission check returns a pending promise, and a promise is truthy,
so the call site passes a check that never ran.

On the Windows side, `build.bat` ran the three browsers as a single Playwright
invocation writing one `wekan-alltests-browsers.log`, where "which browser
failed" and "what did WebKit print" could not be answered afterwards - and
CLAUDE.md's "check the newest test logs" names the per-browser files. It now
starts chromium, firefox and webkit as three jobs with a log, a status and a
summary row each, as `build.sh` has always done, with a per-browser `--output`
because Playwright clears its output directory at startup and three jobs sharing
one would delete each other's traces. EVERYTHING itself is not reimplemented
there: Windows hands the whole run to `releases/run-everything.sh`, which calls
`build.sh --run-everything`, so there is one implementation and the new stage
arrives on both platforms at once. The parity guard now pins all of it,
including that the shared checks install nothing.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b55cbda20dcb1faa82d9c080472017f1e275c0e6">Tests -> EVERYTHING runs again instead of quitting the script</a>. Thanks to xet7.</summary>

Renaming the menu entry above broke it, between one commit and the next.
`choose()` shows the SHORT labels and sets `$opt` to the FULL DESCRIPTION of the
one picked, and the dispatcher hundreds of lines below matches that description
as a `case` arm - so the description is an identifier written twice, and the
rename changed only one of the two. With no arm matching and no catch-all, the
case fell through, the `for _once` loop ended and the script EXITED: choosing
`Tests -> 1` printed nothing and ran nothing at all.

The arm carries the same string as the menu entry again. Two guards so it cannot
come back: the parity test now checks every one of the 25 `choose()` entries
against the case arms and fails on a description that matches none - it fails on
the previous commit - and the dispatcher has a `*)` arm that names the option
with no handler and says nothing was run, so if one ever does get past the test,
the person at the menu is told rather than dropped back to the shell.

`build.bat` was checked for the same fault and cannot have it: its menus
dispatch on the NUMBER typed rather than on a sentence, and its EVERYTHING hands
the run to `releases/run-everything.sh` instead of reimplementing it. Verified
in both directions anyway - every printed menu number has an if-dispatch in all
seven menus, and every `goto` / `call` target resolves to a label - and that is
pinned now too.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f138b3124f7514909b0314ab3a6db367eb806056">The "Playwright ALL browsers" option on Windows writes logs again</a>. Thanks to xet7.</summary>

The `EVERYTHING` run above found this on its first green pass: the WeKan stage
failed on one node suite, `dbConformanceWiring`, with "build.bat: playwright-all
must be logged". Splitting the whole-suite browser job into three uncovered a
real gap rather than causing one.

`call :onelog playwright-all` existed in exactly one place - inside the combined
three-project browser line of the sequential all-tests flow, which is gone now
that each browser is its own job with its own log. Where it did exist it never
worked: the call sat inside the `cmd /c` string of a STARTED child process,
which has no `build.bat` labels to call, so `%ONELOG%` was empty and
`Tee-Object` was handed an empty path.

Meanwhile the option that name was supposed to cover - `Tests -> 11`,
"Playwright ALL browsers" - wrote no log at all: one `playwright test` call with
three `--project` flags straight to the terminal, nothing left to read
afterwards. That is exactly what the guard is about, and `build.sh`'s same
option has always written one log per browser. It now runs the three browsers
one at a time - still sequential, because three at once against one dev server
exhausts RAM on smaller machines - each through the same `:onelog` helper as
every other Tests option, and each with its own `--output` so Playwright does
not clear another browser's traces at startup. The guard drops `playwright-all`,
which named an implementation that is gone and was broken, and gains what it was
reaching for: that the ALL-browsers option logs, and covers all three.

</details>

**Board export** - what a backup contains, pinned against the source.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ee16a41a9963d2c579f52c62f9fccc14849c7aba">Every section of a board export is pinned, so a backup cannot quietly lose one</a>. Thanks to Tuphal, KhaoulaMaleh and xet7.</summary>

[#6274](https://github.com/wekan/wekan/issues/6274) was "export includes only
comments from current year": the exporters selected comments and activities by
`boardId`, and records written by older WeKan versions carry no `boardId`, so
every comment from a previous year was dropped from the JSON and the Excel
export alike. [#6275](https://github.com/wekan/wekan/pull/6275) fixed it by
selecting on the cards' ids, which every comment has. Its reporter then came
back with a second one: *"the export is now missing the lists part"*.

Both were checked against the current source rather than assumed. The fix from
PR #6275 is intact and survived the streaming-export rewrite that came after it:
`models/exporter.js` and `models/server/ExporterExcel.js` each select comments
by `cardId` and activities by `boardId` OR `cardId`, in all three of the
streaming JSON writer, the in-memory one and the spreadsheet. The missing
`lists` is not reproducible: `result.lists` has been written by the JSON
exporter continuously since the CSV/TSV export was added, both JSON writers emit
the same fourteen sections, and the flat formats carry each list's name on the
card's own row.

So nothing needed fixing, and nothing about the export changed - what was
missing was the guard. `tests/exportBoardSections.test.cjs` pins the section
list, that the two JSON writers agree on it (a key only one of them writes is a
section that appears or not depending on which path served the download), that
no exporter selects comments by board again, and the two smaller fixes from that
PR: the class has no `this.boardId`, which was the undefined field that ran a
query against no board, and a comment whose author has been deleted falls back
instead of writing `undefined` into the cell.

One thing that PR also fixed is deliberately gone: the Excel exporter used to
LOAD custom fields and render them nowhere, and the streaming rewrite dropped
that dead load along with the activities, checklists, subtasks and rules the
spreadsheet also never showed. Custom fields survive where an import reads them
back - the JSON export - and the guard pins them there.

</details>

**The mocha test stage** - what a suite on the client side may import.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ee16a41a9963d2c579f52c62f9fccc14849c7aba">A test that reads the repository moves to the side that has a filesystem</a>. Thanks to xet7.</summary>

`client/lib/tests/boardTriggersClass.tests.js` is the regression guard for
[#5188](https://github.com/wekan/wekan/issues/5188), the rule trigger that could
not be activated because a class name in the jade template and the one in the
event handler had drifted apart by a letter. It reads both files off disk with
`fs` and `path` and compares them - which is a server-side thing to do, and it
ran on the client, where it worked only because node-polyfill-webpack-plugin's
browser shims were in the bundle.

The **@meteorjs/rspack 2.1.0** update above drops that plugin, so the shims went
with it and the `meteor test` client build stopped on one line: `Cannot find
module 'path' for matched aliased key 'path'`. That is not one suite failing -
the client bundle does not build, so every mocha suite is skipped and the stage
reports a crash where its results should be. One file's import took out the
whole stage.

The suite was never wrong, only on the wrong side; it now lives in
`server/lib/tests`, registered in that index. A new guard,
`tests/clientTestsNoNodeBuiltins.test.cjs`, walks the client suites for imports
of Node builtins - the mirror of the existing guard that keeps browser-only
packages out of the server bundle - and pins where this one went. It strips
comments before looking, or the sentence explaining the fix would be reported as
the fault.

</details>

**Running the exotic builds on Launchpad** - and reading them afterwards.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3c7926662c5e14dde16465d6a5380746cf298708">A Launchpad build keeps its whole log, and the job outlives its own retries</a>. Thanks to xet7.</summary>

Two things about the job made the failures above harder to fix than they should
have been.

The build log is downloaded by `remote-build` and printed as its last 150 lines.
For v10.71's staging failure those 150 lines were the `IsADirectoryError` and
then lpbuildd's own Python traceback, the proxy-token revocation and the process
scan - everything except the mongodb part's output from an hour earlier, which
is the part that would have said what `bin` was. The Launchpad build log is
deleted along with the temporary snap recipe, so once the job ended, no copy of
it existed anywhere. The job now prints the lines *around* every failure marker
as well as the tail, and uploads the complete Launchpad and snapcraft logs as a
`snap-launchpad-logs-<arch>` artifact - on `always()`, not `failure()`, because
a build that succeeds on attempt 2 otherwise hides why attempt 1 did not.

The other is the job timeout, which was 180 minutes for a step that retries
three times. The riscv64 leg spent 2h24m on attempt 1 alone, almost all of it
queueing for a riscv64 builder, failed it on the `bin` bug above, and was cut
off 35 minutes into attempt 2 - the `The operation was canceled.` in that job is
this timeout and not Launchpad at all. A retry loop the job does not outlive is
not a retry loop; 350 minutes fits two slow attempts and stays under GitHub's
360-minute per-job ceiling.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8ebeb85832c62aeba72d774cdb4df7d5c6105f43">The snap-launchpad job stops blaming LP_CREDENTIALS for every Stopped Launchpad build</a>. Thanks to xet7.</summary>

The exotic snap architectures (ppc64el, s390x, riscv64, armhf) have no native
runner and cannot be cross-built, so they are built with `snapcraft
remote-build` on Launchpad. When such a build ends as `Stopped` with no `.snap`
- Launchpad cancelling it mid-run, usually an out-of-memory in the Meteor `npm
install` or a transient build-farm reset - the job scans the downloaded build
log to tell that apart from a real credential failure. The scan pattern was
`unauthoriz|401|403`, and a bare `401`/`403` matches any three digits anywhere
in a large build log - a package size, a hash, an `attempt 4/6` line - so it
fired on almost every Stopped build and told the maintainer to re-create
`LP_CREDENTIALS` that were working: the build had reached `Building:`, which
already needs valid credentials. The pattern now matches those codes only in an
HTTP-error context (`HTTP Error 401`, `403 Forbidden`) or an explicit phrase
(`invalid credentials`, `not logged in`, `bad credentials`), so the credential
hint appears only for a genuine authorization failure. The Launchpad `Stopped`
builds themselves are a Launchpad-side limit on slow emulated architectures, not
a WeKan bug; the job already retries three times and is `continue-on-error`, so
it never fails the release.

</details>

and updates the documentation and translations:

- [CLAUDE.md drops the standing rule that forbade pushing](https://github.com/wekan/wekan/commit/a7f840be489b1769b7248a673e8873fa57859f2f). Thanks to xet7.
- [Serbian translations](https://github.com/wekan/wekan/commit/a74aee2e45d2833ae7b0029763bfb403da9d4ec3). Thanks to translators and xet7.

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.71 2026-08-06 WeKan ® release

**In short:** the bundled **MongoDB Database Tools** - bsondump, mongodump,
mongoexport, mongofiles, mongoimport, mongorestore, mongostat and mongotop - now
come from **wekan/mongo-tools-patches** instead of the **wekan/mongo-tools**
fork, in every place that downloads them: the amd64 base bundle, the per-arch
overwrite in each Linux bundle, the Windows and macOS bundles, the preflight and
download checks, the **Dockerfile**, both **snapcraft** files, the **Flatpak**
and **AppImage** workflows and the docs. The fork changed none of upstream's Go
source and existed only to carry a build; the new repository keeps that build,
clones the newest upstream release and applies patches to it, exactly as
**wekan/node-patches** replaced the wekan/node fork. Nothing about the bundles
changes - the same asset names, the same per-tool tolerance for an architecture
with no binary, the same checksum verification - and the new checkout beside the
repository is excluded from git and from Meteor's file scan like its siblings.
Below that: the **release scripts** now run on the **bash 3.2** that macOS
ships, so a release can be triggered from a Mac.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-amd64) | v1.45.0 | `94713f605167abb45a3717482d35de4824cb4a8f199c1400e826a8a2b04f3893` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-arm64) | v1.45.0 | `275ae50ac97e6a70eee72e6de37766c458775c5997c896352db5189c6cf1f04b` |
| loong64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-loong64.tar.xz) | v24.19.0 | `c24f224726f2d785bd18a1fd09f5e6d1fecf0269928451a60c5da9eac8e92e68` |
| loong64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-loong64) | v1.45.0 | `28bf67981168dfc4bd67698b41dd62628aafe347a77f2b1e6ffcadf009d575e0` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-mac-arm64) | v1.45.0 | `639ed58b84820b3d588f4161c64d0ab940d0cc6e7d022088d60c2b0b97f99f8e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-mac-amd64) | v1.45.0 | `fd519903f5630e881e38e7c5814f00c0e89ad26f6785f1ddcbab4058356fc9f3` |
| ppc64le | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-ppc64le.tar.xz) | v24.19.0 | `c510c6ce12f07010f771e6edb22a3fe23f4f2e6f40b1ffd4941aed0646a0d8b3` |
| ppc64le | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-ppc64le) | v1.45.0 | `de4518c7774d302533369c477759ddd866785d6741d98d399388eb8de3df175a` |
| riscv64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-riscv64.tar.xz) | v24.19.0 | `cd1f14af2812148002f58b58a5f9af512a50e3b8e8c148e0db44019dcb68edfd` |
| riscv64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-riscv64) | v1.45.0 | `7dc2952f554e8800c4029577901999e06e10272da686f7e402177080067028f9` |
| s390x | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-s390x.tar.xz) | v24.19.0 | `a4792e65962ffa0af42627aacf1122a60c3c88dbf4e4184f06820d66f9da8ba4` |
| s390x | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-s390x) | v1.45.0 | `0ae2e2f2cffdc5dd2ea4f125281a5e12eea216fbe49b5561d9c001700c3fc0c1` |
| win64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip) | v24.19.0 | `57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73` |
| win64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-win64.exe) | v1.45.0 | `f6337994368a52d011d438c82b914b0cedb3178fd030acac8db3dab8017cee85` |

This release changes where the bundled MongoDB Database Tools come from:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/354d356a0">The MongoDB Database Tools come from wekan/mongo-tools-patches now</a>. Thanks to xet7.</summary>

`wekan/mongo-tools` was a fork of a large Go project that changed none of its
source: its six commits were the build workflow and its changelog, and the 738
directories of upstream Go beside them were kept in a fork only so that workflow
had somewhere to live. `wekan/mongo-tools-patches` keeps the build and drops the
fork - it clones the newest upstream `mongodb/mongo-tools` release, applies the
patches in its `dist/` (there are none yet, which is the honest state of a fork
that changed nothing), cross-compiles the eight tools for sixteen platforms with
CGO disabled and publishes the same `<tool>-<arch>[.exe]` assets with a
`.sha256sum` beside each. It is the same move `wekan/node-patches` made for the
retired `wekan/node` fork.

So every download URL here moved with it: the amd64 base bundle and the per-arch
overwrite in the Linux bundle jobs and in `releases/repack-bundle-for-arch.sh`,
the Windows and macOS bundle jobs, `releases/check-arch-binaries.sh`,
`releases/require-binaries.sh`, `releases/test-download-urls.sh`, the
`Dockerfile`, `snapcraft.yaml` and `snapcraft-core26.yaml`, the Flatpak and
AppImage workflows, the Sandstorm build-deps note and the CPU-platforms
documentation.

Nothing else changes. The asset names are the same, the per-tool tolerance for
an architecture the tools were not built for is the same, and the checksum
verification is the same, because the build script moved across unchanged. What
does change is that the next release needs `wekan/mongo-tools-patches` to have
published a release first: its **Release All** has not run yet, and the amd64
bundle's download of the eight tools is not tolerant of a missing release.

</details>

and has the following developer-tooling changes:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/354d356a0">The mongo-tools-patches checkout is excluded from git and from Meteor's scan</a>. Thanks to xet7.</summary>

`mongo-tools-patches/` is a separate git repository worked on beside WeKan, like
`node-patches/`, `FerretDB/` and the `mongo-tools/` clone it replaces. It is in
`.gitignore` so it is not untracked noise in `git status`, and in
`.meteorignore` so Meteor does not walk it during a build - nothing in WeKan
imports it. The guard that checks every git repository cloned in here is
excluded from BOTH files covers it now.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c09e538fe">The release scripts run on the bash 3.2 that macOS ships</a>. Thanks to xet7.</summary>

`releases/release-all.sh` and `releases/version.sh` built arrays with
`mapfile`, a bash 4+ builtin absent from the bash 3.2 that macOS still ships,
so `./releases/release-all.sh` stopped with `mapfile: command not found` and
could not trigger a release from a Mac - and `brew install mapfile` finds
nothing, because `mapfile` is a shell builtin, not a program. Each
`mapfile -t VAR < <(cmd)` became the portable read loop
`VAR=(); while IFS= read -r line; do VAR+=("$line"); done < <(cmd)`, which
builds the same array on bash 3.2 and on the bash 5 the Ubuntu release runner
uses. Converted: release-all.sh's RELEASED version list, and version.sh's three
reads - the Node.js files, the MongoDB files, and the two newest CHANGELOG
release lines.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.70 2026-08-05 WeKan ® release

**In short:** WeKan takes its **Node.js** from **three sources, in order** -
official **nodejs.org**, then **unofficial-builds.nodejs.org**, then
**wekan/node-patches** - instead of only from the retired **wekan/node** fork,
and a platform that none of the three publishes a Node.js for is simply **not
built** that release instead of failing it. The order lives in one new script
that the bundle `.zip` jobs, the extra-architecture preflight and the
`Dockerfile` all ask, so the image and the `.zip` of one CPU can never be built
on Node.js from different places; the **snap** takes its node out of the bundle,
so it follows without a change of its own, and **Sandstorm** (amd64 only) is
untouched. Below that: the release notes now say which source actually served
each platform instead of a hardcoded name, the 32-bit Windows import library
moves with the runtime, and the guards that pinned the old fork-only rule are
updated to the new one.

| Platform | Binary | From | Version | SHA256 |
| --- | --- | --- | --- | --- |
| amd64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz) | v24.19.0 | `14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647` |
| amd64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-amd64) | v1.45.0 | `94713f605167abb45a3717482d35de4824cb4a8f199c1400e826a8a2b04f3893` |
| arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-arm64.tar.xz) | v24.19.0 | `01443c1e1a29e531ccad5a46fefa6df490d2189c49f7955904aecdbb0fe86fdc` |
| arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-arm64) | v1.45.0 | `275ae50ac97e6a70eee72e6de37766c458775c5997c896352db5189c6cf1f04b` |
| loong64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-loong64.tar.xz) | v24.19.0 | `c24f224726f2d785bd18a1fd09f5e6d1fecf0269928451a60c5da9eac8e92e68` |
| loong64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-loong64) | v1.45.0 | `28bf67981168dfc4bd67698b41dd62628aafe347a77f2b1e6ffcadf009d575e0` |
| mac-arm64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-arm64.tar.xz) | v24.19.0 | `3f1cf157479c1480352083105e13faf9d008ede98e7e157746b6df940d197b94` |
| mac-arm64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-mac-arm64) | v1.45.0 | `639ed58b84820b3d588f4161c64d0ab940d0cc6e7d022088d60c2b0b97f99f8e` |
| mac-x64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-darwin-x64.tar.xz) | v24.19.0 | `d35e95230f46f6f0751df497c56622c6735e05d5e1fb1630996a005b9d328fe4` |
| mac-x64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-mac-amd64) | v1.45.0 | `fd519903f5630e881e38e7c5814f00c0e89ad26f6785f1ddcbab4058356fc9f3` |
| ppc64le | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-ppc64le.tar.xz) | v24.19.0 | `c510c6ce12f07010f771e6edb22a3fe23f4f2e6f40b1ffd4941aed0646a0d8b3` |
| ppc64le | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-ppc64le) | v1.45.0 | `de4518c7774d302533369c477759ddd866785d6741d98d399388eb8de3df175a` |
| riscv64 | Node.js | [unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-riscv64.tar.xz) | v24.19.0 | `cd1f14af2812148002f58b58a5f9af512a50e3b8e8c148e0db44019dcb68edfd` |
| riscv64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-riscv64) | v1.45.0 | `7dc2952f554e8800c4029577901999e06e10272da686f7e402177080067028f9` |
| s390x | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-s390x.tar.xz) | v24.19.0 | `a4792e65962ffa0af42627aacf1122a60c3c88dbf4e4184f06820d66f9da8ba4` |
| s390x | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-s390x) | v1.45.0 | `0ae2e2f2cffdc5dd2ea4f125281a5e12eea216fbe49b5561d9c001700c3fc0c1` |
| win64 | Node.js | [nodejs.org](https://nodejs.org/dist/v24.19.0/node-v24.19.0-win-x64.zip) | v24.19.0 | `57f71ab3652e797d84acddc79c81cc9ff1c6ddb2a1974cdb83f00fee9bff4c73` |
| win64 | FerretDB | [wekan/FerretDB](https://github.com/wekan/FerretDB/releases/download/v1.45.0/ferretdb-win64.exe) | v1.45.0 | `f6337994368a52d011d438c82b914b0cedb3178fd030acac8db3dab8017cee85` |

**i386**, **armhf**, **armv7** and **win32** have no rows because they are not
built this release: nodejs.org publishes no 32-bit x86 or ARMv7 Node 24 and no
32-bit Windows one at all, unofficial-builds has none of them either, and
wekan/node-patches has not published its first release yet. Each returns by
itself on the first run after a Node.js for it appears - nothing has to be
edited for that to happen.

This release changes where the bundled Node.js comes from:

**Bundled Node.js** - the runtime inside every bundle, image and snap.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b9eff391b97427f4ed31ff07753a83d1f571f511">Node.js comes from official, then unofficial, then patched builds, and one script decides</a>. Thanks to xet7.</summary>

WeKan took its Node.js only from the `wekan/node` fork, for every platform. That
fork is retired in favour of
[wekan/node-patches](https://github.com/wekan/node-patches), which carries
patches rather than a whole Node.js source tree - so the question "where does
this platform's Node.js come from" had to be answered again, and the answer is
now three sources tried in order: **nodejs.org**, then
**unofficial-builds.nodejs.org**, then **wekan/node-patches**.

The order is a preference, not a last resort. Where nodejs.org publishes a
build, that is the one WeKan ships: it is the build the rest of the world runs
and its checksums are the ones everyone else verifies against. unofficial-builds
covers the CPUs nodejs.org does not release - riscv64 and loong64 - and
node-patches covers what neither publishes at all: 32-bit x86, 32-bit ARM and
32-bit Windows.

`releases/resolve-node-source.sh` is the one place that order and the
platform-name mapping live. The bundle jobs (through
`releases/embed-verified-node.sh`), the extra-architecture preflight
(`releases/check-arch-binaries.sh`) and the `Dockerfile` all ask it, so the
image and the `.zip` of one CPU cannot be built on Node.js from different
places - which is exactly what happened when each of them carried its own copy
of the walk. The snap copies its node out of the bundle, so it follows with no
change of its own, and Sandstorm is amd64-only and untouched.

It answers with the exact file, what shape that file is - nodejs.org and
unofficial-builds publish a tarball or a `.zip`, node-patches a bare binary -
and the SHA256 that source published for it. Because it only returns a build it
found a published checksum for, the "shipped unverified" path that a missing
`.sha256sum` used to open is gone.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b9eff391b97427f4ed31ff07753a83d1f571f511">A platform no source has a Node.js for is not built, instead of failing the release</a>. Thanks to xet7.</summary>

There is nothing a release run can do about a CPU nobody publishes a runtime
for, so it no longer tries: the resolver answers "not found", the preflight in
each bundle job turns that into a skip, and every step after it is gated on
that. A red job every release for such a CPU is noise, and when it was an error
it took the whole extra-architecture matrix with it - and, through that, the
Docker image and the jobs that need it.

Nothing has to be edited when that changes. The next run resolves again, and the
platform builds the moment a Node.js for it is published at any of the three
sources. That is what the four missing rows in the table above are: i386,
armhf, armv7 and win32 are waiting for wekan/node-patches to publish its first
release, and they come back by themselves when it does.

A lookup that could not be MADE is kept apart from an answer of "nobody
publishes it": an unreachable nodejs.org is an error, not a reason to skip every
platform and call an empty release normal.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b9eff391b97427f4ed31ff07753a83d1f571f511">The release notes name the source that actually served, not a hardcoded one</a>. Thanks to xet7.</summary>

Every bundle job recorded its Node.js provenance row with the literal source
`wekan/node`, whatever had actually served, so the provenance table at the top
of the release notes could not answer the one question it exists for. The rows
now carry what the embed step reported - `nodejs.org`,
`unofficial-builds.nodejs.org` or `wekan/node-patches` - together with the exact
URL and the verified SHA256.

The same table is now part of the CHANGELOG too, at the top of each release
section under the summary, so which binaries a release carries can be read
without a build log that expires. `CLAUDE.md` describes its shape.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b9eff391b97427f4ed31ff07753a83d1f571f511">The 32-bit Windows import library moves with the runtime it belongs to</a>. Thanks to xet7.</summary>

A 32-bit Windows native addon must link against an ia32 `node.lib`, and
nodejs.org stopped publishing one in Node 23, so `node-gyp` is pointed at a
`nodedir` built by hand: headers from nodejs.org plus a `node-win32.lib`. That
library came from the retired fork; it now comes from wekan/node-patches, which
is also where the `node-win32.exe` in the bundle comes from. The addons and the
runtime they run on are then from the same build.

</details>

and has the following developer-facing changes:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b9eff391b97427f4ed31ff07753a83d1f571f511">The guards pin the three-source order, and no longer pin the fork-only rule they replaced</a>. Thanks to xet7.</summary>

`tests/releaseNodeSources.test.cjs` is new and pins what the change above is
worth: that the three sources are tried in that order, that version is the outer
loop and source the inner one - so a current patched build beats an ancient
official one rather than the other way round - that every consumer asks the one
resolver instead of carrying its own walk, that a platform with no Node.js is a
skip rather than a failure, and that no file downloads from the retired fork any
more.

`releaseNodeVerified` and `releaseArchSkipAndBaseAttach` pinned the fork-only
rule, which was the correct rule until this release. They are updated to the new
one and say in the test why, so the next reader can see it was a decision. Each
keeps the assertion that made it valuable: a named version, a verified download,
and no path that ships an unverified Node.js.

`releaseSnapArches` read `release: ` out of ordinary English in a `run:` block
and took the following word for a snap channel; it now keeps only the matches
that name one. `node-patches`, checked out beside WeKan, is added to
`.meteorignore` for the same reason the other sibling repositories are there.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v10.69 2026-08-05 WeKan ® release

**In short:** two fixes to the release build after the **fork-everywhere
Node.js** switch in v10.68. The native jobs pass the pinned Node **major**
(`24`), but the wekan/node fork tags releases by full version (`v24.19.0`), so
the embed helper built a `…/download/24/node-x64` URL that 404s - it now
resolves the major to the newest fork tag that carries the asset. And the
multi-arch **Docker image** no longer skips when one exotic CPU fails to build:
it now builds for whatever bundles landed, dropping just the missing arch.

This release fixes the following bugs:

**The release build** - the fork Node.js download and the Docker platform set.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/414594ce99ac7dd44de2affaa15d7b135f6c319e">The native embed resolves the fork's full version from the pinned major</a>. Thanks to xet7.</summary>

The native jobs call `embed-verified-node.sh … node-x64 "$NODE_VERSION"`, but
`$NODE_VERSION` is the pinned MAJOR, `24`, while the fork tags its releases by
full version, `v24.19.0`. The helper built
`…/releases/download/24/node-x64`, which 404s, so the amd64 bundle failed at the
Node embed step. It now resolves a bare major to the newest fork tag
`v<major>.x` that carries the asset - the same GitHub-API walk
`check-arch-binaries.sh` uses - and takes a full tag as given. When no release
has the asset it stops with a message naming the fork asset to build.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0aa74076a20b191f3055932d1cc795115ea966f2">The Docker image builds for whatever bundles landed, so one failed exotic arch never skips it</a>. Thanks to xet7.</summary>

The docker job `needs: build-extra-arches`, a matrix. When one leg failed - a
single exotic CPU like ppc64le - the whole matrix job was "failed", and a job
whose `needs` dependency failed is SKIPPED, so one failed arch skipped the
entire image. It now runs on `always() && needs.release.result == 'success'`,
and a new "Decide which platforms" step probes which
`wekan-<version>-<arch>.zip` bundles actually landed: amd64 and arm64 are
required, the exotic arches
(ppc64le/s390x/riscv64/386/arm/v7) are included only if their bundle is present,
and a missing one is a warning that drops just that platform. The decided set
drives the wait loop, `--platform` and the push-verify list from one place, so a
failed or best-effort-skipped arch drops only itself and returns the next
release that builds it - the image is never skipped and never fails on one CPU.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d0934867661a0186d2a21f1b6e0e551fa5af5c51">The native embeds authenticate the fork lookup, tolerate a missing checksum, and cross-build win32</a>. Thanks to xet7.</summary>

Three native-bundle failures in one run. mac-arm64 failed the fork major->tag
lookup: `embed-verified-node.sh` and `check-arch-binaries.sh` call the GitHub
API to find the newest `v24.x` fork tag, but no step passed a token, so the
call was UNauthenticated (60/hour per shared runner IP) and 403-rate-limited -
amd64 (run first) resolved, mac-arm64 (later) did not. A workflow-level
`GITHUB_TOKEN: ${{ github.token }}` authenticates every such call. win64 failed
because the fork published `node-win64.exe` WITHOUT its `.sha256sum`, and the
helper 404'd on the sidecar; a missing checksum is now a warning (the binary
still ships, over authenticated HTTPS, UNVERIFIED - a checksum that is present
and does not match is still fatal). win32 failed at setup-node
("Unable to find Node version '24' for platform win32 and architecture x86" -
there is no 32-bit Windows Node 24); it now runs the x64 Node to drive node-gyp
and cross-builds the native modules to ia32 with `npm_config_arch=ia32`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b46acc47c5cae3b4e0ee543436cf994532408d80">Every extra-arch bundle is best-effort, so an emulated CPU that crashes cannot fail the release</a>. Thanks to xet7.</summary>

Each extra arch is built by running the fork's target-CPU node UNDER QEMU to
rebuild the native modules, and qemu-user does not run every binary perfectly:
ppc64le crashed at node startup deserializing its V8 snapshot
(`Check failed: IsFreeSpaceOrFiller(filler)` in `v8::Isolate::Initialize`, then
`qemu: uncaught target signal 5`), failing its leg. With ppc64le and riscv64
still REQUIRED, that failed the whole build-extra-arches matrix. They join
s390x/i386/armhf/armv7/loong64 as best-effort: a leg that cannot run this
release SKIPS with a warning, so the matrix never fails on one exotic CPU, the
docker job is never dragged down, and the release ships whatever built. amd64
and arm64 (native) remain the required core; ppc64le returns the release it runs
cleanly again.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/59e54e384aa70a44d0825cb4ade7d9acc0918be3">win32 and mac-x64 resolve the fork version, and win32 cross-builds ia32 addons against the fork's node.lib</a>. Thanks to xet7.</summary>

The win32 and mac-x64 preflights checked
`…/releases/download/${NODE_VERSION}/…` with `NODE_VERSION=24` (the bare MAJOR),
which 404s - the fork tags by full version (`v24.19.0`) - so both jobs ALWAYS
skipped. They now resolve the newest `v24.x` fork tag that carries the asset
via a shared helper, `releases/resolve-fork-node-tag.sh` (authenticated with
the workflow token, so the API is not rate-limited). And the win32
native-module rebuild is finished: `npm_config_arch=ia32` alone could not link,
because an ia32 addon needs an ia32 `node.lib` and nodejs.org dropped 32-bit
Windows in Node 23, so node-gyp cannot fetch `win-x86/node.lib`. The rebuild now
assembles a nodedir node-gyp can use - node headers (arch-independent, from
nodejs.org) plus the fork's own `node-win32.lib` (now published beside
`node-win32.exe`) - and points node-gyp at it, so bcrypt cross-builds to ia32
against the fork's Node.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.68 2026-08-04 WeKan ® release

**In short:** WeKan now takes its **Node.js from the wekan/node fork for every
platform** and from nowhere else - the native bundles, the emulated
cross-builds and the multi-arch **Docker image** alike - so a Node bug can be
patched and rebuilt from source, and one set of artifacts is never half-built on
a different Node.js per CPU. On top of that, every platform the fork builds a
Node.js for now has a `.zip` **bundle**: this adds the missing **armv7**,
**win32** and **mac-x64** bundles. Below that: a **Docker release-verify** fix
that was failing a `linux/arm/v7` image that had actually built correctly.

This release takes WeKan's Node.js from the wekan/node fork for every platform:

**Node.js sourcing** - one source, built from source, for every CPU.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac899ece2d3c2a5445cbb48e77df545b6b9ac808">Every native bundle takes its Node.js from the wekan/node fork, not nodejs.org</a>. Thanks to xet7.</summary>

The four native bundles (amd64, arm64, win64, mac-arm64) embedded a verified
Node.js downloaded from nodejs.org. They now download the wekan/node fork's bare
`node-<asset>` binary (`node-x64` / `node-arm64` / `node-win64.exe` /
`node-mac-arm64`) and verify it against the `node-<asset>.sha256sum` the fork
publishes beside it. The reason is control: the fork is Node built from source,
so a Node bug can be patched and rebuilt - which cannot be done with
nodejs.org's opaque binaries - and one source means a set of bundles is never
half-built on one Node.js and half on another. A bundle ships only the node
binary and runs `node main.js`, so no npm is grafted here (the Docker image and
the emulated cross-builds, which run npm, graft it separately).
`tests/releaseNodeVerified.test.cjs` pins the fork source for all four.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e9171ff7d16456a38b6066a242b261b969abd4ba">The extra-arch bundles and the Docker image take Node.js only from the fork</a>. Thanks to xet7.</summary>

The emulated cross-builds and the multi-arch Docker image used to prefer
nodejs.org, then unofficial-builds, and fall back to the fork only for the CPUs
neither built. That is now reversed to fork-only, for the same
built-from-source reason as the native bundles.
`releases/check-arch-binaries.sh` no longer walks nodejs.org - it lists the
fork's own releases for this major, newest first, takes the newest that carries
`node-<arch>`, and verifies it against that release's `.sha256sum`;
`releases/install-node-for-arch.sh` always installs the fork's bare binary
(grafting npm - arch-independent JavaScript - from the official amd64 tarball,
a build tool, not the shipped node); the `Dockerfile` maps every `TARGETARCH` to
a fork asset. `s390x` becomes best-effort (optional) like i386/armhf/loong64:
until the fork has published `node-s390x` the preflight skips it with a warning
instead of failing the whole matrix and taking docker down with it, and it
returns on its own once the fork publishes it.

</details>

and adds the following new `.zip` bundles:

**Platform bundles** - every CPU the fork builds a Node.js for gets a bundle.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/41d4eaf7e8d03f43aa3a1f7d661ca9f373549dc8">A new armv7 .zip bundle, from the fork's node-armv7</a>. Thanks to xet7.</summary>

The wekan/node fork builds a generic ARMv7 Node.js (`node-armv7`) as well as
Debian's hard-float one (`node-armhf`); each is a real fork platform, so each
gets its own WeKan `.zip`. A new `armv7` leg of the extra-arches matrix runs in
the same `linux/arm/v7` emulated container as armhf, takes its Node.js from the
fork's `node-armv7`, and shares FerretDB's armhf binary (FerretDB has no
distinct armv7). It is best-effort, like the other 32-bit bundles. The result is
`wekan-<version>-armv7.zip` alongside the armhf one.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bff53e93adfb7cc596fb87f51d1769e795afe208">New win32 and mac-x64 .zip bundles, so every fork platform has a bundle</a>. Thanks to xet7.</summary>

Twelve of the fork's thirteen platforms had a bundle; 32-bit Windows and Intel
macOS did not, though the fork builds `node-win32.exe` and `node-mac-x64`.
`build-win32` mirrors the win64 job but installs a 32-bit (x86) Node via
`setup-node` so the native modules it rebuilds (bcrypt) are ia32, matching the
fork's 32-bit `node.exe`, and takes `ferretdb-win32.exe`. `build-mac-x64`
mirrors the mac-arm64 job on a `macos-13` Intel runner, taking `node-mac-x64`
and `ferretdb-mac-amd64`. Both are best-effort: a preflight step skips the job
with a warning if the fork has not published that platform's node yet, so the
bundle appears the run after the fork publishes it.
`tests/releaseBundleCoverage.test.cjs` pins that all thirteen fork platforms map
to a bundle.

</details>

and fixes the following bug:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d71f030527bbc1c225e0d062113f61f4726be4b3">The Docker release verify reads the CPU variant, so linux/arm/v7 is not misread as linux/arm</a>. Thanks to xet7.</summary>

The docker job built and pushed the multi-arch image for all seven platforms
correctly; the step after it, which inspects each registry's manifest to prove
every platform arrived, then failed the run over a manifest that was right.
buildx builds `linux/arm/v7`, but a registry records that as architecture `arm`
with variant `v7` in a separate field, and the verify's `imagetools --format`
printed only `OS/Architecture` - so the entry read back as bare `linux/arm` and
the check for `linux/arm/v7` never matched it. The format now appends
`/{{.Platform.Variant}}` when a variant is present, and normalises arm64's
implied `/v8` away so it still matches `linux/arm64`.
`tests/releaseDockerPlatforms.test.cjs` pins the variant-aware format.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.67 2026-08-04 WeKan ® release

**In short:** the **Docker image** gains **linux/386** and **linux/arm/v7** -
the two 32-bit platforms that were shipping as `.zip` bundles only. The image
base moves from **ubuntu:26.04** to **debian:trixie** (Ubuntu publishes no i386
image, Debian does, and Debian carries every arch the image targets), and the
Dockerfile installs their **Node 24 from the wekan/node fork** (`node-i386` /
`node-armhf`) - which nodejs.org and unofficial-builds do not build - grafting
**npm** from the official amd64 tarball. v10.66 had *removed* arm/v7 as a
stopgap so the build could pass; this brings it back properly, with i386
alongside.

This release adds the following new Docker platforms:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/703527a322d2b1557181bdb36bdce5074c601169">Docker images for linux/386 and linux/arm/v7, on a Debian base with Node from the fork</a>. Thanks to xet7.</summary>

Two 32-bit Docker platforms that only ever shipped as `.zip` bundles now build
as images. The blocker was two-fold and is removed on both sides:

The **base image** moves from `ubuntu:26.04` to `debian:trixie`. Ubuntu dropped
i386 years ago and its image has no `linux/386` manifest, so 386 stopped at the
base; Debian still ships i386, and `debian:trixie` carries every arch this image
targets (amd64, arm64, 386, arm/v7, ppc64le, riscv64, s390x), so one base covers
them all - and it is the same base the per-arch `.zip` bundles already build in.
The image installs no MongoDB server (every arch defaults to the bundle's
FerretDB), so nothing was Ubuntu-specific; the sha checks moved from `shasum` to
coreutils `sha256sum`.

**Node.js** for 32-bit x86 and ARM exists on neither nodejs.org nor
unofficial-builds, but the [wekan/node](https://github.com/wekan/node) fork
builds it - as a bare `node-i386` / `node-armhf` binary plus a `.sha256sum`, not
a tarball. A new `fork` branch in the Dockerfile's arch case downloads and
verifies that binary and grafts `npm`/`npx` from the official amd64 tarball (npm
is arch-independent JavaScript). Debian's 32-bit ARM port is armhf (ARMv7
VFPv3-D16), which is what `linux/arm/v7` runs, so `node-armhf` is the match.
`linux/loong64` still ships as a `.zip` only - no Docker base publishes it and
the registries do not agree on its manifest yet.
`tests/releaseDockerPlatforms.test.cjs` pins the Debian base, 386/arm/v7 in and
loong64 out, and that every built platform has a Dockerfile arch-case branch.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.66 2026-08-04 WeKan ® release

**In short:** with `linux/386` gone, the multi-arch **Docker image** build got
past the base image and then failed inside the Dockerfile on **`linux/arm/v7`**
(armv7l) - the Dockerfile installs Node.js from nodejs.org / unofficial-builds,
neither of which ships a **Node 24** for armv7l, so its arch case has no `arm`
branch and the build stopped with *"Unsupported architecture: arm"*. armv7l is
dropped from the image's platform list, joining 386 and loong64: it ships as a
`.zip` bundle but not as a Docker image.

This release fixes the following release-build issue:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/370c091cf91ba014a8fde026cac7e8313cd56b76">The Docker image drops linux/arm/v7 too, which its Dockerfile has no Node 24 to install for</a>. Thanks to xet7.</summary>

Removing `linux/386` last release let the multi-arch build get past the
`ubuntu:26.04` base, and it then failed inside the Dockerfile's RUN step on
`linux/arm/v7`: *"+ echo Unsupported architecture: arm / + exit 1"*. Docker's
`TARGETARCH` for `linux/arm/v7` is `arm`, and the Dockerfile's architecture
`case` handles only amd64/arm64/ppc64le/s390x/riscv64 - it deliberately has no
`arm` branch, because it installs Node.js from nodejs.org and
unofficial-builds, and NEITHER ships a Node 24 for armv7l. But `linux/arm/v7`
was still in the `docker buildx --platform` list, so the RUN reached the
"Unsupported architecture" guard and the whole build failed. `linux/arm/v7` is
removed from the build's `--platform` list and from the `want=` list that
verifies the pushed manifest, joining `linux/386` and `linux/loong64`: all three
ship as `.zip` bundles (armhf's Node.js comes from the wekan/node fork there)
but not as Docker images, because the image sources its Node.js from
nodejs.org/unofficial only. `tests/releaseDockerPlatforms.test.cjs` pins arm/v7
out of both lists.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.65 2026-08-04 WeKan ® release

**In short:** this release clears the remaining **release-build** failures.
**loong64** has no `linux/loong64` base image to build its bundle in, so its
build job failed - and because the **docker** job waits on the whole
`build-extra-arches` matrix, that one failed leg **skipped docker**, and with it
the **charts, ucs and nextcloud** jobs; loong64 is now **best-effort** like
**i386** and **armhf**, skipped with a warning instead of failing. With docker
running again, it then dropped **linux/386** from the multi-arch image, which
its **ubuntu:26.04** base cannot provide. And the
**Launchpad** snap builds (**ppc64el, s390x, riscv64, armhf**) could not push
WeKan's large history to `git.launchpad.net` and timed out mid-upload; the
repository is flattened to a single commit before the push now, so it fits.
Below that, a Launchpad failure hint that wrongly blamed the project **licence**
- which is already set to MIT - is corrected to point at the real cause.

This release fixes the following release-build issues:

**Extra-architecture bundles** - the CPUs the build matrix compiles under
emulation, and the Docker image that waits on that matrix.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/27da39f9587365003d26cfa6f095a203c67e1eb6">A loong64 with no base image is skipped, not failed, so it stops skipping the Docker image build</a>. Thanks to xet7.</summary>

The `docker` job has `needs: [prepare, release, build-extra-arches]`, and GitHub
skips a job whose needed job failed. `build-extra-arches` is a matrix, and its
**loong64** leg hard-failed: no Docker Hub image publishes `linux/loong64`
(`node-loong64` and `ferretdb-loong64` exist, but the container to rebuild the
native modules in does not), so the preflight stopped it. One failed matrix leg
makes the WHOLE `build-extra-arches` job `failure`, which skipped `docker` - and
through docker the `charts`, `ucs` and `nextcloud` jobs that need it. That is
why run #209 left docker skipped, even though every buildable architecture
succeeded. loong64 is now marked `optional: true`, like i386 and armhf, and
`releases/check-arch-binaries.sh` skips a best-effort arch whose BASE IMAGE is
missing - not only one whose Node.js is missing - with a warning and `exit 0`
emitting `skip=true`, gated the same way as every other best-effort skip. So the
matrix job succeeds and docker runs; loong64 stays visible on every run as a
skip, and returns to a real build the day a `linux/loong64` base image is
published. `tests/releaseArchSkipAndBaseAttach.test.cjs` pins loong64 as
best-effort and that the base-image gate skips it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a2d47df8c2322b357199d27abf0f139a2cd8f5a6">The Docker image drops linux/386, which its ubuntu:26.04 base cannot provide</a>. Thanks to xet7.</summary>

With loong64 no longer skipping `build-extra-arches`, the `docker` job ran again
for the first time in a while and failed at the base image: *"ubuntu:26.04:
failed to resolve source metadata ... no match for platform in manifest"*. The
image is `FROM ubuntu:26.04`, and Ubuntu publishes no i386 image, so `docker
buildx build --platform ...,linux/386,...` cannot resolve the base for that one
platform and the whole multi-arch build stops - the workflow's own bundle-build
comment already notes that `docker run --platform linux/386 ubuntu:26.04`
answers "no matching manifest". `linux/386` is removed from the build's
`--platform` list and from the `want=` list that verifies the pushed manifest,
exactly as `linux/loong64` already was: i386 ships as a `.zip` bundle (built on
debian:trixie, which has 386) but not as a Docker image.
`tests/releaseDockerPlatforms.test.cjs` pins that 386 and loong64 are out of
both lists, that the two lists match, and that the base is ubuntu:26.04.

</details>

**The Launchpad snap builds** - the ppc64el, s390x, riscv64 and armhf snaps
built on Launchpad with `snapcraft remote-build`.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/50e2e14d99bb27455cf69f169bc43ed48cff96d9">The Launchpad snap builds flatten history first, so the push to git.launchpad.net stops timing out</a>. Thanks to xet7.</summary>

The `snap-launchpad` builds (ppc64el, s390x, riscv64, armhf) run through
`snapcraft remote-build`, which pushes the project's git repository to
`git.launchpad.net` and builds it there. The push failed - *"Git operation
failed with: Could not push 'HEAD' to git.launchpad.net/... snapcraft-wekan-
&lt;hash&gt;"* - about four to five minutes in, on every one of the three
retries (v10.64 ppc64el, and v10.55 riscv64 before it). remote-build rejects a
SHALLOW clone, which is why the checkout is `fetch-depth: 0`, but it does not
need the history, and WeKan's full history is large enough that the push times
out or is refused mid-upload. After the full checkout the repository is now
re-initialised as ONE commit of the tagged tree - `git rev-parse
--is-shallow-repository` is still false, so remote-build accepts it, but the
push carries the source tree (tens of MB) instead of the whole history
(hundreds). The snap version comes from `snapcraft.yaml`, not `git describe`, so
dropping the history changes nothing about what is built.
`tests/releaseSnapLaunchpadFlatten.test.cjs` pins the flatten, its order, and
that the checkout stays full-depth.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/646c5db79d450bfd5ff403e4d0e4fae443671794">A Launchpad snap failure no longer blames the licence when it is already set</a>. Thanks to xet7.</summary>

The Launchpad project the remote builds file under
([xet7-craft-remote-build](https://launchpad.net/xet7-craft-remote-build)) is
set to MIT / X/Expat, but the `snap-launchpad` failure hint printed *"check its
Licence, 'None specified' ... set the licence to MIT"* on EVERY failure - so an
s390x build that Launchpad had *Stopped* for another reason read as a licence
problem that was already fixed, and the search went to a correct setting. The
hint now says the licence should already be MIT (re-set it only if the page
shows "None specified") and, for the real remaining case, explains that a
*Stopped* build whose log is `BUILDING` (not `FAILED`) and ends mid-step is
Launchpad cancelling the build as it runs - typically an out-of-memory in the
memory-heavy Meteor `npm install`, or a transient build-farm reset, both of
which the three retries already cover.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.64 2026-08-04 WeKan ® release

**In short:** this release hardens how the multi-platform release is assembled.
The **Node.js and FerretDB** inside every platform bundle become **named,
checksummed** binaries, so the release provenance table can say exactly which
build each platform carries - the thing you need when a **Node.js CVE** lands;
the four native bundles used to ship whatever Node the GitHub runner carried
(`cp $(command -v node)`), and **arm64** was even shipping **Node 22** because
its job had no setup-node. Separately, the **base bundles** (**amd64, arm64**)
are now attached to the release loudly and verified, and - the real fix behind
that - the release job **checks out before downloading the bundles** instead of
after: the after-checkout deleted the just-downloaded zips (that is what
shipped **v10.63 and v10.64 with no amd64/arm64 bundle**, 404'ing every snap
build). And **i386/armhf** are skipped when no Node.js exists for them anywhere
instead of failing the run every release. It
also fixes an **Admin Panel** bug where a report opened by its own URL came up
empty over data that was plainly there, because the subscription was cancelled
by its own count re-render.

This release fixes the following release-build issues:

**Bundle provenance** - which Node.js and FerretDB binary each platform ships.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e802d52eed3c41bb65071c2c17bb6890c704232b">Every native bundle ships a named, checksummed Node.js and FerretDB instead of the runner's node</a>. Thanks to xet7.</summary>

The amd64, arm64, win64 and mac-arm64 bundles embedded Node.js with `cp
$(command -v node)` - the runner's node. A bare binary extracted onto the
runner publishes no checksum, so `releases/record-provenance.sh` could only
write *no checksum published*, and the provenance table at the top of the
release could not name the exact Node.js build a platform carried. It was also
the wrong build on arm64: `build-arm64` has no `setup-node` step, so
`$(command -v node)` was `ubuntu-24.04-arm`'s DEFAULT Node **22.x**, not the
pinned Node 24 every other bundle shipped - and nothing recorded the
disagreement. A new `releases/embed-verified-node.sh` downloads the pinned
Node.js for the bundle's OS+CPU from nodejs.org, verifies the archive against
the published `SHASUMS256.txt` (fatal on a mismatch), and puts its `node` into
the bundle; each native job now calls it and records `nodejs.org` + the exact
version + the verified SHA256. FerretDB is verified the same way, against the
`.sha256sum` wekan/FerretDB now publishes beside every binary, and win64 and
mac-arm64 - which recorded no provenance at all - now upload a provenance
artifact like amd64 and arm64, so every platform is accounted for. The
emulated arches already did this through `install-node-for-arch.sh`.
`tests/releaseNodeVerified.test.cjs` pins that no native bundle can go back to
the runner's node or an unverified download.

</details>

**Release assembly** - attaching the base bundles, and the arches that can be
built at all.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/55463f685a09f75b07a127ec901b3d564353d46b">The base amd64/arm64 bundles are attached loudly and verified, not silently by softprops</a>. Thanks to xet7.</summary>

Every bundle except amd64 and arm64 attaches itself with `gh release upload
--clobber`, which fails on a missing file and is verified from the release
side. The two base bundles were the exception: the central `release` job
attached them with softprops `files:`, which does NOT fail on an unmatched
file. So when a run produced no base zip, softprops created the release with
none of them and reported success - and [v10.63](https://github.com/wekan/wekan/releases/tag/v10.63)
shipped with **no amd64 or arm64 bundle at all**, which 404'd every snap build
(native, wekan-ondra, wekan-gantt-gpl) on `wekan-10.63-amd64.zip`. softprops
also never listed the `.sha256sum`, so the base bundles had no checksum beside
them. The release job now creates the release with softprops (so it exists for
the self-attaching jobs) and attaches amd64/arm64 in a following step with `gh
release upload --clobber` - failing the release if a base bundle is missing or
empty, rather than 404'ing ten downstream jobs - and it checksums the exact
bytes it attaches, so the base bundles get a `.sha256sum` like the rest. (Why
the base zip was missing in the first place is the next entry - the loud,
verified attach is what turned that silent gap into a failed release that
names it.)

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ea4a7a5eb8fe912d6dbedb4b00b16918da075159">The release job checks out before downloading the bundles, so the checkout stops deleting them</a>. Thanks to xet7.</summary>

The real reason v10.63 (and then v10.64) shipped with no amd64/arm64 bundle was
not softprops - it was the checkout. The `release` job downloaded the bundles
into the workspace and THEN ran `actions/checkout` for the provenance script.
The workspace is not a git repository at that point, so checkout's very first
act is *"Deleting the contents of '&lt;workspace&gt;'"* to make room for a fresh
clone - and it does this even with `clean: false`, which only skips the
`git clean` in an already-checked-out repo, not the initial wipe. The
just-downloaded `wekan-<version>-{amd64,arm64}.zip` were deleted before the
attach step, which then failed with *"wekan-<version>-amd64.zip is missing or
empty"* - and, because of the loud attach above, that now failed the release
outright rather than shipping an empty one. The checkout runs FIRST now, into
the empty workspace, and the bundles are downloaded on top of the checked-out
tree, where nothing removes them. `tests/releaseBundlesSurviveCheckout.test.cjs`
pins the order (checkout before the bundle download) rather than `clean: false`,
which was never enough.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/55463f685a09f75b07a127ec901b3d564353d46b">i386 and armhf are skipped when no Node.js exists for them, instead of failing the run</a>. Thanks to xet7.</summary>

`build-extra-arches` failed on i386 and armhf because there is no Node.js to
build them against: Node has no `linux-x86` build at all, and no source builds
Node 24 for `armv7l` (nodejs.org and unofficial-builds have neither, and the
wekan/node fork has not built them yet). A red job every release for a CPU
nothing can currently produce a Node for is noise, not news. Both are now
marked **best-effort** (`optional: true`), and when a best-effort arch's
Node.js is absent everywhere `releases/check-arch-binaries.sh` emits
`skip=true` (a warning, exit 0) rather than a fatal error; every build step in
the job is gated on it, so the arch is skipped cleanly with nothing built. It
returns on its own the first release after wekan/node publishes `node-i386` /
`node-armhf`. A *required* arch whose Node.js is missing is still fatal, as
before. `tests/releaseArchSkipAndBaseAttach.test.cjs` pins both this and the
base-bundle attachment above.

</details>

and fixes the following Admin Panel bug:

**Admin Panel reports** - loading a report by its own URL.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c5a40924187545b3f954ba1eca7970346432a314">An admin report opened by its URL keeps the subscription its own count re-render used to cancel</a>. Thanks to xet7.</summary>

Opening an admin report by its address - `/admin/problems/files` typed,
bookmarked or refreshed - drew the column headers, "No results" and a "1 / 1"
pager over data that was plainly there, while the count method reported five.
An [earlier fix](https://github.com/wekan/wekan/commit/78b2f9ebcd56b699f218e8da06cd99a8eac81b12)
addressed one half (re-subscribe once the login lands), but the report still
came up empty. The `onCreated` autorun opens the pane and subscribes when the
open-pane or the logged-in user changes, and it called `openReportPane()` /
`loadReport()` directly in its reactive body - so it became reactive on
`cfg.count` (which `loadReport` reads through `pageInfo`), and `loadReport`'s
own count method then did `cfg.count.set(...)`. That re-ran the autorun, and a
`Meteor.subscribe` made inside an autorun is AUTO-CANCELLED when the autorun
re-runs; the re-run took the "same user, same pane" path, did not re-subscribe,
and left the report with no subscription - *attachments in minimongo: 0*. From
the left menu it worked, because that opens the pane from an event rather than a
computation, so the subscribe was never auto-managed; only the URL path hit it.
The autorun now reads only the pane id and the user reactively and runs its body
inside `Tracker.nonreactive`, so a count re-render no longer cancels the
subscription, whose lifetime is managed explicitly (a new `onDestroyed` stops
the last one). `tests/adminProblemsSubscriptionLifetime.test.cjs` pins it.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.63 2026-08-04 WeKan ® release

**In short:** this release stops **"release all missing"** from rebuilding the
**AppImage and Flatpak** every run when they are already published. Their
checksum files were named with the extension dropped
(`WeKan-<v>-<arch>.sha256sum`), but the missing-check looks for the name the
zip bundles use - the asset name plus `.sha256sum`
(`WeKan-<v>-<arch>.AppImage.sha256sum`) - so it never found the checksum and
counted the package as missing. The checksums now keep their extension,
matching the check.

This release fixes the following release-build issue:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/85d2ec6dadc8a8f04b97d3fa21af3367c7031336">"Release all missing" no longer rebuilds the AppImage and Flatpak that are already published</a>. Thanks to xet7.</summary>

`releases/expected-assets.sh` decides a package is present only when its binary
AND `<asset>.sha256sum` are both on the release - the same convention the
`wekan-<v>-<arch>.zip.sha256sum` bundles follow. But `AppImage.yml` and
`Flatpak.yml` wrote the checksum with the extension DROPPED
(`WeKan-<v>-<arch>.sha256sum` rather than
`WeKan-<v>-<arch>.AppImage.sha256sum`), so the check never matched it and
reported the AppImage and Flatpak as missing on every run - rebuilding and
re-uploading them even when nothing had changed. The checksum (and md5sum) now
keep the `.AppImage` / `.flatpak` extension, so the check finds them and only
genuinely-missing packages are built. The same fix went to the wekan-ondra and
wekan-gantt-gpl forks, which name their assets the same way.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.62 2026-08-04 WeKan ® release

**In short:** this release fixes the reason the release shipped **no bundles**,
which is what starved every downstream job (snap, Docker, AppImage) of the
`wekan-<version>-amd64.zip` they download - the 404s those jobs kept hitting
were never their own fault. The `release` job downloaded the bundles and then
checked the repo out, and `actions/checkout`'s default clean **deleted** the
untracked zips before they could be attached; the checkout now keeps them. The
snap download also stops treating the brief post-upload 404 as fatal.

This release fixes the following release-build issue:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/809dc794f2627c6fbc18ea0570128b4a8bac57a6">The release stops deleting its own bundles before attaching them</a>. Thanks to xet7.</summary>

The `release` job downloads the per-arch bundles to the workspace root, then
checks the repo out (for the provenance script) before creating the GitHub
Release. `actions/checkout` defaults to `clean: true`, whose `git clean -ffdx`
**deletes those untracked zips** - so the "Create GitHub Release" step's
`files: wekan-<version>-{amd64,arm64}.zip` matched nothing. softprops does not
fail on unmatched files, so the release was created (job "success") with NO
bundles attached, and every downstream job that downloads one 404'd on
`wekan-<version>-amd64.zip` - the snap, Docker and AppImage failures were all
this. The checkout now sets `clean: false`, so the bundles survive and are
attached; the same fix went to the wekan-ondra and wekan-gantt-gpl forks, which
had the identical job. Separately, the snapcraft `wekan` part downloaded its
bundle with a single `wget` that treated a 404 as fatal, so it also broke on
the brief CDN lag right after an upload; it now retries like the other release
downloads. `tests/releaseBundlesSurviveCheckout.test.cjs` pins that a checkout
after the bundle download keeps `clean: false`.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.61 2026-08-04 WeKan ® release

**In short:** this release is all **release-build** fixes. With the release job
itself working again (v10.60), the per-platform jobs it feeds surfaced their
own breakage: **build-win64** ran a bash script under PowerShell,
**build-mac-arm64** called the Linux-only `sha256sum`, **build-extra-arches**
never unpacked the bundle it downloaded, and an **i386** entry in
`snapcraft.yaml` — which core24 cannot build — was a parse error that failed
*every* snap. The downstream **Docker** and **AppImage** jobs, which only wrap
an already-published release bundle, now skip gracefully instead of failing
when that bundle is not up yet. And a **Debian `type: base` snap** is
scaffolded so i386 can eventually ship as a snap at all, since core24 has no
i386 port.

This release fixes the following release-build issues:

**The per-platform release jobs** - each broke in its own way once the release
job started feeding them again.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bbc357874715f1e91e4297a40c7301d5aea354cf">The win64, mac-arm64, extra-arch and snap release jobs each fail on their own bug</a>. Thanks to xet7.</summary>

Four independent failures in the v10.60 run, one per job: `build-win64`'s
"Check the binaries" step ran `set -euo pipefail` under the Windows default
shell and PowerShell answered "A parameter cannot be found that matches
parameter name 'euo'" - it now says `shell: bash`. `build-mac-arm64` ran
`sha256sum`, a GNU coreutils name macOS does not have, and died exit 127;
`shasum -a 256` is the BSD/macOS spelling. `build-extra-arches` downloaded
`wekan-<version>-amd64.zip` but never unpacked it, so the container mounted an
empty `/bundle` and the native-module rebuild died with `ENOENT ...
/bundle/programs/server/package.json` (exit 254) - it now unzips the bundle
like the arm64/win64/mac-arm64 jobs already do. And `snapcraft.yaml` declared
an `i386` platform that core24 (Ubuntu 24.04, no i386 port) rejects with "none
of these build architectures are supported" - a PARSE error that failed
`snap-native` AND every `snap-launchpad` arch, not only i386. The i386 platform
and its launchpad matrix entry are removed; i386 users are served by the `.deb`
and AppImage.

</details>

**The downstream packaging jobs** - Docker and AppImage only WRAP a release
bundle that another job builds, so they cannot run before it exists.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/43ff0e7a5ca56e3c51560e701146e336449affee">Docker and AppImage skip with a notice instead of failing when the release bundle is not published yet</a>. Thanks to xet7.</summary>

`dockerimage.yml` / `docker-publish.yml` build a Dockerfile that DOWNLOADS the
prebuilt `wekan-<version>-amd64.zip`, and `AppImage.yml` wraps the per-arch
bundle; all of them `exit`ed hard when that asset was not on the release -
which it was not while the release was still building, or when a run targeted a
version whose bundle was not published. Each now checks whether the asset it
needs is on the release and SKIPS with a `::notice::` (a green run) when it is
not: the docker jobs gate the build on the pinned version's zip, and AppImage
flips its per-arch `BUILD_THIS` off and treats "no AppImage, and no base bundle
either" as nothing-to-do. The release image / AppImages are still built by
`release-all.yml` once the bundles are up; these standalone runs simply stop
failing in the meantime.

</details>

and scaffolds an i386 snap on a Debian base:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8790b66806269f26f08c4073ea8d4f7805716ba6">A Debian type:base snap so i386 can ship as a snap at all, since core24 has no i386 port</a>. Thanks to xet7.</summary>

core24 has no i386 port, so `base: core24` cannot build an i386 snap. Debian
still ships i386 and is glibc, so - unlike an Alpine/musl base - WeKan's
existing binaries run unchanged, and since the snap only assembles the prebuilt
`wekan-i386.zip` (which already exists), the one missing piece is an
i386-capable base. `snap-base-debian/` scaffolds `wekan-base-debian13` (`type:
base`), a trimmed Debian trixie rootfs, starting with i386 - which builds
NATIVELY on an amd64 runner, no qemu or Launchpad. It is isolated from the
working core24 `snapcraft.yaml` and is a documented, UNVERIFIED scaffold: a
custom base snap needs a real `snapcraft pack` + local install + a WeKan snap
running on it before CI or the (manual) store review, all of which
`snap-base-debian/README.md` spells out.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.60 2026-08-04 WeKan ® release

**In short:** this release fixes the **release workflow** that publishes WeKan.
The v10.59 release job built the GitHub Release body from the newest CHANGELOG
section by interpolating it **inline** into a shell `printf`, so every backtick
in the notes ran as a command — and v10.59's notes are full of `code` spans, so
the job died with `Incorrect: command not found` and
`loginFailureDecision.js: Permission denied`, and published nothing. The
CHANGELOG now reaches the release-notes scripts through the **environment**,
where the shell treats it as data. A new test pins that the changelog is never
interpolated into a `run:` script again.

This release fixes the following release-build issue:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/541dc8b7b6499ef39f7812deacdebc5927570b9b">The release notes pass the CHANGELOG through the environment instead of inline into the shell</a>. Thanks to xet7.</summary>

The `release` and `release-notes` jobs of `release-all.yml` composed the GitHub
Release body with `printf '%s\n' "${{ needs.prepare.outputs.changelog }}"`.
Interpolated inline with `${{ }}`, the CHANGELOG becomes part of the shell
*source* before bash parses it, so a backtick in an entry — every `code` span is
one — runs as a command substitution. The v10.59 notes (this file's own
LockoutBleed section) turned into `Incorrect: command not found`,
`User not found: command not found`, `POST: command not found` and
`server/apiAuthRoutes.js: Permission denied`, the `release` job failed, and the
release was published with no bundles. Both steps now take the changelog through
`env: CHANGELOG: ${{ … }}` and write `"$CHANGELOG"`, where the shell treats the
value as data and never parses its backticks, `$( )` or quotes.
`tests/releaseNotesNoShellInjection.test.cjs` pins that `outputs.changelog` is
only ever consumed as an `env:` assignment, never inline in a `run:` script, and
fails on both pre-fix `printf` lines.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v10.59 2026-08-04 WeKan ® release

**In short:** this release closes **LockoutBleed** (GHSA-2g94-9x3m-hv37), a
reported two-part authentication weakness that chained into account takeover.
The bundled **accounts-lockout** brute-force protection had gone completely
inert: its hooks gated on the English failure text `Incorrect password` /
`User not found`, but Meteor's `ambiguousErrorMessages` (on by default) rewrites
every credential failure to one generic sentence *before* those hooks run, so
the failure counter never moved and no account ever locked. Alongside it the
login path leaked **which usernames and emails exist** — a real user runs bcrypt
(~50 ms) while a missing one answers in ~2 ms, a timing oracle no uniform error
text can hide. The **REST `/users/login`** twin was worse: it named the missing
user outright and never went through the lockout at all. The lockout now counts
on any genuine password failure regardless of wording, a **dummy bcrypt
comparison** equalises the missing-user path's timing on both the DDP and REST
logins, and the REST endpoint answers missing-user and wrong-password
identically and **throttles** repeated failures per client. Four new unit suites
pin each half. Below that, a **release-build fix**: three build jobs ran the
binary pre-check without the repo checked out where the call looked for it, so
the arm64 build died with `exit 127` before assembling a bundle.

This release fixes the following CRITICAL SECURITY ISSUE of [LockoutBleed](https://wekan.fi/hall-of-fame/lockoutbleed/):

**Login and the brute-force lockout** - signing in, the lockout that guards it,
and its REST twin.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3742f2ed7cfeb3dc709997ca9403d3fae5f7188">The bundled brute-force lockout counts failed logins again instead of silently never firing</a>. Thanks to NinjaGPT and xet7.</summary>

WeKan bundles `wekan-accounts-lockout` (default: 3 failures → 60 s lockout), and
it had been doing nothing at all. Both of its `Accounts.validateLoginAttempt`
hooks decided whether an attempt was a failure by comparing the error's *reason
string*: `loginInfo.error.reason !== 'Incorrect password'` for a known user,
`!== 'User not found'` for an unknown one. That reason never arrives. Meteor's
`accounts-base` ships `ambiguousErrorMessages` defaulting to **true**, so
`Accounts._handleError` rewrites every credential failure — wrong password, no
such user, no password set — to the single sentence *"Something went wrong.
Please check your credentials."* before any validateLoginAttempt hook runs. The
literals therefore never matched, both hooks returned early, the counter was
never incremented, and no account ever locked — confirmed in the report by
`AccountsLockout.Connections` staying empty under unlimited failed logins.

The hooks now decide from the attempt's **structural fields** instead of a
localized, Meteor-internal string we do not control (new
`packages/wekan-accounts-lockout/src/loginFailureDecision.js`): a password login
of a known user that carries an error is a countable failure; a password login
with no matched user that carries an error is a countable unknown-user failure.
The one error deliberately **not** counted is `no-2fa-code` — accounts-2fa
throws it *after* the password already checked out, to ask for the second
factor, so it is the normal first leg of every two-factor sign-in and counting
it would lock out legitimate 2FA users. A *wrong* second factor
(`invalid-2fa-code`) still counts, because there the password was already
correct. `tests/loginFailureDecision.test.cjs` pins that the ambiguous reason is
counted (the exact regression), that success still runs the hook so an active
lock is enforced, and that `no-2fa-code` never locks anyone.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3742f2ed7cfeb3dc709997ca9403d3fae5f7188">A login for a user that does not exist now takes as long as one that does</a>. Thanks to NinjaGPT and xet7.</summary>

The accounts-password login path runs a bcrypt comparison (~50 ms) only when the
user exists and has a local password; for a missing user — or an LDAP/OIDC-only
user with no local password — it throws immediately (~2 ms) with no bcrypt work.
The two response-time distributions do not overlap, so an unauthenticated
attacker can tell whether any given username or email exists with near-100%
reliability, regardless of the uniform error *text* WeKan returns.

The standard mitigation is applied: whenever the real path would skip bcrypt,
one **dummy bcrypt comparison against a fixed cost-10 hash** is performed so the
missing-user path costs about the same as a real check (new
`server/lib/loginTimingDefense.js`). On the DDP `login` method a
timing-normalization login handler runs ahead of the built-in password handler,
looks the user up, and — when there is no local password to check — burns the
compensating time before falling through; it never authenticates
(`server/loginTimingNormalization.js`).
`tests/loginTimingDefense.test.cjs` pins the fixed hash's shape, that the
equaliser feeds the dummy user and digest to the injected comparator, and that
it never throws.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3742f2ed7cfeb3dc709997ca9403d3fae5f7188">The REST login endpoint stops naming missing users and throttles password guessing</a>. Thanks to NinjaGPT and xet7.</summary>

`POST /users/login` in `server/apiAuthRoutes.js` checks the password directly
with `Accounts._checkPasswordAsync` and never runs the DDP lockout hooks, so it
had no brute-force protection at all — and it enumerated by *message*, throwing
a distinct *"User with that username or email address not found."* for a missing
user while a wrong password threw the ambiguous one. It now fails missing-user
and wrong-password with the **same uniform error**, runs the same dummy-bcrypt
timing equaliser for a missing or password-less account, and throttles failed
attempts per client address (new `server/lib/loginAttemptThrottle.js`, default
10 failures / 60 s → 60 s lockout, env-tunable via `REST_LOGIN_MAX_FAILURES` /
`REST_LOGIN_FAILURE_WINDOW_SECONDS` / `REST_LOGIN_LOCKOUT_SECONDS`). Only
failures count and a success clears the client's counter, so correct-credential
clients are never impeded; `X-Forwarded-For` is honoured only when
`HTTP_FORWARDED_COUNT` declares the proxy depth, so the header cannot be spoofed
to dodge the throttle. `tests/loginAttemptThrottle.test.cjs` pins the
time-injected state machine and the key resolver, and
`tests/loginBruteForceEnumerationWiring.test.cjs` pins that the fragile
reason-string guards stay gone and the REST endpoint keeps its uniform error,
timing equaliser and throttle.

</details>

and has the following release-build fix:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e8c5a89e23c7d51cbe53cde23955aabaf74d635">Three release-build jobs check the repo out before running the binary pre-check</a>. Thanks to xet7.</summary>

The `bash releases/require-binaries.sh` pre-check, wired into the release build
jobs, needs the repository on disk — but three jobs did not have it there, so
the arm64 build failed with `exit code 127`
(`releases/require-binaries.sh: No such file or directory`) before it ever
assembled a bundle. `build-arm64` and `build-mac-arm64` download a prebuilt
bundle artifact and never checked the repo out at all; each now checks the tag
out first, before `download-artifact` drops the bundle into the same workspace
(a root checkout would otherwise wipe it). `build-win64` checks the repo out
into `src/` for `start-wekan.bat` and `snapcraft.yaml`, but called the script at
the workspace root; it now calls `src/releases/require-binaries.sh`, the same
`src/` path its `start-wekan.bat` copy already uses.
`tests/releaseBuildJobsCheckout.test.cjs` pins, for every build job that runs
the pre-check, that the job checks the repo out where the call looks for it and
that a root checkout precedes `download-artifact`; it fails on all three pre-fix
breakages.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v10.58 2026-08-04 WeKan ® release

**In short:** WeKan is downloadable as an **AppImage** and as a **Flatpak** now,
both built from the bundle a release already carries rather than from a second
build of WeKan. Everything else here is about builds, which were failing at both
ends, and none of it was about WeKan's
own code. The **release build** for every architecture that is not amd64 or
arm64 was down: four died on a **shell quoting bug** that emptied the CPU name
out of the Node.js download URL, two on a **base image** that is not built for
their CPU, and underneath both, nothing checked that the **binaries** those
bundles are assembled from had been published at all. Every build checks first
now, and says which file is missing and which repository should publish it. The
**local build** was running out of memory, which turned out to be **`.gitignore`
against `.meteorignore`**: Meteor reads only the second, so every other
repository cloned in beside the app - the **Node.js fork**, mongo-tools, TSC,
two more WeKan checkouts - was being walked as if it were WeKan, at one ignore
matcher per directory. And a release can now be **finished** rather than made
again: `release-all-missing.yml` builds only what a release is short of, in
every repository WeKan releases from. Below that: an Admin Panel report that
drew "No results" over data that was there, a phone layout with the menu over
the boards, seven SSRF tests failing on a fake response that was not a stream,
where a local run writes its logs, and a `build.sh` that reported success after
a failed build.

This release adds the following ways to install WeKan:

**AppImage and Flatpak** - two more formats, from the bundle a release already
has.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/73e06940c3ee7b597e9f47ce9054dbbb5b69aa82">WeKan is published as an AppImage and as a Flatpak, for x86_64 and aarch64</a>. Thanks to xet7.</summary>

Both are built from `wekan-<version>-<arch>.zip` - the bundle the release
already carries - rather than from a second build of WeKan, so what is inside an
AppImage is the same Node.js, the same FerretDB and the same application code
that the .zip for that architecture contains. Neither needs Meteor to run again.

The AppImage carries its own runtime and starts on any distribution with a
recent enough glibc; the Flatpak runs against `org.freedesktop.Platform` and is
published with a repository so `flatpak update` works. Each is checksummed like
the bundles, with a `.md5sum` and a `.sha256sum` beside it.

</details>

and updates the following dependencies:

- **fast-uri 3.1.4 → 3.1.5** — the URI parser Fastify's JSON schema validation
  uses.
- **postcss 8.5.22 → 8.5.25** — the CSS transformer the stylesheet build runs
  on.
- **socket.io-parser 4.2.6 → 4.2.7** — encodes and decodes the Socket.IO
  protocol.
- **brace-expansion 5.0.8 → 5.0.9** — the `{a,b}` expansion behind glob
  matching.

Thanks to dependabot.

and fixes the following release-build bugs:

**The extra-architecture bundles** - built from binaries other projects publish.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/92198b0671ee27545d62c9537aaccb50cabe49f7">An apostrophe in a comment emptied the CPU name out of every Node.js download URL</a>. Thanks to xet7.</summary>

Four of the six died with the same 404, on a URL that named no architecture at
all:

```
curl: (22) The requested URL returned error: 404
No Node.js for  at official (https://nodejs.org/dist/v24.18.1/node-v24.18.1-linux-.tar.xz)
```

The container script was passed as `bash -c '...'` - a single-quoted argument -
and it contained apostrophes, in comments like "where this CPU's Node.js comes
from". A single-quoted shell string cannot hold an apostrophe: the backslash
does not escape it, it ENDS the string. Everything after became separate words,
and `${NODE_ARCH}` ended up somewhere the RUNNER's shell expanded rather than
the container's - and the runner has no `NODE_ARCH`, so it expanded to nothing.

The script is a file now, `releases/install-node-for-arch.sh`, mounted into the
container. A file has no quoting layer to get wrong and `bash -n` can check it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/92198b0671ee27545d62c9537aaccb50cabe49f7">i386 and loong64 asked for a base image that is not built for their CPU</a>. Thanks to xet7.</summary>

The other two died earlier still, on `docker: no matching manifest for
linux/386 in the manifest list entries`. **ubuntu:26.04** publishes amd64,
arm/v7, arm64, ppc64le, riscv64 and s390x - not 386, and not loong64.
**debian:trixie** publishes 386 as well, so that is the base image now, named
per architecture in the matrix instead of assumed.

loong64 still cannot be built: no image on Docker Hub publishes it at any tag,
so there is no loong64 userland to rebuild the native modules in. Its Node.js
and its FerretDB both exist; the container does not. It stays in the matrix, and
the check below says exactly that on every run, rather than the architecture
quietly vanishing from the release.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/92198b0671ee27545d62c9537aaccb50cabe49f7">Every build checks the binaries it needs exist, and stops naming the missing one</a>. Thanks to xet7.</summary>

A bundle is assembled out of files other repositories publish: **FerretDB** from
wekan/FerretDB, the **MongoDB Database Tools** from wekan/mongo-tools, and on
the CPUs nobody else builds for, **Node.js** from wekan/node. Any of them can be
absent because a build has not finished, and the build should say so plainly
rather than failing an hour later with a bare 404 in the middle of an emulated
`npm install`.

`releases/check-arch-binaries.sh` runs before anything is built and checks the
base image, the Node.js, the FerretDB binary and the tools;
`releases/require-binaries.sh` does the same for the amd64, arm64, win64 and
mac-arm64 bundles. Each missing file gets a line naming it and the repository
that should publish it. The MongoDB tools stay a warning - FerretDB is the
database, and the launcher does not need them to start.

</details>

**What a release says about itself** - what is in a bundle, and where it came
from.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c429ea71d92d945076d25f990599fa0b1fd3d535">Every bundle has a checksum, and the release notes open with where its binaries came from</a>. Thanks to xet7.</summary>

A WeKan bundle is assembled out of files other projects publish - a Node.js
build, a FerretDB binary, the MongoDB Database Tools - and WHICH of them a given
architecture got varies per release: nodejs.org builds some CPUs,
unofficial-builds others, the wekan/node fork the ones neither of them does, and
not all of them publish a checksum to check the download against.

None of that was written down anywhere a downloader could see. It lived in a
build log that expires.

Every `wekan-<version>-<arch>.zip` now has a `.sha256sum` beside it on the
release, so a download can be checked. And the release notes OPEN with a
provenance table: for each architecture, what each binary was, which project
published it, at what version, from what URL, and with what checksum - or, when
the publisher offers none, that it could not be verified. It is written by the
build that used the file, not by hand afterwards, so it describes what actually
went into the bundle.

</details>

**Which Node.js a bundle carries** - where it comes from, and if it is checked.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/60c9e55d2fa4e5a152c2784caa60bb4db0dc3b21">Each CPU gets the newest that exists for IT, not the newest that exists</a>. Thanks to xet7.</summary>

Those are the same thing on amd64 and arm64, and regularly are not anywhere
else. nodejs.org builds a handful of architectures, unofficial-builds adds a
few, the **wekan/node** fork builds the rest, and each runs on its own schedule
- so the further a CPU is off the beaten path, the further behind its newest
build tends to be. Asking for the exact newest version fails for precisely the
architectures this job exists to serve.

The check walks the 24.x releases from newest down and asks all three sources at
each one, taking the first hit - which is by construction the newest build that
exists anywhere for that CPU. **riscv64** is why it matters: unofficial-builds
publishes it up to `v24.18.1` and has not reached `v24.19.0`, so looking only at
the newest found nothing and stopped the build, while a perfectly good riscv64
build was sitting there one version back.

When the answer is behind, the log says which version it got, from where, which
it wanted, and what to build to bring it in line - a warning, not an error,
because the alternative is no bundle at all for that CPU. The walk stops after
twelve releases: a CPU whose newest build is a dozen releases old is not
slightly behind, it is unmaintained, and saying so is more use than quietly
shipping something from last year.

Today that gives **s390x** and **ppc64le** the newest `v24.19.0`, and
**riscv64**, **i386** and **loong64** `v24.18.1`. **armhf** has no build at any
version from any source, and is the one architecture the run still stops on.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1a263e9e21f60f2e1eaa7d1295ede4c21b6f465a">It comes from the most verifiable source that has it, and is checked against its checksum</a>. Thanks to xet7.</summary>

The three sources do not offer the same assurances, and this was checked rather
than assumed: **nodejs.org** publishes a `SHASUMS256.txt` and signs it with the
Node.js release keys, **unofficial-builds** publishes the checksums but no
signature, and the **wekan/node fork** published neither until the change beside
this one. So the order is official, then unofficial, then the fork - descending
verifiability, with the fork as the backstop for what the other two do not
build.

Preferring a source because it publishes a checksum and then not checking it
would be preferring it for nothing. The checksum is looked up during the
preflight and the download step refuses a file that does not match it.

A mismatch is retried before it is fatal: the likely cause is a truncated
transfer, which asking again fixes. After three attempts the build stops,
because at that point the file being served is not the file that was published.
Where no checksum exists the log says so in as many words, rather than leaving
the reader to assume a check was made - which is the case for **FerretDB** and
the **MongoDB tools** today, neither of which publishes one.

</details>

- [Taking Node.js from the wekan/node fork first - the first answer, before the
  verifiability order above replaced
  it](https://github.com/wekan/wekan/commit/77d38e099f99f897af1b59350adb58143d092a93).
  Thanks to xet7.

**Running the tests locally** - what a run is given, and what it leaves behind.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/03b677f285ec7ba8c9da9e62e3096ba9efff390c">A build that runs out of heap can be told to leave a snapshot behind</a>. Thanks to xet7.</summary>

Three runs have now exhausted the heap in the same phase - after both rspack
compiles report done, while Meteor writes the production bundle. 8146 MB of
8192, then 15526 of 15542 once the limit was worked out from the machine, then
15520 with `standard-minifier-js` removed on the theory that a second JS
minifier over rspack's already-minified output was the consumer.

That last run settled the theory: taking the minifier out moved the peak by
**6 MB**, which is noise, and it died in the same place. It was not the
consumer, so it is back - an unverified change to the release artifact that
demonstrably fixes nothing does not belong in the tree, and with the build never
completing there was no way to confirm the bundle was still correctly minified
either.

Something else is holding 15 GB, and three guesses is enough. `build.sh` takes
`WEKAN_BUILD_HEAP_SNAPSHOT=1` now, which adds Node's
`--heapsnapshot-near-heap-limit=1` so the build writes a heap snapshot just
before it dies instead of only dying. Off by default, because the file is about
as large as the heap; when it is on, the build says where the snapshot lands and
what to open it with.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/581475a0d56b69ad94611ff7086f966f22c4b2ee">The heap limit for builds is worked out from the machine, not fixed at 8 GB</a>. Thanks to xet7.</summary>

The build died with

```
FATAL ERROR: Ineffective mark-compacts near heap limit
Allocation failed - JavaScript heap out of memory
```

at **8146 MB of an 8192 MB limit**, on a machine with **30 GiB of RAM**. It had
not run out of memory - it had run out of the ceiling `build.sh` gave it. And
because that ceiling was a constant, the same number was simultaneously too
small on a large machine and too large on a small one.

It is **half of total RAM now, clamped to [4096, 16384]**. Half is the share
that leaves the rest of the machine usable while a build runs; the floor keeps a
small machine from being handed something unusable; the ceiling is there because
a heap bigger than that means something is wrong rather than something is big.
At 16 GiB it works out to exactly 8192 - the value that was hard-coded - so
nothing changes on the machine that number was picked for. This one gets 15542.

The chosen size is printed at startup, and exporting `TOOL_NODE_FLAGS` or
`NODE_OPTIONS` yourself still wins.

This is also the first failure the new build log caught: the run before it
failed the same way and left nothing behind to read. And when it happens
again the error [says so in
words](https://github.com/wekan/wekan/commit/c0d9581df44c45cd4f378e01c6125356459a2be2) - the limit the build
had and the peak it reached - rather than ending on a V8 stack trace, which
reads as a crash rather than as the resource limit it is.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/76f278871c62049ad419498bd7dbe4c33f7ed11c">Logs land somewhere writable, so a run inside a sandbox keeps them</a>. Thanks to xet7.</summary>

Every log `build.sh` writes goes into a `log/<datetime>/` directory, and the
root of those was hard-coded to **`../log/`** - one level up from the repo,
which is the right default: a test run then does not show up in `git status`,
and the release process and the docs read it there.

It is not always there to write into. A Flatpak sandbox shares only the
repository directory, so `..` is missing or read-only, `mkdir -p ../log` fails,
and every redirection after it either failed or quietly dropped its log into the
repo root - which is the worst of both, because the run looks like it logged
something and `git status` fills with stray files.

`WEKAN_LOG_ROOT` is resolved once at startup: `../log` when the parent is
writable, `./log` inside the repo when it is not, and whatever you set if you
set it. Same `log/<datetime>/` shape either way, so nothing that reads these has
to care which happened, and the chosen path is printed when a run starts.
`releases/db-conformance.sh` makes the same choice when run on its own, and
`/log/` is gitignored for the case it lands inside.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4b77eb655f0a1b4c28a3f66bd98ffc3667d1b52e">A test run that fails in the build now leaves the build log behind</a>. Thanks to xet7.</summary>

The newest run ended `FAIL WeKan tests (sequential)` and its log directory held
nothing about WeKan at all - the FerretDB and database-conformance logs were
there, and not one line about why WeKan never got as far as a test. The build's
output went to the terminal only, so the one question the run raised was the one
question its logs could not answer.

`build_wekan` tees into `wekan-build.log` in the run's own directory now, and
says the path before it starts. An interactive build still scrolls past exactly
as before.

Two things found while looking. `build_wekan` did not check whether the build
worked - `meteor build` failing left the function returning success, and the
caller found out only later by noticing `.build/bundle` was missing. And
`run_all_tests` minted its own `../log/<datetime>/` even when a larger run had
already set `WEKAN_LOGDIR`, which is exactly the split-across-two-directories
the per-run directory exists to prevent; it happened to land in the same second
this time, so nothing showed. It uses the outer directory when there is one, and
exports its own when there is not.

</details>

The steps that got there, each a change of its own:

- [A build that dies of heap exhaustion says so, and how much it had](https://github.com/wekan/wekan/commit/c0d9581df44c45cd4f378e01c6125356459a2be2).
  Thanks to xet7.
- [The snapshot needs its own, lower heap cap - at the full limit the kernel
  killed the process and left a 0-byte
  file](https://github.com/wekan/wekan/commit/38c5764f753a9461df5d8022cd59e0fcc30e51ab).
  Thanks to xet7.
- [The failure names the command that diagnoses it, and the diagnosis goes into
  the log rather than only into
  scrollback](https://github.com/wekan/wekan/commit/bc3029aac70c5d5788e24c09465613460b75db8c).
  Thanks to xet7.
- [Reading the snapshot: 14,267,543 IgnoreRule objects, an ignore list
  recompiled hundreds of
  times](https://github.com/wekan/wekan/commit/317b50b8a756958b08f101a00eb85271dbbf5d78).
  Thanks to xet7.
- [Removing the second JS minifier, the theory that the revert above
  disproved](https://github.com/wekan/wekan/commit/cea2ff6f7dda00a3100301093063bc503b813de7).
  Thanks to xet7.

and fixes the following local-build bugs:

**What Meteor is allowed to walk** - the app directory, and what has been cloned
into it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cf178e5948f91041af2a02ad2503d6ce37cae105">The build ran out of memory scanning the other repositories cloned beside it</a>. Thanks to xet7.</summary>

`meteor build` died with `JavaScript heap out of memory`, and raising
`--max-old-space-size` never helped, because the ceiling was not the variable.

A heap snapshot taken as the build died says what was holding it. Of a 4.1 GB
heap, 980 MB was 14,267,543 `IgnoreRule` objects, 667 MB sliced strings, 308 MB
concatenated strings, and 274 MB was 945 copies of a single 296 KB pattern
list - about 2.5 GB of ignore machinery, and only 945 directories in.

Meteor builds one ignore matcher per directory it descends into, each carrying
the whole accumulated pattern list. There were 6,867 directories under the app
and roughly 1,000 of them were WeKan. The rest were repositories cloned in
beside it - the Node.js fork checkout alone is 4,132 directories, 45,527 files
and 2.3 GB - plus mongo-tools, TSC, the TSC website and two more WeKan
checkouts. So the real cost was very nearly seven times what the snapshot
managed to catch.

All of them were in `.gitignore`. Meteor does not read `.gitignore`; it reads
`.meteorignore`, which listed only `.tools/`, `FerretDB/` and `tests/`. The two
variant checkouts were the worst of them, because `wekan-ondra` and
`wekan-gantt-gpl` contain `client/`, `server/` and `models/`, and Meteor loads
`server/` and `client/` eagerly - a second and third copy of the whole app
pulled into the build.

`_build/` and `_build-local-test/` are the trap here, and the first attempt
fell into it. They are gitignored, and they were the first two entries of that
296 KB pattern list, so they read as build output that should be excluded too -
and excluding them breaks the build, with an error that never mentions
`.meteorignore`: `Could not find mainModule for 'os' architecture:
_build/main-prod/server-meteor.js`. They are not leftovers, they are the
handoff. rspack compiles the app INTO `_build/main-prod/`, and Meteor then reads
`server-meteor.js` and `client-meteor.js` from there as the application's main
modules. They are three directories each, so there was nothing to win and a
build to lose; the guard now asserts the opposite for them.

`tests/meteorignoreScanScope.test.cjs` pins the excludes and that they are
anchored to the repo root rather than matching a directory of that name at any
depth. It also states the general rule, so the next clone dropped in here is
caught by a test rather than by a build running out of memory: it WALKS the tree
for any directory with a `.git` of its own, rather than comparing against a list
of names, and requires each one to be ignored by git and listed in
`.meteorignore`. A directory with a `.git` is another project - not WeKan's
source and not WeKan's history - so it belongs in both files, and being in
neither is the state every one of these arrived in.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cf178e5948f91041af2a02ad2503d6ce37cae105">build.sh exited 0 while printing that the build had failed</a>. Thanks to xet7.</summary>

`build_wekan` returns 1 when the build fails, and prints `ERROR: the WeKan build
failed`. The menu called it bare, which throws that status away: the script fell
off the end and exited 0. Anything driving it non-interactively - `printf
'1\n2\n' | ./build.sh`, or CI - saw a green run and a missing bundle.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6e3e2ef154822ef47559fd4358cbe63db9bff9c">_build is the handoff to Meteor, not leftovers - excluding it broke the build</a>. Thanks to xet7.</summary>

The first attempt at the fix above excluded `_build/` and `_build-local-test/`
too, and that broke the build outright, with an error that never mentions
`.meteorignore`:

```
error: Could not find mainModule for 'os' architecture:
_build/main-prod/server-meteor.js
```

They look exactly like build output that should be ignored - they are
gitignored, and they were the first two entries of the 296 KB pattern list the
heap snapshot turned up. They are not leftovers, they are the HANDOFF: rspack
compiles the app INTO `_build/main-prod/`, and Meteor then reads
`server-meteor.js` and `client-meteor.js` from there as the application's main
modules. Ignoring them hides the files Meteor is about to be handed. They are
three directories each, so there was nothing to win and a build to lose.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/062f9127a8e23bfceb007fdbd2885f3d17dff9b8">A cloned repository has to be in both .gitignore and .meteorignore</a>. Thanks to xet7.</summary>

The first guard derived its list FROM `.gitignore`, so it only caught a clone
that had got half way: one added to NEITHER file was invisible to it, and that
is the state every one of these arrived in.

The check walks the tree for any directory with a `.git` of its own -
`existsSync`, because a submodule's `.git` is a file rather than a directory -
instead of comparing against a list of names, so a clone nobody thought to name
is caught too. Anything it finds must be ignored by git (asked of `git
check-ignore`, not of a hand-parsed `.gitignore`) and, when it is top-level,
listed in `.meteorignore`. It does not descend into a repository it has already
found: that one's own submodules ride along with it.

Verified by planting a directory with a `.git` in it - the guard fails and names
it.

</details>

The three clones that arrived during this release, each in both files - git
ignores them so `git status` stays readable, Meteor ignores them so the build
does not walk them:

- [TSC, the game, cloned under this working copy](https://github.com/wekan/wekan/commit/b7426212257222a2777c4347534dbc71085bab1c).
  Thanks to xet7.
- [Its website, secretchronicles.github.io](https://github.com/wekan/wekan/commit/2e51e7ceecaf7a754b9392ed8c560fad2dfb2468).
  Thanks to xet7.
- [The gitea fork, 1,401 directories and 384 MB - more than WeKan's own ~1,000
  directories, so it would have more than doubled the
  scan](https://github.com/wekan/wekan/commit/f47018c455fe52227c3d2a153be7e0773fb22c59).
  Thanks to xet7.

and fixes the following bugs:

**The Admin Panel reports** - how a pane gets its rows.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/78b2f9ebcd56b699f218e8da06cd99a8eac81b12">A report opened by its own address drew "No results" over data that was there</a>. Thanks to xet7.</summary>

Opening a report BY ITS ADDRESS - `/admin/problems/files` typed, bookmarked or
just refreshed - drew the column headers, "No results" and a "1 / 1" pager while
the attachments were plainly in the database. Reached by clicking the menu entry
it worked, so this only ever happened to the URL.

A full page load resumes the login from `localStorage` **asynchronously**, and
the route sets the open pane before that lands. The subscription was therefore
made with no user; the publication's `isAdmin` check answered `this.ready()`
with no rows; and nothing re-subscribed, because the autorun that opens the pane
did not depend on the user. The count METHOD, called later from the same page,
happily reported five - which is what made this look like a publication bug
rather than a timing one.

The autorun depends on `Meteor.userId()` now. `openReportPane()` returns early
when the pane is already open, so re-running it after the login would do nothing
at all - hence the second branch, which re-subscribes the report that is already
open now that there is a user to subscribe as.

</details>

**Mobile All Boards** - the phone layout, and what decides a column's width.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d80d8de1a0dbc4abf55cb8831c64ee9017440079">The left menu was drawn over the board icons on a phone</a>. Thanks to xet7.</summary>

The menu was 260px wide inside a 157.5px grid track and lay over the boards. The
grid was right all along: 42% of a 375px phone is 157.5, plus the 8px gap puts
the board column at x=165.5, which is exactly where the boards start. The menu
simply did not fit in its track.

260px is `--wekan-left-menu-width`, the DESKTOP width the drag-grip sets, and
`leftMenu.js` does not even offer that grip below 800px. The menu carried it on
a phone anyway, because the phone rules never said otherwise and the
`max-width: 100%` on the base rule does not do what its comment claimed: a
percentage width on a grid item does not resolve against the track, so it capped
nothing. That is not a browser quirk - Chromium, Firefox and WebKit all drew the
same 260px.

`width: auto` in the phone rules instead. A grid item with an auto width
stretches to its grid area, so it fills the track exactly with no percentage to
resolve. Measured rather than guessed: decoding the failing test's screenshot
pixel by pixel shows the menu background `#f7f7f7` running from x=3 to x=255 with
the blue board tiles painted on top of it from x=170, and the page background
only from x=260.

</details>

**The security test suite** - what it stands in for, and how faithfully.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aab81e8ffd4df6b0585f122aea3dac09ded726be">Seven SSRF tests timed out because the fake response was not a stream</a>. Thanks to xet7.</summary>

Every ALLOW case of the DnsBleed suite failed with `Timeout of 2000ms exceeded`,
while every block case passed - which is what hid it.

The stub was at fault, not `fetchSafe`. It faked `http.IncomingMessage` with a
bare `EventEmitter` that emitted `data` and `end` from a `process.nextTick`,
into the void if nothing was listening yet. No real response does that: an
`IncomingMessage` is a PAUSED `Readable` that buffers its body until a listener
attaches, so reading late cannot lose data. That only started to matter when
`fetchSafe` was split into resolving the response and then reading it, which the
redirect handling needs - the nextTick queue drains BEFORE promise microtasks,
so the fake had already fired `end` by the time the awaited continuation
attached its listeners.

Verified rather than assumed, both halves: against a real server, a request
whose listener is attached two nextTicks, a `setImmediate` and 20ms late still
receives the whole body; and against the real `fetchSafe`, driven by each stub
in turn, the old one times out where the `Readable`-backed one returns the body,
the pinned IP and the Host header. The security assertions still hold through
the new stub - a 302 refused, a host resolving to 127.0.0.1 refused with ZERO
requests sent, each redirect hop pinned, and credentials dropped cross-origin.

</details>

and adds the following release tooling:

**Completing a release** - across every repository WeKan releases from.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d62c4f376635461d7cd59ffc6fa791b5a7f39556">A release can be finished without being made again</a>. Thanks to xet7.</summary>

`release-all.yml` is one run that bumps the version, tags, builds every
platform, and publishes Docker images, snaps, the website and the charts. It is
the right thing for MAKING a release and the wrong thing for FINISHING one. When
the v10.57 run ended with all six extra architectures missing, there was no way
to get those six except to run the whole thing again, version bump and all.

`release-all-missing.yml` finishes a release that already exists. It never bumps
a version, never tags, and never touches Docker, snap, the website or the
charts.

What makes it possible: only `build-amd64` runs Meteor. Every other bundle WeKan
ships is that same bundle with its native modules rebuilt, its Node.js swapped
and its database binaries replaced. So it downloads the PUBLISHED
`wekan-<v>-amd64.zip` - verifying its checksum, since it is the bundle every
other architecture is cut from - and repacks it with
`releases/repack-bundle-for-arch.sh`, the same script the full release runs. A
bundle added to a release months later is therefore built exactly like the ones
already on it.

It does not claim to build everything, and says which: amd64 is the Meteor
build, arm64/win64/mac-arm64 each need their own kind of runner, and the
Sandstorm `.spk` is signed. `releases/expected-assets.sh` says what a complete
release looks like, in one place, and an asset counts as present only when its
`.sha256sum` is there too - a bundle whose checksum upload failed is
half-published.

The same pair now exists in **wekan/node**, **wekan/FerretDB**,
**wekan/mongo-tools**, **wekan/gitea**, **Secretchronicles/TSC** and both snap
variants, so every repository WeKan releases from can be completed the same way.
Where the full build had another name - `node.yml`, `build-binaries.yml` - it is
`release-all.yml` now.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dcdda5f0f8c34aeb4ca5c58f925386e7d507cb40">The filter that selects what to build stopped every workflow loading</a>. Thanks to xet7.</summary>

The `only` filter was written as a job-level condition, and GitHub refuses to
load a workflow that does that:

```
Invalid workflow file
(Line: 109, Col: 9): Unrecognized named-value: 'matrix'
```

`matrix` is available to a job's `runs-on`, `env`, `name`, `container`,
`services`, `continue-on-error`, `timeout-minutes`, `strategy` and `steps` - but
NOT to `jobs.<id>.if`, which is evaluated before the matrix is expanded. It
looks entirely reasonable, which is why it was written in five workflows in one
sitting.

It is worse than a job that does not run: a workflow that will not load takes
every workflow that CALLS it with it, so TSC's `release-all-missing.yml` failed
at startup with "error parsing called workflow" and built nothing at all.

The decision moves to the job's `env:`, which can see matrix, and every step
asks for it. Steps that already had a condition keep it, ANDed inside
parentheses. Twelve files across five repositories.

`tests/workflowExpressions.test.cjs` is the guard, and it exists because a YAML
parser is perfectly happy with every one of these - the file is valid YAML, and
only GitHub's expression evaluator rejects it, when the workflow is dispatched.
It pins that no job-level `if:` reads `matrix` or `steps`, that every `${{ }}`
is closed, and that a workflow declaring an `only` input actually consults it.
Its brace check strips complete expressions rather than counting braces, because
three real lines run docker with Go templates full of `}}` that close nothing of
GitHub's.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/18c6dcc68fb3023feaa9382c596ba4df72aa947d">The other way a workflow fails before it starts is guarded too</a>. Thanks to xet7.</summary>

`uses: ./.github/workflows/X.yml` fails at STARTUP - taking the calling workflow
down with it, so nothing runs and there is no job log to read - when X.yml does
not exist, has no `workflow_call` trigger, or is handed a `with:` key it never
declared. Same class of failure as the one above, and just as invisible: the
YAML is valid, and only GitHub's loader objects.

Worth pinning now because `release-all-missing.yml` calls `AppImage.yml` and
`Flatpak.yml` here, TSC's calls five workflows, and the `only` input they all
take was added by hand to each of them. One typo in a `with:` key would stop a
whole run.

Checked across every repository first - TSC, WeKan, both snap variants,
wekan/node, wekan/FerretDB, wekan/mongo-tools and wekan/gitea - where all
reusable-workflow calls already match. Then verified against all three shapes by
breaking each in turn: an undeclared `with:` key, a missing file, and a called
workflow with no `workflow_call`.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.57 2026-08-03 WeKan ® release

**In short:** two reported bypasses of the **SSRF guard** are closed, and they
are the same mistake in its two halves. **FollowBleed** — the import downloads
validated the URL and then fetched it with something that follows redirects, so
a public URL could answer *302 to 127.0.0.1* and that body became the imported
attachment; **fetchSafe** now validates and pins **every hop**, not only the one
the caller passed. **TransitBleed** — the shared block-list read an IPv6 address
by its spelling, so **6to4**, **NAT64** and **Teredo** addresses carried an
internal IPv4 destination straight through it; an address is now expanded to its
bytes and every embedded IPv4 is re-checked. Below that, the **platform
documentation** is arranged by what each platform is: every page lives under
**OS**, **HW**, **Container**, **Cloud**, **Package**, **Source** or **SaaS**,
with the links that had to follow the move, logos stored beside their page
instead of fetched from somebody else's server, two new platform pages, and a
developer-tooling fix.

This release fixes the following CRITICAL SECURITY ISSUES:

**The SSRF guard** - what it checks, and what it was deciding from.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4c183b4d5942f09ab30d0dcdad4d6e4df889023d">Import downloads validate every redirect hop instead of only the URL they were given</a>. Thanks to RandomGenerator and xet7.</summary>

[FollowBleed](https://wekan.fi/hall-of-fame/followbleed/) is a bypass of the fix
that closed [LiveBleed](https://wekan.fi/hall-of-fame/livebleed/) /
CVE-2026-30844. The live Trello import did validate the attachment URL with
`validateAttachmentUrl()` — and then downloaded it with the platform `fetch()`,
which **follows redirects**. So the guard only ever saw the request, and the
target gets to answer:

1. the attacker puts `http://<public-host>/attachment.txt` on a Trello card
2. `validateAttachmentUrl()` resolves it, sees a public IP, allows it
3. that host answers `302 Location: http://127.0.0.1:18080/secret`
4. `fetch()` follows, and the loopback body is stored as the imported
   attachment, readable back through WeKan

That is non-blind SSRF against loopback services, internal admin panels, cloud
metadata and anything else reachable from the container — the exact thing the
validation was added to stop, reached through the response instead of the
request.

A guard on the URL alone cannot hold, so `fetchSafe()` guards **every hop**.
`maxRedirects` (default 0) is how many redirects a caller is willing to follow.
0 keeps the old behaviour of refusing any 3xx outright, which is right for
outgoing webhooks and avatar downloads, because a legitimate one never
redirects. A caller that must follow one passes a small number, and each hop
goes through the same protocol allowlist, blocked-range check and DNS pinning as
the original URL before a packet is sent to it. Credentials are dropped on a
cross-origin redirect, so following Trello's 302 to S3 cannot hand the API key
and token to whoever the redirect names.

Refusing every redirect was not an option: Trello's own attachment endpoint
answers with a 302 to a signed S3 URL, so that would have meant importing no
attachments at all.

The **offline** importers had the same hole and were not in the report. They
handed the validated URL to `Attachments.loadAsync()`, and Meteor-Files
downloads with the platform `fetch()` too, so a pasted Trello or WeKan board
export reached `127.0.0.1` by exactly the same 302. They download through the
guard now, and store the bytes with the same call they already used for an
attachment that arrived inline.

`tests/followbleed.test.cjs` replays the reported attack against a stubbed
transport and asserts the second hop is never sent, then pins the rest: a
redirect to a hostname resolving to a private IP, to metadata, to a non-`http`
scheme, a relative `Location`, the chain limit, credential stripping across
origins, 303/307 method handling — and that a legitimate public-to-public
redirect is still followed with each hop pinned, because the import has to keep
working.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4c183b4d5942f09ab30d0dcdad4d6e4df889023d">IPv6 addresses are classified by their bytes, not by how they are spelled</a>. Thanks to tonghuaroot and xet7.</summary>

[TransitBleed](https://wekan.fi/hall-of-fame/transitbleed/). `isIpBlocked()` is
the one block-list behind **both** halves of the SSRF defence — the input-time
validator and the delivery-time guard — and its IPv6 half classified an address
by its spelling: `startsWith('::ffff:')`, `startsWith('2001:db8')`, and the
first hextet parsed out of the string.

IPv6 has several standard ways to write "this packet goes to an IPv4 address",
and none of them looks like `::ffff:`:

- `2002:a9fe:a9fe::` — 6to4 (RFC 3056) → `169.254.169.254`
- `64:ff9b::c0a8:101` — NAT64 (RFC 6052) → `192.168.1.1`
- `2001:0:…` — Teredo (RFC 4380), the IPv4 stored as the complement of the low
  32 bits
- `0:0:0:0:0:ffff:7f00:1` — IPv4-mapped, merely spelled out → `127.0.0.1`

On a host with a 6to4 relay or a NAT64 gateway — ordinary in cloud and
Kubernetes networks — the packet arrives at that IPv4 address. So
`http://[2002:a9fe:a9fe::]/latest/meta-data/` read cloud metadata straight
through the guard whose whole job was to stop it.

An address is **expanded to its 16 bytes once** and every check reads those
bytes, so notation cannot change the answer, and every transition form has its
embedded IPv4 extracted and re-checked with the IPv4 rules: 6to4, NAT64 (the
well-known prefix and the RFC 8215 local-use one), Teredo through both its
server and its obfuscated client address, IPv4-mapped, IPv4-translated,
IPv4-compatible, and ISATAP under any routing prefix rather than only the
link-local one. The deprecated `fec0::/10` site-local range is blocked too.

A transition address wrapping a **public** IPv4 is still allowed, and
`tests/transitbleed.test.cjs` pins that as carefully as it pins the bypasses: a
guard that blocks everything is a guard somebody switches off.

</details>

and has the following developer-tooling fix:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6cd64284dce838fea38dc967a5729246761bc89f">The Sandstorm bridge guard reads the page at the path it moved to</a>. Thanks to xet7.</summary>

The documentation reorganisation turned
`docs/Platforms/FOSS/Container/Sandstorm` from a page into a directory, and this
test reads that page at run time to pin what it documents. So it did not merely
go stale: `fs.readFileSync` on a directory throws `EISDIR`, and the suite died
before its assertions ran.

It reads the directory's landing page, `README.md`, which is where the
migration-bridge documentation ended up. Both assertions are unchanged and both
pass.

</details>

and reorganises the documentation:

**The Platforms docs** - how the pages are arranged, and what points at them.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f628a698890dcbbd965ddee7b3b164523a3acf4a">Every platform page sits under what it is - an OS, container, cloud, hardware or package</a>. Thanks to xet7.</summary>

`docs/Platforms` grew a page at a time, so what a reader met was a flat list:
`Android.md`, `Debian.md`, `FreeBSD.md` and `SmartOS.md` next to `Snap/`,
`Docker/` and `Sandstorm/`, next to `ppc.md`, `s390x.md` and `RaspberryPi/`,
with `Propietary/Cloud/` holding both rented machines and one-click hosting
services. Nothing said which was which, and the list only ever got longer.

The two halves keep their names and gain a middle layer that says what a thing
is. **FOSS** has `OS`, `HW`, `Container`, `Cloud`, `Package` and `Source`;
**Propietary** has `OS`, `HW`, `Cloud` and `SaaS`. So Debian is an OS, Snap and
Sandstorm are containers, Raspberry Pi is hardware, OpenShift and Helm are
cloud, and PikaPods, Cloudron, Scalingo, Heroku and Uberspace are SaaS rather
than being filed beside AWS and OVH.

**A directory's index page is `README.md`**, which is what GitHub renders when
somebody opens the directory, so a link points at the directory and never spells
out `README.md`. `Docker/Docker.md`, `Snap/Snap.md`, `Sandstorm/Sandstorm.md`
and the other pages named after their own directory became that `README.md`.
`Cloud/OpenShift/` is the one exception, because it already had one.

The old `FOSS/Platforms.md` index is gone, the directory tree being the index
now, and the pages that linked to it point at `docs/Platforms` instead.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f628a698890dcbbd965ddee7b3b164523a3acf4a">The links follow the move, including the ones inside the pages that moved</a>. Thanks to xet7.</summary>

Two different things break when a documentation tree is rearranged. A link whose
**target** moved is the obvious one. The other is a link inside a page that
**itself** moved: `Snap/CentOS-7.md` went one directory deeper, so all ten of
its links out to `Webserver/`, `Login/`, `Backup/` and `Email/` needed another
`../` even though nothing they point at had moved at all. Both kinds were
resolved from where each page used to live, across 213 files.

Not every reference is a markdown link, and those were followed too: the Snap
settings comments in the eight `docker-compose*.yml` files,
`sandstorm-pkgdef.capnp`, `sandstorm-src/start.js`,
`server/methods/sandstormMigration.js`, `snap-src/bin/config`,
`releases/version.sh` and the two ferretdb `start-wekan` scripts.

One of them is not a comment. `tests/sandstormMigrationBridge.test.cjs` **reads
the Sandstorm page at run time** to pin what it documents, so this move would
have failed the test suite rather than merely leaving a dead link behind.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f628a698890dcbbd965ddee7b3b164523a3acf4a">Doc links written from the repository root resolve from the page holding them</a>. Thanks to xet7.</summary>

43 links in five files named a path from the repository root, `models/users.js`
or `client/lib/localStorageValidator.js`, which resolves to nothing from the
page holding it. They carry the `../` that gets there now:
`docs/DeveloperDocs/Directory-Structure.md` has 9, where the *other* link on
each of those same lines was already correct, and the four
`docs/Security/PerUserDataAudit2025-12-23/` files have 34.

Only paths that exist in the WeKan repository itself were repointed. `FerretDB`,
`node`, `wekan-gantt-gpl` and `wekan-ondra` sit inside the working copy but are
separate git repositories, so nothing resolves into them.

</details>

**Third-party assets** - what a reader's browser fetches when a page opens.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f628a698890dcbbd965ddee7b3b164523a3acf4a">Platform logos are stored beside their page instead of fetched from another host</a>. Thanks to xet7.</summary>

A logo loaded from somebody else's server hands that server the IP address and
user agent of everyone who opens the page. The deploy buttons were doing exactly
that, from **cdn.zenith.hosting**, **cdn.scalingo.com** and
**www.herokucdn.com**, as was the Sandstorm badge from **img.shields.io** and
the MacStadium and WeKan logos from **wekan.fi**.

Each is stored next to the page that shows it now, named after its platform:
`zenith.svg`, `scalingo.svg`, `heroku.png`, `sandstorm.svg`,
`MacStadium-developerlogo.png` and `wekan-logo.svg`. **PikaPods** needed no
download at all, because `pikapods.svg` was already sitting in its own directory,
unused while the page fetched the same image over the network.

Screenshots are left as they are. This is about the logos, which are small,
never change, and are fetched on every single visit to the page.

One was beyond saving: the chat badge at `vanila.io` answers with an HTML page
rather than an image, so it is left alone rather than replaced by a copy of
something that is already broken.

</details>

and adds the following new platform pages:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f628a698890dcbbd965ddee7b3b164523a3acf4a">Packager.io and Zenith Hosting have a page of their own</a>. Thanks to xet7.</summary>

**Packager.io** at `FOSS/Package/` records the DEB/RPM build at
[packager.io](https://packager.io/gh/wekan/wekan) and says plainly that it does
not work yet, which is the useful part: the link exists, and a link that exists
invites the assumption that what is behind it works.

**Zenith Hosting** at `Propietary/SaaS/` is one-click managed WeKan with
storage, backups, email and a free subdomain, and a share of every subscription
goes back to WeKan.

</details>

- [The Zenith Hosting page reads as prose instead of a two-item list](https://github.com/wekan/wekan/commit/aaab92b9f49985671e09f6e1aa41a8b5880eac46). Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.56 2026-08-02 WeKan ® release

**In short:** WeKan is built for **every Linux platform its database is**. The
three architectures that were missing a Node.js - **i386**, **armhf** and
**loong64** - have one now, built by the **wekan/node** fork for the platforms
nodejs.org and unofficial-builds do not publish, so they get a bundle, and i386
and armhf get a **snap** and a place in the **multi-arch image** as well. Below
that: the snap build that could not finish on any of the FerretDB-only
architectures, the All Boards left menu lying across the boards on a phone and
its board counts landing at four different x positions, and a remote snap build
that failed three times without ever saying why.

This release adds the following new features:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/12ae908ddfbcaa0bf59d7c5dc047ea77757bb264">Every Linux platform FerretDB builds for is built, with a Node.js to match</a>. Thanks to xet7.</summary>

Every non-amd64, non-arm64 platform already used FerretDB v1 - MongoDB ships no
server for any of them - but only three were built, because only three had a
Node.js runtime anyone published. The **wekan/node** fork now builds the rest,
so the release follows FerretDB's list instead of Node.js's.

New bundles: **i386**, **armhf** and **loong64**, beside the ppc64le, s390x and
riscv64 already there. i386 and armhf also become **snaps** and join the
**multi-arch image** (`linux/386`, `linux/arm/v7`); loong64 ships as a `.zip`
only, because it is not a snap architecture and buildx and the three registries
do not agree on it yet.

**Where the Node.js comes from is resolved at build time rather than declared**:
nodejs.org, then unofficial-builds, then the fork, in that order, and the log
says which one served. The first two ship a tarball; the fork ships the bare
binary it built, because that is the only part missing - so when the fork
serves, npm comes from the official amd64 tarball of the same version. npm is
JavaScript and runs on whatever node executes it, so an npm built for one CPU
drives a node built for another.

**Three vocabularies meet in that matrix and they disagree.** Node says `x86`
and `armv7l` where Debian, snap and FerretDB say `i386` and `armhf`, and snap
says `ppc64el` where everyone else says `ppc64le`. Every row now names all
three, because a row that named one of them would download another CPU's binary
and nothing would notice until somebody ran it.

**armel** is the one FerretDB target deliberately left out: V8 has not supported
ARMv5 for many years, so there is no runtime to put in the bundle and the fork
cannot build one either. A bundle with nothing to run it is not a bundle.

The MongoDB Database Tools are per-tool tolerant now - wekan/mongo-tools does
not publish every architecture, and a missing `mongodump` is a missing
convenience rather than a broken bundle, since FerretDB is the database. It
removes the inherited amd64 tool instead of shipping it, because a tool for the
wrong CPU is worse than no tool. It is written up as
[Platforms](https://github.com/wekan/wekan/blob/main/docs/Design/Autoupdate/Platforms.md).

</details>

and fixes the following bugs:

**The snap** - the packages Launchpad builds for the arches with no runner.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2d17d2627a2aef431b40e644805e9cf822d4f958">It builds again on every architecture that has no MongoDB server</a>. Thanks to xet7.</summary>

The s390x snap died in the STAGE step of both its Launchpad builds, right after
"Staging mongodb", with `IsADirectoryError` on `stage/bin`. ppc64el and riscv64
take the same branch and would have died the same way.

The mongodb part's stage-packages unpack an Ubuntu 24.04 merged-`/usr` layout,
which leaves `bin` in the part as a **symlink** to `usr/bin`. On amd64 and arm64
the part then downloads MongoDB and copies its binaries in, which replaces that
symlink with a real directory. On the architectures MongoDB ships no server for,
the build exits before that and the symlink survives - and staging a symlink on
top of the real `stage/bin` an earlier part has already created is what failed
the whole snap, not just that part.

An `override-stage` turns a `bin` symlink into an empty real directory before
staging. It tests for a symlink specifically, so the architectures where mongod
really is there are untouched, and it removes before `mkdir -p`, because
`mkdir -p` follows a symlink and would have changed nothing.

</details>

**All Boards** - the page and its left menu, on a phone above all.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b91c99b115c93c27fa2d257972a748ee45054e4">The left menu fits its column on a phone instead of lying over the boards</a>. Thanks to xet7.</summary>

On a 375px phone the menu's column is capped at about 157px, and the menu kept
the 260px width it carries so it can be dragged - so it lay across the board
icons.

`max-width: 100%` did not fix it, and that is the part worth knowing: a grid
item's default `min-width` is `auto`, which is its content's intrinsic minimum,
and **a minimum beats a maximum**. The cap did nothing until the item was
allowed to shrink to it. `min-width: 0` is the same pair the board column beside
it has carried all along, for the same reason. Nothing inside the menu needs the
intrinsic width held open - the workspace name already ellipses through its own
`min-width: 0`.

The `node/` directory - a clone of the Node.js fork the runtime is built from -
joins the other local-only clones in `.gitignore` at the same time, so it stops
filling `git status` with 2.2G of untracked source.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/852ad1714b58589fd132c4f63ef32fc47eef709d">The board counts line up in one column</a>. Thanks to xet7.</summary>

Starred, Home, Templates and Archive have labels of four different lengths, and
on a phone the count chip sat immediately after its label - so the four numbers
landed at four different x positions and the column of counts read as ragged
rather than as a column at all.

That packing was deliberate: the number beside the text rather than across a
gap, on the grounds that a landscape phone's menu is wide enough for the gap to
look like a mistake. It is reversed here, because the alignment is what a reader
is actually using - the counts are compared with each other down the column, and
four x positions is what stops that. The row keeps the same spread-apart layout
at every width now, so every count sits at the end of its own row and they line
up. The phone override is gone rather than re-tuned: there is no width at which
the ragged version was wanted.

</details>

and improves the following release tooling:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8dc6bc7edd69fc44d0a084fe6d07c3799e1d28f2">A remote snap build that never starts now says why it did not</a>. Thanks to xet7.</summary>

The riscv64 leg failed three times in sixteen minutes, and the whole of what it
printed was one line: `Git operation failed with: Could not push 'HEAD' to`
Launchpad. The build had not started - `remote-build` uploads the source to a
Launchpad git repository first, and it was the upload that failed - so there was
no Launchpad build log to print, which is what the job knew how to show.

snapcraft swallows git's own error, writes it to its own execution log, names
that log's path in the output, and nothing reads it. So "rejected", "timeout",
"auth" and "too big" all looked identical from the job log, which is why three
runs narrowed nothing down. That log is printed now when an attempt fails.

The retry also clears snapcraft's local clone of the Launchpad repository before
waiting. A retry that reuses a half-pushed one repeats the same failure, and
three identical attempts sixteen minutes apart is what that looks like.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.55 2026-08-02 WeKan ® release

**In short:** a dependency release. Four updates arrive from **dependabot**,
none of them in the shipped bundle: the two halves of **typescript-eslint** that
let ESLint read and check TypeScript, the **sinon** test doubles the unit suites
build their fakes from, and the **docker/login-action** step that signs in to
the container registries when a release image is published. Nothing WeKan runs
in a browser or on a server changes.

This release updates the following dependencies:

- **@typescript-eslint/eslint-plugin 8.63.0 → 8.65.0** — the TypeScript rules
  ESLint checks the source against. A development dependency: it runs in the
  linter, never in the bundle.
  ([#6564](https://github.com/wekan/wekan/pull/6564),
  [Update](https://github.com/wekan/wekan/commit/31fb4f509)). Thanks to
  dependabot.
- **@typescript-eslint/parser 8.63.0 → 8.65.0** — the other half of the same
  pair: what lets ESLint read TypeScript at all, so it moves with the plugin
  above.
  ([#6562](https://github.com/wekan/wekan/pull/6562),
  [Update](https://github.com/wekan/wekan/commit/d949bc6c0)). Thanks to
  dependabot.
- **sinon 22.0.0 → 22.1.0** — the spies, stubs and fake timers the unit tests
  build their doubles from. Also a development dependency.
  ([#6563](https://github.com/wekan/wekan/pull/6563),
  [Update](https://github.com/wekan/wekan/commit/72ea1282f)). Thanks to
  dependabot.
- **docker/login-action 4.5.1 → 4.6.0** — the GitHub Actions step that signs in
  to the container registries before a release image is pushed. Pinned by
  commit hash rather than by tag, which is why the change is a hash and not a
  version number.
  ([#6561](https://github.com/wekan/wekan/pull/6561),
  [Update](https://github.com/wekan/wekan/commit/fe185f5c2)). Thanks to
  dependabot.

Thanks to above GitHub users for their contributions and translators for their
translations.

# v10.54 2026-08-02 WeKan ® release

**In short:** a large redesign of the pages you are always looking at. The
**first header bar** now says where you are, carries every control that used to
be scattered around the page, wraps instead of hiding what does not fit, and
holds a **bookmarks menu** - the star works on any page now, not only on a
board. **All Boards** gains a Home section for the board that opens after login,
an Archive in its left menu, a Table view, a heading naming the section you are
in, and an address for every section and workspace; the **Admin Panel** moves
under `/admin` with an address for every pane. **The left menu** those two pages
share **folds away** and is **resized by dragging** its inner edge, and the
**workspaces** in it are a real tree: drop one onto another to nest it, to any
depth, and fold a branch away with its caret. **Public Boards** becomes a
read-only page of its own, a swimlane, a list and a card can each be **linked**
to directly, and **board roles** are one capability table with a pane that shows
it. Below that: dependency updates, sixteen bug fixes -
the header bar's layout and where it starts, a filter that left a spinner
turning, a search that reached past your own boards, a left-menu caret that did
nothing when clicked - and the usual documentation and translation work.

This release adds the following new features:

**The left menus** - the one menu All Boards and the Admin Panel share.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5df6f284212be9ec6070f8438dca78f0d1fa89d8">The left menu folds away, with the caret a list already has</a>. Thanks to xet7.</summary>

At the top of both left menus - All Boards and the Admin Panel - there is now a
caret that folds the menu away, and the same caret brings it back. It is the
control a **list** has on a board: pointing down while the thing is open and
right once it is folded, with the same two words in its tooltip, so there is
nothing new to learn.

Folded, the menu is **gone** - no column, no strip, no narrow band of grey with
a glyph in it - and the page beside it takes the whole width. A strip is still a
column: it holds width, it keeps the page from starting at the window edge, and
a caret alone in it is a target that has to be aimed at.

**The way back is the pane title.** Folded, the caret moves to the inline start
of the heading beside it, and the caret and the title are one target: clicking
anywhere on it brings the menu back. Nothing is lost by drawing nothing, because
the way back is the largest thing on the page rather than the narrowest. The
heading is drawn even for a pane that has no title of its own, so a folded menu
can never be a menu you have lost.

**One state for both pages**: they draw one menu, and a reader who folds it away
on one of them has said what they want on the other. It is a Session value
first, so the fold is instant rather than waiting for a round trip, then
`profile.leftMenuCollapsed` on the user document so it survives a reload and
follows the reader to their other browser, and a cookie when nobody is signed in
- a public board has this menu too - through the same cookie helpers the public
list and swimlane collapse states already use.

Open is the default: a menu that remembered itself collapsed for somebody who
has never collapsed one would be a page with no visible way to navigate.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/920d42b6db4c2df0d8302ee56b3d0d17fc40c3c3">Its width is dragged from its inner edge, the way the right sidebar's is</a>. Thanks to xet7.</summary>

The menu's inner edge - the right one while reading left to right, the left one
under a right-to-left language - now carries a grip, and dragging it changes the
width. It is the same control the right board sidebar has on its own inner edge:
the same strip, the same cursor, and the same sign flip on the drag so the
widening direction mirrors under a right-to-left language rather than needing a
second rule kept in step.

**One number, on `<html>`.** The width is a CSS custom property, and everything
that needs it reads that one: the Admin Panel's menu, the All Boards one - whose
grid track follows the menu - and the grip itself, which has to sit exactly on
the edge. An inline width on one element could not have done that, because the
menu is a different element in a different template on each page. A breakpoint
that wants a different default width overrides the variable rather than the
menu, or it would beat a dragged width at exactly that one screen size.

The grip is positioned against the row around the menu, not inside it: the menu
is its own scroll area, and a handle within it would scroll away with the
entries. Being positioned it is neither a flex item nor a grid item, so it adds
no column and no gap - which is why the shared menu template can carry it and
every Admin Panel pane gets it without naming it.

The width is remembered the same three ways the fold is: a Session value first,
then `profile.leftMenuWidth` on the user document, then a cookie when nobody is
signed in - the same cookie mechanism the fold uses rather than the localStorage
the right sidebar's width uses, so one reader's menu is not remembered in two
different places. It is saved once, when the drag ends; while dragging, the
width is written straight to the property, so the edge follows the pointer
without a database write per pixel. There is nothing to drag on a phone, where
the menu is full width above the content, or while it is folded, where there is
no edge.

</details>

**Workspaces** - the tree of folders for boards in the All Boards left menu.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/73a136bedd86fe3760ba707eca8612209a5e82ce">A workspace nests inside another one, and a caret folds the tree away</a>. Thanks to xet7.</summary>

A workspace holds boards and, in the data, other workspaces - but a drag could
only ever say one thing about them, and there was no way to fold a branch at
all.

**Where in a row a workspace is dropped is now what the drop means.** The top
quarter makes it that row's previous sibling, the bottom quarter its next
sibling, and the **middle half** makes it that row's **last child** - a
sub-workspace. The middle is the biggest target on purpose: reordering can also
be reached by aiming at the neighbouring row's far edge, but nesting has only
this one. Coming back up is a drop like any other - a child dragged onto a root
row's edge is a root again - because nesting has to be undoable, or a workspace
put one level too deep is stuck there.

**The placeholder is a slot, not a line.** While the pointer is over a row, an
empty slot a row high opens above it, below it, or - for "into this one" -
indented underneath it, which is exactly where the workspace will appear. A line
between two rows is a target that has to be aimed at; a slot is a place to drop
into. It opens as a pseudo-element of the row, so the rows below shift down and
the row being aimed at stays where the pointer put it.

A workspace may not be dropped into itself or into its own descendant: the
subtree would be cut off from the root, taking every workspace under it with it.
That is refused while the workspace is still in the air, so the cursor says no
rather than the drop landing and quietly doing nothing.

**A caret folds a workspace's own workspaces away**, at the start of the row -
before the drag handle, so the carets of a tree line up whatever the
drag-handles toggle says. It is the control a list has on a board and the one
the left menu itself has, down to the two words in its tooltip, and it answers
Enter and Space, because a tree that only opens with a mouse is a tree half the
readers cannot open. A workspace with nothing under it keeps a spacer of the
same width, so a row does not shift sideways the moment it gains its first
child. Open is the default, and only the folded ones are stored - fifty
workspaces with two folded is two keys - remembered in the same three layers as
the rest of this menu: a Session value, the user's profile, and a cookie for a
reader who is not signed in.

The depth is **unlimited** because nothing counts it: the menu draws itself
again for a workspace's children, each level indenting by one caret's width with
a logical property, so a right-to-left tree indents from the right by itself.

What a drag does to the tree is a pure module with its own tests - which third
of a row the pointer is in, and the tree a move produces, guards included - so
the rules are proved without a browser, and the page is pinned to calling them
rather than working them out a second time. It is written up as
[Workspaces](https://github.com/wekan/wekan/blob/main/docs/Features/Page/Workspaces.md).

</details>

**All Boards** - its sections, its controls, and what the page opens on.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a88dc8cbba676a7ef33ab076943f6dd5b57b9e05">Every section names itself at the top of its pane</a>. Thanks to xet7.</summary>

The right pane began with board tiles and nothing said which list they were. The
page is five lists of boards under one name - Starred, Remaining, Home,
Templates, Archive, and a workspace - so the pane now opens with a heading
naming the one you are looking at.

It is the Admin Panel's own `paneTitle` template with the same
`.admin-pane-title` class, so the two pages have one heading at one size and
colour rather than two written twice that drift apart. Only the space below it
is set here: the Admin Panel's own gap rule is scoped to its `.main-body` and
does not reach this page.

It is drawn once, above the view branch, since the board icons and the Table are
two ways of showing the same section rather than two sections. Its words are the
section's own title key - the same key the first header bar names the page with,
and the same one the highlighted menu row carries - so all three say the same
thing. A workspace shows its own name instead, untranslated: a workspace called
"starred" is not the Starred section.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eea1f2ffed4af635c67659f176353de57b0d4040">Home, a section for the board that opens after login</a>. Thanks to xet7.</summary>

One board can be Home: logging in opens it instead of the All Boards page. That
has always existed, set from Multi-Selection's "Set as Home board (opened after
login)", but there was nowhere that said which board it *was* - the setting was
write-only, and the only way to find out what you had chosen was to log out.

Home is now a section of All Boards with a row in the left menu, a home icon and
the word Home, a count beside it like the other lists, and the address
`/allboards/home`. It sits under Starred and Remaining - the top row stays the
one the page opens on, since after login you are already *in* the Home board -
and the row is there whether or not a board is at it, because the place to drop
a board onto has to exist before there is anything in it.

**Drop a board on the row to make it Home.** The row is one more place in a
column a board icon can already be dragged onto, so the gesture is the one
already in the reader's hand; the alternative was three clicks through
Multi-Selection. A drop **replaces** rather than toggling: Home holds one board,
and a drop that sometimes set and sometimes cleared would depend on state the
reader cannot see while dragging.

**Home is a mark on a board, not a place boards are kept** - like a star. The
board stays in Remaining, or in its workspace, and appears in Home as well.

**Taking a board off Home is the Android launcher's gesture.** Pick the board up
in Home and a Remove bar appears above the tiles - only while the board is
actually in the air, because an affordance that shows up when the gesture is
possible explains itself, and a trash can sitting permanently under somebody's
boards is a button nobody dares press. Drag the board onto it and it turns red,
let go and it asks, and the question says the board itself is not deleted. Every
other target refuses the drop while the board is still in the air, so a board
cannot leave Home by accident while you are filing it into a workspace.

The server accepts only a board the caller is a member of and that is not
archived - a Home board that will not open would send that user to a board that
refuses to draw at every login - and clears only the board that is actually
theirs. Nothing automatic writes it; in particular Sandstorm's auto-open still
persists nothing.

Documented in [Home](https://github.com/wekan/wekan/blob/main/docs/Features/Board/Home.md).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/50a1d4263e253b0771342e7469243b13eaf106d3">It opens on Starred, or on Remaining when nothing is starred</a>. Thanks to xet7.</summary>

Starred was always the section All Boards landed on. On an account that has
starred nothing that is an empty page with a full one behind it, which reads as
WeKan having lost the boards rather than as a section nobody has filled in yet.

`/` now opens **Starred when the user has starred boards and Remaining when they
have none**, and the left menu puts whichever one that is on top, so the
highlighted row is the first row. Only those two rows move — Templates and the
Archive keep their places.

The rule is one pure function pair in `models/lib/allBoardsUrls.js`, so the page
and its guard read the same one. The router no longer answers the question: it
runs before the user document has necessarily loaded, so it leaves `/` open and
the page decides — in an autorun, because on a cold load the user document lands
after the template is created and a single read would say "nothing is starred"
for everybody. It asks the user document's own starred list rather than the
query that counts the boards, whose answer depends on the subscription and would
draw Remaining and then jump to Starred mid-load. An address that does name a
section still wins, so this can never fight a row the reader has clicked.

The four menu rows became one row drawn once per section, since an order that
depends on the user cannot be four copies of the same markup.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d50d9d66">Boards in Archive moves to the left menu, and the Workspaces section gets its rules</a>. Thanks to xet7.</summary>

Boards in Archive was a button in the first top header bar beside Sort, Search
and Multi-Selection. Those three act on the boards in front of you; Boards in
Archive is a place you go instead, so it is a row of the left menu now, under
Remaining, with a count beside it like the three lists above it — and it opens
as a SECTION of the All Boards page, drawn beside the menu rather than as a
full-width page that replaces it. Selecting something from a menu and then
losing the menu is a menu that throws itself away. Its address is
`/allboards/archive`, in the same shape as the other four sections.

The count is asked of the server rather than counted from what the page has:
All Boards does not subscribe to archived boards at all, and the archive's own
publication is paginated, so counting minimongo would answer 0 on a fresh load.

Boards can be dragged onto that row to archive them, from any of the four lists
or from a workspace — the same drag the left menu already accepts for Remaining,
and the alternative was three clicks through Multi-Selection. It asks before
doing it, because a drop is easy to make by accident.

The Workspaces section has a rule above and below it. The left menu is three
kinds of thing in one column — the three board lists, the workspaces tree, and
the archive — and without them the tree ran into its neighbours as if it were
more of the same list. They are a 2px dark grey line: a first attempt used the
same near-white the menu's own edge uses and was too faint to separate
anything.

The whole menu is styled like the Admin Panel's now — a panel with its own
background, border and rounded corners, and a selected row filled with the
per-user theme accent and white text — and it reaches the window's left and
bottom edges the way that one does, instead of floating 14px in from an edge it
is meant to look attached to. WeKan has one kind of left menu and it should look
like one kind of left menu.

The click handler moved with the markup, because a Blaze event map only sees
events inside its own template: one left behind in the header buttons would
never fire and the row would silently do nothing, which is exactly what happened
to this button once before. A guard now checks both halves of that.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a05c1ac08">Multi-Selection shows that it is on, and the Sort Boards popup gets a title</a>. Thanks to xet7.</summary>

The Multi-Selection button in the first header bar looked identical whether or
not a selection was running, so the one control that changes what clicking a
board does gave no sign it had changed it — and the only way out was to find the
row inside the sidebar. It is emphasised while it is on, says so in its label
and its tooltip, and has an ✕ beside it to turn it off: the same pair the
board's own Multi-Selection has.

The Sort Boards popup is titled "Sort Boards", from the key the app already has
for that phrase. A title is what gives a pop-over its header, and the header is
what carries the close button.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6051a4368">Its four controls stay in the header bar, and the hamburger that only led to them is gone</a>. Thanks to xet7.</summary>

Sort, Search, Multi-Selection and Boards in Archive were rows of the right
sidebar's home view, so reaching any of them meant opening a panel over the
boards first. They are icons in the first top header bar now, left of the
notification bell — exactly where a board's own controls are — each named by a
tooltip.

That home view was the only thing the hamburger opened, so All Boards no longer
offers one, nor the divider before it: a menu to reach what is already one
click away is a step with nothing in it. The sidebar is still opened, by Search
and by Multi-Selection, straight into their own view; and its home view is
still what the back arrow of those views leads to. A board keeps its hamburger
— what its sidebar holds, members and labels and activities and settings, is
not in the bar and has nowhere else to be opened from.

Boards in Archive is drawn in both places now, and a Blaze event map only sees
events inside its own template, so each copy has its own handler. A copy with
markup and no map is a button that silently does nothing, which is what
happened to that exact button once already; a guard now checks both.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/05e9cbc7c">One row of controls, in the header bar, and a Table view</a>. Thanks to xet7.</summary>

The page carried two rows of controls: the second top header bar, holding only
the title, and a row of its own above the board icons — Multi-Selection with
its archive and duplicate actions, Sort and the search box — styled nothing
like the board header of the Swimlanes view. There is one row now, in the
header bar, with the same `.board-header-btn` buttons and the same Font Awesome
glyphs a board's header uses: Starred, Sort, Search, Multi-Selection and the
view menu. The actions ON a selection stay beside the boards they act on, and
appear only while something is selected.

Search is a **field**, not a button, and it does what the old right-pane search
did: it filters as you type, across every one of your boards rather than the
section the left menu has selected, and Escape clears it. That is a deliberate
difference from the board header, whose Search is a button: on a board, Search
opens a whole search view over cards; here it filters the list it sits above,
and a filter belongs in the bar it filters.

The view menu names the current view — Lists or Table, never the words "Board
View" — the way the board header says "Swimlanes" or "Lists". Lists is the
default and is what an account that has never chosen sees. Table is the shared
table page, editable: Edit, Board title and Board description, ten rows a page,
the same boards the Lists view would draw. Edit opens the SAME
`boardChangeTitlePopup` the Swimlanes view opens rather than a copy of it, which
took one change to make true — its submit read `Utils.getCurrentBoard()`, and
on All Boards you are not looking at a board, so it now takes the board from
its own data context when it has one and falls back to the current board.

The view choice is remembered per browser, not on the user document: it is a
preference for one page and changes nothing anybody else can see. A board's
view IS on the profile, because it follows the user between devices; this
deliberately does not. The design is written down in
`docs/Features/Page/All-Boards.md`.

</details>

**The first header bar** - the strip always on screen: what it says and carries.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1f2044219a0625a4d8d2de752dd4da2b4c5e5078">Starred: bookmarks to any page, not only to boards</a>. Thanks to xet7.</summary>

The star group in the first header bar is a **bookmarks menu** now: the caret
that opens the list, the count of what is in it, and the star that says whether
the thing you are looking at is among them.

It held boards only. A board could be starred and reached from the dropdown;
every other page - All Boards / Remaining, a workspace, Admin Panel / Settings /
Version - could not, so the one control for "keep this where I can get at it"
worked on one kind of destination and was simply absent on the rest, even though
those pages have had their own addresses since the All Boards and Admin Panel
URLs landed.

The star on any other page now stars **that page**. A bookmark is a relative URL
and the title from the browser tab: relative so it survives the site moving to
another host, and an absolute or protocol-relative URL is refused rather than
cleaned up, because what is stored goes into an `href` the reader clicks.

**The browser tab says where you are** - `Product name - All Boards / Remaining`
- instead of only the product name. Ten open tabs of one WeKan were ten
identical tabs, and a bookmark of any of them was named after the whole app
rather than after the page. The path is the one the header bar already computes
for the page title's tooltip, published rather than worked out twice.

In **All Boards / Starred** the bookmarks are tiles beside the starred boards,
with the white border the template-container tile carries, the theme's own
colour behind them, and both the title and the URL - the title says where it
goes, the address says what it is. Each tile has its own unstar button, since
the star in the header bar stars the page you are on.

**Dragging a tile past another reorders them**, and that is the order of the
header dropdown: the two are views of one array. The move matches both ends by
URL rather than by index, because the two views are rendered separately and an
index from one of them is a guess about the other. The list is capped at 50,
oldest dropped, because it is a dropdown.

Documented in [Starred](https://github.com/wekan/wekan/blob/main/docs/Features/Board/Starred.md).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f62258b5c">One star group, and every button whose icon does not say enough is named</a>. Thanks to xet7.</summary>

The bar drew two stars in a row — one on the starred-boards dropdown and one for
the board you are on — which read as a single control somehow drawn twice. The
dropdown has no star now: it is a caret and the COUNT of starred boards, which
is what it is about, and the board's own star sits immediately beside it. The
two are wrapped in a rounded outline of their own, shaped like the
phone/desktop toggle's but white where that one is black — the toggle is a white
box on the bar, while these sit on the bar's own colour.

The count is shown even at zero, because it is now the button's only label; a
bare caret says nothing about what it opens.

Clicking Filter or Search while the sidebar is already showing that view closes
it. They only ever opened, so a second click did nothing visible and the only
way back was the sidebar's own ✕, somewhere else on screen from the thing you
just clicked. Filter has one exception — not while a filter is ON, because the
sidebar is then the one place that says what is being hidden from the board, and
closing it would leave a board showing a subset of its cards with nothing to say
so. Search has no such case: its results are inside the panel.

The starred-boards popup has a title, "Starred Boards", and so has a header —
and the header is what carries the close button; without a title it rendered
with nothing to shut it but clicking away. The title reuses the key the app
already has for that phrase rather than a `starredBoardsPopup-title` of its own,
which would be a second copy of one phrase in all 147 language files, English in
every one at first.

Sort Cards, Filter, Search, Show Dependencies, the board's visibility (Private
or Public), its watch level (Watching, Tracking or Muted), both Multi-Selection
buttons and the two view menus carry their name beside the icon where the bar
has room for it — a tooltip is the one place a name cannot be read without
hovering. Below 1100px every one of those labels goes and they are icons again:
a label is worth several icons' width, so on a narrow window keeping them costs
more buttons off the first row than the names are worth. All of them together,
not some, because half the buttons named and half not reads as a bar half
finished — and which half you got would depend on which words happen to be
short in your language. All Boards' four controls — Sort Boards, Search,
Multi-Selection and Boards in Archive — are named the same way. Each label uses
the same translation key as its own tooltip, so the two cannot say different
things.
Six view glyphs are six things to learn, a check-box outline says nothing about
multi-selection, and a tooltip is the one place a name cannot be read without
hovering. The bar wraps to a second row when it runs out of width, which is what
makes the word affordable. Sort, Search and Boards in Archive stay icons — those
glyphs are well known.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1164785d1">It names the All Boards list you are on, and the workspace inside it</a>. Thanks to xet7.</summary>

The bar said "All Boards" on the Starred list, on Templates, on Remaining and
inside every workspace — it named the page and not the list you were looking
at. It shows the path now: `All Boards / Starred`,
`All Boards / Workspaces / Engineering / Backend`.

The section's words are the left menu's own key, so the title and the row
highlighted beside it always say the same thing. A workspace's words are its
NAME rather than the slug in the URL, and are printed as text rather than
translated — a workspace name is what a person typed, and a workspace called
"starred" is not the Starred section. A trail segment that names nothing stops
the walk, so a stale link titles the part of the path that is still real
instead of nothing at all.

The Admin Panel's `Admin Panel / Settings / Version` and this are one list of
segments rather than a helper each: the two pages do not have the same number
of them, and a workspace has as many as its tree is deep.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/03cb79bdd">It says where you are: Admin Panel / Settings / Version</a>. Thanks to xet7.</summary>

The bar named the panel and stopped there. The Admin Panel is four pages and
each page is a stack of panes, so "Admin Panel" named the building and not the
room - and all four of its routes answered the same three words, whichever one
was open.

The title now names the same three things the address does. The page's words
are the tab's own and the pane's words are the menu row's own, so the title,
the tab that is marked active and the row that opened the pane cannot say
different things about one place.

The button of the page you are ON also keeps the hover background, permanently
and a shade darker. The tabs had marked themselves active all along, but the
only rule that drew it was scoped to the second header bar - which those tabs
no longer live in - so the state had been computed and invisible since they
moved.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/28a5973c6b00d85a4c2a24e608e6dfd777a36df4">It starts where the left menus start</a>. Thanks to xet7.</summary>

The All Boards and Admin Panel left menus indent a row by 4px of row margin plus
18px of link padding, so a row's icon lands 22px from the window edge. The first
header bar sat flush against the edge, so its home icon started 10px in and
every button under it was a little to the left of the menu below.

The bar now carries a 12px inline gutter: 12 + 4 + 6 = 22, the same x as the
menu rows. It is on the BAR rather than on its first item because the bar wraps
- padding applies to every row it wraps onto, while a margin on the first item
would indent the first row and leave the second starting at the edge. The number
is a variable so it has one home, and the phone overrides use it too rather than
putting the bar back against the edge at the widths where the alignment matters
most.

</details>

**The Admin Panel** - where the settings live, and how they are addressed.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/03cb79bdd">It moves under /admin, and its address names the pane you are on</a>. Thanks to xet7.</summary>

Every left-menu entry of the Admin Panel had a URL, but the four pages sat at
the TOP level - `/settings`, `/people`, `/attachments` - as if they were pages
of the app rather than of the Admin Panel, and `/attachments` is also the path
the file server serves attachments from, so the panel and the files were
claiming one address. They are under `/admin` now:
`/admin/settings/version`, `/admin/people/login`, `/admin/problems/database`,
`/admin/attachments/backup`.

The DEFAULT pane is named too. It used to be left implicit in a bare page URL -
`/settings` rather than `/settings/version` - so the address of "Settings" and
the address of "Settings showing Version" were one string. The address is meant
to say where you are, and the first pane is somewhere too. The bare
`/admin/settings` still resolves; it redirects to `/admin/settings/version`
rather than being a second name for it.

Every path the panel used to answer on redirects, and a bookmarked
`/settings/global-webhooks` keeps its pane rather than landing on the top of
the panel. The redirects are built from the same map the URLs are, so a page
cannot be given an address without also being given its redirect.

</details>

**Board views** - the board itself: its swimlanes, lists and cards.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e755b60b3">A swimlane, a list and a card can each be linked, and the link lands on the thing it names</a>. Thanks to xet7.</summary>

A card has had an address since there has been a card route. A swimlane and a
list had none, so "the Backlog list of this board" could only be sent as "open
this board and scroll down" — and `List.absoluteUrl()` answered with the URL of
whichever CARD the cache returned first for that list, so the one place that did
offer a list link showed a card's address, and an empty box for an empty list.

Both have their own now — `/b/<board>/<slug>/swimlane/<id>` and
`/b/<board>/<slug>/list/<id>`. Five segments against the card route's four,
which is what keeps the three apart: a card URL cannot match these and these
cannot match a card.

Following one brings the thing into view. The route cannot scroll — it runs
before the board has rendered, and on a board that is already open it runs
without re-creating anything — so it names what to reveal and the board body
reveals it once the element exists, waiting for it rather than assuming it,
because a large board renders in more than one pass. It gives up after a few
seconds instead of spinning: a link to a list that was archived names an element
that is never going to exist, and the board is still the right place to have
landed. The revealed swimlane or list gets a brief outline, because a scroll
that lands mid-board gives no sign of which of the things now on screen the link
was about.

All three are copied the same way, from the first row of the hamburger menu,
with the link icon and the name beside it. The card carried this as an icon in
its title header named only by a tooltip — the one place a name cannot be read
without hovering — and that button is gone, along with its handler and the
"Copied" tooltip only it used.

The copy row sits above every permission check in those menus: copying an
address is reading, not editing, and somebody who may only read the board can
still tell a colleague which list they mean.

</details>

**Public Boards** - the page a visitor sees without an account.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/54915db25">Its own read-only table page, not All Boards with a different query</a>. Thanks to xet7.</summary>

/public rendered the All Boards page with its query swapped for `{ permission:
'public' }`, which brought the whole of All Boards with it: the Starred /
Templates / Remaining menu counting the user's *own* boards beside a grid that
was not, the workspaces tree, the org and team filters, Multi-Selection with its
archive and duplicate actions, the sort popup, board dragging, and an "Add
board" tile that made a private board from a page about public ones.
Multi-Selection offered to archive boards the visitor has no rights to at all.

It is only the table now: board title and board description, ten rows a page,
paged and counted on the server. No left menu, no create, no selection, no drag,
and nothing on the page changes anything — a row's only action is to open its
board. The rows carry their board's colour and background image, so a board is
recognised here the way it is on All Boards.

A page costs six fields for ten boards, not ten board documents: the two
columns, the slug the link needs, and the two the row is coloured with.
`members` is deliberately absent — it is the largest field on a busy board and
this page shows no avatars. The selector is built on the server and takes
nothing from the client: public, not archived, a real board rather than a
template container, and not an internal `^Subtasks^` board.

Not carried over from the board tile: member avatars, the per-list card counts
and the spent-time clock. What a visitor needs of a board they do not belong to
is what it is called and what it is for; the rest is the inside of a board they
have not opened, and each costs a query the page would otherwise not make — the
clock answers by looking for cards, which this page does not publish, so it
would read false for every board on every instance.

The design is
[docs/Features/Page/Public.md](https://github.com/wekan/wekan/blob/main/docs/Features/Page/Public.md),
which describes only what is different about this page and links back to the
shared [Table page
design](https://github.com/wekan/wekan/blob/main/docs/Features/Page/Table.md) for
everything else.

Two things it got wrong on the way, both reported by xet7: the page drew [its
own "Public boards" heading](https://github.com/wekan/wekan/commit/3644b3b0c)
under a header bar that already said "Public", and [a row's text was white on
white](https://github.com/wekan/wekan/commit/deab12272) — the row was given a
board-colour class, but `boardColors.css` styles `.board-list .board-color-X a`
and nothing on this page matches that selector. The seventeen colour rules name
the public row too now, and a board with no colour set falls back to a readable
default instead of to the page's own background.

</details>

**Board roles** - what a member of a board may do.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/efa534fdd">One capability table, three roles fixed, and a Roles Status pane that shows it</a>. Thanks to xet7.</summary>

What each role may do was spelled out THREE times — in the server allow helpers,
in the client's `canModify*` helpers, and in prose in the docs — and the three
had drifted apart. Every place they disagreed was a role that did not do what
its name says. `models/lib/boardRoleCapabilities.js` is that table now, in code,
and everything reads it: the allow rules, the UI helpers, the new Admin Panel
pane and the documentation.

**"Comment only, assigned" had full write access.** Nothing outside the card
publications read its flag and it was not in the write rule, so the role could
create and edit cards, lists and checklists — it was "Normal, assigned only"
under another name. It is comment-only now, like the role it is named after.

**"No comments" could not write anything.** The write rule excluded it, so the
role blocked editing as well as commenting — a second read-only role under a
name that says otherwise, and one the UI still offered the edit buttons for. It
blocks commenting only now.

**The write rule did not exempt board admins.** Every other helper ignores a
flag on an admin; that one read the raw flags, so an admin who also carried
`isNoComments` silently lost write access. Not reachable from the Web UI, which
writes all eight flags at once, but reachable over the REST API.

The UI helpers were part of the same drift — `canModifyCard()` did not exclude
`isNoComments` while the server did, and `canModifyBoard()` excluded neither
`isNoComments` nor `isWorker` — so each disagreement was a button offered to
somebody whose write the server then refused.

A **fourth** gap was found and is NOT fixed: a Worker cannot move a card, which
is the one thing the role is for. Moving a card is a card update, so it goes
through the write rule, which excludes Worker. The fix means letting a role
write some fields of a card and not others, and validating that a member change
only ever adds the caller — a field-level policy on the path every card update
takes, which wants deciding on purpose. It is recorded under "Known gaps" with
what it needs.

**Roles Status**, at Admin Panel / People / Roles below the Save button: a
read-only table of what each role may do. It is the shared table page, with no
markup of its own, no interactive rows and nothing editable, because a role's
capabilities are a property of the code and not a setting. Every string is a
translation key, the Yes/No of each cell included. The "Invite to board" column
reads the pane's working copy, so the table follows the checkboxes above the
Save button as they are ticked, before saving.

</details>

and reorganises the following in the user interface:

**All Boards** - where its controls live, and what the page shows around them.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f56254e71">The actions on a selection move into the header bar with everything else</a>. Thanks to xet7.</summary>

The header bar took the controls of the page, but the actions ON a selection —
Move Board to Archive, Duplicate Board, and the "Selected:" star and home —
were left where they were, in a strip above the board icons, on the reasoning
that they are about those boards rather than about the page. That still left
two places to look for a button. They are in the header bar now, to the right
of the controls that are always there, as `.board-header-btn` like every
control beside them, and `.boards-path-header` holds the section title and
nothing else.

They appear only while something is selected: four buttons that would do
nothing are worse than no buttons. Archive and duplicate carry their names;
star and home stay icon-only under the "Selected:" label that already named
them, because their names are sentences — "Set as Home board (opened after
login)" — that belong in a tooltip, and spelling them out pushes the bar onto a
second row. The label stays a label, with neither the button class nor any
button behaviour.

Two things had to move with the buttons, because Blaze binds both to a single
template: their four click handlers, which an event map on `boardList` could no
longer see, and `hasBoardsSelected`, which decides whether they are drawn. The
stylesheet lost `.path-right`, `.selected-action` and `.selected-actions`,
which now select nothing, and the phone media query lost the four rules that
flattened a controls row this page no longer has.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fa6bcd1f4">No Starred button in the bar, Multi-Selection after the view menu, a narrower search</a>. Thanks to xet7.</summary>

Starred was the first button in the header bar, and Starred is a **section**:
the left menu already lists it beside Templates and Remaining, counts it, and
highlights it when it is the one shown. A second way to reach one section, one
click away from the first, is a control whose only job is to be kept in step
with the menu — so it is gone, and with it the header bar's own
`js-select-menu` handler and `isSelectedMenu` helper, which had no other caller
there. The left menu is part of `boardList` and has always had its own.

Multi-Selection moved to the right of the Lists/Table menu. The bar now reads
left to right as what is shown — Sort, Search, Lists/Table — and then what is
selected: Multi-Selection, followed by the archive, duplicate, star and home
actions that appear with it.

The search box is 150px wide, half of the 300px it was drawn at when it had a
card of its own. Getting there turned up that it had **no styling at all**: its
rules said `.boards-path-header .board-search`, the bar it used to live in, so
from the moment the controls moved to the header bar they matched nothing and
the box rendered at the browser's default input size. They are
`.all-boards-controls …` now — and because a white box on a themed bar cannot
inherit that bar's light-on-dark colour without putting white text in a white
box, the input, the magnifier and the ✕ each set their own.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2537a52ec">The Selected star is a toggle now, and every button in the bar names itself</a>. Thanks to xet7.</summary>

The "Selected: ★" button only ever *added* stars: it walked the selection and
starred whatever was not starred yet. Once every selected board was starred it
did nothing at all, so there was no way to undo from here what it had just
done, and its tooltip read "Star the selected boards" whatever state the
selection was in. It is a toggle now — none starred stars them all, all starred
unstars them all, and a mixed selection stars **the rest**, leaving the starred
alone. The mixed case deliberately does not flip each board independently: one
click that starred some boards and un-starred others is not something a button
may do. Only the boards that must change are called, because the server method
flips one board and calling it for an already-starred one would un-star it.

The tooltip says which way the button goes right now, `set-selected-starred` or
the new `set-selected-unstarred`, and it reads the SAME function the click does
— two copies of "which way does this button go" would eventually be two
answers, and the tooltip would lie about what the click does. The rule itself
is `models/lib/selectedStars.js`: pure, so it is unit-tested rather than
reasoned about.

All four buttons on a selection are icon-only now, and they follow the
"Selected:" label in the order star, home, archive, duplicate — the two that
only mark a board first, the two that change what boards exist last. Archive
and duplicate carried their names, which are sentences and pushed the bar onto
a second row.

Checking that each button says what it is turned up one that did not: the ✕
that turns Multi-Selection off said "Clear filter", which is what the *other* ✕
in this bar does, in the search box. It is `multi-selection-off`. A guard now
requires every `.board-header-btn` in the bar to carry a `title`, and every
title to come out of a translation key rather than being literal English.

Both new keys are in all 147 language files as English placeholders, which is
what the translation policy does with a string that is untranslated everywhere,
so no language silently loses a tooltip.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fcfed1fd3">Search and Multi-Selection are the board header's own controls, opening a right sidebar</a>. Thanks to xet7.</summary>

All Boards had a search **field** in its header bar, and a Multi-Selection
button whose actions were four icons beside it. A board has a search **button**
and a Multi-Selection button, and both open the right sidebar. Two pages, the
same two control names in the same place, behaving differently — and one of them
not the way the rest of WeKan does. They are the board's now, and they are the
*same* markup: `headerBarControls.jade` holds one `headerSearchButton` and one
`headerMultiSelectionButton`, included by the board header of the Swimlanes view
and by the All Boards bar. The two copies had already drifted — the ✕ that turns
Multi-Selection off said "Clear filter" on the board header, which is what a
different control does, and says `multi-selection-off` in both now.

Only the markup is shared. What a click does is not — a board searches and
selects cards, All Boards searches and selects boards — and it does not need to
be: a Blaze event map catches events from the templates rendered inside it, so
each bar's own map sees the clicks on its own copy. `isActive` is passed in,
because the two pages keep different selection objects.

All Boards has a right sidebar of its own. Not the board one: that is built
around a board's members, labels, activities and settings, and this page has no
board. It borrows the **shell** — the same `.board-sidebar.sidebar` classes, the
same ✕, the same title-and-back-arrow above a view — so the two look and behave
alike, and it has three views. `home`, what the hamburger opens, is the page's
menu: Search, Multi-Selection, and Boards in Archive, which had a handler in the
header bar and no way to reach it. `search` is the field that was in the bar,
still writing the page's own search term so the boards behind it narrow as you
type. `multiselection` is where the actions on a selection went — star, home,
archive, duplicate and a way out — each with its name beside it instead of being
a crowded icon.

The bar also gained the divider and the hamburger, in their own flex item and
last in the source exactly as the board header has them, which is what keeps the
hamburger in the top right on a phone while the other buttons wrap.

Two things this turned up. A `.jade` file is not picked up by being on disk — it
has to be imported from `client/features/`, and the shared controls threw "No
such template: headerSearchButton" on render until they were; a guard now
requires every `.jade` under `client/components` to be imported and every
`+template` it includes to exist, and it found a dangling `+subtaskDeleteDialog`
that has never had a template (unreachable, so it has never thrown, and it is
recorded with that reason rather than hidden). And deriving a template name from
a view name gave `allBoardsMultiselectionSidebar` for
`allBoardsMultiSelectionSidebar` — one letter, renders nothing, no error worth
the name — so the names are an explicit map the guard can check.

The designs are
[Search](https://github.com/wekan/wekan/blob/main/docs/Features/Page/Search.md)
and
[Multi-Selection](https://github.com/wekan/wekan/blob/main/docs/Features/Page/Multi-Selection.md),
one per shared control, each covering both pages.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/57dd62bad">The white bar above the board icons is gone</a>. Thanks to xet7.</summary>

Once every control had moved to the header bar, what was left above "+ Add
Board" was a white strip carrying one thing: a Font Awesome icon for whichever
left-menu section is selected. Three things already say which section that is —
the left menu highlights it, the header bar names the page, and the Starred
control is emphasised while Starred is on — so the strip said nothing and cost
a bar's worth of height on every screen. The board icons start at the top of
the right column now.

It took more with it than the markup. `currentMenuPath`, sixty-four lines that
resolved a workspace path to an icon and a name, had no other caller. Every
`.boards-path-header` rule went — the seventeen that styled the bar and its
contents, and the phone media query that had already been reduced to holding
the title. So did the `pulse` keyframes, whose only user was the
multi-selection hint that lived in the bar. The pager's `flex: 0 0 auto` was
sharing a selector list with the bar, and is kept on its own: it is still the
fixed-height thing above the scrolling list.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5cc399b47">A URL for every left-menu entry here too, workspaces included</a>. Thanks to xet7.</summary>

`/allboards/starred`, `/allboards/templates`, `/allboards/remaining`,
`/allboards/workspaces`, and a workspace as deep as its tree goes:
`/allboards/workspaces/engineering/front-end/design-system`. The page was three
addresses and the workspaces tree had none at all — which workspace you had open
was a ReactiveVar, so it could not be linked or bookmarked either.

A workspace is addressed by the slugs of its **names**, not by its id: the id is
a random string and a URL should say where you are. The slugs come from
`getSlug` (limax), the same function that gives a board its slug, so a workspace
and a board turn a name into a URL the same way — including the scripts where a
naive slugifier returns an empty string. When a name slugifies to nothing anyway
— an emoji-only name — the node's id stands in, because a workspace with no
address could not be opened from a link.

The route resolves the section and splits the path; the PAGE resolves the
workspace, in an autorun, once its tree has loaded. The router cannot: the tree
is on the user document, which it has no way to read before the page has it —
and a one-shot read would always run before the tree arrived and never select
anything. `/` stays the home and still shows Starred; `/templates` and
`/remaining` redirect to the new form.

One thing this had to fix rather than add: the page filters boards by membership
only on the All Boards routes, **by route name**, and a route missing from that
list falls through to the public-boards branch — it would have shown public
boards instead of your own.

</details>

**The Admin Panel** - its own addresses.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/841479774">A URL for every left-menu entry</a>. Thanks to xet7.</summary>

The panel was four addresses — `/setting`, `/people`, `/admin-reports`,
`/attachments` — each opening whichever pane its page happened to open first.
Which pane you were looking at was ReactiveVar state and nothing else, so a pane
could not be linked to a colleague, bookmarked, opened in a second tab or
reached with the back button, and `/setting` always landed on Version even if
you had just been in Global Webhooks.

Every entry has its own now: `/settings/visibility`,
`/settings/global-webhooks`, `/people/roles`, `/admin-reports/cpu`,
`/attachments/s3`. Lowercase, words separated by `-`, and the **default** pane
keeps the bare page URL — `/settings`, not `/settings/version` — so there is one
address for "the Settings page" rather than two that show the same thing. The
Settings path is plural: `/setting` was the odd one out beside `/people`,
`/attachments` and `/admin-reports`, and it still resolves, as a redirect.

The slug is **not** derived from the pane id. The ids are internal and read like
it — `tableVisibilityMode-setting`, `layout-setting`, `report-cpu` — while a URL
is something a person types and pastes into a chat, and a name derived from
another name is wrong the moment the two spellings differ. So it is an explicit
map, and the guard checks it against the real menus in BOTH directions: every
slug names a pane the page has, and every menu entry has a slug. Neither failure
shows up until somebody clicks that row. A slug that is not one falls back to
the page's default rather than rendering an empty panel, because a URL is typed.

`/information` and `/translation` redirected to `/setting` and handed their pane
over in a `Session` value the page consumed once. They redirect to the pane's
own address now.

</details>

**The first header bar** - what it stopped carrying.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2f0445102">The 100% zoom control is gone</a>. Thanks to xet7.</summary>

It scaled the board with a CSS transform, it did not work, and there is no plan
to fix it — WeKan already has a font-size setting, which is what the control was
reached for anyway. A control that does nothing is worse than no control.

What went with it: the pill and its number, the helper and three handlers, the
zoom utilities and their call sites, the `profile.zoomLevel` schema field and
its setter and server method, one translation string, and 57 stylesheet rules
spread over four files — which is how much of the stylesheet a broken feature
had accumulated. The card zoom is a different feature and is untouched.

</details>

**Member Settings** - the per-user panes.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/472ed566c8a86b46be41de33a3ad3902c14c5edb">Change Password's button is themed, like the Save button beside it</a>. Thanks to xet7.</summary>

Change Password draws the useraccounts form, and its submit button carries that
package's own classes rather than any of ours - so it fell back to the plain
grey button, while the Save button one entry above it in the same menu was
painted with the theme accent. Two buttons, one menu, two looks.

It is named in the same rules as every other primary button rather than given a
copy of them, so the accent and the hover and active states keep one home, and
it is scoped to a popup: the login page styles that form its own way and is not
what this is about.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/95b0acd0b">Change Color shows as many swatch columns as the width allows</a>. Thanks to xet7.</summary>

The swatch list is shared with the board-background picker, where it is a
float-based two-column grid. Two columns is right for background thumbnails; for
Select Color it meant Flat, Clear, Dark and Special each ran down the popup in a
narrow pair, and most of them were below the fold however wide the browser was.

Auto-filling columns instead — the same answer the Change Language popup already
uses. It takes as many columns as fit and collapses to one on a narrow window,
so no media query is needed and a phone is unaffected. Both Change Color popups,
Member Settings and Board Settings, get more width on desktop to spend on
columns; below 800px every popup is a full-screen sheet and is left alone. The
width is mirrored in the popup positioning code, which clamps a popup into the
viewport by its width — computed for the default it placed a wide popup opened
near the right edge with a third of itself off the screen.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/15157cde0">Change Settings: the button is Save, and it has a theme</a>. Thanks to xet7.</summary>

It said "Apply" while every other settings form in WeKan says Save, and it was
pure black. Both came from one line: the submit carried no `primary` class, so
it fell to the base button rule — whose fallback is black — instead of the
primary rule beside it, which is the themed one. The Change Language form
directly above it in the same popup is the shape it now matches.

</details>

and updates the following dependencies:

- **aldeed:collection2 4.2.0 → 4.2.1** — cleans and validates every write
  against a collection's SimpleSchema, so it is on the path of every insert and
  update WeKan makes.
  [Update](https://github.com/wekan/wekan/commit/885a11f1e). Thanks to xet7.
- **Meteor 3.5 → 3.5.1-beta.0** — the framework WeKan is built on, and with it
  the build system, the MongoDB driver and the accounts packages that ship as
  part of the release.
  [Update](https://github.com/wekan/wekan/commit/2160eccd4). Thanks to Meteor
  developers and xet7.
- **meteor-node-stubs fork** — the Node core-module shims the browser bundle is
  built against, forked into `npm-packages/meteor-node-stubs`.
  [Update](https://github.com/wekan/wekan/commit/9c5ff4f9f). Thanks to xet7.
- **@meteorjs/rspack 2.0.1 → 2.1.0-beta.0** — the rspack bundler Meteor builds
  the client with, the counterpart of the 3.5.1-beta.0 release above. It moved
  to rimraf 6, whose glob 13 no longer ships a command line of its own, so
  twenty-seven packages leave the lockfile with it (975 → 948) without anything
  being dropped from WeKan itself. `archiver` and `unzipper` also move into
  alphabetical order in `package.json`, which changes nothing that is
  installed. [Update](https://github.com/wekan/wekan/commit/91e8e05db). Thanks
  to developers of dependencies and xet7.

and fixes the following bugs:

**The first header bar** - how it lays itself out, and what sits under it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/551a44d769652a26d86c1b0d9603f692dd370a7c">The Notifications panel starts below the bar, so the avatar is not over it</a>. Thanks to xet7.</summary>

The panel is fixed at 48px from the top - a guess at the height of one header
bar. The bar wraps to a second and a third row, and the user avatar is the item
that wraps last: on a window where it did, the panel covered the row the avatar
was on, and the avatar - which is inside a bar that paints above it - landed
straight on the panel's own header, beside the ✕ that closes it.

It starts at the height the header MEASURES itself to be now, kept current by a
`ResizeObserver` because a bar re-wrapping is not a window resize. The panel's
own fixed header - the row the ✕ is in - follows the same number, and so does
the height it may take: the `100vh - 28px - 36px` it had was the same guess
written as a subtraction in two pieces. That measurement is what everything else
laid out against the viewport already uses, so this is the panel joining them
rather than a new mechanism.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/93042642f4fe3ae91d0b54e988a97d7ddcebdd5d">The All Boards house starts at the same X at every window width</a>. Thanks to xet7.</summary>

The house at the start of the bar sat further in on a wide window than on a
narrow one, and on none of them on the line the left menu's rows below it start
on.

Its inset is a SUM, and two of the terms were added at some widths only. The
header carried side padding of its own - 8px below 800px, 16px between 768 and
1024, none between 1024 and 1920, 8px above 1920: four widths, four insets. And
`.allBoards` is the SAME element as the house's own `.home-icon`, so its side
padding lands between that icon's margin and the link - and it was 15px on a
desktop against 6px on a phone.

Neither adds anything sideways now, and the link's own start padding is the same
6px in every rule, phone rules included: a bigger tap target on a small screen
grows at the END, not at the inset. So the house is at 12px of the bar's own
gutter plus 4px of the icon's margin plus 6px of the link's padding = 22px at
every width - the same 22px the left menu's rows are indented by, so the two are
one line down the page.

The existing guard added up the three terms it knew about, got 22, and passed
while the house still moved. The new one pins the other side of it: no rule, at
any width, may add a side inset of its own.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9a1463d7e">It fills each row before starting the next one</a>. Thanks to xet7.</summary>

The bar wraps when its buttons do not fit, but everything after the drag-handles
toggle was wrapped in one group — and a nested flex box is a single item to the
bar, so the whole group moved to the second row together. The first row ended
halfway across with nothing in the rest of it while the second row was crowded.

The group generates no box now, so its buttons are items of the bar itself and
wrap one at a time: the second row takes only what did not fit on the first. The
push that keeps them at the end of the bar moves to the group's first child, and
on a row that wrapped there is no free space for it to absorb, so those items
pack from the start — which is what fills the row rather than stranding it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/49f4e77aa">It wraps to a second row instead of hiding the buttons that do not fit</a>. Thanks to xet7.</summary>

The bar was one row with `overflow: hidden`, so a button that did not fit was
not drawn at all - and a button that is not drawn gives no sign that it exists.
It wraps now, and every height on it is a minimum, including the four phone
rules that pinned 40px or 48px: a fixed height cannot hold two rows, so it
would have cut off exactly what the wrap was for. A phone is where the buttons
run out of room first, which makes it the last place that should hide them.

Everything after the drag-handles toggle hugs the end of the bar from one
`margin-inline-start: auto`, a LOGICAL property, so a right-to-left language
mirrors it by itself rather than needing a second rule kept in step.

Both view menus lost their visible labels - the board's said "Swimlanes" and
All Boards' said "Lists" - and name their view in a tooltip instead, where the
other buttons of that bar already keep theirs. A divider after the notification
bell separates what belongs to the page from what belongs to you.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/49f4e77aa">The right sidebar starts below it again, on every page that has no second bar</a>. Thanks to xet7.</summary>

`--wekan-header-height` is what anything laid out against the viewport starts
below, and it measured `#header` - the SECOND header bar - from when every page
had one. Most pages have none now, their title being in the first bar and their
controls in a sidebar, so on those the variable was 0 and the All Boards
sidebar covered the bar above it.

It measures both bars, as the bottom of the lowest one rather than a sum of
heights, so any margin between them counts and a bar that is absent contributes
nothing without needing a special case. Each bar is watched by its own
ResizeObserver, because the first one wrapping to a second row is a resize of
that element and of nothing else.

Sidebar buttons are no longer drawn under the close button either: the ✕ is
positioned absolutely, so it contributes no height and the row holding it
collapsed to its padding.

</details>

**All Boards** - the overview and its search.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b50ccc63a83ac2185b3bdc2605adde9f955a685a">The selected workspace shows its board count again</a>. Thanks to xet7.</summary>

The count was there, at the right of the ⋯ menu where it belongs, and it was
invisible.

The theme accent fills the icon and the name of the selected row, not the whole
row: the menu button and the count sit after it, on the panel's own light grey.
A rule gave the count a light pill with white text "for contrast against the
filled row" - but the count is not on the filled row, so it was white on light
grey. The selected workspace was the one row whose board count could not be
read, and it is the row you have just asked which boards are in.

The rule is gone rather than re-tinted, because there is no accent behind the
count to contrast with: it keeps the same grey pill every other row has. The
count and the menu button also hold their size now, so a long workspace name
ellipses itself instead of squeezing them off the row.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c7bf2958a36f4ac120681ee435a564dd74d09517">A workspace row obeys the drag-handles toggle, and drags without one</a>. Thanks to xet7.</summary>

The workspace rows in the left menu drew a ✥ handle whatever the **Show desktop
drag handles** toggle in the first header bar said - and the handle was
decoration: the whole ROW was draggable, so the drag started anywhere on it. A
row that is draggable as a whole starts a drag on the way to a click, and a
workspace row is a row you click, because that is how a workspace is opened.

The handle follows the toggle now, through the same helper the board tiles
beside it use, so the two cannot drift apart. With handles **on**, the handle is
drawn and is the only place a workspace drag may start. With handles **off**
there is no handle and the workspace's **icon and name** is what reorders it.

`draggable` lives on the handle or on that icon-and-name anchor, never on the
row - the row also holds the ⋯ menu and the board count, and a drag started on
those is a drag of something else - and the `dragstart` handler stays on the row
because the event bubbles up from whichever child started it, so the reordering
itself is untouched. Clicking the anchor still opens the workspace: a click and
a drag are two gestures on one element, as they are on a board tile with handles
off.

Two things make that drag real rather than declared, and both are easy to leave
out. The anchor is opted out of the page-level **dragscroll**, which would
otherwise take the mousedown so the drag never begins - which is exactly what
"reordering does not work" looks like. And it carries `user-select: none` while
it is the drag source, because the name is TEXT: a press-and-move over
selectable text starts a **selection**, and the browser owns the gesture from
there. Everything that changes with the toggle follows the `draggable` attribute
itself rather than a second class, so there is one answer to "is this the drag
source right now" instead of two that can disagree.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/89d12c6fe689aa970cafda2429ff480ed7038a92">Its view menu opens a titled popup, like the board's own</a>. Thanks to xet7.</summary>

The Lists/Table dropdown in the first header bar opened a bare list of two
links, while the board's Swimlanes/Lists dropdown - which asks the same question
about the same kind of page - opens with **Board View** above it and a close ✕
beside it. A popup with no title renders no header at all, so the two read as
two different kinds of control.

It is titled now, with the BOARD's own translation. The convention is
`<popupName>-title`, which here would mean a second key saying the same two
words - and a new key starts as English in all 142 language files, so most
languages would have shown English for a phrase they have translated for years.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cdb611340120d0c9f56e890a85fa2f1c3da0e4f8">Archive opens the section of this page, not the full-width page it replaced</a>. Thanks to xet7.</summary>

Member Settings / Archive went to `/archive`, and Boards in Archive is a
**section** of All Boards now: a row in its left menu, drawn beside it like
Starred and Remaining. That page is the thing the section replaced. Landing on
it meant the same list of boards with no menu beside it, no way across to
another section without going back first, and the menu row that says Archive was
not the row you had arrived at. A menu entry should land you on the same Archive
the menu itself offers.

All four entry points are the same line in a different menu - the board menu,
the member menu, the board sidebar and the All Boards sidebar - so all four go
to the section now, through the URL helper rather than a path spelled out in
four places that can drift apart. The member menu also closes itself behind the
click, like every other entry in it that navigates. `/archive` is still a route
and still renders, so a bookmark from before does not break.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1049e3e8f">It no longer throws No such function: isAllBoardsView as it renders</a>. Thanks to xet7.</summary>

The All Boards page chooses between the board icons and the Table view with
`{{#if isAllBoardsView 'table'}}`, and that helper was registered on
`boardListHeaderBar` and on `allBoardsViewPopup` but not on `boardList` — the
template that actually asks. A Blaze helper belongs to the template it is
registered on, so the page threw as soon as the router rendered it, right after
login, and All Boards did not come up at all.

Nothing noticed, because the guard read the jade and the JavaScript as two
separate files: it checked that the controls are in the header bar and that the
Table branch calls `+tablePage`, never that the template asking a question has
the helper that answers it. It now collects every helper this file registers,
and for each template in the jade every helper it uses that this file defines
must be registered on THAT template. Only helpers the file itself defines are
checked — a name it registers nowhere is a model helper on the data context,
like `colorClass` on a board, and a guard cannot tell one of those from a typo.
The other four templates in the file were clean.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96289e118">Search All Boards searches all of your boards, not Public Boards anymore</a>. Thanks to xet7.</summary>

The board scope listed the ways a user reaches a board — member, organization,
team, e-mail domain — and `{ permission: 'public' }`. That last one is the odd
one out: it is not a relationship to the user at all, it is "anybody may open
this".

That belongs in the boards list, where a public board is meant to be
discoverable. In a search it meant every public board on the instance was
searched: on a public server a common word answered with strangers' cards, and
following a hit dropped the user into a board they have no part in. Someone who
wants to look inside a public board can still open it and search there.

The option defaults to including public boards, so every other caller — the
boards list, the lists and comments lookups — is unchanged. The search names its
scope once and passes it to all four board lookups plus the `board:` filter's
name resolution: one missed lookup and that branch still reaches the whole
instance, with nothing looking wrong.

</details>

**The left menus** - the one menu All Boards and the Admin Panel share.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/25265527648cffb1fe479c7a4c2a4f13b69f9041">The caret that folds the menu away does something when clicked</a>. Thanks to xet7.</summary>

The caret at the top of the left menu - on All Boards and in the Admin Panel -
rendered, pointed down, and did nothing at all when clicked.

Its template draws the caret; the click that folds the menu, and the helper that
says whether it is folded, live in a `.js` file beside it that nothing imported.
`package.json` sets `meteor.mainModule`, so the client is **not** eagerly
loaded: a file nobody imports is not in the bundle at all. The click handler was
never registered, so the caret was a dead control - and an unregistered Blaze
helper is undefined, so the menu never took the `collapsed` class either, which
is why even the caret itself never turned to point right.

One import fixes it. The new guard is what stops it happening a third time - it
had already happened to the Admin Panel reports' stylesheet: a test walks the
import graph from the client's entry point and pins that every file under
`client/components` which REGISTERS something with Blaze - a template's events,
helpers or lifecycle, a global helper, a `BlazeComponent` - is reachable from
it, and that every stylesheet and template beside them is too. A file that only
exports helpers is left alone: whoever uses it pulls it in.

</details>

**Board views** - filtering a board, and who sees which cards.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7d9a2e303">A filter no longer leaves a spinner over an empty list, and a half-arrived card is not drawn blank</a>. Thanks to xet7.</summary>

Two problems from one report with screenshots, both in how a list decides what
to draw at its bottom edge.

**"Once a filter is applied for a member, the 3 dots continue to animate."** The
screenshot shows a list with no cards under the filter and the load-more spinner
still turning under it — and the scroll handler raising the window limit by ten
every idle callback for as long as it stayed on screen.

The spinner asked "does this list hold more cards than the window I asked for?"
and answered it from a total built somewhere else than the cards being drawn.
The cards come from the filtered selector; the total came either from the list's
own card count or, in lazy card-loading mode, from a count document published
per list/swimlane — whose id was `listId::swimlaneId` and did **not** include
the filter. So changing the filter re-subscribed with a new selector under the
SAME document id, two publications wrote one document, and Meteor's merge box
serves whichever subscription it prefers — which during the changeover is the
older, pre-filter one. The list drew its empty filtered window while its count
still described the unfiltered list.

The count document now carries a short stable key for its selector, so each
filter counts into its own document and a count can never describe another
filter's cards. And the spinner no longer depends on that being right: there is
nothing more to fetch unless the window came back FULL. If we asked for twenty
cards and got three, those three are all there are, whatever any count says —
which holds in both card-loading modes and for a stale count in either
direction.

**"Random blank cards are appearing on the board."** White minicards with the
handle icon and nothing else — no title, no members, no labels — mixed in among
the real ones.

A minicard renders blank when its document is in minimongo without its fields:
`getTitle()` returns null for an undefined `title`, and every badge is
conditional on a field that is not there either. That is not a card with an
empty title — the schema declares `title` as optional with `defaultValue: ''`,
so a card that went through it has the key, `''` at worst. A document without
the key at all is a partial replication, and several publications ship cards
with a projection (`openCardData` publishes `{ _id: 1 }` as the parent of its
children cursors, the search publications ship their own field lists), while
minimongo merges what every live publication says about an id.

Which of them produced these particular stubs is **not settled** — it needs the
running board to catch — so this is a guard where the card is drawn rather than
a fix at the source: a document that does not carry the field the minicard is
built around is not drawn. It cannot hide a real card, and when the full
document arrives the card appears, which is what the blank box was standing in
for anyway.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1de699aca">Clicking outside the filter panel closes it</a>. Thanks to xet7.</summary>

"If I use any filter, the modal that appears on screen sometimes doesn't
disappear. Ideally, this should close the moment I click anything outside the
modal."

It is the board sidebar showing its filter view, and nothing dismissed it but
the sidebar's own toggle or Escape. The reason is one argument: the document
click handler runs `clickExecute(evt.target, 'multiselection')`, and
`sidebarView` sits below `multiselection` in the escape hierarchy, so the loop
returns before ever reaching it. A click could not close the sidebar by design.

The handler lives in the filter template rather than raising that limit, because
raising it would make every sidebar view close on any outside click — Archive,
Settings and Card Settings are panels people work beside on purpose, and only
the filter reads as a thing you open, use and are done with. Escape is
untouched: it still returns the sidebar to its default view.

Three clicks deliberately do not close it. Inside the panel, obviously. A
pop-over the panel opened — the label, member and due-date pickers render
outside the sidebar, so without this, choosing a value in one would close the
panel behind it. And the header button that opens the filter, which would
otherwise toggle it shut in the same gesture that opened it. The handler is
bound on the next tick so the opening click cannot reach the handler it just
created, and it is removed by name when the panel goes, so it can never outlive
it and close the sidebar under some later view.

The sidebar is hidden, not reset, so reopening it comes back to the filter you
were using.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/550cd5c68">An assigned-only member sees only their own cards on a big board too</a>. Thanks to xet7.</summary>

Three board-member flags mean the same thing — `isReadAssignedOnly`,
`isNormalAssignedOnly`, `isCommentAssignedOnly` — the member may only see the
cards they are assigned to. The board publication has always narrowed its card
cursor for such a member. `boardCardsWindow`, which is what ships the cards in
LAZY card-loading mode, did not.

So whether the restriction applied at all depended on the board's card-loading
mode. The same member saw only their own cards on a small board and every card
in the window on a big one (or on any board with `CARDS_LOADING=lazy`) — and
with the cards went their comments, attachments, checklists and checklist items,
because the window's children hang off the same selector. The restriction is
part of the window scope now, and of its count: an unrestricted count still told
the member how many cards the list really holds, and offered to scroll in cards
that would never arrive.

Two things this had to get right. The field projection: publish-composite hands
each child the document as the parent cursor published it, and that cursor
projected to `{ _id: 1 }` — so `board.members` was undefined in every child and
the restriction would have been dead code. The parent publishes `members` now,
which also makes it reactive, and the board publication already ships them to
the same client.

And the merge. The board scope is spread into the client's selector at the top
level because FerretDB v1 (SQLite) does not push a top-level `$and` down to its
index — the wrapped form full-scanned the whole cards table on every poll and
cards never loaded on a big board. But a top-level spread can only be used when
the two selectors do not both speak for the same key, and the board Filter has
an assignee filter, so that collision is reachable from the UI: in the direction
the publication spreads them, the client's value would have won and the
restriction would have been silently dropped. The guard covered
`boardId`/`archived` only; it is `mergeCardScope` now, which merges when the
keys are disjoint and falls back to `$and` — where both hold — when they are
not. An assigned-only member filtering for someone else gets nothing rather than
everything, and an unrestricted member keeps the fast path.

</details>

**Public Boards** - what it lists.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a4475e57e">The internal Subtasks boards are no longer listed</a>. Thanks to xet7.</summary>

WeKan creates boards of its own to hold machinery — a subtasks board, for one.
Nobody chose to make one and nobody means to open one, so no list of boards
shows them; they are recognised by their title being wrapped in carets,
`^Subtasks^`.

The selector for that was typed out at each list — five copies of the same
regular expression — and the sixth place forgot it: /public built its own query
and listed every public subtasks board on the instance beside the real ones. It
is one shared helper now, used by every list including /public. A function
rather than a shared constant, because Mongo selectors get merged and mutated by
their callers.

</details>

and improves the following developer tooling:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/65a6a311e">build.sh installs Node on macOS with nvm, and installs the newest 24.x</a>. Thanks to xet7.</summary>

"Install WeKan dependencies" ran `brew install node@24`, which gives whatever
24.x Homebrew currently has bottled rather than what nodejs.org has released,
and which is keg-only — so the branch also wrote `PATH`, `LDFLAGS` and
`CPPFLAGS` for it into `~/.zshrc` by hand. It is `nvm install 24` now: the
major alone, so it resolves to the newest 24.x every time it runs and never
needs bumping, and nvm puts it on `PATH` itself. npm comes with the Node it
installs, so `brew install npm` is gone too.

The nvm installer is fetched from a pinned release tag rather than `master`,
because the line pipes a downloaded script into a shell, and `nvm.sh` is
sourced before the first `nvm` call — nvm is a shell function, not a binary, so
without that every call is "command not found" even straight after a successful
install. An `NVM_DIR` the caller has already set is honoured, and a failed
install is reported instead of run into.

Two things the old branch did are now actively undone. `npm config set prefix
'~/.npm'` cannot coexist with nvm: it overrides the per-version prefix, global
installs land outside the Node they were installed for, and nvm refuses to
switch versions while it is set — so the branch clears it, which a machine that
ran the Homebrew path needs. And that prefix directory was created with a
quoted tilde, `mkdir "~/.npm"`, which makes a directory literally named `~` in
whatever directory `build.sh` was run from.

Linux is untouched and still installs Node with `n`, which the guard pins so
the split stays deliberate.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e8d9c06a7">The notifications spec looks for the header bar that exists</a>. Thanks to xet7.</summary>

One browser test waited for `header, #header` to be visible on the page of the
user who had just been mentioned. The first header bar was rebuilt this release
and there is no `<header>` element and no `#header` id any more - the bar is
`#header-quick-access`, which two other specs already address it by. The
locator matched nothing, so the test asserted that a non-existent element was
visible, and failed in all three browsers.

The guard is what changed, not the app: the bar was deliberately rebuilt. It
names the bar that is there now, and says so in the test for the next reader.
It also asserts the BELL inside that bar, which is what the test is about - the
count beside it arrives asynchronously, so asserting the count would be timing
rather than behaviour, but a notification the user cannot see the bell for is
not a notification.

</details>

and documents the following:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/744df4154">What each board role may and may not do, as one table, read from the code</a>. Thanks to xet7.</summary>

There was no comparison of the roles anywhere. Members.md listed three of them —
Admin, Normal, Comment only — in one line each, and there are **nine**: board
admin, normal, no comments, comment only, worker, read only, and an
assigned-only variant of normal, comment-only and read-only. The API page shows
how to set each flag without saying what any of them does.

[Board
roles](https://github.com/wekan/wekan/blob/main/docs/Features/Members/Roles.md)
is the table: for every role, which cards it sees, whether it may comment,
create or edit cards, move cards, edit lists and swimlanes, and change the
board's settings and members. It says where each column comes from, because the
answer is only two helpers in `server/lib/utils.js` plus `isBoardAdmin()` and,
for visibility, the assigned-only scope in the card publications. It is what the
SERVER allows, because the server is the authority and the UI can only hide
buttons.

Reading the code to write it turned up three roles that do not do what their
name says. They are recorded as gaps rather than fixed, because each needs a
decision about which side is wrong. **"Comment only, assigned" has full write
access** — nothing outside the card publications ever reads that flag, so the
role is in practice "Normal, but only sees my cards", which another role already
means. **"No comments" cannot write anything** — the write helper excludes it,
so the role blocks editing as well as commenting, while the schema calls it "not
allowed to make comments" and the UI offers the edit affordances anyway. **The
write helper does not exempt board admins** — every other helper ignores a flag
on an admin; that one reads the raw flags, which the REST API can set
individually. A fourth section lists the buttons the UI offers that the server
then refuses.

A test keeps the page honest rather than trusting it — a permissions table that
quietly goes stale is worse than none, because it is what an admin decides who
to trust with. It parses the table and checks that every role the code can
return has a row naming a flag it really reads, that the "create / edit" and
"comment" columns match the flag lists in the two server helpers, that "which
cards they see" matches the assigned-only scope, and that each gap it marks is
still real and still explained — so fixing one has to update the page with it.

</details>

and improves the translations:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/de1662146">The Roles Status strings are translated into 111 languages</a>. Thanks to xet7.</summary>

The eleven strings the Roles Status table is built from were new, so they were
untranslated everywhere — on Transifex and in git — and every language showed
them in English. They are filled directly, per language, from that language's
own existing translations and its usual kanban vocabulary, with
`fill-translations.mjs --apply`, which writes only into keys that are still
English placeholders. A filled string can never overwrite a human translation
and is never pushed to Transifex, so it cannot masquerade as one there. The
thirty-one languages that have no translator at all keep the English source, as
they did before.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/720d451d64bdae4beb39d73fe5180846d2096a70">The left menu's drag-to-resize tooltip is translated into every language</a>. Thanks to xet7.</summary>

The grip on the left menu's inner edge got its tooltip this release, so its
string was English in all 142 languages. It is translated directly - no external
translation service, API or key - from each language's OWN existing strings:
that language's "Drag to resize sidebar" sentence gives the pattern and the
verb, and its own words for "left" and "menu" replace the sidebar, so the two
controls read as the pair they are.

Applied with `fill-translations.mjs`, which writes only into keys that are still
English placeholders, so a human translation cannot be overwritten by it, and
filled strings are never pushed to Transifex and so cannot masquerade as human
ones there.

</details>

- [Newest translations from Transifex](https://github.com/wekan/wekan/commit/5c299d763).
  Thanks to translators and xet7.

Thanks to above GitHub users for their contributions and translators for their
translations.
