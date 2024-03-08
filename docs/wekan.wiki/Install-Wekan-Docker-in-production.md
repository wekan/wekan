# Different wiki page: [Production setup for thousands of users at AWS](AWS)


***


## Single server install, for small teams

## Also see: [Using same database for both LAN and VPN Wekan](https://github.com/wekan/wekan-mongodb/blob/master/docker-compose.yml#L86-L100)

**Purpose:** run Wekan on a production Linux server with Docker and Apache or Nginx as a front-end server (reverse proxy)

## 1. Install newest Docker and Docker Compose

[Docker website](https://docker.com)

## 2. Use Wekan-MongoDB with Docker Compose

https://github.com/wekan/wekan-mongodb

[External MongoDB authentication](https://github.com/wekan/wekan/issues/1375)

## 3. Email

[Troubleshooting Email](Troubleshooting-Mail)

## 4. Configure webserver as a front-end proxy

* [Caddy](Caddy-Webserver-Config)
* [Nginx](Nginx-Webserver-Config)
* [Apache](Apache)

## 5. Launch Wekan

As `wekan` user and from `/home/wekan`, run `docker-compose up -d`

## 6. Improvements to bring to this doc

* Verify everything works


## 7. Tested on...

This procedure has been tested on:

* [VPS-SSD 2016 from OVH](https://www.ovh.com/fr/vps/vps-ssd.xml) with Ubuntu 14.04