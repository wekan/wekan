# Running WeKan under GDPR, HIPAA, NIS2, ISO 27001 and SOC 2

## What it is

A guide for the **operator** of a WeKan - whoever runs it for others - on what
WeKan provides for the laws and standards most asked about, what to set, and
what stays the operator's own job. WeKan is software: the operator is the
controller (GDPR), the covered entity or business associate (HIPAA), the
essential or important entity (NIS2) or the audited organisation (ISO 27001,
SOC 2), and decides its legal basis, contracts and processes. This page is not
legal advice.

The requirement-by-requirement analysis, with the article of each law and
where WeKan meets it, is [docs/Compliance/README.md](../../Compliance/README.md);
what WeKan stores about people is the
[personal-data inventory](../../Compliance/Data-Inventory.md).

## What WeKan provides

| Need | Law or standard | In WeKan |
| --- | --- | --- |
| Tell people what is stored and why | GDPR Art. 13, CCPA § 1798.100(a) | Admin Panel / Settings / Legal pages: privacy notice (with a draft made from the inventory), terms, cookie notice, imprint, privacy contacts |
| Access and portability | GDPR Art. 15, 20 | Member Settings / Privacy and my data / **Download my data** - everything about the person, as a ZIP of JSON |
| Erasure | GDPR Art. 17 | Deleting or anonymising an account removes the person's data from every collection the inventory lists |
| Storage limitation | GDPR Art. 5(1)(e) | `LOGIN_ADDRESS_RETENTION_DAYS`, `ADMIN_AUDIT_RETENTION_DAYS`, `ACTIVITIES_RETENTION_DAYS`, `WORKLOAD_ABSENCE_RETENTION_DAYS`, attachment retention; the values in force are listed under Legal pages / Data inventory |
| Special category data | GDPR Art. 9 | `WORKLOAD_ABSENCE_TYPE_RECORDED=false` records no sick leave at all |
| Versioned acceptance | GDPR Art. 7(1) where consent is the basis; contract law | Require acceptance for the terms and the privacy notice; each account's accepted versions are kept |
| Audit trail | HIPAA § 164.312(b), ISO A.8.15, SOC 2 CC7.2 | Admin Panel / People / Audit log - every administrator action, kept `ADMIN_AUDIT_RETENTION_DAYS` |
| Access control and authentication | HIPAA § 164.312(a), (d); NIS2 Art. 21(2)(i), (j) | Board roles, `REQUIRE_2FA`, password policy, lockout, idle sign-out ([Security settings](../Security-Settings.md)) |
| Detecting attacks | NIS2 Art. 21(2)(b) | Admin Panel / Problems / Security: each refused attack, summarised per kind with who and how often |
| Vulnerability handling | CRA Annex I Part II, NIS2 Art. 21(2)(e) | [SECURITY.md](../../../SECURITY.md) with the support period, `/.well-known/security.txt` from the security contact, a CycloneDX SBOM on every release |

## How to use it

Recommended settings for a deployment that handles personal data. Each is an
environment variable on every platform ([Security settings](../Security-Settings.md)
says how to set it on Snap, Docker and the others):

- `REQUIRE_2FA=admins` at least, `all` where health or financial data is on
  the boards.
- `PASSWORD_MIN_LENGTH=12`, `PASSWORD_MIN_LENGTH_ENFORCE=true`,
  `PASSWORD_CHECK_PWNED=true`.
- `LOGOUT_IDLE_MINUTES` - for example 30 on shared computers.
- `ADMIN_AUDIT_RETENTION_DAYS=2190` (six years) for HIPAA; 365, the default,
  is common for ISO 27001 and SOC 2.
- `LOGIN_ADDRESS_RETENTION_DAYS` and `ACTIVITIES_RETENTION_DAYS` - as short as
  your purpose allows; write the values in your privacy notice.
- `WORKLOAD_ABSENCE_TYPE_RECORDED=false` unless recording sick leave is needed
  and has a legal basis.
- Admin Panel / Settings / Legal pages: publish the privacy notice and the
  imprint, fill the privacy and security contacts, and Require acceptance where
  your terms need it.

### Encryption at rest

WeKan encrypts its Admin Panel backups when `BACKUP_PASSPHRASE` is set, the
continuous backup when its key is, and the attachments on its disk when
`ATTACHMENTS_PASSPHRASE` is set (Admin Panel / Attachments / Encrypt); it does
not encrypt the live database itself. Encrypt the storage they are on: an encrypted disk or volume (LUKS, BitLocker, FileVault, an
encrypted cloud volume) for the database directory and the attachments
directory (`WRITABLE_PATH`), and for every backup. Use TLS in front of WeKan
(`ROOT_URL` with `https://`) so nothing travels unencrypted.

### Break-glass access

When nobody can sign in as an administrator - the only administrator left, or
lost two-factor devices - keep one emergency account and its procedure written
down, offline, with the people allowed to use it:

1. A named account with administrator rights, a long random password and its
   own two-factor device, kept sealed and used by two people together.
2. Every administrator action it takes is in Admin Panel / People / Audit log;
   review it after each use and change the password.
3. Where even that is lost, an operator with access to the server can make an
   account administrator in the database (`users`, `isAdmin: true`); record
   when and why, as the audit log cannot.

### Processors, DPA and BAA

The hosting provider - and anybody else who runs the server, its backups or its
mail - processes the personal data on your behalf:

- GDPR Art. 28: a data processing agreement with each of them, saying what they
  may do with the data, where it is, and how it is deleted at the end.
- HIPAA § 164.504(e): a business associate agreement with each that can reach
  protected health information. WeKan, the software, is not a party to either:
  nobody at WeKan sees your data.
- List them, with what they process, in your records of processing (GDPR
  Art. 30); the data inventory is where WeKan's part of that list comes from.

## How it works in WeKan

- [models/lib/personalDataInventory.js](../../../models/lib/personalDataInventory.js) -
  every collection that holds personal data, with its retention and erasure.
- [models/lib/legalPages.js](../../../models/lib/legalPages.js),
  [models/lib/legalAcceptance.js](../../../models/lib/legalAcceptance.js) -
  the legal pages and their acceptance.
- [models/lib/securityTxt.js](../../../models/lib/securityTxt.js) -
  `/.well-known/security.txt` and the SBOM link.
- The `sbom` job of
  [.github/workflows/release-all.yml](../../../.github/workflows/release-all.yml):
  `npm sbom` from the tagged `package-lock.json`.

## Read more

- [General Data Protection Regulation](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [NIS2 Directive](https://eur-lex.europa.eu/eli/dir/2022/2555/oj)
- [Cyber Resilience Act](https://eur-lex.europa.eu/eli/reg/2024/2847/oj)
- [RFC 9116, security.txt](https://www.rfc-editor.org/rfc/rfc9116)
- [CycloneDX](https://cyclonedx.org/)
