<img src="univention.svg" width="30%" alt="Univention logo" />

## <a name="ProductionUnivention"></a>Production: [Univention](https://www.univention.com/products/univention-app-center/app-catalog/wekan/) platform, many apps and WeKan ®

- Virtual Appliances Download: [VirtualBox, KVM, VMware, VMware ESX](https://www.univention.com/products/univention-app-center/app-catalog/wekan/)
- [Video of installing Univention WeKan ® Appliance](https://wekan.fi/UCS-4.4-with-wekan-10.200.2.25.webm)
- After installing, you get license key file in email. Go with webbrowser to VM ip address like http://192.x.x.x and upload license. After that also on VM screen console login as root is possible. If you install KDE app from App Center with webbrowser, you get KDE on VM screen.
- [WeKan ® for Univention Feature Requests and Bug Reports](https://github.com/wekan/univention/issues)
- [Univention Open Source repos](https://github.com/Univention)
- [Univention interview at FLOSS Weekly 480](https://twit.tv/shows/floss-weekly/episodes/480) 
- VM based on Debian. Free and Enterprise versions of Univention are same, only difference is paid support.
- Univention VM can be standalone, or replace Windows Server Active Directory, or join to existing Active Directory. Has web UI, LDAP server, Users/Groups management, adding user to app.
- WeKan ® LDAP login is integrated to Univention LDAP. Create at Univention web UI at Users management LDAP Domain Admin user, and add WeKan ® app for that user, to get WeKan ® Admin Panel. Normal users don't have Admin Panel.
- Has WeKan ® . From App Center you can install RocketChat, WordPress, OnlyOffice, NextCloud, OpenXChange, etc. Some apps are full free versions, some other apps require payment for more features. WeKan ® is full free version.
- WeKan ® on Univention uses Docker. UCS App Center offers the newest WeKan version that has been published and approved for your UCS version; this can differ from the newest upstream release.
- The prepared upgrade from 6.09 targets WeKan 12.28 with FerretDB SQLite. It still needs image publication and testing/approval in the UCS App Center before production availability.
- [RocketChat Webhook workaround](https://github.com/wekan/univention/issues/15)

## Prepared upgrade: WeKan 6.09 → 12.28

The new UCS app definition is designed to migrate automatically when you select
**Upgrade** for WeKan in the UCS App Center portal. You should not need to run a
separate migration command. This upgrade is **not yet verified or published for
production UCS**; wait until the tested version is offered in your App Center.

During the upgrade, WeKan is temporarily unavailable while its database and
attachments are copied and checked. MongoDB collections move to **FerretDB v1
with SQLite**. Attachments and avatars stored in MongoDB move to the
**filesystem**, keeping their links to cards and users. UCS LDAP, mail and
ROOT_URL settings remain part of the app configuration.

After a successful upgrade, starting WeKan runs only two Docker containers:

- `wekan-app`: the new WeKan application.
- `wekan-db`: FerretDB v1 with the SQLite backend, sourced from the
  `ghcr.io/wekan/ferretdb` image and mirrored to Univention's registry when published.

The migration containers are removed. MongoDB no longer runs for this app;
its original data remains on disk for rollback. The old
`wekan-wekandb:6.09-ucs1` registry image was verified as **MongoDB 3.2.21**.
The `wekan-wekandb` repository name is retained for UCS packaging; the new image
under that name will contain FerretDB, not MongoDB.

Before upgrading, take a UCS VM snapshot or a tested backup and allow maintenance
time and enough free disk space for the old data, backup and migrated copy. The
upgrade checks available space before dumping the database. If migration fails,
it cancels the upgrade and attempts to restart the old application. Do not delete
the old database or bypass the migration completion check.

### Where the data lives

Paths are below `/var/lib/univention-appcenter/apps/wekan/data/`:

| Path | Contents |
| --- | --- |
| `ferretdb/files/db/` | Active SQLite database after migration |
| `ferretdb/files/attachments/` | Attachments on the filesystem |
| `ferretdb/files/avatars/` | Avatars on the filesystem |
| `db/` | Retained original MongoDB data |
| `dump/ucs-<timestamp>-<pid>/` | Pre-upgrade dump and configuration backup |

Back up the active database **and** both file directories together. Stop the app
and database before a filesystem backup to keep them consistent. Keep the old
MongoDB data and pre-upgrade backup until the migrated app has been checked and
you have a tested backup of the new storage.

After upgrading, check LDAP login, board/card counts, comments, old attachment
downloads, avatars and new uploads. Restart through UCS and verify the same data
is present. Upgrade logs are in `/var/log/univention/appcenter.log`; the migration
result is in `data/ferretdb/ucs-migration-status.json` under the app directory.

For the maintainer's remaining build, publication and UCS test steps, see
[UCS automatic upgrade design](UCS-upgrades.md).

### LDAP login fails after upgrading to 12.32

The 12.32 app definition kept a 6.09 setting: WeKan's LDAP **group** filter
switched on, with no group named. WeKan 6.09 read that as "member of any group";
current WeKan refuses an incomplete group filter, so every LDAP login fails with
**LDAP authentication failed**, and the app log says `LDAP group login filter is
enabled but cannot check membership ... Refusing login`. Who may use WeKan on UCS
is decided by the **WeKan activated** checkbox of each user
(`(wekanActivated=TRUE)`), so the group filter is not needed. The next app
version turns it off and sets `cn` as the group name attribute, so members of
**Domain Admins** are WeKan administrators again.

Until that version is offered, an installation that already upgraded can apply
the same two settings on the UCS host:

```
ucr set appcenter/env/wekan/LDAP_GROUP_FILTER_ENABLE=false \
        appcenter/env/wekan/LDAP_GROUP_FILTER_GROUP_ID_ATTRIBUTE=cn
univention-app reinitialize wekan
docker exec wekan-app env | grep LDAP_GROUP_FILTER
```

The last command should show `LDAP_GROUP_FILTER_ENABLE=false` and
`LDAP_GROUP_FILTER_GROUP_ID_ATTRIBUTE=cn`. The two `ucr` values can be removed
with `ucr unset` after upgrading to a version that contains the fix.

Open WeKan at the address in its **ROOT_URL** setting
(`https://<ucs-host>/wekan`). Opened through another host name or an IP address,
the browser blocks WeKan's own requests to the ROOT_URL host as cross-origin.

## Feature Requests and Bugs

[WeKan ® for Univention Feature Requests and Bugs](https://github.com/wekan/univention/issues)

## Gantt

[How to use Gantt](../../../../../Features/Board-Header/Board-Views/Gantt.md)

UCS WeKan v5.71 and newer is using WeKan Gantt GPL version. [Source](https://github.com/wekan/wekan/issues/2870#issuecomment-954598565).

## Email on Univention

[Source](https://github.com/wekan/univention/issues/6#issuecomment-607986717)

### 1) WeKan ® product page, scroll down

![ucs-mail-1](https://user-images.githubusercontent.com/15545/78279227-e682f700-751f-11ea-83fc-d22bc71b77fb.png)

### 2) Click APP SETTINGS

![ucs-mail-2](https://user-images.githubusercontent.com/15545/78279301-fdc1e480-751f-11ea-9d7b-1632c71cd79a.png)

### 3) Mail Settings

[Troubleshooting Mail](../../../../../Features/General/Email/Troubleshooting-Mail.md)

![ucs-mail-3](https://user-images.githubusercontent.com/15545/78279359-129e7800-7520-11ea-9e22-a911826285ba.png)

## Repairing the legacy MongoDB installation

[Repair MongoDB](../../../../../Backup/Repair-MongoDB.md) applies to the old 6.09
installation and retained MongoDB backup, not the new FerretDB SQLite database.

## Migration image availability

New releases bundle UCS migration tools in the ordinary WeKan Docker image.
The temporary worker uses that same image with an explicit migration command;
there is no separately published helper image. If Univention mirrors both the
new WeKan and FerretDB images, the generated preinst can use only UCS's registry.
It reads the exact target compose references before trying upstream fallbacks.
See [release and recovery steps](UCS-upgrades.md#recover-the-1231-helper-image-authorization-failure).
