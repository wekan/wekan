# Cleanup

## What it is

Cleanup means removing data that is no longer needed: old or orphaned
documents in the WeKan database, and unused Docker images, containers and
volumes that fill the disk. These are companion tools and commands that run
outside WeKan; take a backup first.

## Read more

- [WeKan database cleanup script](https://github.com/wekan/wekan-cleanup) — remove
  old/orphaned data from the database.
- [Docker cleanup](https://github.com/wekan/wekan/issues/985) — reclaim disk space
  used by Docker, and Docker's own guide to
  [pruning unused objects](https://docs.docker.com/engine/manage-resources/pruning/).
- [MongoDB](https://en.wikipedia.org/wiki/MongoDB) on Wikipedia.

## How to use it

1. Take a backup, see [Backup and Restore](../../Backup/Backup.md).
2. Database: follow the README of
   [wekan-cleanup](https://github.com/wekan/wekan-cleanup).
3. Docker: follow [issue 985](https://github.com/wekan/wekan/issues/985) or
   Docker's pruning guide; remove only images and volumes you no longer use.
4. If the database itself is damaged, see
   [Repair MongoDB](../../Backup/Repair-MongoDB.md) instead.

## How the numbers are calculated

This page has no numbers of its own; what is removed and how old it must be is
decided by the cleanup script's own settings.

## How it works in WeKan

Nothing in this repository runs these tools; the cleanup script works on the
MongoDB collections directly. Cleanups that WeKan does by itself (for example
attachment retention and event log retention) are set with environment
variables and described on their own pages.

## Related

- [Backup and Restore](../../Backup/Backup.md)
- [Repair MongoDB](../../Backup/Repair-MongoDB.md)

## Commits

 - [Move the cleanup repository to the WeKan organization](https://github.com/wekan/wekan/commit/4c62b3260506017f7a3cc5c7b6db9051fb694be6)
 - [Link the WeKan database cleanup script](https://github.com/wekan/wekan/commit/eb7b15a12ca69b6c69538afe22e4c154387b4c85)
