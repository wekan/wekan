# Local database preparation for Meteor 3.6

Meteor 3.6-beta.3 bundles MongoDB 8.0.29. Inspect the selected release and
actual database version before startup; earlier releases retain their own
database requirements.

| Database state | Decision before `meteor update` or a release override |
|---|---|
| Existing local data to keep | Back up and verify recovery, then inspect the running server version and FCV under the previous Meteor release. Prepare MongoDB 7 before opening the data with MongoDB 8. |
| Fresh local database | No old FCV to migrate; check host requirements. |
| External `MONGO_URL` | Meteor does not upgrade that database. Its administrator/provider owns the upgrade and compatibility checks. |
| Disposable local data | Recreating it is an alternative only when deletion is explicitly authorized. `meteor reset --db` is not a preservation workflow. |

## Prepare retained data

Resolve `METEOR_LOCAL_DIR` and the connection target before backup; verify
recovery with a compatible server. Do not assume the host OS or Mongo port.
Check `MONGO_URL` presence without printing credentials:

```bash
if [ -n "${MONGO_URL:-}" ]; then
  printf 'MONGO_URL is set (value hidden)\n'
else
  printf 'MONGO_URL is unset\n'
fi
```

Start the app with its previous release. With `mongosh` installed, open another
terminal in the app directory:

```bash
meteor mongo
```

Inspect the local database, not an external production connection:

```javascript
db.version()
db.adminCommand({ getParameter: 1, featureCompatibilityVersion: 1 })
```

MongoDB 8 requires a MongoDB 7 database with FCV `"7.0"`. If the server is
older than 7, follow the required intermediate MongoDB major upgrades first.
If the server is 7 but FCV is older, after backup run on the local replica
set's primary and repeat the FCV check:

```javascript
db.adminCommand({ setFeatureCompatibilityVersion: "7.0", confirm: true })
```

Exit the shell and stop the app, then run `meteor update --release 3.6-beta.3`
to resolve the release and compatible packages. Do not start beta.3 before
preparation. Reverting Meteor is not a database rollback. Keeping FCV `7.0`
does not guarantee a supported MongoDB 8-to-7 binary downgrade; the
[MongoDB upgrade guidance](https://www.mongodb.com/docs/v8.0/release-notes/8.0-upgrade-replica-set/#downgrade-consideration)
requires support assistance. Use the verified pre-upgrade recovery plan.

`meteor reset` preserves the database and cannot repair an incompatible FCV.
`meteor reset --db` deletes it. Keep the distinction when diagnosing startup.

## Bundled MongoDB host requirements

| Host for beta.3's local database | Requirement |
|---|---|
| Linux x86_64 | glibc 2.34+ |
| Linux ARM64 | glibc 2.35+ |
| Linux shared libraries | `libcurl.so.4`, `libssl.so.3`, `libcrypto.so.3` (OpenSSL 3) |
| Windows x64 | Windows 11 or Windows Server 2022; Windows 10/Server 2019 and earlier are unsupported for bundled MongoDB 8 |

Do not diagnose these failures as a corrupt installation or replace system
libraries with symlinks to incompatible versions. Use a supported host, keep
an explicitly constrained earlier release, or use an appropriate external
database. `MONGO_URL` avoids launching bundled MongoDB; it does not waive
Meteor/Node runtime or provider requirements.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/about/install.md
