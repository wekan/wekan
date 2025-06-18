## Upgrade

- If using Snap, please wait for official automatic upgrade from 6.09 to 7.x
- It is only possible to migrate to same version of WeKan at different platform, like Snap 6.09 to Docker 6.09
  - Because attachments will not be visible, if upgrading from 6.09 to 7.x
  - There will be some way to upgrade attachments later.

## Migrate

- [Backup/Restore Snap/Docker](../Backup/Backup.md)
  - also copy files at `/var/snap/wekan/common/files/` to environment variable `WRITABLE_PATH` files subdirectory
  - If you use WeKan included Caddy v1, also copy `/var/snap/wekan/common/files/Caddyfile`, but recommended is to use [newer webserver like Caddy 2 etc](../Webserver)
- [Automatically updating multi Snap](../Platforms/FOSS/Snap/Many-Snaps-on-LXC.md)
  - at multisnap also copy other snapnames like t `/var/snap/wekan_OTHERSNAPNAME/common/files/` to environment variable `WRITABLE_PATH` files subdirectory
- [Migrate Sandstorm](../Platforms/FOSS/Sandstorm/Export-from-Wekan-Sandstorm-grain-.zip-file.md) that also has [exporting to JSON textfiles](../Platforms/FOSS/Sandstorm/Export-from-Wekan-Sandstorm-grain-.zip-file.md#11b-dump-database-to-json-text-files)
- [Migrate text to SQLite and attachments to separate files](https://github.com/wekan/minio-metadata) that will be later used with future WeKan versions like [WeKan Studio](https://github.com/wekan/wekanstudio) or [wami](https://github.com/wekan/wami)
