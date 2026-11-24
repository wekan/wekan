# Migrating from old WeKan manually

## What it is

Migrations from every possible old Wekan version are not implemented yet. This page is a set of starting points for moving the data of a very
old WeKan to the newest one by hand: back up, export the database to JSON,
compare the old and new schema, and fix what differs.

## Read more

- [Wikipedia: Schema migration](https://en.wikipedia.org/wiki/Schema_migration)
- [Backup](../../../../../Backup/Backup.md)
- [History of schema migration systems](History-of-Schema-Migrations-Systems.md)
- [WeKan](README.md): exporting and importing a board as WeKan JSON

## How to use it

Here are some starting points.

### 1) Required: Backups

[Backup](../../../../../Backup/Backup.md)

Do backups to multiple places. And test does restore work, with restore script already made.

### 2) You can save all data from MongoDB to .json files and compare them

That way you can also edit files to fix something, and also save back to MongoDB:
- https://forums.rocket.chat/t/big-issue-with-custom-javascript/261/3

### 3) Change text in all files in current directory in-place

Take backup before runnning this.

Using sed on Linux or Mac. 
```
sed -i 's|FindThisText|ReplaceWithThisText|g' *
```
### 4) Example: From v0.77 to newest

#### v0.77
- Schema https://github.com/wekan/wekan/tree/v0.77/models
- Migrations https://github.com/wekan/wekan/blob/v0.77/server/migrations.js

#### Newest
- Schema [models](../../../../../../models)
- Migrations: the startup schema steps in [server/lib/schemaUpgradeSteps.js](../../../../../../server/lib/schemaUpgradeSteps.js) and the scripts in [server/migrations](../../../../../../server/migrations) (`server/migrations.js` is gone)

### 5) Some migrations could be missing

Some of the database schema can be different. If you see difference in these files, you could fix it for everybody by adding new code to migrations, so old schema is converted to new one automatically when Wekan starts.

### 6) Inform Wekan about what is missing

#### a) Add issue

- https://github.com/wekan/wekan/issues

#### b) Create pull request

- [Build from source and create pull request](../../../../../DeveloperDocs/Build-and-Create-Pull-Request.md)

## How the numbers are calculated

The manual steps have no numbers. WeKan's own startup schema upgrade
([server/lib/schemaUpgradeSteps.js](../../../../../../server/lib/schemaUpgradeSteps.js))
re-checks the database only after the WeKan version changed (or with
`WEKAN_FORCE_SCHEMA_UPGRADE=true`): the `_wekan_migration` marker holds the
version of the last successful re-check, so a start with the same version costs
one lookup.

## How it works in WeKan

When WeKan starts after a new version, it re-checks the database and migrates
only what is missing
([server/lib/schemaUpgradeSteps.js](../../../../../../server/lib/schemaUpgradeSteps.js)),
each step idempotent, replicating the steps of the old `server/migrations.js`
of WeKan v0.9 to v8.00 - text data from every old version is brought to the
newest structure by itself;
the scripts in [server/migrations](../../../../../../server/migrations) repair
older data. A version older than those steps know needs the manual work above.
See [History of schema migration systems](History-of-Schema-Migrations-Systems.md)
for why migrations work this way.

## Commits
 - [Add the docs from the wekan.wiki, this page among them](https://github.com/wekan/wekan/commit/73ae73d4c38640e9daedbe8ef9e5b25b877ee804)
