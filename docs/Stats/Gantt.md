# What is this?

Original WeKan is MIT-licensed software.

This different Gantt version here currently uses Gantt chart component that has GPL license, so this Wekan Gantt version is GPL licensed.

Sometime later if that GPL licensed Gantt chart component will be changed to MIT licensed one, then that original MIT-licensed WeKan will get Gantt feature, and maybe this GPL version will be discontinued.

# How to use

[Source](https://github.com/wekan/wekan/issues/2870#issuecomment-721690105)

At cards, both Start and End dates should be set (not Due date) for the tasks to be displayed.

# Funding for more features?

You can fund development of more features of Gantt at https://wekan.team/commercial-support, like for example:
- more of day/week/month/year views
- drag etc

# Issue

https://github.com/wekan/wekan/issues/2870

# Install

Wekan GPLv2 Gantt version:
- https://github.com/wekan/wekan-gantt-gpl
- https://snapcraft.io/wekan-gantt-gpl
- https://hub.docker.com/repository/docker/wekanteam/wekan-gantt-gpl
- https://quay.io/wekan/wekan-gantt-gpl

## How to install Snap

[Like Snap install](https://github.com/wekan/wekan-snap/wiki/Install) but with commands like:
```
sudo snap install wekan-gantt-gpl

sudo snap set wekan-gantt-gpl root-url='http://localhost'

sudo snap set wekan-gantt-gpl port='80'
```
Stopping all:
```
sudo snap stop wekan-gantt-gpl
```
Stopping only some part:
```
sudo snap stop wekan-gantt-gpl.caddy

sudo snap stop wekan-gantt-gpl.mongodb

sudo snap stop wekan-gantt-gpl.wekan
```

## Changing from Wekan to Wekan Gantt GPL

1) Install newest MongoDB to have also mongorestore available

2) Backup database and settings:
```
sudo snap stop wekan.wekan

mongodump --port 27019

snap get wekan > snap-set.sh

sudo snap remove wekan

sudo snap install wekan-gantt-gpl

sudo snap stop wekan-gantt-gpl.wekan

nano snap-set.sh
```
Then edit that textfile so all commands will be similar to this:
```
sudo snap set wekan-gantt-gpl root-url='https://example.com'
```
And run settings:
```
chmod +x snap-set.sh

./snap-set.sh

sudo snap start wekan-gantt-gpl.wekan
```
## Changing from Wekan Gantt GPL to Wekan

1) Install newest MongoDB to have also mongorestore available

2) Backup database and settings:
```
sudo snap stop wekan-gantt-gpl.wekan

mongodump --port 27019

snap get wekan-gantt-gpl > snap-set.sh

sudo snap remove wekan-gantt-gpl

sudo snap install wekan

sudo snap stop wekan.wekan

nano snap-set.sh
```
Then edit that textfile so all commands will be similar to this:
```
sudo snap set wekan root-url='https://example.com'
```
And run settings:
```
chmod +x snap-set.sh

./snap-set.sh

sudo snap start wekan.wekan
```

# UCS

[Gantt feature at UCS](UCS#gantt)
