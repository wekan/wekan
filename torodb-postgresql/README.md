# Docker: Wekan to PostgreSQL read-only mirroring

* [Wekan kanban board, made with Meteor.js framework, running on
  Node.js](https://wekan.github.io) -- [GitHub](https://github.com/wekan/wekan)
* [MongoDB NoSQL database](https://www.mongodb.com)
* [ToroDB: MongoDB to PostgreSQL read-only mirroring, programmed with Java](https://www.8kdata.com/products) --
  [GitHub](https://github.com/torodb/stampede) --
  [Interview at FLOSS Weekly](https://twit.tv/shows/floss-weekly/episodes/377)
* [LibreOffice with native PostgreSQL support](https://www.libreoffice.org)

## Screenshot

![Screenshot of PostgreSQL with LibreOffice][screenshot]

## Install

1) Install docker-compose.

2) Clone this repo.

```bash
git clone https://github.com/wekan/wekan-postgresql.git
cd wekan-postgresql
```

3) IMPORTANT: In docker-compose.yml, to use Wekan on local network, change ROOT_URL=http://localhost to http://IPADRESS like http://192.168.10.100 or http://example.com

4) OPTIONAL: In docker-compose.yml, change PostgreSQL database name, username and password from wekan to something else.

5) Write:

```bash
docker-compose up -d
```

6) Wekan is at http://IPADDRESS or http://example.com (port 80)

7) PostgreSQL connection URL for LibreOffice is `dbname=wekan hostaddr=127.0.0.1 port=15432 user=wekan password=wekan`.
   In some other apps URL could be postgresql://127.0.0.1:15432/wekan , and
   Username: wekan, Password: wekan , or others if you changed those at docker-compose.yml.
   Do not write to PostgreSQL, as it's readonly mirror. Write to MongoDB or make
   changes in Wekan. If server port 15432 open, PostgreSQL can be accessed also
   remotely at local network at http://IPADDRESS:15432/wekan

8) MongoDB is at 127.0.0.1:28017

9) Wekan and databases bind to address 0.0.0.0 so could be also available to other
   computers in network. I have not tested this.

10) [Restore your MongoDB data](https://github.com/wekan/wekan/wiki/Export-Docker-Mongo-Data).

## Feedback

[GitHub issue 787](https://github.com/wekan/wekan/issues/787)

[screenshot]: https://wekan.github.io/ToroDB.png
