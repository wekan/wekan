Running Wekan Mongodb with Traefik as a reverse proxy with a self-signed cert as containers on a single docker host.

## Background

Craig had been using nginx as a reverse proxy for a restyaboard install, but it was a bit opaque (at least to him) as to how to configure it to reverse proxy for multiple services, so he thought he'd try traefik and use Wekan as the service as a learning exercise and compare the two.

This was done to demo using containers as services (he works in an older style org and they're still stuck in a vmware/vm mentality).

Updated 5-10-18 for wekan v1.52 and mongodb 3.2.21
## Install

Note: my login is a member of the docker group on this docker host so I can exec docker commands.

Created directories:
```
sudo mkdir -p /opt/traefik/certs
sudo chmod 755 /opt/traefik
sudo chmod 750 /opt/traefik/certs
```

Created a self-signed cert and key for the application (its on an internal network so didn't want to mess with the Letsencrypt stuff that requires access to the internet and registered dns domains):

```
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout wekan1.key -out wekan1.crt
```

Copied these to /opt/traefik/certs and set permissions:
```
chmod 644 /opt/traefik/certs/wekan1.crt

chmod 600 /opt/traefik/certs/wekan1.key 
```             

Create a docker network web to use for traefik - this config doesn't require any ports exposed for wekan-app or wekan-db on the docker-host:

```
docker network create web
```

Created an internal dns entry wekan.myinternaldomain.org that is a cname for the docker host (i.e. Wekan resolves to the ip address of the docker host) - note that this config assumes that ports 80 and 443 don't have any processes from the docker host listening on those ports. If you don't have internal dns - put this in the relevant hosts file on the systems that will access the app, including the docker host.

## Traefik config

added the following to `/opt/traefik/docker-compose.yml`

```
version: '2'

services:
  traefik:
    image: traefik:latest
    ports:
      - 80:80
      - 443:443
      - 8080:8080
    networks:
      - web
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /opt/traefik/traefik.toml:/traefik.toml
      - /opt/traefik/certs/:/certs/
    container_name: traefik

networks:
  web:
    external: true
```

Created `/opt/traefik/traefik.toml` with:

```
debug = false

logLevel = "DEBUG"
defaultEntryPoints = ["https","http"]

[entryPoints]
  [entryPoints.http]
  address = ":80"
    [entryPoints.http.redirect]
    entryPoint = "https"
  [entryPoints.https]
  address = ":443"
  [entryPoints.https.tls]
    [[entryPoints.https.tls.certificates]]
      certFile = "/certs/wekan1.crt"
      keyFile = "/certs/wekan1.key"
  [entryPoints.eightzero]
  address = ":8080"

[api]
entrypoint = "eightzero"


[retry]

[docker]
endpoint = "unix:///var/run/docker.sock"
domain = "docker.localhost"
watch = true
exposedbydefault = false
```

Comments  - `docker-compose.yml`:

The image is set as the latest for traefik - you may want to tie it to a particular version. Also added in the entrypoint for the trafik api (8080)

To test:

```
cd /opt/traefik

docker-compose up
```

This will ouput to the terminal till you are ready to run it in the background with `docker-compose up -d` . (stop the container running with Ctrl-c)

It exposes ports 80, 443 and 8080 on the docker host so you can check by webbing to `<docker hostip>` but you should get a 404 error until wekan is up.
```
curl -H Host:wekan.myinternaldomain.org http://localhost
```
mounting `/var/run/docker.sock:/var/run/docker.sock` on the container gives access to docker config so that traefik can be dynamic (thats more advanced) see https://traefik.io/ for extensive docs.

traefik.toml is the config for traefik. It sets up port 80 to redirect to 443. This is a very simple config - there's a whole lot more that you can do.

endpoint under `[docker]` is where changes are read from.

- domain - default dns domain used.
- watch = true - watch docker changes.
- exposedbydefault = false - If set to false, containers that don't have `traefik.enable=true` will be ignored. (I haven't tried it with other containers yet so I've set it to false).

Now for Wekan:

This fairly standard with the addition of some labels(handy notes have been removed for brevity)

```
version: '2'

services:

  wekandb:
    image: mongo:3.2.21
    container_name: wekan-db
    restart: always
    command: mongod --smallfiles --oplogSize 128
    networks:
      - web
    expose:
      - 27017
    volumes:
      - wekan-db:/data/db
      - wekan-db-dump:/dump
  wekan:
    image: quay.io/wekan/wekan:v1.52
    container_name: wekan-app
    restart: always
    networks:
      - web
	# traefik magic stuff here
    labels:
      - "traefik.backend=wekan-app"
      - "traefik.docker.network=web"
      - "traefik.frontend.rule=Host:wekan.myinternaldomain.org"
      - "traefik.enable=true"
      - "traefik.port=8080"
      - "traefik.default.protocol=http"
    #note: mail url points to ip address of docker host which has postfix running as a relay
    # for docker apps. ping me at email: silvacraig@gmail.com if you want the postfix config.
    # note here that an ip address is used instead of the servce name in the MONGO_URL - 
    # this is a bug that I have to work out. To identify the IP address use docker network
    #  inspect web when the wekandb is running
    environment:
      - MONGO_URL=mongodb://172.xx.xx.2:27017/wekan
      - ROOT_URL=http://wekan.myinternaldomain.org
      - MAIL_URL=smtp://172.17.0.1:25/
      - MAIL_FROM='Wekan Support - <unix.admin@myinternaldomain.org>'
    # newer environment variables:
      - BROWSER_POLICY_ENABLED=true
      - TRUSTED_URL=''
      - WEBHOOKS_ATTRIBUTES=''
    depends_on:
      - wekandb

volumes:
  wekan-db:
    driver: local
  wekan-db-dump:
    driver: local

networks:
  web:
    external: true
```
	
One this is done - run wekan with:
```
docker-compose up 
```
This will run with logging output to the console - once its running ok - CTRL-C and start it up again with:
```
docker-compose up -d
```