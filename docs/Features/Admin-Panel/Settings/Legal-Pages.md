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

## How the numbers are calculated

- **Version**: starts at 1 and goes up by one each time a save changes the
  title, the text, the link or an imprint field; a save that only switches
  Published leaves it.
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
- Tested by [tests/legalPages.test.cjs](../../../../tests/legalPages.test.cjs).

## Commits
