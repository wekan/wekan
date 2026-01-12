# Install WeKan, FerretDB 2, PostgreSQL

## WeKan

```
git clone --branch main --depth 1 https://github.com/wekan/wekan.git
cd wekan
sudo apt update
sudo apt install -y build-essential gcc g++ make git curl wget \
p7zip-full zip unzip unp npm p7zip-full
sudo npm install -g n
export N_NODE_MIRROR=https://github.com/wekan/node-v14-esm/releases/download
sudo -E n 14.21.4
sudo npm -g install @mapbox/node-pre-gyp
sudo npm -g install meteor@2.14 --unsafe-perm
export PATH=$PATH:/home/demo/.meteor
meteor npm install production
meteor build .build --directory --platforms=web.browser
```

## Postgres 17 + DocumentDB

```
sudo bash -c 'curl -fsSL https://repo.pigsty.io/pig | bash'
pig repo add all -u
pig ext install pg17
pig ext install documentdb
```
Edit `/etc/postgresql/17/main/postgresql.conf`, there set
```
shared_preload_libraries = 'pg_cron, pg_documentdb, pg_documentdb_core'
```
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
Edit your `/etc/systemd/system/ferritdb.service` file,
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
```
export PATH=$PATH:/home/demo/.meteor
cd ~/wekan

MONGO_URL=mongodb://ferret:DB_PASSWORD_GOES_HERE@127.0.0.1:27017/wekan \
WRITABLE_PATH=.. WITH_API=true RICHER_CARD_COMMENT_EDITOR=false \
ROOT_URL=https://wekan.example.com meteor run \
--exclude-archs web.browser.legacy,web.cordova \
--port 8080 2>&1 | tee ../wekan-log.`date +%s`.txt
```

## Notes

- Machine must have at least 3 gigs of ram. Crashes at npm installing meteor, with 384 megs.
- Machine must have at least 4 gigs of ram. Crashes at meteor build with 3 gigs.
- Be ready to read rebuild-wekan.sh if you want to actually get it running.
