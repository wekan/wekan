# Admin Panel / Settings / Legal pages

## What it is

**Legal pages** is where the operator of a WeKan publishes its **privacy
notice**, **terms of use**, **cookie notice** and **imprint**, and names its
**privacy contacts**: the privacy contact, the data protection officer, the
representative in the EU and the security contact. Everybody - signed in or
not - reads the published pages at `/privacy`, `/terms`, `/cookies` and
`/imprint`; they are linked from the login page and from Member Settings /
Privacy and my data. The duty to have them is the operator's
([the compliance analysis](../../../Compliance/README.md), rows 7.1 to 7.5,
WP-6); WeKan makes it possible.

## Read more

- [Privacy policy](https://en.wikipedia.org/wiki/Privacy_policy) and
  [Impressum](https://en.wikipedia.org/wiki/Impressum) on Wikipedia.
- [Member Settings / Download my data](../../Member-Settings/Download-My-Data.md).
- [The personal-data inventory](../../../Compliance/Data-Inventory.md): what to
  describe in a privacy notice.

## How to use it

1. Open **Admin Panel** / **Settings** / **Legal pages**
   (`/admin/settings/privacy`).
2. For each page: tick **Published**, give it a **title**, and write its
   **text** (Markdown) - or give a **link** to the page where it already is.
3. For the imprint, fill the fields that apply to you: name or company, legal
   form, who represents it, postal address, e-mail, phone or contact form,
   register and register number, VAT ID, supervisory authority, professional
   rules and the media disclosure. Only filled fields are shown.
4. Click **Save** under the page. Its version goes up when what a reader sees
   changed.
5. Under **Privacy contacts**, fill the contacts that apply and click **Save**.
   They are shown on the privacy notice.
6. To have every account accept the **terms of use** or the **privacy
   notice**, tick **Require acceptance** under that page and click **Save**.
   From then on an account that has not accepted the current version sees
   only the acceptance dialog after signing in, and WeKan answers nothing
   else for it until it accepts or signs out. Each new version is asked for
   again. The sign-up form shows an **I accept** checkbox meanwhile; an
   account that does not tick it is asked after signing in. Each person sees
   the versions they accepted in Member Settings / Privacy and my data.

7. Click **Records of processing (draft)** for a draft of the records of
   processing activities (GDPR Art. 30): every collection that holds personal
   data, why, how long it is kept with the values set on this server, and the
   outside services this server hands personal data to. Copy it and complete
   the parts marked "fill in".

## How the numbers are calculated

- **Version**: starts at 1 and goes up by one each time a save changes the
  title, the text, the link or an imprint field; a save that only switches
  Published leaves it.
- **Data inventory**: every collection that holds personal data, what it
  holds and why, how long it is kept, and the setting that limits it with the
  value it has on this server (`getRetentionOverview`) - the retention settings
  themselves are environment variables (`LOGIN_ADDRESS_RETENTION_DAYS`,
  `ADMIN_AUDIT_RETENTION_DAYS`, `ACTIVITIES_RETENTION_DAYS`,
  `WORKLOAD_ABSENCE_RETENTION_DAYS` and the others the table names).
- **Accepted**: an account has accepted a page when it accepted its current
  version or a later one (`missingAcceptances` in
  `models/lib/legalAcceptance.js`). Accepting records
  `legalAcceptances.<page> = { version, at }` on the account, and only the
  version that is current at that moment - a browser that showed an older
  text is asked to read the new one. The cookie notice and the imprint are
  never to be accepted: they inform.
- **What is public**: only a published page, and of the imprint and the
  contacts only the filled fields (`publicPage`, `publicContacts` in
  `models/lib/legalPages.js`). A link is used only when it is `http` or
  `https`.

## How it works in WeKan

- [models/lib/legalPages.js](../../../../models/lib/legalPages.js) - the pages,
  the fields, what is public and how a save is shaped (pure).
- [server/methods/legalPages.js](../../../../server/methods/legalPages.js) -
  `getLegalPages` for everybody, `getLegalPagesForAdmin`, `saveLegalPage` and
  `saveLegalContacts` for site administrators; the two saves are in the Audit
  log.
- [models/legalPages.js](../../../../models/legalPages.js) - the `legalPages`
  collection, which nothing writes from the browser.
- The pages: `client/components/legal/legalPage.*`; the routes in
  `config/router.js` have no sign-in trigger.
- [models/lib/legalAcceptance.js](../../../../models/lib/legalAcceptance.js)
  and [server/requireLegalAcceptance.js](../../../../server/requireLegalAcceptance.js) -
  Require acceptance: the decision (pure) and the gate that refuses every
  other method and publication until it is met, built like REQUIRE_2FA's
  (`server/requireTwoFactor.js`). The REST API is not gated: integrations
  use it with an API token. The dialog and the sign-up checkbox:
  `client/components/legal/legalAcceptance.*`.
- Tested by [tests/legalPages.test.cjs](../../../../tests/legalPages.test.cjs),
  [tests/legalAcceptance.test.cjs](../../../../tests/legalAcceptance.test.cjs) and
  [tests/playwright/specs/legal-acceptance.e2e.js](../../../../tests/playwright/specs/legal-acceptance.e2e.js).

## Commits
