# WeKan compliance gap analysis (2026-11-22)

> **What this is.** An analysis of which requirements of laws and standards a
> self-hosted WeKan supports, which it does in part, and what is missing - with
> the code it found and the official text of each provision. It is a plan for
> WeKan's development, not legal advice and not a claim of compliance: whether
> a deployment complies depends on how its operator runs it. The legal sources
> are in [Sources.md](Sources.md). Rows are updated as the work packages are
> done.

Read-only analysis of the WeKan repository (branch `main`). Scope: what a **self-hosted collaborative
application** must provide so that the organisation running it can meet GDPR /
UK GDPR, ePrivacy, NIS2, ISO/IEC 27001:2022 Annex A, ISO/IEC 27701, SOC 2 TSC,
HIPAA Security and Privacy Rules, CCPA/CPRA, LGPD, PIPEDA, Australian Privacy
Act, PIPL, India DPDP, Japan APPI, POPIA, EU Cyber Resilience Act, EU
Accessibility Act / EN 301 549 / WCAG 2.2 AA, EU Data Act and (checked) EU AI
Act / eIDAS. Organisational processes (DPIAs, staff training, the operator's
own incident procedure) are out of scope except where the app must support them.

Status: **EXISTS** (done, evidence given), **PARTIAL** (exists, a concrete part
missing), **MISSING** (searched, not found - search terms given).
Priority: **P1** legally required for most deployments, **P2** commonly required
by a framework, **P3** nice to have.

Legal basis column: every row names the exact provision and links its
official source; the bracketed key (e.g. [GDPR], [CRA], [DDG5]) is a link
defined in "Legal sources" at the end of this file, and
[Sources.md](Sources.md) holds, per source, the
HTTP status seen, the version/consolidation read, the application date and a
quotation of the sentence relied on. Citations were added on 2026-11-22 from
the current official texts (Pandex / EU Publications Office Cellar /
national official portals), not from memory. **UNVERIFIED** marks a
provision that could not be confirmed in an official source, with the
reason; the row does not rely on it as fact. GDPR article numbers are the EU
text; the UK GDPR (amended by the Data (Use and Access) Act 2025) was not
re-read article by article. ISO/IEC 27001/27701 control numbers and SOC 2
criteria are **UNVERIFIED** throughout: iso.org answered 403 and both texts
are paywalled/gated, so they are kept only as orientation.

## Summary

WeKan already has a strong **security** base: TOTP 2FA with a `REQUIRE_2FA`
off/admins/all policy, passkeys, account lockout, idle logout and timed logout,
log out everywhere, password minimum + breached-password check, HSTS/HTTPS,
board roles and custom roles, an admin audit log, a summarised security event
log, file and history integrity scans (history is hash-chained), backups with
restore and encrypted continuous backup, S3 server-side encryption,
inactive-account disabling, a published vulnerability-disclosure process,
an accessibility statement page and axe-core tests.

The gaps are concentrated in **privacy transparency and data-subject rights**,
not in security:

1. **No self-service "download my data"** and no admin "export this person's
   data" (only board exports and the REST `GET /api/user`).
2. **Erasure is incomplete**: `removeUser` and `anonymizeUser` leave personal
   data in at least 12 other collections - including `workloadAbsences` whose
   `type: 'sick'` is health data (GDPR Art. 9) - and the login-address tally
   keeps the old username after anonymisation. `anonymizeUser` is not in the
   audit log.
3. **No privacy policy / terms / imprint / cookie pages inside WeKan**, no
   versioned acceptance record - only one external "legal notice" URL shown on
   the login page with "By continuing, you accept our legal notice". An
   operator that offers an instance commercially in Germany or Austria must
   keep an imprint "ständig verfügbar" (§ 5 DDG, § 5 ECG) - a login-only link
   is not enough (row 7.3).
4. **No ROPA export yet, and no retention for some personal data**
   (`impersonatedUsers`, activities, change history, time entries,
   absences). The data inventory exists ([Data-Inventory.md](Data-Inventory.md),
   WP-3) and sign-in addresses expire (`LOGIN_ADDRESS_RETENTION_DAYS`, row 2.6).
5. **Audit log gaps**: client-side Settings writes (Admin Panel switches) are
   not audited, retention is a fixed 365 days (HIPAA § 164.316(b)(2)(i) keeps
   required Security Rule documentation 6 years - it does not literally name
   audit-log rows), no export / SIEM forwarding, no record of who exported
   what.
6. **CRA**: no SBOM drawn up per release (deliberately off in Docker, pinned
   by a test), no support-period statement, no `/.well-known/security.txt`.
   The CRA applies in full only from **2027-12-11**, but its Art. 14
   reporting duties apply since **2026-09-11** - see "Legal status" below for
   whether WeKan is a manufacturer at all.
7. **WCAG 2.2**: the axe suite runs WCAG 2.0/2.1 tags only; the 2.2-only
   criteria are open in `TODO.md`. Legally the EU baseline is still WCAG 2.1
   AA through EN 301 549 V3.2.1, and only for public-sector deployments (Web
   Accessibility Directive) or in-scope consumer services (EAA); 2.2 is good
   practice.

EU AI Act (Regulation (EU) 2024/1689, **amended by Regulation (EU)
2026/1744**, consolidated 2026-07-27 - its Art. 113 dates changed): **not
applicable** - WeKan has no AI model; its "assistants" are
deterministic code (`docs/Features/General/Assistants/Assistants.md`: "No
model is downloaded, no text leaves the server"); a grep for
`openai|anthropic|ollama|llm|chatgpt|gemini` in `models/ server/ client/` found
nothing. eIDAS: **not applicable** (no qualified signatures/seals; SAML/OIDC
login is enough for eIDAS-notified eIDs via an IdP). ePrivacy cookie banner:
**not required by default** - WeKan sets only the strictly necessary
`meteor_login_token` cookie; the Matomo code in `client/lib/utils.js`
(`setMatomo`, `manageMatomo`) is dead code (only called from
`client/lib/tests/Utils.tests.js`; `matomoURL`/`matomoSiteId` are not in the
`models/settings.js` schema and nothing writes them) - it should be removed or,
if kept, gated behind consent.

Side findings (bugs, not compliance features, worth fixing on the way):
`removeUser` and `anonymizeUser` on oneself do not check
`AccountSettings 'accounts-allowUserDelete'` server-side (only the button is
hidden, `client/components/users/userHeader.jade:243`), and a self-delete
skips the last-administrator check (`server/models/users.js` `removeUser`,
self branch returns before it). `TODO.md` already lists "the per-address login
delay is never applied" and the attachment-retention per-run limit mismatch.

## Legal status on 2026-11-22 (what applies now, what comes later)

| Instrument | Version read | Applies from | Binds |
|---|---|---|---|
| [GDPR] Regulation (EU) 2016/679 | consolidation 2016-05-04 (corrigendum); no amending act in Cellar | **2018-05-25** (Art. 99(2)) - applies now | the operator (controller); WeKan supplies the features |
| [EPD] Directive 2002/58/EC Art. 5(3); DE [TDDDG25] § 25; UK [PECR6] reg. 6 | 2009-12-19; TDDDG current; PECR reg. 6 **substituted 2026-02-05** | applies now | operator |
| [NIS2] Directive (EU) 2022/2555 | 2022-12-27, unamended | Member State measures **from 2024-10-18** (Art. 41(1)); DE: [BSIG] 2025 (Ausfertigung 2025-12-02) - applies now where transposed | operators that are essential/important entities (Art. 2), not WeKan |
| [CRA] Regulation (EU) 2024/2847 | 2024-11-20; amended only by Reg. (EU) 2025/327 (EHDS) | **Art. 14 reporting since 2026-09-11** (also for products placed before 2027-12-11, Art. 69(3)); Chapter IV since 2026-06-11; **everything else, incl. Art. 13, Annex I, Annex II and Art. 24, from 2027-12-11** (Art. 71(2)) | manufacturers / stewards - see the CRA note below |
| [EAA] Directive (EU) 2019/882 | 2019-06-07, unamended | **2025-06-28** (Art. 31(2)); services transition to 2030-06-28 (Art. 32) | only consumer services listed in Art. 2(2) - a kanban tool is not one; microenterprises exempt (Art. 4(5)) |
| [WAD] Directive (EU) 2016/2102 | OJ text | websites 2019-09-23 / 2020-09-23, apps 2021-06-23 (Art. 12(3)) - applies now | public sector bodies running WeKan |
| [DA] Regulation (EU) 2023/2854 | 2023-12-22, unamended | **2025-09-12** (Art. 50) - applies now | operators selling WeKan as a data processing service (Art. 23 switching) |
| [ECD] Art. 5; DE [DDG5] § 5 DDG; AT [ECG5] § 5 ECG, [MedienG] §§ 24-25; UK [UKECR6] reg. 6 | DDG last amended 2026-05-12; ECG/MedienG "Fassung vom 22.11.2026" | applies now (DDG since 2024-05-14, replacing § 5 TMG) | operator of a commercially offered instance |
| [AIA] Regulation (EU) 2024/1689 | **amended by Reg. (EU) 2026/1744**, consolidated 2026-07-27 | in parts since 2025; high-risk 2027-12-02 / 2028-08-02 | not applicable (no AI) |
| [HIPAA] 45 CFR 164 Subpart C (Security Rule) | eCFR up to date 2026-11-19; Security Rule unchanged since 2013; NPRM of 2025-01-06 not final | applies now | covered entities / business associates |
| [HIPAA] Privacy Rule final rule 91 FR 74848 (2026-11-19) | amends § 164.524 etc. | **2027-01-19** | same |
| [CCPA] Cal. Civ. Code § 1798.100 et seq. + 11 CCR § 7000 et seq. | statute and regulations effective 2026-01-01 | applies now; ADMT regulations by **2027-01-01** | a "business" (§ 1798.140(d)) |
| [LGPD] Lei 13.709/2018 | texto compilado | applies now (sanctions since 2021-08-01, Art. 65) | operator |
| [PIPEDA] S.C. 2000, c. 5 | current to 2026-10-29 | applies now | operator |
| [AUPA] Privacy Act 1988 (Cth) | compilation C2026C00227, 2026-06-04 | applies now (small business ≤ AUD 3 M turnover generally exempt, s. 6D) | operator |
| [PIPL] 个人信息保护法 | 2021 text (NPC) | **2021-11-01** (Art. 74) | operator |
| [DPDP] Act No. 22 of 2023 | as enacted | **UNVERIFIED**: core duties reported to start 2027-05-13 (MeitY page not readable) - treat as later | operator |
| [APPI] Act No. 57 of 2003 | translation of Act No. 37 of 2021 | applies now | operator |
| [POPIA] Act 4 of 2013 | Gazette text as enacted | applies now (commencement date UNVERIFIED) | operator |
| [WCAG22], [EN301549], [ISO27001], [ISO27701], [SOC2], [RFC9116], [NIST63B] | standards / guidance | not law by themselves | - |

**CRA and WeKan itself (Art. 3(13), 3(14), 24, recitals 15, 18, 19).**
The open-source steward regime of Art. 24 needs a **legal person** (Art.
3(14): "a legal person, other than a manufacturer"; recital 19). WeKan's own
commercial-support page says "WeKan (VAT Number: FI34047245) is a Finnish Sole
Proprietorship", i.e. a natural person, so WeKan is not a steward. Whether
WeKan is a *manufacturer* depends on whether it is supplied "in the course of
a commercial activity" (Art. 3(22)): free FOSS that is "not monetised" is not
commercial (recital 18), but recital 15 names "charging a price for technical
support services where this does not serve only the recuperation of actual
costs" and "an intention to monetise" as signs of commercial supply, and the
same page sells support cases, hourly work, yearly plans and an "Official SaaS
with Admin Panel: 50 euro/year" (while stating all revenue goes to WeKan's
FLOSS development). So the premise "free, non-commercial" is not clearly
supported; the case is borderline. If it is commercial, Lauri Ojansivu is the
manufacturer (Art. 3(13) covers natural persons and "free of charge"): Art. 14
reporting of actively exploited vulnerabilities (24 h / 72 h / 14 days) via
ENISA's single reporting platform already applies, and Art. 13 + Annex I/II
from 2027-12-11. If not, the CRA does not apply to WeKan at all. Organisations
that **sell or bundle** WeKan are manufacturers of their product and must do
FOSS due diligence (Art. 13(5)); organisations that **only self-host** it are
users. Rows 5.1-5.5 are written so they are worth doing either way. This is
a reading of the text, not legal advice.

---

## 1. Data subject rights

| # | Requirement | Legal basis (exact provision; key links to official source) | Status | Evidence | What is missing / smallest addition | Menu | Prio |
|---|---|---|---|---|---|---|---|
| 1.1 | Right of access + portability: a person downloads all data about themselves, machine-readable | [GDPR] Art. 15(1),(3), Art. 20(1); [CCPA] § 1798.110(a); [LGPD] Art. 18 (items II, V UNVERIFIED - only the head was read); [PIPEDA] Sch. 1 Principle 4.9; [AUPA] APP 12.1; [PIPL] Art. 45 (UNVERIFIED, not read); [APPI] Art. 33; [POPIA] s. 23; [DPDP] s. 11 (not yet in force, UNVERIFIED date); [HIPAA] § 164.524 (amended by 91 FR 74848, effective 2027-01-19). Data Act Art. 4-5 removed: they cover connected-product data, not WeKan ([DA] Art. 1(1)(a)). | **PARTIAL** | Board exports in many formats (`models/lib/exportAllBoards.js`, `server/routes/exportAllBoards.js`, All Boards sidebar "Export all boards"); REST `GET /api/user` (`server/models/users.js:2672`) returns the user document minus `services` plus board memberships. Searched `exportMyData|exportUserData|downloadMyData|my-data|personal data` - no personal-data export. | A "Download my data" ZIP: `user.json` (profile, settings, `loginAddresses`, notifications, 2FA/passkey **metadata** only, no secrets), `authored/` (cards created, comments, checklists, attachments uploaded, time entries, workload absences/capacity, reactions, saved filters), `boards.json` (memberships + roles), and the existing per-board WeKan JSON export of boards still visible to them. New `server/lib/personalDataExport.js` driven by the inventory (WP-3) so a new collection is included automatically; route `GET /api/user/export` reusing `activeUserByToken(token, 'export', req)` like `server/routes/exportAllBoards.js`; respect `assertExportEnabled()` only for board content, never for the person's own profile (access right cannot be switched off). | Member Settings / **Privacy and my data** / Download my data | P1 |
| 1.2 | Admin answers a data-subject request on behalf of a person | Same rights as 1.1, exercised through the controller: [GDPR] Art. 12(3) (deadline one month - UNVERIFIED, Art. 12 not re-read), Art. 15; [CCPA] § 1798.110; [HIPAA] § 164.524 | **MISSING** | Admin Panel / People / People ⋯ menu (`settingsUserPopup` in `client/components/settings/peopleBody.jade:730`) has Impersonate, Anonymize, Delete only. Impersonation can export boards but that is not a DSAR. | Add "Export personal data" to the ⋯ menu calling the same exporter for `userId` (admin only, audited, add to `AUDITED_METHODS`). | Admin Panel / People / People / ⋯ | P1 |
| 1.3 | Rectification | [GDPR] Art. 16 (not re-read, UNVERIFIED); [CCPA] § 1798.106(a); [LGPD] Art. 18(III); [PIPEDA] Principle 4.9; [HIPAA] § 164.526; [POPIA] s. 24 (not re-read, UNVERIFIED) | **EXISTS** | Member Settings / Edit Profile (`editProfilePopup`, `client/components/users/userHeader.jade`): full name, username, initials, email; admin edit in People (`editUser`). `allowUserNameChange`/email change governed by `models/accountSettings.js`. | - | - | - |
| 1.4 | Erasure: delete account | [GDPR] Art. 17(1); [CCPA] § 1798.105(a); [LGPD] Art. 18 (item VI UNVERIFIED); [PIPEDA] Principle 4.5.3; [AUPA] APP 11.2; [PIPL] Art. 47; [APPI] Art. 35; [DPDP] s. 8(7), s. 12 (date UNVERIFIED); CRA Annex I Part I(2)(m) from 2027-12-11 ([CRA], see CRA note) | **PARTIAL** | Self: Edit Profile "Delete" when `allowUserDelete` (`userHeader.jade:243-245`); admin: People ⋯ Delete; REST `DELETE /api/users/:userId`. `Users.after.remove` cleanup plan `models/lib/userDeletionCleanup.js` covers `boards.members/watchers`, `cards.members/assignees/watchers`, `lists.watchers`, avatars. | Not cleaned (grep of the plan): `workloadAbsences` (health data), `workloadCapacities`, `workloadAllocations`, `timeEntries`, `loginAddresses` (per-address user tally keyed by username, `server/lib/loginTally.js`), `shortPasswordLogins`, `impersonatedUsers`, `idleSessions`, `notificationEmailJobs`/outbox (rendered e-mail HTML), `unsaved-edits`, `userPositionHistory`, `savedCardFilters`, `sessiondata`, `orgUser`, `card_comment_reactions`, eventlog actor tallies. Extend `buildUserDeletionCleanupPlan` with one entry per collection from the inventory (WP-3) and a negative test that every inventory entry with `subjectField` has a deletion rule. Also: server-side check of `allowUserDelete` for self-delete, and the last-admin check for self. | Member Settings / Privacy and my data / Delete account (move the button there; keep Edit Profile link) | P1 |
| 1.5 | Erasure alternative: anonymise (keep history, remove identity) | [GDPR] Art. 17(1) and Art. 5(1)(e) (anonymised data leave GDPR scope - recital 26, UNVERIFIED, not re-read); [PIPEDA] Principle 4.5.3 ("made anonymous"); [AUPA] APP 11.2 ("de-identified") | **PARTIAL** | `anonymizeUser` (`server/models/users.js:483`), pure `models/lib/userAnonymization.js` (`buildAnonymizeUpdate`): scrubs username, fullname, initials, avatarUrl, emails, password, `profile.token`, login tokens. Test `tests/userAnonymization.test.cjs`. | Not scrubbed: `loginAddresses` on the user and in the `loginAddresses` collection (old username stays as the tally key), `passkeys`, `sqrl`, `webPushSubscriptions`, `ntfy`, `profile.emailToCard`, `profile.emailBuffer`, `services.*` (OAuth/OIDC/LDAP/SAML identifiers, `twoFactorAuthentication`, `accounts-lockout`), `orgs`/`teams` free text, `@username` mentions and `requestedBy`/`assignedBy` strings in cards and comments (the import anonymiser already rewrites these: `models/lib/importExportSecurity.js` `buildUserAnonymizationMap`), plus the same side collections as 1.4. Extend `buildAnonymizeUpdate` `$unset` and reuse the mention rewriter. | Same as 1.4 | P1 |
| 1.6 | Restriction of processing / objection | [GDPR] Art. 18(1), Art. 21(1); [LGPD] Art. 18(IV),(IX) (UNVERIFIED sub-items, Art. 18 head read); [POPIA] s. 11(3) (UNVERIFIED, s. 11(1) read) | **PARTIAL** | Admin deactivation `loginDisabled` (People "Active Person"), revokes tokens (`server/models/users.js:2795`); per-user notification opt-outs (Member Settings / Notifications); `profile.webhookHideIdentity` (`models/users.js:438`); site switches Disable all activities / notifications / watch (`docs/Features/Admin-Panel/Settings/Activities-and-Notifications.md`). | No person-initiated "request restriction/objection" channel. Smallest: a "Contact the privacy contact" link on the privacy page (WP-1) - the process is organisational. | Member Settings / Privacy and my data | P3 |
| 1.7 | Consent records and withdrawal; terms/privacy acceptance with versioning | [GDPR] Art. 7(1) (demonstrate consent), 7(3) withdrawal (UNVERIFIED, Art. 7(1)-(2) read); [LGPD] Art. 8; [PIPL] Art. 14; [DPDP] s. 6(1) (date UNVERIFIED); [POPIA] s. 11(1)(a). Accepting terms is a contract question, not GDPR consent; for employee boards consent is rarely the legal basis. CCPA has no general consent duty - removed. | **MISSING** | Only `legalNotice` URL (`models/settings.js:477`, Admin Panel / Settings / Appearance `#legalNoticevalue`, `settingBody.jade:602`) rendered on the login page as "By continuing, you accept our legal notice" (`client/components/main/layouts.jade:136-141`). Searched `consent|termsAccepted|acceptTerms|termsOfService|privacyPolicy` - none in app code. | Store `users.legalAcceptances: [{ page, version, at }]`; legal pages (WP-1) carry `version` + `modifiedAt`; optional setting "Require acceptance" shows a blocking accept dialog after login when the stored version is older - same gate pattern as `server/passwordChangeRequired.js`. Withdrawal = the user sees the accepted versions in Member Settings / Privacy and my data and can delete/anonymise. Registration form: an "I accept" checkbox when required. | Login page footer + Member Settings / Privacy and my data; config in Admin Panel / Settings / Privacy | P2 |
| 1.8 | Cookie consent | [EPD] Art. 5(3) (strictly-necessary exemption); DE [TDDDG25] § 25(2) Nr. 2; UK [PECR6] reg. 6 (substituted 2026-02-05) + Sch. A1; [GDPR] Art. 7 for any consent | **EXISTS (not needed) / cleanup** | Only `meteor_login_token` (strictly necessary; `models/lib/loginCookieExpiry.js`). Searched `document.cookie|Cookies.set|analytics|matomo|plausible|gtag(`: only dead Matomo code in `client/lib/utils.js:1037-1090`. | No banner needed. Add a cookie/local-storage section to the privacy page (WP-1). Remove dead Matomo code or gate it behind consent with Matomo `disableCookies`. | Login page footer "Cookies" | P2 |
| 1.9 | Children's data / age | [GDPR] Art. 8(1) (16, Member States may lower to 13); [COPPA] § 312.2 (under 13); [PIPL] Art. 31 (under 14); [DPDP] s. 2(f), s. 9(1) (under 18; date UNVERIFIED); [POPIA] s. 11(1)(a); UK AADC UNVERIFIED (ico.org.uk answered 403) | **MISSING** | Searched `dateOfBirth|birthdate|minimum age|minAge|parental` - none. | WeKan is not directed at children; smallest: optional "minimum age" confirmation checkbox on the registration form (Admin Panel / People / Login setting `registrationMinimumAge`, empty = off). | Admin Panel / People / Login | P3 |
| 1.10 | Portability formats (structured, commonly used, machine-readable) | [GDPR] Art. 20(1); [CCPA] § 1798.100(d) portable format (UNVERIFIED, sub-section not re-read); [DA] Art. 23 + Art. 25 switching/export - only for operators that sell WeKan as a data processing service (SaaS), applies since 2025-09-12 | **EXISTS** | WeKan JSON, CSV/TSV, Excel and ~50 tool formats (`models/lib/exportAllBoards.js` `EXTENSIONS`), Trello/Jira/... import. | Personal-data export (1.1) should be JSON + CSV. | - | - |
| 1.11 | Automated decision-making notice | [GDPR] Art. 22(1), Art. 13(2)(f) (UNVERIFIED letter, Art. 13 head read); [CCPA] ADMT regs 11 CCR § 7200 et seq. (compliance by 2027-01-01) | **EXISTS (N/A)** | No profiling decisions; helpers are rule-based (`docs/Features/General/Assistants/Assistants.md`). Auto-disable of inactive accounts is an admin policy (`server/disableInactiveUsers.js`). | Mention in privacy page template. | - | P3 |

## 2. Records and retention

| # | Requirement | Legal basis (exact provision; key links to official source) | Status | Evidence | What is missing / smallest addition | Menu | Prio |
|---|---|---|---|---|---|---|---|
| 2.1 | Data inventory: which collection/field holds which category of personal data, purpose, legal basis, recipients | [GDPR] Art. 30(1) (exemption Art. 30(5) below 250 staff unless processing is not occasional or includes Art. 9 data - WeKan absences are health data); [LGPD] Art. 37; [PIPL] Art. 51 (classification and measures) - Art. 54 is compliance audits, corrected; [POPIA] s. 14, s. 17 (s. 17 UNVERIFIED); [DPDP] s. 8 (date UNVERIFIED); 27701 7.2.8 and ISO A.5.9/A.5.34 UNVERIFIED ([ISO27701], [ISO27001]) | **PARTIAL** | Done in [bfd83d09b6](https://github.com/wekan/wekan/commit/bfd83d09b6) (WP-3): `models/lib/personalDataInventory.js` classifies all 185 collections (categories, subject field, purpose, legal-basis hint, retention and where it is enforced, erasure and which file does it); 128 hold personal data, health (Art. 9) in `workloadAbsences`, financial in the billing collections, `timeEntries`, `shopOrders`, `cloudDomains`, `cloudInvoices`. `tests/personalDataInventory.test.cjs` scans `models/`, `server/`, `packages/` (skipping `_build*`) and fails on an unclassified or vanished collection and on a new erasure gap. Generated view: [Data-Inventory.md](Data-Inventory.md) (`releases/compliance/data-inventory.mjs`). | Recipients per instance (see 2.2). The UI part is WP-6: Admin Panel / Settings / **Privacy** / Data inventory (read-only table from the module + "Download ROPA"). | Admin Panel / Settings / **Privacy** / Data inventory (read-only table + "Download ROPA" CSV/Markdown) | P1 |
| 2.2 | Records of processing (ROPA) export the controller can complete | [GDPR] Art. 30(1)(a)-(g); [LGPD] Art. 37. PIPL Art. 54 removed (it requires compliance audits, not a ROPA); PIPL Art. 55-56 impact assessment is the nearest record | **PARTIAL** | [Data-Inventory.md](Data-Inventory.md) (from 2.1, [bfd83d09b6](https://github.com/wekan/wekan/commit/bfd83d09b6)) is the static part of a ROPA the controller can complete: purpose, categories, legal-basis hint, retention, erasure per collection. | WP-6, Admin Panel / Settings / Privacy: render the inventory + the instance's actual retention settings + enabled third-party services (HIBP if `PASSWORD_CHECK_PWNED`, `DEFAULT_AVATAR_URL`, mail provider, S3/Azure/GCS, webhooks, ActivityPub) as a ROPA draft. | Admin Panel / Settings / Privacy | P2 |
| 2.3 | Attachment retention | [GDPR] Art. 5(1)(e); [HIPAA] § 164.310(d)(2)(i) disposal (UNVERIFIED, § 164.310 not read) | **EXISTS** | `models/lib/attachmentRetention.js`, `server/attachmentRetention.js`, Admin Panel / Attachments / Retention (`adminUrls.js` `retention`), soft-delete then purge. TODO.md notes a per-run limit mismatch. | - | - | - |
| 2.4 | Security / speed / test event log retention | [GDPR] Art. 5(1)(e); [NIS2] Art. 21(2)(b); ISO A.8.15 and SOC2 UNVERIFIED ([ISO27001], [SOC2]) | **EXISTS** | `EVENTLOG_RETENTION_DAYS` default 90 (`models/eventLog.js:116-148`). | Show it in the retention overview (2.10). | - | - |
| 2.5 | Admin audit log retention configurable (HIPAA keeps required Security Rule documentation 6 years, § 164.316(b)(2)(i); a 1+ year log period for SOC2/ISO is common practice, not a cited rule) | [HIPAA] § 164.316(b)(1)(ii), (b)(2)(i) - 6 years for policies and for records of actions/activities/assessments the Security Rule requires (e.g. the activity reviews of § 164.308(a)(1)(ii)(D)); the rule does not literally require keeping raw audit-log rows 6 years. ISO A.8.15, SOC2 UNVERIFIED | **PARTIAL** | Fixed `AUDIT_KEEP_DAYS = 365` (`models/lib/adminAudit.js:26`), pruned daily (`server/adminAudit.js:113-126`). | Read `ADMIN_AUDIT_RETENTION_DAYS` (0 = keep forever, default 365) through `authEnv`/Admin Panel override like other Login settings; also apply to `impersonatedUsers`. | Admin Panel / People / Audit log (show "kept N days") | P2 |
| 2.6 | Login / IP data retention | [GDPR] Art. 5(1)(c),(e); [POPIA] s. 14(1); [PIPEDA] Principle 4.5.3; [AUPA] APP 11.2; [PIPL] Art. 19 (UNVERIFIED, not read) | **EXISTS** | `LOGIN_ADDRESS_RETENTION_DAYS` (default 365, 0 = keep): a daily claimed job (`server/lib/loginAddressRetention.js`, decisions in `models/lib/loginAddressRetention.js`, `tests/loginAddressRetention.test.cjs`) removes account address entries, `loginAddresses` rows and their per-account entries, and `shortPasswordLogins` rows last used before the cutoff. | Done. Still open: show the period in the retention overview (2.10). | Admin Panel / People / Login (setting) + Privacy retention overview | P1 |
| 2.7 | Activities / change history retention | [GDPR] Art. 5(1)(e) | **MISSING (by design kept)** | No age-based removal of `activities` or `changeHistory` (grep `Activities.removeAsync` only finds per-object deletes). Change history is append-only and hash-chained (`server/lib/historyChainAppend.js`) - deleting rows would break the chain. | `ACTIVITIES_RETENTION_DAYS` (default off) removing old `activities` only; for change history document "kept for the board's lifetime, removed with the board" and pseudonymise actor on user erasure (keep `userId`, drop names). Do not delete chained rows. | Admin Panel / Settings / Activities and notifications | P2 |
| 2.8 | Time tracking / absence data retention and minimisation (employee data, health) | [GDPR] Art. 9(1),(2)(b), Art. 88; [LGPD] Art. 11; [POPIA] s. 26; [APPI] Art. 2(3) (medical history) | **PARTIAL** | `WorkloadAbsences` type `sick` visible only to self and admins (`models/workload.js:31-41`, `server/workload.js`). No retention. `timeEntries` none. | `WORKLOAD_ABSENCE_RETENTION_DAYS` (default off); admin switch "do not record absence type" (store only "unavailable"). Classify `health` in inventory. | Admin Panel / Settings / Features (Workload) | P2 |
| 2.9 | Notification / e-mail outbox retention | [GDPR] Art. 5(1)(e) | **EXISTS** | Tray: `NOTIFICATION_TRAY_AFTER_READ_DAYS_BEFORE_REMOVE` (`models/lib/notificationCleanup.js`); receipts `EMAIL_RECEIPT_METADATA_DAYS` (`server/lib/emailReceiptRetention.js`); received e-mail TTL 30 d (`server/emailToCard.js:74`); many `*Retention.js` under `server/lib/`. | Include in overview. | - | - |
| 2.10 | One place that shows every retention period in force | [GDPR] Art. 13(2)(a), Art. 30(1)(f); 27701, SOC2 C1.2 UNVERIFIED | **MISSING** | Retention is spread over env vars and panes. | Read-only "Retention" table in the Privacy pane, built from inventory `retention.env` + current values; doubles as input for the privacy page. | Admin Panel / Settings / Privacy / Retention | P2 |
| 2.11 | Inactive accounts | [GDPR] Art. 5(1)(e); [HIPAA] § 164.308(a)(3)(ii)(C) termination procedures; ISO A.5.18 / SOC2 CC6.2 UNVERIFIED | **EXISTS** | `USERS_DISABLE_INACTIVE_AFTER_DAYS` (`server/disableInactiveUsers.js`, `models/lib/inactiveUsers.js`). | Optional "delete/anonymise after N more days" step (P3). | - | P3 |
| 2.12 | Data residency / international transfers information | [GDPR] Art. 44-49, Art. 13(1)(f) (UNVERIFIED letter); [PIPL] Art. 38; [DPDP] s. 16 (date UNVERIFIED); [LGPD] Art. 33; [AUPA] APP 8 | **PARTIAL** | Self-hosted; optional third parties are off by default: HIBP k-anonymity (`models/lib/passwordPolicy.js`), `DEFAULT_AVATAR_URL` (`models/lib/defaultAvatarUrl.js`), cloud storage, webhooks, mail. No document lists them. | `docs/Security/Privacy/Third-Party-Transfers.md` + the ROPA export (2.2) listing which are enabled on this instance. | Admin Panel / Settings / Privacy | P2 |

## 3. Security controls

| # | Requirement | Legal basis (exact provision; key links to official source) | Status | Evidence | What is missing / smallest addition | Menu | Prio |
|---|---|---|---|---|---|---|---|
| 3.1 | MFA / 2FA, enforceable | [NIS2] Art. 21(2)(j); DE [BSIG] § 30(2) Nr. 10; [CRA] Annex I Part I(2)(d) (from 2027-12-11); [HIPAA] § 164.312(d) (authentication, MFA not prescribed; MFA only in the 2025 NPRM, not law); ISO A.8.5 / SOC2 CC6.1 UNVERIFIED | **EXISTS** | Member Settings / Two-factor (`js-two-factor-auth`), passkeys, SQRL; `REQUIRE_2FA` off/admins/all (`models/lib/twoFactorRequirement.js`, `server/requireTwoFactor.js`), Admin Panel / People / Login. | - | - | - |
| 3.2 | Password policy | [HIPAA] § 164.308(a)(5)(ii)(D) password management (UNVERIFIED, sub-item not read); [NIST63B] (guidance, 15 chars single-factor); ISO A.5.17 / SOC2 UNVERIFIED | **EXISTS** | `PASSWORD_MIN_LENGTH` (default 8), `PASSWORD_MIN_LENGTH_ENFORCE`, `PASSWORD_CHECK_PWNED` (`models/lib/passwordPolicy.js`), Problems / Password length. Matches NIST 800-63B (no forced complexity). | Default minimum 8 is below NIST 800-63B rev.4 recommendation (15 for single-factor); document recommended values in the compliance guide (WP-9). | - | P3 |
| 3.3 | Account lockout / brute force | [GDPR] Art. 32(1)(b); [CRA] Annex I Part I(2)(d); [HIPAA] § 164.308(a)(5)(ii)(C) log-in monitoring (UNVERIFIED, not read); ISO A.8.5 / SOC2 UNVERIFIED | **PARTIAL** | `packages/wekan-accounts-lockout`, `models/lib/accountLockout.js`, Admin Panel / People / Locked users; Problems / Security report brute-force rows. | TODO.md: "the per-address login delay is never applied" - fix that bug. | - | P2 |
| 3.4 | Automatic logoff / session timeout | [HIPAA] § 164.312(a)(2)(iii) (Addressable: "terminate an electronic session after a predetermined time of inactivity"); ISO A.8.5 UNVERIFIED; PCI DSS not checked | **EXISTS** | `LOGOUT_IDLE_MINUTES` (`models/lib/idleLogout.js`, `server/idleLogout.js`), `LOGOUT_WITH_TIMER`/`LOGOUT_IN` (`models/lib/logoutTimer.js`), login expiry cookie fix (`models/lib/loginCookieExpiry.js`); Admin Panel / People / Login. | - | - | - |
| 3.5 | Session management: log out everywhere; see active sessions | [GDPR] Art. 32(1)(b); [CRA] Annex I Part I(2)(d); ISO A.8.5 / SOC2 UNVERIFIED | **PARTIAL** | Member Settings / Log out everywhere (`logoutEverywhere`, `server/models/users.js:991`); admin deactivation clears tokens. Per-token last activity exists in `idleSessions` (`server/idleLogout.js`). | No list of the person's own sessions (device/IP/last active) with "end this session". Small: read `services.resume.loginTokens` + `idleSessions` + `loginAddresses`. Admin: "Log out this user" in People ⋯. | Member Settings / Privacy and my data / Sessions; Admin Panel / People / ⋯ | P3 |
| 3.6 | Own login history (IP, place, time) | [GDPR] Art. 15(1),(3); [CRA] Annex I Part I(2)(d) "report on possible unauthorised access"; ISO/SOC2 UNVERIFIED | **PARTIAL** | Admin only: People "Location" column -> login addresses per user (`docs/Features/Admin-Panel/People/People.md`), Problems / Offices. User cannot see their own (grep `loginTally|loginAddresses` in `client/` only hits `client/components/settings/adminProblems.js`). | Show the user's own `loginAddresses` (first/last seen, count, location) in the sessions view (3.5) - also part of 1.1 export. | Member Settings / Privacy and my data | P2 |
| 3.7 | RBAC / least privilege | [NIS2] Art. 21(2)(i); [HIPAA] § 164.308(a)(4), § 164.312(a)(1); [GDPR] Art. 25(2), Art. 32(1)(b); ISO A.5.15/A.8.2 / SOC2 CC6.3 UNVERIFIED | **EXISTS** | Board roles + custom roles (`models/customBoardRoles.js`, `models/lib/boardRoleCapabilities.js`), tenant admins (`models/lib/tenantAdmin.js`), admin-only custom fields, private-boards-only, `docs/Features/Admin-Panel/Who-Sees-What.md`. | - | - | - |
| 3.8 | Access review: what each person can reach, exportable | [HIPAA] § 164.308(a)(3)(ii)(B) workforce clearance, § 164.308(a)(4); [NIS2] Art. 21(2)(i); ISO A.5.18 / SOC2 CC6.2-6.3 UNVERIFIED | **PARTIAL** | Problems / Boards Report lists every board with visibility and members (`docs/Features/Admin-Panel/Problems/Boards-Report.md`); `/api/user` lists a user's boards. No per-person view, no export (`client/components/settings/tablePage.*` has no CSV export; grep `csv|export` only finds attachment download). | (a) "Boards and roles" in People ⋯ for one user; (b) CSV export button on the shared table page (People, Boards Report, Audit log, Security report). | Admin Panel / People / People ⋯ ; table pages | P2 |
| 3.9 | Unique user identification | [HIPAA] § 164.312(a)(2)(i) (Required); ISO A.5.16 UNVERIFIED | **EXISTS** | Unique `username`/`emails` (`models/users.js`), `_id`. | - | - | - |
| 3.10 | Emergency access ("break glass") procedure | [HIPAA] § 164.312(a)(2)(ii) emergency access procedure (Required) - about obtaining ePHI in an emergency; § 164.308(a)(7)(ii)(C) emergency mode operation plan | **PARTIAL** | Admin impersonation with a recorded reason (`models/impersonatedUsers.js` `reason`, Problems / Impersonation Report). Searched `break.glass|emergency access` - none; no documented admin-recovery procedure (only `docs/Features/Login-Page/Forgot-Password.md`). | Document the procedure (sealed admin account, `REQUIRE_2FA`, impersonation report as evidence) in the compliance guide; optional: an "emergency" reason category in impersonation that notifies all admins. | docs + Admin Panel / Problems / Impersonation | P3 |
| 3.11 | Encryption in transit | [NIS2] Art. 21(2)(h); [HIPAA] § 164.312(e)(1), (e)(2)(ii) (Addressable); [GDPR] Art. 32(1)(a); [CRA] Annex I Part I(2)(e); ISO A.8.24 / SOC2 CC6.7 UNVERIFIED | **EXISTS** | Built-in HTTPS (`models/lib/httpsConfig.js`, `server/httpsServer.js`), HSTS (`models/lib/securityHeaders.js`), verified SMTP TLS (`server/lib/mailTransport.js`), proxy docs. | - | - | - |
| 3.12 | Encryption at rest | [GDPR] Art. 32(1)(a); [HIPAA] § 164.312(a)(2)(iv) (Addressable); [NIS2] Art. 21(2)(h); [CRA] Annex I Part I(2)(e) "encrypting relevant data at rest" (from 2027-12-11); ISO A.8.24 UNVERIFIED | **PARTIAL** | S3 SSE for attachments/avatars/backups (`models/lib/s3Encryption.js`), continuous backup encryption (`server/lib/continuousBackup/encryption.js`). Full backups (`server/lib/fullBackup.js`, 0 hits for `encrypt`), filesystem/GridFS attachments and the database itself are not encrypted by WeKan. | Smallest: document "use an encrypted volume / database encryption" + optional passphrase encryption of full backups reusing `continuousBackup/encryption.js`. App-level file encryption is P3. | Admin Panel / Attachments / Backup | P2 (docs) / P3 (feature) |
| 3.13 | Backup and restore, tested | [NIS2] Art. 21(2)(c); [GDPR] Art. 32(1)(c); [HIPAA] § 164.308(a)(7)(ii)(A),(B) (Required); ISO A.8.13 / SOC2 A1.2 UNVERIFIED | **EXISTS** | Admin Panel / Attachments / Backup, Continuous backup, `restoreBackup`, `backupRuns` status, `tests/integration/continuousBackup.test.cjs`. | Optional "restore test" result shown (P3). | - | - |
| 3.14 | Integrity | [HIPAA] § 164.312(c)(1), (c)(2) (Addressable); [GDPR] Art. 32(1)(b); [CRA] Annex I Part I(2)(f); ISO / SOC2 PI1 UNVERIFIED | **EXISTS** | File integrity scan (`models/lib/fileIntegrity.js`, Problems / Filesystem integrity), hash-chained change history with scan (`server/lib/historyIntegrityScan.js`, `models/lib/changeHistoryIntegrity.js`), data health. | - | - | - |
| 3.15 | Data minimisation switches | [GDPR] Art. 5(1)(c), Art. 25(2); [CRA] Annex I Part I(2)(g); [LGPD] Art. 6(III) (UNVERIFIED, not read); 27701 UNVERIFIED | **EXISTS** | Anonymise import/export users, disable import/export avatars, disable all activities/notifications/watch, private boards only, hide identity in webhooks. | Add "do not record login addresses" switch next to 2.6 (P3). | - | P3 |
| 3.16 | Secure configuration baseline / hardening guidance | [CRA] Annex I Part I(2)(b) secure by default (from 2027-12-11), Annex II point 8(a); [NIS2] Art. 21(2)(e),(g); [HIPAA] § 164.306 (flexibility of approach); ISO A.8.9 UNVERIFIED | **PARTIAL** | Many secure defaults; `docs/Security/Security-Settings.md`. No per-framework checklist. Searched `HIPAA` (1 hit, `docs/Features/Login-Page/Multitenancy.md`), `NIS2`, `27001` - none. | `docs/Security/Compliance/README.md` (+ GDPR, HIPAA, NIS2/ISO pages) mapping each control to its setting; optionally a read-only "Compliance checklist" in Admin Panel showing which recommended settings are on (2FA required, idle logout set, HTTPS, retention set, audit retention ≥ 6 y for HIPAA...). | Admin Panel / Problems / **Compliance** (read-only checklist) | P2 |

## 4. Logging and monitoring

| # | Requirement | Legal basis (exact provision; key links to official source) | Status | Evidence | What is missing / smallest addition | Menu | Prio |
|---|---|---|---|---|---|---|---|
| 4.1 | Audit log of administrative actions | [HIPAA] § 164.312(b), § 164.308(a)(1)(ii)(D); [CRA] Annex I Part I(2)(l) (from 2027-12-11); [NIS2] Art. 21(2)(b); ISO A.8.15 / SOC2 CC7.2, CC8.1 UNVERIFIED | **EXISTS** | `server/adminAudit.js` wraps `AUDITED_METHODS` (`models/lib/adminAudit.js`), secrets redacted, failures recorded; Admin Panel / People / Audit log. | Done (commit 377a7b3abc and the follow-up): the admin-only collections written from the browser (settings, announcements, translation, accessibilitySettings, lockoutSettings, inviteToBoardRolesSettings, attachmentStorageSettings, accountSettings, tableVisibilityModeSettings) through their /insert, /update and /remove methods, and `anonymizeUser`, are in `AUDITED_COLLECTIONS`/`AUDITED_METHODS`. Still open: the DSAR export (WP-5) when it exists; custom board roles are board admins' writes, not site settings. | Admin Panel / People / Audit log | P1 |
| 4.2 | Audit of access to / export of data (who exported which board, downloaded attachments in bulk, impersonated) | [HIPAA] § 164.312(b); [GDPR] Art. 32(1)(b), Art. 5(2) accountability (UNVERIFIED, not re-read); [CRA] Annex I Part I(2)(l) "access to or modification of data"; ISO A.8.15 / SOC2 CC7.2 / 27701 UNVERIFIED | **PARTIAL** | Impersonation recorded with reason; refused exports logged (`authz.export-disabled`). Successful exports not recorded (searched `export` in `server/adminAudit.js` / `models/lib/adminAudit.js`). | A "data access" stream: one row per export (who, board/format, IP) written from `refuseDisabledExport`'s success path and `server/routes/exportAllBoards.js`; fold per user/day to avoid growth (CLAUDE.md summary rule). Board-view logging is P3 (high volume). | Admin Panel / People / Audit log (tab "Data access") | P2 |
| 4.3 | Audit log export / SIEM forwarding | [NIS2] Art. 21(2)(b), Art. 23(4) (24 h / 72 h reports need evidence); [HIPAA] § 164.308(a)(1)(ii)(D); ISO A.8.15-A.8.16 / SOC2 CC7 UNVERIFIED | **PARTIAL** | Login & registration webhook (`server/accountWebhook.js`, `docs/Features/Admin-Panel/Settings/Login-and-Registration-Webhook.md`). Security event fold writes only to DB (`server/lib/eventLogFold.js`, console only on `DEBUG`). No CSV/JSON download of audit log (`adminAuditLog.jade` has search + pager only). | (a) "Download CSV/JSON" on the Audit log and Security report; (b) env `AUDIT_LOG_STDOUT=json`: one JSON line per audit row and per security fold to stdout, so Docker/journald/Fluent Bit ship it to a SIEM - no new dependency. | Admin Panel / People / Audit log; Problems / Security report | P2 |
| 4.4 | Log integrity (tamper evidence) | [HIPAA] § 164.312(c)(1); [CRA] Annex I Part I(2)(f) "report on corruptions"; ISO A.8.15 / SOC2 UNVERIFIED | **PARTIAL** | Change history is hash-chained; `adminAuditLog` is a plain collection. | Chain audit rows with `models/lib/changeHistoryIntegrity.js` (`hashHistoryRow`, `previousHash`) and verify in Problems / Integrity. | Admin Panel / Problems / Integrity | P3 |
| 4.5 | Security monitoring / detection | [NIS2] Art. 21(2)(b); [CRA] Annex I Part I(2)(l); ISO A.8.16 / SOC2 CC7.2 UNVERIFIED | **EXISTS** | Problems / Security report with catalog `models/lib/securityCategories.js`, folded rows, account blocking; CPU/RAM/disk monitors; canary tokens (`models/lib/canaryTokens.js`). | - | - | - |
| 4.6 | Clock synchronisation / timestamps in UTC | ISO A.8.17 UNVERIFIED (no statutory clock rule was found in the texts read) | **EXISTS (platform)** | Dates stored as BSON Date (UTC); NTP is the host's job. | Mention in compliance guide. | - | P3 |

## 5. Incident and vulnerability handling

| # | Requirement | Legal basis (exact provision; key links to official source) | Status | Evidence | What is missing / smallest addition | Menu | Prio |
|---|---|---|---|---|---|---|---|
| 5.1 | Coordinated vulnerability disclosure policy | [CRA] Art. 13(8) last subpara. + Annex I Part II(5),(6) (manufacturer duty from 2027-12-11, if WeKan is a manufacturer - see CRA note); [CRA] Art. 24(1) is the steward equivalent; [NIS2] Art. 12(1) only sets up national CSIRT coordinators (useful route, not a duty on WeKan); ISO A.5.7/A.8.8 UNVERIFIED | **EXISTS** | `SECURITY.md` (GHSA process, CVE policy), Hall of Fame, `docs/Security/Security-Disclosure.md`. | - | - | - |
| 5.2 | Support period / which versions get security updates | [CRA] Art. 13(8) (support period at least five years unless shorter use expected), Art. 13(9) (updates kept available 10 years), Art. 13(19) (end month/year stated), Annex II point 7 - from 2027-12-11, for a manufacturer | **MISSING** | `SECURITY.md` "About WeKan Versions" (line 77) describes Standalone vs Sandstorm; grep `supported versions|only the newest|latest version` - none. | One section in `SECURITY.md`: "Security fixes are released for the newest release only; upgrade to stay supported", plus the CRA support period statement. | docs | P2 |
| 5.3 | SBOM | [CRA] Annex I Part II(1) - SBOM must be **drawn up** (top-level dependencies, machine-readable) and kept in the technical documentation; giving it to users is optional (Annex II point 9: "If the manufacturer decides"). Applies 2027-12-11. [EO14028] binds US federal procurement only. NIS2 Art. 21(2)(d) supply chain is the operator's duty. | **MISSING** | Docker SBOM deliberately off, pinned by `tests/dockerProvenance.test.cjs` "SBOM stays off, deliberately" (attestation size); maintainer-side `docs/Security/gh/pull-security-reports.sh` pulls GitHub's `sbom.json` locally. | Publish a CycloneDX SBOM as a **release asset** (not an image attestation, so the size concern does not apply): `npm sbom --sbom-format cyclonedx` (npm ≥ 10, already the pinned toolchain) in `release-all.yml` for the app + `.meteor/versions` packages; link it from Admin Panel / Settings / Version. Keep the Docker test as is. | Admin Panel / Settings / Version (link) | P2 |
| 5.4 | Security update notification to operators | [CRA] Annex I Part II(8) (disseminate security updates with advisory messages), Art. 14(8) inform impacted users (applies since 2026-09-11 for a manufacturer); [NIS2] Art. 21(2)(e) | **PARTIAL** | Admin Panel / Settings / Version "Check for a newer version" (`checkNewestVersions`, `server/statistics.js:14`, `models/lib/versionCheck.js`). | Mark releases that contain security fixes (CHANGELOG has `CRITICAL SECURITY ISSUE` headers) and show "security update available" in Problems / Summary. | Admin Panel / Problems / Summary | P3 |
| 5.5 | `/.well-known/security.txt` (RFC 9116) for the operator's contact | No law requires security.txt: [RFC9116] is a standard. Legal hook: [CRA] Art. 13(17) single point of contact, Annex I Part II(6), Annex II point 2 (manufacturer, from 2027-12-11). ISO A.5.5 UNVERIFIED | **MISSING** | `.well-known` routes: only `assetlinks.json` (`server/routes/customHeadAssets.js:92`) and `webfinger` (`server/activityPub.js:85`). | Serve `security.txt` from a "Security contact" field in the Privacy pane (contact, expires, policy URL defaulting to WeKan's SECURITY.md), same handler pattern as `serveAssetLinks`. | Admin Panel / Settings / Privacy | P2 |
| 5.6 | Breach support: find who/what was affected and export it | [GDPR] Art. 33(1) (72 h), Art. 34; [HIPAA] §§ 164.400-414; [CCPA] § 1798.82 (breach statute is outside the CCPA title - UNVERIFIED, not read); [LGPD] Art. 48; [PIPEDA] s. 10.1(1); [AUPA] Part IIIC s. 26WE, 26WK; [POPIA] s. 22(1); [PIPL] Art. 57; [APPI] Art. 26; [NIS2] Art. 23(4); [CRA] Art. 14(3)-(4) severe incidents (since 2026-09-11, manufacturer) | **PARTIAL** | Security report (who, from where, counts), login addresses per user, Boards report (members per board), audit log. Nothing exportable (see 3.8/4.3). | The CSV exports of 3.8b/4.3a cover it: People (with e-mail), Boards report (members), Security report rows, Audit log - filtered by date. A breach *register* is organisational - optional template in docs. | Admin Panel table pages | P2 |
| 5.7 | Incident notification channel to admins | [NIS2] Art. 23(4); DE [BSIG] § 32(1); [CRA] Art. 14 (since 2026-09-11); SOC2 CC7.3 UNVERIFIED | **EXISTS** | Admin notify defaults (`setAdminNotifyDefault` in `AUDITED_METHODS`), Problems / Summary, login webhook. | - | - | - |

## 6. Accessibility

| # | Requirement | Legal basis (exact provision; key links to official source) | Status | Evidence | What is missing / smallest addition | Menu | Prio |
|---|---|---|---|---|---|---|---|
| 6.1 | Accessibility statement page | [WAD] Art. 7(1) accessibility statement - **public sector bodies only** (websites since 2019/2020, apps since 2021-06-23). Not EAA: EAA Annex V is the service-provider information in the terms and conditions ([EAA] Art. 13(2)), and a kanban tool is not an EAA service ([EAA] Art. 2(2)) - corrected. | **EXISTS** | `/accessibility` route (`config/router.js:355`), `models/accessibilitySettings.js` (enabled/title/body), Admin Panel / Settings / Accessibility (`settingBody.jade:734`). | Statement template text with the required parts (compliance status, non-accessible content, feedback contact, enforcement procedure, date) as the default body; link it from the login footer (WP-1). | Admin Panel / Settings / Accessibility | P2 |
| 6.2 | Skip link, focus visible, keyboard, screen reader basics | [WAD] Art. 4 via [EN301549] V3.2.1 (WCAG 2.1 AA) for public bodies; [EAA] Art. 4(3), Annex I only for in-scope consumer services (since 2025-06-28; microenterprises exempt, Art. 4(5)) (WAD Art. 4 UNVERIFIED, not re-read) | **EXISTS** | Skip link (`client/components/main/layouts.jade`, `layouts.css`), `tests/playwright/specs/19-accessibility.e2e.js`, `45-axe-accessibility.e2e.js`, `46-axe-theme-contrast.e2e.js`, keyboard move/copy (`move-copy-keyboard-shortcut-6904.e2e.js`), `prefers-reduced-motion` in several CSS files, `docs/Features/General/Accessibility/Audit.md`. | - | - | - |
| 6.3 | WCAG 2.2-only criteria (2.4.11 Focus Not Obscured, 2.5.7 Dragging Movements, 2.5.8 Target Size 24px, 3.2.6 Consistent Help, 3.3.7 Redundant Entry, 3.3.8 Accessible Authentication) | [WCAG22] (W3C Recommendation 12 Dec 2024) - voluntary today: the harmonised [EN301549] V3.2.1 references WCAG 2.1; an EN revision referencing 2.2 is UNVERIFIED | **PARTIAL** | Axe tags `['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']` (`tests/playwright/specs/45-axe-accessibility.e2e.js:19`) - no `wcag22aa`; docs say "WCAG 2.1 AA". `TODO.md:37-40` lists the work. Passkeys and paste-friendly password fields help 3.3.8; card move has a non-drag menu (2.5.7) but list/swimlane reorder needs checking. | Add `wcag22aa` to TAGS, fix findings, add a target-size test and a non-drag reorder path for lists/swimlanes; update the docs' target to 2.2. | - (tests + CSS) | P2 |

## 7. Legal pages and transparency

| # | Requirement | Legal basis (exact provision; key links to official source) | Status | Evidence | What is missing / smallest addition | Menu | Prio |
|---|---|---|---|---|---|---|---|
| 7.1 | Privacy notice shown at collection time (registration, login) | [GDPR] Art. 13(1)-(2); [CCPA] § 1798.100(a); [LGPD] Art. 9; [PIPEDA] Principles 4.2 (UNVERIFIED), 4.8; [AUPA] APP 1, APP 5.1; [PIPL] Art. 17; [DPDP] s. 5 (date UNVERIFIED); [APPI] Art. 21; [POPIA] s. 18(1) | **MISSING** | Only external `legalNotice` URL (see 1.7). Searched `privacy policy|privacyPolicy|privacy-policy` - no app hits (only a GitHub workflow and translation audit doc); no `privacy` i18n key. | Built-in pages like `/accessibility` and `/support`: `/privacy` rendered from a new `LegalPages` collection (or fields on `AccessibilitySettings`' pattern) with `title`, `body` (markdown), `version`, `modifiedAt`, `enabled`; or an external URL per page for orgs that host it elsewhere (keep `legalNotice` as the "imprint/legal notice" URL for backward compatibility). Default body generated from the inventory + retention (2.1/2.10) so it is accurate out of the box. | Login page footer; Member menu "Privacy"; Admin Panel / Settings / Privacy | P1 |
| 7.2 | Terms of use page | No statutory duty found for a generic terms page; contract/consumer law of the operator. EU consumer contracts: [ECD] Art. 10-11 (UNVERIFIED, not read). CCPA/DPDP references removed (they require privacy notices, not terms). | **PARTIAL** | Same `legalNotice` link. | `/terms` page in the same mechanism. | Login footer | P2 |
| 7.3 | Imprint / legal notice | DE [DDG5] § 5(1) DDG (replaced § 5 TMG on 2024-05-14); AT [ECG5] § 5(1) ECG + [MedienG] § 24 (Impressum), § 25 (Offenlegung on a website); EU baseline [ECD] Art. 5(1); UK [UKECR6] reg. 6(1); FR/CH/NL/LU/FI equivalents UNVERIFIED | **PARTIAL** | `legalNotice` (`models/settings.js:477`), per-org `orgLegalNotice` (`models/org.js:169`, tenant override `models/lib/tenants.js`). Shown on login page only, as an external URL behind the sentence "By continuing, you accept our legal notice" (`client/components/main/layouts.jade:136-141`). § 5 DDG requires the data to be "leicht erkennbar und unmittelbar erreichbar" and "ständig verfügbar" (§ 5 ECG: "ständig ... leicht und unmittelbar zugänglich"), so a login-page-only link does not reach logged-in users and an unset URL leaves nothing. The duty is the **operator's** (a commercially offered instance), not WeKan's; WeKan only has to make it possible. | An **Imprint** page in the WeKan legal-pages mechanism (WP-6): `/imprint` with structured fields - name / company and legal form, representative, postal address, e-mail and a fast contact channel, register and register number, VAT ID, supervisory authority, professional rules (all optional, rendered only when filled), plus AT MedienG § 25 Offenlegung text and a free-text body; or keep `legalNotice` as an external URL override (backward compatible) and per-org `orgLegalNotice`. Link it from every page: login page footer, the logged-in Member menu, and the footer of `/privacy`, `/terms`, `/cookies`, `/accessibility`. Problems / Compliance (WP-12) warns "Imprint not set" (information, not error: an internal instance may not need one). Do **not** keep "you accept our legal notice": an imprint is information, not a contract. | Login page footer "Imprint"; Member menu / Privacy and my data / Imprint; editor in Admin Panel / Settings / **Privacy** / Legal pages / Imprint | P1 for commercially offered instances in DE/AT (P2 overall) |
| 7.4 | Cookie / local storage information | [EPD] Art. 5(3) ("clear and comprehensive information"); DE [TDDDG25] § 25; UK [PECR6] reg. 6; [GDPR] Art. 13 | **MISSING** | see 1.8 | Section of the privacy page (or `/cookies`): `meteor_login_token` (HttpOnly, purpose, lifetime = `loginExpirationInDays`), localStorage keys. | Login footer | P2 |
| 7.5 | DPO / privacy contact, representative | [GDPR] Art. 13(1)(b), Art. 27(1), Art. 37(1); [LGPD] Art. 41; [PIPL] Art. 52, Art. 53 (UNVERIFIED, Art. 53 not read); [PIPEDA] Principle 4.1; [POPIA] s. 55; [DPDP] s. 8(9)-(10) (UNVERIFIED sub-sections and date) | **MISSING** | Searched `DPO|data protection officer` - no app hits (only substrings like "enDPOint"). Support page (`/support`, `supportTitle`/`supportPageText`) is generic. | Fields "Privacy contact / DPO", "EU/UK representative" in the Privacy pane, shown on `/privacy`. | Admin Panel / Settings / Privacy | P1 |
| 7.6 | DPA / BAA templates and operator guidance | [GDPR] Art. 28(3); [HIPAA] § 164.504(e), § 164.314(a) (§ 164.314 UNVERIFIED, not read) | **MISSING** | Searched `data processing agreement|DPA|BAA` - none. | Docs only: `docs/Security/Compliance/` with a hosting-provider DPA checklist and HIPAA BAA notes (WeKan is software; the hoster signs). | docs | P3 |
| 7.7 | "Do not sell or share" link | [CCPA] § 1798.120 (UNVERIFIED, not re-read), § 1798.135(a)(1); only for a "business" (§ 1798.140(d)) | **EXISTS (N/A)** | WeKan does not sell or share personal data for cross-context advertising (no ad/analytics code; Matomo dead). | Sentence in the privacy page template. | - | P3 |

---

## Implementation plan (work packages, smallest-first within priority)

Placement rule: a new Admin Panel pane is added in `models/lib/adminUrls.js`
(`ADMIN_PAGES.setting.panes` + `PANE_TITLES`), the menu entry in
`client/components/settings/settingBody.js` (the list near line 245 where
`accessibility-setting` is), the pane template in `settingBody.jade`, and is
pinned by `tests/adminUrls.test.cjs`. **Pane id collision**: the existing
Security pane's id is already `privacy-security-setting`
(`adminUrls.js:61`), so the new pane must be slug `privacy`, id
`privacy-setting`. New strings go into `imports/i18n/data/en.i18n.json` first
and are filled for every language per CLAUDE.md. Each feature page gets a
`docs/Features/...` page in the house shape. Each pane with a refusal path
records attempts via `server/lib/securityLog.js` only when no legitimate user
can reach it.

### P1

**WP-1 Audit-log completeness** (smallest P1). (Legal basis: [HIPAA] § 164.312(b), § 164.308(a)(1)(ii)(D); [GDPR] Art. 5(2), 32(1); [CRA] Annex I Part I(2)(l) from 2027-12-11.)
- Add `anonymizeUser` (and later `exportUserPersonalData`) to `AUDITED_METHODS`
  in `models/lib/adminAudit.js`.
- Server hooks `after.update`/`after.insert` on `Settings`,
  `AccessibilitySettings`, `AccountSettings`, `LockoutSettings`,
  `TableVisibilityModeSettings`, `InviteToBoardRolesSettings`,
  `CustomBoardRoles` in `server/adminAudit.js` recording
  `{ method: 'settings.update:<collection>', args: auditArgs(changed fields) }`
  for admin `userId`.
- Fix: `removeUser`/`anonymizeUser` self path check `allowUserDelete` and the
  last-admin rule (`server/models/users.js`, `models/lib/userAnonymization.js`).
- Tests: extend `tests/adminAudit.test.cjs`; new negative test scanning
  `server/**/*.js` (skip `_build/`) for admin-gated `Meteor.methods` that are
  neither audited nor on a read-only allowlist.
- Menu: Admin Panel / People / Audit log (unchanged).

**WP-2 Login/IP data retention.** (Legal basis: [GDPR] Art. 5(1)(e); [POPIA] s. 14(1); [PIPEDA] Principle 4.5.3; [AUPA] APP 11.2.)
- `LOGIN_ADDRESS_RETENTION_DAYS` (default 365, 0 = keep) in
  `models/lib/loginTally.js` (pure cutoff) + daily claimed job in
  `server/lib/loginTally.js` (pattern: `claimDailyJob` in `models/eventLog.js`)
  over `users.loginAddresses.entries`, `loginAddresses`,
  `shortPasswordLogins`; apply `ADMIN_AUDIT_RETENTION_DAYS` to
  `impersonatedUsers`.
- Admin override in Admin Panel / People / Login (`models/lib/authConfigCatalog.js`).
- Tests: `tests/loginAddressRetention.test.cjs` (positive: old entry removed;
  negative: recent kept, 0 keeps everything).

**WP-3 Personal-data inventory (foundation for WP-4, WP-5, WP-7).** (Legal basis: [GDPR] Art. 30(1); [LGPD] Art. 37; [PIPL] Art. 51.)
- `models/lib/personalDataInventory.js` (pure, CommonJS) classifying all ~170
  collections: categories, `subjectField(s)`, purpose, retention source,
  erasure action.
- `tests/personalDataInventory.test.cjs`: every `new Mongo.Collection('x')` in
  `models/` and `server/` is classified (fails on a new unclassified one);
  every entry with a subject field has an erasure action.
- Generated [Data-Inventory.md](Data-Inventory.md) (`releases/compliance/data-inventory.mjs`).
- Done in [bfd83d09b6](https://github.com/wekan/wekan/commit/bfd83d09b6): 185 collections, 128 with
  personal data; the 40 collections nothing erases yet are `KNOWN_WP4_GAPS`
  in the test, the work list of WP-4. Remaining: the Admin Panel view (WP-6).

**WP-4 Complete erasure and anonymisation.** (Legal basis: [GDPR] Art. 17(1); [CCPA] § 1798.105(a); [LGPD] Art. 18; [PIPL] Art. 47; [CRA] Annex I Part I(2)(m) from 2027-12-11.)
- Extend `buildUserDeletionCleanupPlan` (`models/lib/userDeletionCleanup.js`)
  from the inventory: remove `workloadAbsences`, `workloadCapacities`,
  `timeEntries` (or pseudonymise if billing requires keeping), `idleSessions`,
  `unsaved-edits`, `userPositionHistory`, `savedCardFilters`, `sessiondata`,
  `orgUser`, notification e-mail jobs, `shortPasswordLogins`; pull the user
  from `loginAddresses.users.entries`.
- Extend `buildAnonymizeUpdate` (`models/lib/userAnonymization.js`) `$unset`:
  `loginAddresses`, `passkeys`, `sqrl`, `webPushSubscriptions`, `ntfy`,
  `profile.emailToCard`, `profile.emailBuffer`, `services` except
  `resume` cleared; rewrite `@username`/`requestedBy`/`assignedBy` with the
  existing `models/lib/importExportSecurity.js` helpers; apply the same side
  cleanup as deletion.
- Tests: extend `tests/userDeletionCleanup.test.cjs`,
  `tests/userAnonymization.test.cjs`; negative test that the plan covers
  every inventory entry flagged `erasure: 'delete'`.
- Menu: unchanged (People ⋯, Edit Profile) until WP-6 adds the Member Settings
  entry.

**WP-5 Personal-data export (access + portability).** (Legal basis: [GDPR] Art. 15(3), 20(1); [CCPA] § 1798.110(a); [PIPEDA] Principle 4.9; [AUPA] APP 12.1; [HIPAA] § 164.524.)
- `server/lib/personalDataExport.js` driven by the inventory; route
  `GET /api/user/export?authToken=` (pattern of
  `server/routes/exportAllBoards.js`), ZIP of JSON + CSV; method
  `exportUserPersonalData(userId)` for admins (audited).
- Secrets never exported (password hash, 2FA secret, resume tokens, passkey
  private material).
- Tests: `tests/personalDataExport.test.cjs` (positive: own data, all
  inventory categories present; negative: another user's id refused for a
  non-admin, no secret field names in output), Playwright download test.
- Menu: Member Settings / **Privacy and my data** / Download my data;
  Admin Panel / People / People ⋯ / Export personal data.

**WP-6 Legal pages + privacy contact + Member Settings "Privacy and my data".**
- Legal basis: privacy notice [GDPR] Art. 13, [CCPA] § 1798.100(a) and the
  other rows of 7.1; imprint [DDG5] § 5 DDG, [ECG5] § 5 ECG, [MedienG]
  §§ 24-25, [ECD] Art. 5, [UKECR6] reg. 6 (row 7.3); cookies [EPD] Art. 5(3),
  [TDDDG25] § 25, [PECR6] reg. 6 (row 7.4); contacts [GDPR] Art. 13(1)(b),
  27, 37 (row 7.5).
- `models/legalPages.js` (like `models/accessibilitySettings.js`): docs
  `privacy`, `terms`, `cookies`, `imprint`, each `{ enabled, url?, title,
  body, version, modifiedAt }`; the `imprint` doc also has structured fields
  `name`, `legalForm`, `representative`, `address`, `email`, `phoneOrForm`,
  `register`, `registerNumber`, `vatId`, `supervisoryAuthority`,
  `professionalRules`, `mediaDisclosure` (AT MedienG § 25), rendered only when
  filled; `legalNotice` / per-org `orgLegalNotice` stay as the external-URL
  override of `imprint` for backward compatibility. Settings fields
  `privacyContact`, `dpoContact`, `euRepresentative`, `securityContact`.
- **Imprint is reachable from every page** (§ 5 DDG "unmittelbar erreichbar"
  and "ständig verfügbar"): login page footer, logged-in Member menu, and the
  footer of every legal page; not only the login page as today.
- Routes `/privacy`, `/terms`, `/cookies`, `/imprint` in `config/router.js` next to
  `/accessibility` (line 355) with templates beside
  `client/components/main/accessibility.jade`; default privacy body generated
  from the inventory + retention values + enabled third parties.
- Login page footer (`client/components/main/layouts.jade` around the
  `legalNoticeDiv`, line 136): links Privacy · Terms · Cookies · Accessibility
  · Imprint; replace the "By continuing, you accept our legal notice"
  wording with a neutral link list unless acceptance is required (WP-8).
- Member menu (`client/components/users/userHeader.jade`): new entry
  "Privacy and my data" popup with: legal pages (incl. Imprint), Download my data (WP-5),
  Delete / Anonymise account (moved from Edit Profile), accepted versions
  (WP-8), own login history (WP-10).
- Admin Panel / Settings / **Privacy** pane (`privacy-setting`): page editors
  (Privacy, Terms, Cookies, Imprint), contacts, read-only Retention table and Data inventory (from WP-3).
- Remove dead Matomo code in `client/lib/utils.js` and its test, or gate it.
- Tests: `tests/adminUrls.test.cjs` (new pane), `tests/legalPages.test.cjs`
  (publication exposes only enabled pages; non-admin cannot write; imprint
  renders only filled fields; negative test: no page template outside the
  login layout lacks the footer link when an imprint is set), Playwright:
  login footer links and the Member-menu Imprint link reach the pages, axe
  passes on them.

### P2

**WP-7 Retention overview + remaining retention knobs.** `ADMIN_AUDIT_RETENTION_DAYS`
(`models/lib/adminAudit.js`), `ACTIVITIES_RETENTION_DAYS` (default off; never
deletes `changeHistory`), `WORKLOAD_ABSENCE_RETENTION_DAYS` and an "absence
type not recorded" switch; Retention table in the Privacy pane listing every
inventory entry with its effective value. Menus: Admin Panel / People / Login,
Settings / Activities and notifications, Settings / Features (Workload),
Settings / Privacy. Tests: pure cutoff tests per knob + inventory test that
each `retention.env` is read somewhere.

**WP-8 Versioned acceptance of terms/privacy.** (Legal basis: [GDPR] Art. 7(1) only where consent is the basis; otherwise contract law.) `users.legalAcceptances`,
"require acceptance" setting per page, post-login gate modelled on
`server/passwordChangeRequired.js` (methods refused until accepted, allowlist
like `ALLOWED_METHODS` in `models/lib/twoFactorRequirement.js`), checkbox on
registration. Menu: Admin Panel / Settings / Privacy; user sees accepted
versions in Member Settings / Privacy and my data. Tests: pure gate decision,
negative test that an un-accepted user cannot call a board method, Playwright
accept flow.

**WP-9 CRA and disclosure items.** (Legal basis: [CRA] Art. 13(8), 13(17), 13(19), Annex I Part II(1), (5), (6), (8), Annex II points 2, 7, 9 - from 2027-12-11; Art. 14 reporting since 2026-09-11; only if WeKan is a manufacturer, see the CRA note. security.txt is [RFC9116], not law. The SBOM must be drawn up; publishing it is optional.) `/.well-known/security.txt` from
`securityContact` (handler like `serveAssetLinks` in
`server/routes/customHeadAssets.js`); `SECURITY.md` support-period section;
CycloneDX SBOM release asset in `.github/workflows/release-all.yml` +
link in Admin Panel / Settings / Version; `docs/Security/Compliance/` guide
(GDPR, HIPAA, NIS2/ISO/SOC2 mapping, recommended settings, encryption-at-rest
guidance, break-glass procedure, DPA/BAA notes). Tests: route test for
security.txt fields/Expires; workflow-source test that the SBOM step exists
(leave `tests/dockerProvenance.test.cjs` SBOM-off assertion intact - it is
about image attestations).

**WP-10 Exports for access reviews and incidents.** CSV export button on the
shared table page (`client/components/settings/tablePage.*`,
`models/lib/tablePage.js`) for People, Boards Report, Security report, Audit
log (server-side, admin only, streamed); "Boards and roles" view in People ⋯;
own login history in Member Settings / Privacy and my data. Tests: admin-only
negative test, CSV columns test, no secret columns.

**WP-11 Data-access log + SIEM output.** Folded "data access" rows for
successful exports (`server/routes/exportAllBoards.js`, board export methods,
`exportUserPersonalData`) into Audit log tab; `AUDIT_LOG_STDOUT=json` line
writer in `server/adminAudit.js` and `server/lib/eventLogFold.js`. Tests: fold
keeps one row per user/day; stdout writer emits valid JSON and never a
redacted value.

**WP-12 Compliance checklist pane.** Admin Panel / Problems / **Compliance**
(slug `compliance`): read-only rows "2FA required for admins", "idle logout
set", "HTTPS/HSTS", "login data retention set", "imprint set (information
only)", "audit retention ≥ 2190 days
(HIPAA deployments; 6 years is the § 164.316(b)(2)(i) documentation period,
used here as a conservative choice for audit records)", "privacy page published", "backups encrypted", each linking to the
pane that changes it. Pure `models/lib/complianceChecks.js` + test.

**WP-13 WCAG 2.2.** (Good practice: [WCAG22]; the legal baseline is [EN301549] V3.2.1 = WCAG 2.1 AA, via [WAD] for public bodies.) Add `wcag22aa` to `TAGS` in
`tests/playwright/specs/45-axe-accessibility.e2e.js`, target-size and
focus-not-obscured checks, non-drag reorder for lists/swimlanes, default
statement template (6.1), docs to "WCAG 2.2 AA" (this is `TODO.md:37-40`).

**WP-14 Bugs found on the way.** Per-address login delay never applied
(`TODO.md`), attachment-retention per-run limit mismatch (`TODO.md`).

### P3

- Active-session list with "end this session" (Member Settings) and admin
  "Log out this user" (People ⋯).
- Hash-chained admin audit log verified in Problems / Integrity.
- Passphrase encryption of full backups (reuse
  `server/lib/continuousBackup/encryption.js`); app-level encryption of
  filesystem attachments.
- Optional minimum-age confirmation on registration.
- "Security update available" flag in Problems / Summary.
- (Imprint link in the logged-in Member menu moved to WP-6.) "Do not record login addresses"
  switch; delete/anonymise accounts N days after auto-disable.
- Emergency-access impersonation category that notifies all admins.

## Search log (for MISSING claims)

Repository-wide `grep -rIl -i` excluding `node_modules`, `_build`, `.tools`,
`.build`, `.meteor`, `imports/i18n`, `old-CHANGELOG`, for: `gdpr`,
`privacy policy|privacyPolicy|privacy-policy`, `terms of service|termsOfService|terms-of-use|acceptTerms|termsAccepted`,
`cookie consent|cookieConsent|cookie-banner`, `legalNotice|legal-notice`,
`consent`, `anonymi`, `deleteAccount|delete-account|deleteUser|removeUser`,
`exportMyData|exportUserData|downloadMyData|my-data|personal data`, `HIPAA`,
`NIS2`, `27001`, `SBOM|cyclonedx|spdx`, `accessibility statement`,
`skip-link|skip to main|skipLink`, `break.glass|emergency access`,
`data processing agreement|DPA`, `DPO|data protection officer`, `retention`,
`encrypt.*rest|at-rest|atRest`; plus targeted: `expireAfterSeconds`,
`process.env.*(DAYS|RETENTION|KEEP)`, `LoginAddresses.remove`,
`document.cookie|Cookies.set|analytics|matomo|plausible|gtag(`,
`dateOfBirth|birthdate|minAge|parental`, `well-known`, `security.txt`,
`openai|anthropic|ollama|llm|chatgpt|gemini`, `loginTally|loginAddresses` in
`client/`, `csv|export|download` in the table page, and the English catalog
for `privacy|cookie|terms` keys.

## Legal sources

Checked 2026-11-22. Version, HTTP status, application date and quotations:
[Sources.md](Sources.md). EUR-Lex links answer
HTTP 202 (AWS WAF challenge) to scripts but open in a browser; their text was
verified through Pandex and the Publications Office Cellar.

[GDPR]: https://eur-lex.europa.eu/eli/reg/2016/679/oj "Regulation (EU) 2016/679, consolidated 2016-05-04, applies since 2018-05-25"
[EPD]: https://eur-lex.europa.eu/eli/dir/2002/58/oj "Directive 2002/58/EC, consolidated 2009-12-19"
[NIS2]: https://eur-lex.europa.eu/eli/dir/2022/2555/oj "Directive (EU) 2022/2555, national measures from 2024-10-18"
[CRA]: https://eur-lex.europa.eu/eli/reg/2024/2847/oj "Regulation (EU) 2024/2847, Art. 14 from 2026-09-11, rest from 2027-12-11"
[EAA]: https://eur-lex.europa.eu/eli/dir/2019/882/oj "Directive (EU) 2019/882, applies from 2025-06-28"
[WAD]: https://eur-lex.europa.eu/eli/dir/2016/2102/oj "Directive (EU) 2016/2102"
[DA]: https://eur-lex.europa.eu/eli/reg/2023/2854/oj "Regulation (EU) 2023/2854, applies from 2025-09-12"
[ECD]: https://eur-lex.europa.eu/eli/dir/2000/31/oj "Directive 2000/31/EC"
[AIA]: https://eur-lex.europa.eu/eli/reg/2024/1689/oj "Regulation (EU) 2024/1689 as amended by (EU) 2026/1744"
[DDG5]: https://www.gesetze-im-internet.de/ddg/__5.html "§ 5 DDG, last amended 2026-05-12"
[TDDDG25]: https://www.gesetze-im-internet.de/ttdsg/__25.html "§ 25 TDDDG"
[BSIG]: https://www.gesetze-im-internet.de/bsig_2025/__30.html "BSIG 2025 § 30 (NIS2 implementation, Germany)"
[ECG5]: https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20001703 "E-Commerce-Gesetz, Fassung vom 22.11.2026"
[MedienG]: https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10000719 "Mediengesetz, Fassung vom 22.11.2026"
[UKECR6]: https://www.legislation.gov.uk/uksi/2002/2013/regulation/6 "SI 2002/2013 reg. 6"
[PECR6]: https://www.legislation.gov.uk/uksi/2003/2426/regulation/6 "SI 2003/2426 reg. 6, substituted 2026-02-05"
[HIPAA]: https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164 "45 CFR Part 164, eCFR up to date 2026-11-19"
[COPPA]: https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312 "16 CFR Part 312"
[CCPA]: https://cppa.ca.gov/pdf/20260101_ccpa_statute.pdf "Cal. Civ. Code 1798.100 et seq., effective 2026-01-01 (official host leginfo.legislature.ca.gov answers 403 to scripts)"
[LGPD]: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm "Lei 13.709/2018, texto compilado"
[PIPEDA]: https://laws-lois.justice.gc.ca/eng/acts/P-8.6/FullText.html "S.C. 2000, c. 5, current to 2026-10-29"
[AUPA]: https://www.legislation.gov.au/C2004A03712/latest/text "Privacy Act 1988, compilation C2026C00227 (2026-06-04)"
[PIPL]: http://www.npc.gov.cn/npc/c2/c30834/202108/t20210820_313088.html "PIPL, in force 2021-11-01"
[DPDP]: https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf "DPDP Act 2023 (No. 22 of 2023); commencement dates UNVERIFIED"
[APPI]: https://www.japaneselawtranslation.go.jp/en/laws/view/4241/en "APPI (Act No. 57 of 2003), translation of Act No. 37 of 2021; Japanese text authoritative"
[POPIA]: https://www.gov.za/sites/default/files/gcis_document/201409/3706726-11act4of2013popi.pdf "POPIA (Act 4 of 2013) as enacted"
[WCAG22]: https://www.w3.org/TR/WCAG22/ "WCAG 2.2, W3C Recommendation 12 December 2024"
[EN301549]: https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf "EN 301 549 V3.2.1 (2021-03)"
[ISO27001]: https://www.iso.org/standard/27001 "ISO/IEC 27001:2022 - UNVERIFIED (403, paywalled)"
[ISO27701]: https://www.iso.org/standard/27701 "ISO/IEC 27701 - UNVERIFIED (403, paywalled)"
[SOC2]: https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022 "AICPA TSC 2017 (rev. 2022) - UNVERIFIED (gated)"
[RFC9116]: https://www.rfc-editor.org/rfc/rfc9116.html "RFC 9116"
[NIST63B]: https://pages.nist.gov/800-63-4/sp800-63b.html "NIST SP 800-63B-4"
[EO14028]: https://www.federalregister.gov/documents/2021/05/17/2021-10460/improving-the-nations-cybersecurity "Executive Order 14028"
