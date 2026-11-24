# Admin Panel / Problems / Compliance

## What it is

A read-only checklist of the settings that GDPR, HIPAA, NIS2, ISO 27001 and
SOC 2 most often look for, at `/admin/problems/compliance`, for site
administrators. Each row says whether the setting is as recommended, worth a
look, or only for information, shows its current value, and links to the pane
where it is changed. It changes nothing.

## Read more

- [Running WeKan under GDPR, HIPAA, NIS2, ISO 27001 and SOC 2](../../../Security/Compliance/README.md) -
  which of these matter for whom, and the recommended values.
- [The compliance analysis](../../../Compliance/README.md), WP-12.
- [Security settings](../../../Security/Security-Settings.md).

## How to use it

1. Sign in as a site administrator and open **Admin Panel → Problems →
   Compliance**.
2. Read each row: **OK**, **Check** (recommended for any WeKan with personal
   data, and not set) or **For information** (depends on who runs it).
3. Click a row's text to open the pane where that setting is changed. The
   environment variables (`REQUIRE_2FA`, `LOGOUT_IDLE_MINUTES`, `HSTS_MAX_AGE`,
   the retention days) are set as on every platform; the page shows their
   value on this server.

## How the numbers are calculated

| Row | OK when | Otherwise |
| --- | --- | --- |
| Two-factor authentication | `REQUIRE_2FA` is `admins` or `all` | Check |
| Idle sessions signed out | `LOGOUT_IDLE_MINUTES` is more than 0 | Check |
| HTTPS, with HSTS | `ROOT_URL` is `https://` and an HSTS header is sent | Check |
| Sign-in addresses kept a limited time | `LOGIN_ADDRESS_RETENTION_DAYS` more than 0 | Check |
| Audit log kept 2190 days or more | `ADMIN_AUDIT_RETENTION_DAYS` 2190 or more, or 0 (kept) | For information: HIPAA |
| Privacy notice published | Settings / Legal pages / Privacy notice is published | Check |
| Imprint published | Settings / Legal pages / Imprint is published | For information: DE and AT |
| Security contact | Legal pages has a security contact, so `security.txt` answers | Check |
| Continuous backup encrypted | the continuous backup is on and encrypted | Check; For information while it is off |

## How it works in WeKan

- [models/lib/complianceChecks.js](../../../../models/lib/complianceChecks.js) -
  the rows and their status, from the facts (pure).
- [server/methods/complianceChecks.js](../../../../server/methods/complianceChecks.js) -
  `getComplianceChecks`, site administrators only: reads the facts.
- `client/components/settings/complianceReport.*` - the pane.
- Tested by [tests/complianceChecks.test.cjs](../../../../tests/complianceChecks.test.cjs).
