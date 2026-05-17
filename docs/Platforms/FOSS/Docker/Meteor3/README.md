# Meteor 3 WeKan: Hosting many WeKan kanban, websites, etc

Migrating from Parallel Snap setup, because `snap set wekan root-url=...`
etc commands are slow to run, and did not get Parallel Snap working properly yet.

```
caddy proxy: Let's Encrypt and CloudFlare TLS to localhost http ports
  |
  |==> Many Parallel WeKan Snap Containers at different ports,
  |    each Container with it's own Node.js/MongoDB
  |==> Sandstorm, many websites with WordPress and Hackers CMS
  |==> PHP/MySQL WordPress     (example)
  |==> PHP/MySQL Hesk Helpdesk (example)
  |==> PHP/MySQL Kanboard      (example)
  |==> Static websites         (example)
```
To this Docker setup:
```
caddy proxy: Let's Encrypt and CloudFlare TLS to localhost http ports
  |
  |==> Many Docker Meteor 3 WeKan Node.js Containers,
  |    Uses changeStreams and DDP_TRANSPORT=uws
  |     |
  |     |=> One MongoDB without container,
  |         always requires password to login,
  |         for admin and each other users,
  |         each user has it's own database, username and password
  |
  |==> Sandstorm, many websites with WordPress and Hackers CMS
  |==> PHP/MySQL WordPress     (example)
  |==> PHP/MySQL Hesk Helpdesk (example)
  |==> PHP/MySQL Kanboard      (example)
  |==> Static websites         (example)
```
Save all Parallel Snap container settings with:
```
snap-save-settings.sh
```
For setting up MongoDB etc, use examples at `apt` directory.

MongoDB config `/etc/mongod.conf` is at `mongo` directory.

Create MongoDB key:
```
./keys.sh
```
1) Adding new user, it saves MongoDB connection string to username.txt:
```
./1createdb.sh username
```
Same username.txt is used when login to database, backup, restore, files transfer, etc.

You can connect to database:
```
./sh.sh username
```
Or sometime make Backup to `backup/username/YYYY-MM-DD_HH-MM-SS/`
```
./backup.sh username
```
2) Create docker-compose.yml to `restore/username/`
```
./2docker.sh username
```
Edit docker-compose.yml and start Docker container:
```
cd restore/username/

nano docker-compose.yml

docker compose up -d
```
3) Restore database
```
./3restoredb.sh username
```
4) Transfer attachments and avatars from Snap server to Docker server:
```
./4files.sh username
```
5) Restart Docker container:
```
cd restore/username/

docker compose stop

docker compose start
```
6) Upgrade WeKan from old version to new version, for example:
```
./update-wekan-version.sh 9.10 9.11"
```
