# Metrics

## What it is

WeKan can be watched from outside in two ways. **Metrics** is an HTTP endpoint,
`/metrics`, that answers in the plain-text Prometheus format with counts such as
connected users, registered boards and the health of the instance backup, so a
monitoring system can graph them and alert on them. **Matomo** is optional web
analytics: when it is configured, every page view in WeKan is reported to your
own Matomo server.

## Read more

- [Prometheus (software)](https://en.wikipedia.org/wiki/Prometheus_(software)) on
  Wikipedia, and the
  [Prometheus text exposition format](https://prometheus.io/docs/instrumenting/exposition_formats/)
  that `/metrics` answers in.
- [Matomo (software)](https://en.wikipedia.org/wiki/Matomo_(software)) on
  Wikipedia, and [matomo.org](https://matomo.org/).
- [Matomo settings keys for the Snap](https://github.com/wekan/wekan-snap/wiki/Supported-settings-keys#matomo-web-analytics-integration).
- [Original metrics pull request](https://github.com/wekan/wekan/pull/4700). Thanks to Emile840.
- Related WeKan pages: [Stats](Stats.md), [Logs](Troubleshooting/Logs.md),
  [Backup](../Backup/Backup.md).

## How to use it

**Allow a scraper to read `/metrics`.** The endpoint answers only a request from
an allowed address or one carrying the access token.

1. Choose how the scraper proves it may read the numbers:
   - by address: set `METRICS_ACCEPTED_IP_ADDRESS` to a comma-separated list,
     for example `METRICS_ACCEPTED_IP_ADDRESS=192.168.0.100,192.168.0.200`;
   - by token: set `METRICS_ACCESS_TOKEN` to a long random string, and send it as
     `Authorization: Bearer <token>` or as `?access_token=<token>`.
2. If WeKan is behind a reverse proxy and you allow by address, set
   `METRICS_TRUST_PROXY` to the number of trusted proxy hops (for example `1`);
   otherwise the address WeKan sees is the proxy's own.
3. Restart WeKan.
4. Point Prometheus at `https://<your-wekan>/metrics`. A refused request gets
   HTTP 401 and a line that names the address WeKan saw; behind a proxy it also
   says what to set.

The example settings in `docker-compose.yml`, `start-wekan.sh`, the `Dockerfile`
and the Snap (`metrics-allowed-ip-addresses`) are named
`METRICS_ALLOWED_IP_ADDRESSES`:

```
- METRICS_ALLOWED_IP_ADDRESSES=192.168.0.100,192.168.0.200
```

See [docker-compose.yml](https://raw.githubusercontent.com/wekan/wekan/master/docker-compose.yml).
Note that the code that serves `/metrics` reads `METRICS_ACCEPTED_IP_ADDRESS`
(see below), so set that name.

**Alert on a missing backup.** Add a Prometheus rule such as
`time() - wekan_backup_last_success_timestamp_seconds > 26*3600`.

**Matomo.** Set `MATOMO_ADDRESS` (the Matomo server URL, ending in `/`),
`MATOMO_SITE_ID`, and optionally `MATOMO_DO_NOT_TRACK` and
`MATOMO_WITH_USERNAME`. With `MATOMO_WITH_USERNAME` the WeKan username is sent
to Matomo as the user id.

## How the numbers are calculated

All in [models/server/metrics.js](../../models/server/metrics.js), computed
fresh on every request:

| Metric | How it is computed |
| --- | --- |
| `wekan_connectedUsers` | open DDP sockets whose session has a user id (one user with two tabs counts twice) |
| `wekan_registeredUsers` | number of documents in `users` |
| `wekan_registeredboards` | boards with `archived: false` and `type: 'board'` (templates are not counted) |
| `wekan_registeredboardsBysRegisteredUsers` | `wekan_registeredboards / wekan_registeredUsers`, a plain division, not rounded |
| `wekan_registeredboardsWithOnlyOneMember` | unarchived boards whose `members` array has exactly one entry |
| `wekan_usersWithLastConnectionDated5DaysAgo` (and `10`, `20`, `30`) | users whose `lastConnectionDate` is within the last 5, 10, 20 or 30 days (`now - days * 24 * 60 * 60 * 1000`); each count includes the shorter ones |
| `wekan_top10BoardsWithMostActivities{n="<title>"}` | activities with `modifiedAt` in the last 30 days, grouped by `boardId`, sorted by count, highest first; the value is the rank `1, 2, ...`. The limit passed is the 30 of the day window, so up to 30 boards are listed despite the name |
| `wekan_backup_last_success_timestamp_seconds` | Unix time of the last successful instance backup, `0` = never |
| `wekan_backup_last_run_timestamp_seconds` | Unix time the last instance backup run ended (or started, while running) |
| `wekan_backup_last_run_success` | `1` when the backup state is `ok` or `overdue`, else `0` |
| `wekan_backup_overdue` | `1` when a scheduled backup has not succeeded within its period plus a two-hour grace: 1 day, 7 days or 31 days for daily, weekly and monthly schedules |

The backup lines come from `backupMetricsLines()` and `backupHealth()` in
[models/lib/backupRuns.js](../../models/lib/backupRuns.js); organization
backups do not count. If reading the backup history fails, the endpoint writes
`# backup metrics unavailable` and still returns the other metrics.

## How it works in WeKan

- [models/server/metrics.js](../../models/server/metrics.js) registers
  `WebApp.handlers.use('/metrics', ...)` at startup.
- Access: `acceptedIpAddress()` compares the client address with the
  comma-separated `METRICS_ACCEPTED_IP_ADDRESS`; `accessToken()` reads a Bearer
  header or `access_token` query parameter and compares SHA-256 digests of it and
  `METRICS_ACCESS_TOKEN` with `crypto.timingSafeEqual`. An unset or empty token
  never matches.
- The client address is the socket peer. `X-Forwarded-For` is used only when
  `METRICS_TRUST_PROXY` is set, and then the entry that many hops from the right
  of the chain, which a client cannot forge (the MetricsBleed fix reported by
  meifukun).
- A refused request that carries `X-Forwarded-For` naming an allowed address,
  while the real connection is not from one, trips the
  `spoof.forwarded-header` canary (`server/lib/canary`), which shows in
  Admin Panel → Problems. An ordinary proxy header is not logged.
- Matomo: [client/lib/utils.js](../../client/lib/utils.js) `manageMatomo()`,
  called by the routes in [config/router.js](../../config/router.js),
  subscribes to `matomoConfig`
  ([server/publications/customUI.js](../../server/publications/customUI.js)),
  and when the settings document has `matomoURL` and `matomoSiteId`,
  `setMatomo()` loads `<address>piwik.js` and pushes `trackPageView`. The
  environment variables are read by `getMatomoConf()` in
  [server/models/settings.js](../../server/models/settings.js); in the current
  code that function has no caller and nothing writes `matomoURL` into the
  settings document, so Matomo tracking may not start from the environment
  variables alone.
- Tests: [tests/metricsAccessToken.test.cjs](../../tests/metricsAccessToken.test.cjs),
  [tests/securityMeifukun.test.cjs](../../tests/securityMeifukun.test.cjs),
  [tests/restartIsNotACrash.test.cjs](../../tests/restartIsNotACrash.test.cjs)
  and the Matomo case in
  [client/lib/tests/Utils.tests.js](../../client/lib/tests/Utils.tests.js).

## Commits

 - [Backup health lines on /metrics](https://github.com/wekan/wekan/commit/06b7ce994ad193357a20fc6a036060ea04c83947)
 - [Compare the access token in constant time and refuse an empty one](https://github.com/wekan/wekan/commit/a4b524a5fc3930fc02d297d05d73616a0ef63cc6)
 - [A reverse proxy header alone is not logged as spoofing](https://github.com/wekan/wekan/commit/034a23edef3676ced4ba3e724708b574daef473d)
 - [Canary for a forged forwarded-for header](https://github.com/wekan/wekan/commit/d577f07700ad84d94a2caf72a2158cd9db1857d5)
 - [Security log for the metrics forwarded-for check](https://github.com/wekan/wekan/commit/6678c92e08762ead403fe756e28df2ef2800af5f)
 - [Use the socket address unless METRICS_TRUST_PROXY is set](https://github.com/wekan/wekan/commit/1669a1af196ba48395e01376b3a0fc784ad42cc3)
 - [Async ReactiveCache calls for Meteor 3](https://github.com/wekan/wekan/commit/71eb01e2331dc03658d46e5c16ff879b83d12885)
 - [Rename the allowlist variable to METRICS_ACCEPTED_IP_ADDRESS](https://github.com/wekan/wekan/commit/0b1e0bd39569175668c195b63dde91bf0e6f1b24)
 - [Example METRICS_ALLOWED_IP_ADDRESSES for Docker, Snap and source](https://github.com/wekan/wekan/commit/34862810df686abfc0ee9ff1a13690a7b2bacc7e)
 - [Fix the order of the top boards metric](https://github.com/wekan/wekan/commit/f8bc186252b198985f9a7ea2d211a0780233924e)
 - [Fix quotes around the metric label](https://github.com/wekan/wekan/commit/962fb70b164810f9efd9245702097a43d4b01995)
 - [Rename metric keys and add a new one](https://github.com/wekan/wekan/commit/eb15751dae0939149a434dd7d43a368dd5e339f5)
 - [Fix typos and translate comments to English](https://github.com/wekan/wekan/commit/551f57b03bbc1dba37862a0cc3407c8d359e2a9a)
 - [More KPI metrics](https://github.com/wekan/wekan/commit/d2436ba0017bb848211f9d7a94ff423c16a651f3)
 - [First KPI metrics](https://github.com/wekan/wekan/commit/d323c1e51efac880394036d75bb3b8218d4e220d)
