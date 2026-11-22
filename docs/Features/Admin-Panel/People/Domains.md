# Admin Panel / People / Domains

## What it is

Every e-mail domain in use across the instance, with the number of users on it. A
read-only [table page](../../General/Table.md): search on Enter, a total,
`page X / N`, prev/next, one page at a time from the server.

It answers "who is on this instance, by organization" without reading the user list,
and is the quickest way to spot an unexpected domain.

## Read more

- [Domain name](https://en.wikipedia.org/wiki/Domain_name) and
  [Email address](https://en.wikipedia.org/wiki/Email_address) on Wikipedia -
  the domain is the part of an address after the `@`.
- Related, but different: the invite-domain field in [E-mail](E-mail.md), and
  per-organization automatic membership by domain (Organizations / *auto add
  users with domain name*, see [Organizations](Organizations.md)).

## How to use it

1. Sign in as a site administrator.
2. Open **Admin Panel**, **People**, then **Domains** in the left menu
   (`/admin/people/domains`). It sits beside **E-mail** and **Notifications**.
3. Read the table: one row per domain, with how many users have it.
4. To find one domain, type part of it into the search box and press Enter.
5. Move between pages with the previous / next buttons; the total and
   `page X / N` are shown with them.

## How the numbers are calculated

From `getDomainsWithUserCountsPage` in
[server/models/users.js](../../../../server/models/users.js) and
[models/lib/domainTablePage.js](../../../../models/lib/domainTablePage.js):

- **A user's domain**: the text after the LAST `@` of the user's FIRST e-mail
  address, trimmed and lower-cased. A user without an address, or without an
  `@` in it, is not counted. Other addresses of the same user are not counted.
- **Count per domain**: the number of users whose first address has that
  domain. Every user is counted, active or not.
- **Search**: a case-insensitive substring match on the domain.
- **Order**: by domain, ascending, compared case-insensitively and with
  numbers in natural order (`a2` before `a10`). Clicking a column header does
  not sort.
- **Rows per page**: 10 (`PER_PAGE_DEFAULT`, the same number as every other
  table page); the server accepts at most 200.
- **Total**: the number of domains that match the search; **pages** is the
  total divided by the rows per page, rounded up, at least 1. A page number
  past the end is moved to the last page, so a stale page is never empty.

## How it works in WeKan

- The pane is the `domainGeneral` template in
  [peopleBody.jade](../../../../client/components/settings/peopleBody.jade),
  drawn by the shared table page; its data comes from the
  `getDomainsWithUserCountsPage` method, called from
  [peopleBody.js](../../../../client/components/settings/peopleBody.js).
- The method is for site administrators only (`isAdmin`); anybody else gets
  `not-authorized`. It reads the `emails` of every user, groups them by
  domain and hands the rows to `paginateDomains`, a pure function that
  filters, sorts and returns one page plus the total.
- Nothing is stored: the table is computed on every request.
- Pinned by [tests/domainTablePage.test.cjs](../../../../tests/domainTablePage.test.cjs)
  and [tests/tablePage.test.cjs](../../../../tests/tablePage.test.cjs), which
  keeps the 10 rows per page the same as the shared table page.

## Commits

 - [Paginate the admin lists honestly: one page of ten](https://github.com/wekan/wekan/commit/c1add5bc5e5537e3cc8f96076164ebdf4328b0e8)
 - [Render the Domains pane through the shared table page](https://github.com/wekan/wekan/commit/4eab5ffe9f41433ae3ad268eb22395673a1407d4)
 - [Remove clickable column-header sorting from the Domains table](https://github.com/wekan/wekan/commit/6d3c550d8d462fa92984fd6dee644642706569b1)
 - [Server-side pagination and search for the Domains table](https://github.com/wekan/wekan/commit/b2da9ac8d47e7986198ba4be34c5fdccce45526e)
 - [REST API for the Domains list](https://github.com/wekan/wekan/commit/dbaa27dd67d88e87db9cdac286029bd208bbc008)
 - [Add the Domains pane: e-mail domains with a user count each](https://github.com/wekan/wekan/commit/8849b015dd3debdca4445fbf097e289c5be08128)
