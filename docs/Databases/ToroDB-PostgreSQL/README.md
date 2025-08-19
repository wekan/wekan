# What was ToroDB

ToroDB was made with Java. It was about replacing MongoDB with ToroDB/PostgreSQL or ToroDB/MySQL.
ToroDB is not developed anymore.

# Try FerretDB instead

https://blog.ferretdb.io/building-project-management-stack-wekan-ferretdb/

FerretDB https://www.ferretdb.com , https://github.com/FerretDB/FerretDB is made with Go.
Why FerretDB is explained at https://docs.ferretdb.io/#why-do-we-need-ferretdb .
It is about replacing MongoDB with FerretDB/PostgreSQL,
using Microsoft DocumentDB https://github.com/microsoft/documentdb for  additional compatibility.

There is old FerretDB/SQLite, community can maintain it, it's not developed currently by FerretDB:
https://github.com/FerretDB/FerretDB/tree/main-v1 .

C89 SQLite has problems with concurrency, corruption etc.

It will help when updated SQLite made with Rust
will have these issues fixed at https://github.com/tursodatabase/turso .
Turso originally had fork of C89 SQLite C89 Open Contribution based fork of SQLite
https://github.com/tursodatabase/libsql , where they added fixes, but they run into some limits,
so they then moved the Turso Rust SQLite experiment to main tursodatabase GitHub org
https://github.com/tursodatabase/turso like they say at https://www.youtube.com/watch?v=010OKqc3ObM .
Turso is using simulator like https://tigerbeetle.com https://github.com/tigerbeetle/tigerbeetle
to fix concurrency, corruption etc bugs.
So when they get rewrite done, Rust based SQLite is drop-in replacement for C89 SQLite.
It has same database syntax, etc. But it also works with high concurrent usage,
does not corrupt data like C89 SQLite, that is verified with simulator.


# Docker: Wekan to PostgreSQL read-only mirroring

* [Wekan kanban board, made with Meteor.js framework, running on
  Node.js](https://wekan.fi) -- [GitHub](https://github.com/wekan/wekan)
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
git clone https://github.com/wekan/wekan
cd torodb-postgresql
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

[screenshot]: https://wekan.fi/ToroDB.png
