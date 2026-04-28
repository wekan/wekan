Also see at this wiki right menu Webhooks:
- Global Webhooks at Admin Panel, sends most board actions to webhook (chat, etc)
- Per-board webhooks at Wekan board click hamburger menu => cog icon at right side of members => Board Settings / Webhooks, send actions of one board to some webhook

## Enable more Wekan debug logs:

a) Snap: `sudo snap set wekan debug='true'` - but also notice that [in Wekan v4.56 newer most mongo logs go to `/dev/null` on Snap](https://github.com/wekan/wekan/blob/main/CHANGELOG.md#v456-2020-11-30-wekan-release)

b) docker-compose.yml: `DEBUG=true`

c) start-wekan.sh: `DEBUG=true`

d) [MongoDB logs docs](https://docs.mongodb.com/manual/reference/log-messages/)

e) Logging all MongoDB queries, info [from StackOverflow](https://stackoverflow.com/questions/15204341/mongodb-logging-all-queries) below:
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
Source: http://docs.mongodb.org/manual/reference/method/db.setProfilingLevel/
```
db.setProfilingLevel(2) means "log all operations".
```

## Wekan logs could be at syslog

Logs are at /var/log/syslog , like with:
```
sudo tail -f 1000 /var/log/syslog | less
```

Or:

## Snap
All:
```
sudo snap logs wekan
```
Partial:
```
sudo snap logs wekan.wekan

sudo snap logs wekan.mongodb

sudo snap logs wekan.caddy
```
## Docker

```
docker logs wekan-app

docker logs wekan-db
```
## Sandstorm

When Wekan grain is open, click at top terminal icon, so then opens new window that shows logs

## Additional logs

- https://github.com/wekan/wekan-logstash
- https://github.com/wekan/wekan-stats
- Boards count https://github.com/wekan/wekan/pull/3556
- At this wiki right menu, also look at Webhooks topic
- https://github.com/wekan/wekan/wiki/Features#Stats
- https://github.com/wekan/wekan/issues/1001
