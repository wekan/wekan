# UCS migration inside the WeKan image

The main Dockerfile installs Debian's `docker-cli` and these tools. Its ordinary
CMD still runs WeKan as the `wekan` user. The generated UCS preinst starts a
short-lived container from that SAME versioned app image as root with:

```
bash /opt/ucs-migration/start.sh
```

Only the temporary worker receives the Docker socket. It executes `mongo` and
`mongoexport` inside the old database container, whose tools understand MongoDB
3.2. The source app is stopped before copying; the original database is retained.
The worker writes to the temporary FerretDB instance and verifies collection
counts and attachment contents before allowing the App Center upgrade.

`start.sh --check` checks tools and module resolution without a Docker socket,
source database, target database or writes to application data. Release CI and
the portal uploader run this check before advertising a usable UCS upgrade.

The initial runtime was imported from `wekan/univention`'s `component/migration`.
Its importer derives from WeKan's `snap-src/bin/migrate-mongo3-to-ferretdb.mjs`
at commit `97df5395193aca74b7481e149f6d8051577d3b28`, with UCS checks for missing
CollectionFS records, truncated chunks and unmatched Meteor-Files records.
`IMPORTER-LICENSE` preserves its license. Keep these checks when refreshing it.

See [UCS upgrade and test instructions](../../docs/Platforms/FOSS/Container/Docker/UCS/UCS-upgrades.md).
