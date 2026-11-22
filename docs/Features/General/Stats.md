# Stats

## What it is

Stats means exporting WeKan activity and statistics out of WeKan, so they can be
shown on dashboards and analysed with other tools. WeKan itself has no stats
exporter of its own here: these are companion tools that read the WeKan
database, plus the built-in [Metrics](Metrics.md) endpoint for live counts.

## Read more

- [Dashboard (computing)](https://en.wikipedia.org/wiki/Dashboard_(computing)),
  [Logstash](https://en.wikipedia.org/wiki/Logstash) and
  [Elasticsearch](https://en.wikipedia.org/wiki/Elasticsearch) on Wikipedia, and
  the [Elastic Stack (ELK)](https://www.elastic.co/elastic-stack).
- [Daily export of WeKan changes as JSON to Logstash and ElasticSearch / Kibana (ELK)](https://github.com/wekan/wekan-logstash)
- [Statistics Python script for a WeKan dashboard](https://github.com/wekan/wekan-stats)
- [Console, file, and Zulip logger on database changes](https://github.com/wekan/wekan/pull/1010),
  with a [fix to replace console.log with the winston logger](https://github.com/wekan/wekan/pull/1033)

## How to use it

1. For live numbers that a monitoring system scrapes, use [Metrics](Metrics.md).
2. For a daily export to ELK, install
   [wekan-logstash](https://github.com/wekan/wekan-logstash) next to the database
   and follow its README.
3. For a dashboard of statistics, run
   [wekan-stats](https://github.com/wekan/wekan-stats) against the database and
   follow its README.
4. For an export of single boards, use the [REST API](../../API/REST-API.md).

## How the numbers are calculated

The numbers are computed by the external tools above, not by WeKan; see their
own READMEs. The numbers WeKan computes itself are described in
[Metrics](Metrics.md).

## How it works in WeKan

The tools above read the WeKan MongoDB collections directly; nothing in this
repository runs them. The console, file and Zulip logger of pull request 1010
and its winston change of pull request 1033 were reverted in November 2017
(see the commits below), so current WeKan has no such logger; for logs see
[Logs](Troubleshooting/Logs.md).

## Related

- [Metrics](Metrics.md) — Prometheus metrics endpoint.
- [Logs](Troubleshooting/Logs.md)
- [REST API](../../API/REST-API.md)

## Commits

 - [Revert the database change logger](https://github.com/wekan/wekan/commit/e28f3692ca9cbf760c524c531e8ca955e4d78521)
 - [Fix the logger when LOGGERS is empty](https://github.com/wekan/wekan/commit/b03c9b987959d35324295c7cb49b5c6904ebda43)
 - [Enable the logger by default](https://github.com/wekan/wekan/commit/7f8f6bf3dbe4348907085968cd28ec19f69b5384)
 - [Move the cleanup, logstash and stats repositories to the WeKan organization](https://github.com/wekan/wekan/commit/4c62b3260506017f7a3cc5c7b6db9051fb694be6)
 - [Link the WeKan changes to Logstash export](https://github.com/wekan/wekan/commit/cd70076af2b0d34c2fb4a0ef52c02c8f9da28a69)
 - [Replace console.log with the winston logger](https://github.com/wekan/wekan/commit/548172949aaaea054f203d5fdc3286c90c5ae8e1)
 - [Console, file and Zulip logger on database changes](https://github.com/wekan/wekan/commit/00a357cd7067cf5c8b055deacfe2e9bc28b06c5e)
