# Python

## What it is

Some Python etc code for WeKan, that is not yet added directly to WeKan: scripts
and companion projects that talk to WeKan through its REST API or its database,
for syncing users, exporting data, statistics and so on. They run outside the
WeKan server.

## Read more

- [Python (programming language)](https://en.wikipedia.org/wiki/Python_(programming_language))
  on Wikipedia.
- WeKan pages: [REST API](../../../API/REST-API.md), [Stats](../Stats.md),
  [Cleanup](../Cleanup/Cleanup.md).

## How to use it

Pick the script or project from the list below and follow its own README or
header comment. For example, the API CLI in this repository:

1. Edit `wekanurl`, `username` and `password` in
   [api.py](../../../../api.py).
2. Run `python3 api.py` to see its commands, for example
   `python3 api.py listdependencies BOARDID`.

The list:

- [LDAP sync script, that also correctly removes users](../../Login-Page/ldap-sync/ldap-sync.py)
- [Email notifications to AWS SES](https://github.com/wekan/wekan/issues/3543#issuecomment-1199897164)
- [Prometheus Exporter](https://github.com/wekan/wekan-prometheus-exporter)
- [Burndown Chart](../../Board-Header/Board-Views/Charts/Burndown-and-Velocity-Chart.md)
- [Scheduler](https://github.com/wekan/wekan-scheduler)
- [Cleanup](https://github.com/wekan/wekan-cleanup)
- [API client, most complete](https://github.com/wekan/python-wekan) (modelled after Trello API client)
- [API CLI](../../../../api.py)
- [2nd API client](https://github.com/wekan/wekan-python-api-client)
- [Stats](https://github.com/wekan/wekan-stats)
- [Logstash and ElasticSearch](https://github.com/wekan/wekan-logstash)
- iCal server in [Python](https://github.com/wekan/wekan-ical-server)
- [Sandstorm CSV related Python code](../../../Platforms/FOSS/Container/Sandstorm/Wekan-Sandstorm-cards-to-CSV-using-Python.md)
- [Trello API test code](../../Board-Sidebar/Board-Settings/Import-Export/Trello/trello)

## How the numbers are calculated

These tools have no numbers in WeKan; see each one's own documentation.

## How it works in WeKan

They use the [REST API](../../../API/REST-API.md) (the API CLI and the API
clients), read the MongoDB database directly (stats, cleanup, Logstash), or
are documentation examples (Sandstorm CSV, Trello API test code). Nothing in
the WeKan server runs them.

## Commits

 - [Code-quality fixes found by GitHub code scanning](https://github.com/wekan/wekan/commit/582a22c2914e5eaaeea84f29a3c75970195bf5e5)
 - [Fixed the Python API example: edit card](https://github.com/wekan/wekan/commit/bf62a947fbfa7d387074550288376e682fd6ad47)
 - [Added the WeKan REST API Python CLI](https://github.com/wekan/wekan/commit/051f7b2769c51404063e7f0ddf85fbd0f9508a88)
