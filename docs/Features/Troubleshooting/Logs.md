# Logs

## What it is

Logs are the messages WeKan, its database and its web server write while they
run. When something does not work, the logs usually say why. This page says
where the logs are on each platform, how to make WeKan log more, and which other
ways (webhooks, exports) send WeKan's events somewhere else.

## Read more

- [Logging (computing)](https://en.wikipedia.org/wiki/Logging_(computing)),
  [Syslog](https://en.wikipedia.org/wiki/Syslog) and
  [Webhook](https://en.wikipedia.org/wiki/Webhook) on Wikipedia.
- [MongoDB log messages](https://docs.mongodb.com/manual/reference/log-messages/)
  and [db.setProfilingLevel()](http://docs.mongodb.org/manual/reference/method/db.setProfilingLevel/).
- [Logging all MongoDB queries, on StackOverflow](https://stackoverflow.com/questions/15204341/mongodb-logging-all-queries).
- WeKan pages: [Global Webhooks](../Admin-Panel/Settings/Global-Webhooks.md),
  [Outgoing webhook data](../Board-Sidebar/Board-Settings/Outgoing-Webhooks/Webhook-data.md),
  [Stats](../Stats.md), [Metrics](../Metrics.md),
  [Troubleshooting mail](../Email/Troubleshooting-Mail.md).

## How to use it

**Read the logs.**

1. Snap, all services: `sudo snap logs wekan`. One service at a time:

   ```
   sudo snap logs wekan.wekan

   sudo snap logs wekan.mongodb

   sudo snap logs wekan.caddy
   ```

2. Docker:

   ```
   docker logs wekan-app

   docker logs wekan-db
   ```

3. Sandstorm: when the WeKan grain is open, click the terminal icon at the top;
   a new window opens that shows the logs.
4. Otherwise WeKan logs could be at syslog, `/var/log/syslog`, for example:

   ```
   sudo tail -f 1000 /var/log/syslog | less
   ```

**Enable more WeKan debug logs.**

1. Snap: `sudo snap set wekan debug='true'` - but also notice that
   [in WeKan v4.56 and newer most mongo logs go to `/dev/null` on Snap](../../../old-CHANGELOG/2020.md#v456-2020-11-30-wekan-release)
   (Snap setting `mongo-log-destination`: `devnull`, `snapcommon` or `syslog`,
   default `devnull`).
2. docker-compose.yml: `DEBUG=true`
3. start-wekan.sh: `DEBUG=true`
4. Restart WeKan, reproduce the problem, and read the logs again.

**Log all MongoDB queries** (from StackOverflow, see above):

```
$ mongo
MongoDB shell version: 2.4.9
connecting to: test
> use myDb
switched to db myDb
> db.getProfilingLevel()
0
> db.setProfilingLevel(2)
{ "was" : 0, "slowms" : 1, "ok" : 1 }
> db.getProfilingLevel()
2
> db.system.profile.find().pretty()
```

`db.setProfilingLevel(2)` means "log all operations". Set it back to `0` when
done, because level 2 writes every operation.

**Send events elsewhere with webhooks.**

- Global Webhooks at Admin Panel send most board actions to a webhook (chat,
  etc.): [Global Webhooks](../Admin-Panel/Settings/Global-Webhooks.md).
- Per-board webhooks: open the board's right sidebar → Board Settings →
  **Outgoing Webhooks**, to send the actions of one board to some webhook.

## How the numbers are calculated

Logs have no numbers of their own. `DEBUG` counts as on only when it is exactly
`true` (`process.env.DEBUG === 'true'` in the server files), and the MongoDB
profiling levels are `0` off, `1` slow operations only, `2` all operations.

## How it works in WeKan

- Server code writes to standard output and standard error; Snap, Docker and
  systemd collect that. Extra lines are written where the code checks
  `process.env.DEBUG === 'true'`, for example
  [server/initializeDirs.js](../../../server/initializeDirs.js) and
  [server/header-login.js](../../../server/header-login.js).
- The Snap reads `debug` and `mongo-log-destination` through
  [snap-src/bin/config](../../../snap-src/bin/config).
- Problems that WeKan detects itself (security, speed, database) are summarised
  in Admin Panel → Problems rather than only in the log.

## Additional logs

- [wekan-logstash](https://github.com/wekan/wekan-logstash)
- [wekan-stats](https://github.com/wekan/wekan-stats)
- Boards count, [pull request 3556](https://github.com/wekan/wekan/pull/3556):
  `GET /api/boards_count` answers the number of private and public boards; it
  needs an admin user (`Authentication.checkUserId` in
  [server/models/boards.js](../../../server/models/boards.js)).
- [Stats](../Stats.md)
- [Issue 1001](https://github.com/wekan/wekan/issues/1001)

## Commits

 - [Boards count endpoint for statistics](https://github.com/wekan/wekan/commit/bcf5a586c78493c1984bcc9eac2c116ae2e9b461)
 - [Snap mongo-log-destination, default devnull](https://github.com/wekan/wekan/commit/5510c2a37dc6bcfa0ec588eceb8dc9f32cec9851)
