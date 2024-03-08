Copy all docker containers and data to new server, replacing all of docker on new server:
```
ssh ubuntu@oldserver.com
cd repos/wekan
sudo su
docker-compose stop
systemctl stop docker
cd /var/lib
tar cvpzf docker.tar.gz docker
systemctl start docker
scp docker.tar.gz root@newserver.com:/var/lib/
exit
exit
```
Then on new server restore:
```
ssh ubuntu@newserver.com
sudo su
systemctl stop docker
cd /var/lib
mv docker old-docker
tar xpvzf docker.tar.gz
systemctl start docker
exit
exit
```

***

OLD INFO:

This page is work in progress, and needs more details.

1) If you have installed Wekan with Docker like at this page:

https://github.com/wekan/wekan/wiki/Export-Docker-Mongo-Data

2) and you want to move Docker containers to another computer (laptop, server etc) that also has Docker installed, use Docker export and import commands:

https://docs.docker.com/engine/reference/commandline/export/

https://docs.docker.com/engine/reference/commandline/import/

3) If mongo data is on volume, also use this:

https://docs.docker.com/engine/tutorials/dockervolumes/#backup-restore-or-migrate-data-volumes
