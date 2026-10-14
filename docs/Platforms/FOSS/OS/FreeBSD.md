**Current state and plan for FreeBSD, OpenBSD, NetBSD and DragonFly BSD: [BSD.md](BSD.md).**

Newest info at https://github.com/wekan/wekan/issues/2662

Old disappeared info [this comment](https://github.com/wekan/wekan/issues/1155#issuecomment-326734403) instructions:
[https://github.com/greinbold/install-wekan/blob/master/v0.32/freebsd-11.0-RELEASE.md](https://github.com/greinbold/install-wekan/blob/master/v0.32/freebsd-11.0-RELEASE.md)

## Run WeKan as a FreeBSD service

[#2662](https://github.com/wekan/wekan/issues/2662). The FreeBSD bundle,
`wekan-<version>-freebsd-x64.zip` from the
[releases](https://github.com/wekan/wekan/releases), carries an rc.d script,
`bundle/rc.d/wekan` ([source](../../../../releases/bsd/rc.d/wekan)). It runs the
bundle's own `start-wekan.sh` - the bundled Node.js and FerretDB on SQLite, no
other database - under `daemon(8)` as an unprivileged user:

```sh
pw useradd wekan -d /nonexistent -s /usr/sbin/nologin -c WeKan
unzip wekan-<version>-freebsd-x64.zip -d /usr/local/wekan
install -m 555 /usr/local/wekan/bundle/rc.d/wekan /usr/local/etc/rc.d/wekan
sysrc wekan_enable=YES wekan_root_url=https://wekan.example.com
service wekan start
```

| rc.conf variable | Default | What it is |
| --- | --- | --- |
| `wekan_dir` | `/usr/local/wekan/bundle` | the unzipped bundle |
| `wekan_user` / `wekan_group` | `wekan` | who WeKan runs as |
| `wekan_port` | `8080` | the port WeKan listens on |
| `wekan_root_url` | `http://localhost:<port>` | the address people open WeKan at |
| `wekan_data` | `/var/db/wekan` | `WRITABLE_PATH`: the database and attachments |
| `wekan_logfile` | `/var/log/wekan.log` | WeKan's and FerretDB's output |
| `wekan_env` | | more settings, e.g. `MAIL_URL=smtp://mail.example.com:25/` |

`service wekan stop` stops WeKan and the bundled FerretDB together. To
upgrade, stop it, unzip the new bundle over `/usr/local/wekan`, and start it;
the data in `wekan_data` stays.

### A FreeBSD port (proposal)

The rc.d script is what a port installs too. A port for the ports tree, to be
proposed to FreeBSD, would package the same bundle - its Makefile in outline:

```make
PORTNAME=	wekan
DISTVERSIONPREFIX=	v
DISTVERSION=	<version>
CATEGORIES=	www
MASTER_SITES=	https://github.com/wekan/wekan/releases/download/v${DISTVERSION}/
DISTNAME=	wekan-${DISTVERSION}-freebsd-x64
EXTRACT_SUFX=	.zip

MAINTAINER=	x@xet7.org
COMMENT=	Open source kanban
WWW=		https://wekan.fi

LICENSE=	MIT
ONLY_FOR_ARCHS=	amd64

USE_RC_SUBR=	wekan
USERS=		wekan
GROUPS=		wekan
NO_BUILD=	yes
WRKSRC=		${WRKDIR}/bundle

do-install:
	${MKDIR} ${STAGEDIR}${PREFIX}/wekan
	# -p keeps node, ferretdb and start-wekan.sh executable.
	${CP} -Rp ${WRKSRC} ${STAGEDIR}${PREFIX}/wekan/bundle
```

with `files/wekan.in` being `releases/bsd/rc.d/wekan` with `%%PREFIX%%` for
`/usr/local`. A port that builds WeKan from source instead needs Meteor on
FreeBSD, which does not exist; packaging the release bundle is the route that
works now.

## FreeBSD Meteor build instructions

TODO