# Install WeKan, FerretDB 2, PostgreSQL

- https://blog.ferretdb.io/building-project-management-stack-wekan-ferretdb/

## WeKan

- Alternatively, use wekan-app Docker container from https://raw.githubusercontent.com/wekan/wekan/refs/heads/main/docker-compose.yml

```
git clone --branch main --depth 1 https://github.com/wekan/wekan.git
cd wekan
sudo apt update
sudo apt install -y build-essential gcc g++ make git curl wget \
p7zip-full zip unzip unp npm
sudo npm install -g n
export N_NODE_MIRROR=https://github.com/wekan/node-v14-esm/releases/download
sudo -E n 14.21.4
sudo npm -g install @mapbox/node-pre-gyp
sudo npm -g install meteor@2.14 --unsafe-perm
export PATH=$PATH:$HOME/.meteor
meteor npm install production
meteor build .build --directory --platforms=web.browser
```

## Postgres 17 + DocumentDB

```
sudo bash -c 'curl -fsSL https://repo.pigsty.io/pig | bash'
pig repo add pgsql -u
pig ext install pg17
pig ext install documentdb
```
Edit `/etc/postgresql/17/main/postgresql.conf`, there set
```
shared_preload_libraries = 'pg_cron, pg_documentdb, pg_documentdb_core'
```
edit `/etc/postgresql/17/main/pg_hba.conf` ,
replace `scram-sha-256` with trust on the host lines for `127.0.0.1/32` and `::1/128`

Restart PostgreSQL:
```
sudo service postgresql restart
```

## FerretDB

Download:
```
curl -L  \
https://github.com/FerretDB/FerretDB/releases/download/v2.7.0/ferretdb-amd64-linux.deb \
-o /tmp/ferretdb-amd64-linux.deb
```
Install:
```
sudo apt -y install /tmp/ferretdb-amd64-linux.deb
```
Edit your `/etc/systemd/system/ferretdb.service` file,
add your username/password pair to the following line:
```
Environment="FERRETDB_POSTGRESQL_URL=postgres://ferret:DB_PASSWORD_GOES_HERE@127.0.0.1:5432/postgres"
```
Then enable and start FerretDB:
```
sudo systemctl enable ferretdb.service
sudo service ferretdb start
```

## Initializing the Database
```
su -
su - postgres
psql
CREATE ROLE ferret WITH PASSWORD 'DB_PASSWORD_GOES_HERE';
CREATE DATABASE ferretdb;
GRANT ALL PRIVILEGES ON DATABASE ferretdb TO ferret;
ALTER ROLE ferret WITH LOGIN;
CREATE EXTENSION documentdb CASCADE;
GRANT USAGE ON SCHEMA documentdb_api to ferret;
GRANT USAGE ON SCHEMA documentdb_core to ferret;
GRANT USAGE ON SCHEMA documentdb_api_internal to ferret;
GRANT USAGE ON SCHEMA documentdb_api_catalog to ferret;
GRANT INSERT ON TABLE documentdb_api_catalog.collections to ferret;
GRANT ALL ON SCHEMA documentdb_data to ferret;
GRANT documentdb_admin_role to ferret;
```
## Launching WeKan

a) At screen:

```
export PATH=$HOME/.meteor
cd ~/wekan

MONGO_URL=mongodb://ferret:DB_PASSWORD_GOES_HERE@127.0.0.1:27017/wekan \
WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false \
ROOT_URL=https://wekan.example.com meteor run \
--exclude-archs web.browser.legacy,web.cordova \
--port 8080 2>&1 | tee ../wekan-log.`date +%s`.txt
```

b) SystemD Service:

/etc/default/wekan:
```
NODE_ENV=production
MAIL_FROM="WeKan kanban <boards@example.com>"
MAIL_URL=smtp://username:password@email-smtp.eu-west-1.amazonaws.com:587?tls={ciphers:"SSLv3"}&secureConnection=false
OAUTH2_AUTH_ENDPOINT=https://accounts.google.com/o/oauth2/v2/auth
OAUTH2_CLIENT_ID=example.apps.googleusercontent.com
OAUTH2_EMAIL_MAP=email
OAUTH2_ENABLED=true
OAUTH2_FULLNAME_MAP=name
OAUTH2_ID_MAP=sub
OAUTH2_REQUEST_PERMISSIONS="openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email"
OAUTH2_SECRET=topsecret
OAUTH2_TOKEN_ENDPOINT=https://oauth2.googleapis.com/token
OAUTH2_USERINFO_ENDPOINT=https://openidconnect.googleapis.com/v1/userinfo
OAUTH2_USERNAME_MAP=nickname
MONGO_LOG_DESTINATION=mongodb-log.txt
MONGODB_PORT=27017
ROOT_URL=https://boards.example.com
WRITABLE_PATH=../files
MONGO_URL=mongodb://ferret:DB_PASSWORD_GOES_HERE@127.0.0.1:27017/wekan
WITH_API=true
RICHER_CARD_COMMENT_EDITOR=false
CARD_OPENED_WEBHOOK_ENABLED=false
BIGEVENTS_PATTERN=NONE
BROWSER_POLICY_ENABLED=true
TRUSTED_URL=''
WEBHOOKS_ATTRIBUTES=''
LDAP_BACKGROUND_SYNC_INTERVAL=''
```
`/etc/systemd/system/wekan.service` running as user boards,
`sudo adduser boards` and copy files and update permissions
with `sudo chown boards:boards /home/boards -R` 
```
[Unit]
Description=The Wekan Service
After=syslog.target network.target

[Service]
EnvironmentFile=/etc/default/wekan
User=boards
Group=boards
WorkingDirectory=/home/boards/repos/bundle
ExecStart=/usr/local/bin/node main.js
Restart=on-failure
SuccessExitStatus=143
StandardOutput=file:/home/boards/repos/wekan-output-log.txt
StandardError=file:/home/boards/repos/wekan-error-log.txt

[Install]
WantedBy=multi-user.target
```
Then enable service:
```
sudo systemctl enable wekan
sudo systemctl start wekan
```
For SSL/TLS, I run Caddy at front of Node.js:
https://github.com/wekan/wekan/blob/main/docs/Webserver/Caddy.md

Related is docs about Raspberry Pi:
https://github.com/wekan/wekan/blob/main/docs/Platforms/FOSS/RaspberryPi/Raspberry-Pi.md

And also about Windows bundle:
https://github.com/wekan/wekan/blob/main/docs/Platforms/Propietary/Windows/Offline.md

## Notes

- Machine must have at least 3 gigs of ram. Crashes at npm installing meteor, with 384 megs.
- Machine must have at least 4 gigs of ram. Crashes at meteor build with 3 gigs.
- Be ready to read rebuild-wekan.sh if you want to actually get it running.
