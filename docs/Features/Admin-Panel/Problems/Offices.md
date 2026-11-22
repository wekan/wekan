# Admin Panel / Problems / Offices

## What it is

Successful login counts by person and address. Each person's addresses stay
together, so an administrator can see where each account signs in from, and
which addresses several accounts share. A shared address may represent an
office, VPN or NAT; it is not proof that accounts are one person. WeKan does
not block addresses for this reason: blocking one shared address would lock
out everybody behind it.

## Read more

- [Network address translation](https://en.wikipedia.org/wiki/Network_address_translation)
  and [Virtual private network](https://en.wikipedia.org/wiki/Virtual_private_network) -
  why many people can share one address.
- [IPv6](https://en.wikipedia.org/wiki/IPv6) - the second address family shown.
- [Internet geolocation](https://en.wikipedia.org/wiki/Internet_geolocation) -
  why an address alone cannot establish someone's precise physical location.
- WeKan: [Problems](README.md),
  [account lockout](../../Login-Page/Accounts-Lockout.md),
  [People](../People/People.md).

## How to use it

1. Sign in as a site administrator and open **Admin Panel → Problems →
   Offices** (`/admin/problems/office`).
2. Read one person at a time, with a row per address: IPv4, IPv6, first and
   last login times, the number of logins and location information when
   available.
3. Type a username, full name, address or location in the search box and
   press Enter to find people.
4. Use the previous/next page buttons for more people.

## How the numbers are calculated

From [models/lib/loginTally.js](../../../../models/lib/loginTally.js) and
[server/methods/loginOffices.js](../../../../server/methods/loginOffices.js):

- **Logins** - each successful login adds 1 to the account's count for that
  address and to the address's count for that account, and sets the last login
  time; the first login time is set once.
- **Per account**, at most 50 addresses are listed
  (`MAX_ADDRESSES_PER_USER`), and **per address** at most 200 accounts
  (`MAX_USERS_PER_ADDRESS`); the rest are counted as an overflow ("more
  addresses") rather than listed.
- **Shared address** - one that at least 3 different accounts have logged in
  from (`SHARED_ADDRESS_MIN_USERS`).
- An IPv4 address written as IPv6 (`::ffff:203.0.113.9`) is counted as the IPv4
  address it is.
- Addresses are sorted by count, most first.
- **Paging** - 25 people a page (`OFFICES_PER_PAGE` in
  [client/components/settings/adminProblems.js](../../../../client/components/settings/adminProblems.js));
  the server accepts 1 to 200, sorted by username.

## How it works in WeKan

- Every successful login is folded into the account's `loginAddresses` tally
  and into the `LoginAddresses` collection
  ([models/loginAddresses.js](../../../../models/loginAddresses.js)) by
  [server/loginTallyOnLogin.js](../../../../server/loginTallyOnLogin.js) and
  [server/lib/loginTally.js](../../../../server/lib/loginTally.js). The tally
  keys are short SHA-256 hashes, because an address or a username cannot be a
  Mongo field name.
- The `loginOffices` method returns the people first, with all of each
  person's addresses kept together; `loginOffice(address)` returns one address
  in full. Both refuse anybody who is not `isAdmin`.
- Location information comes from the configured trusted proxy/CDN headers
  ([models/lib/geoHeaders.js](../../../../models/lib/geoHeaders.js)). Missing
  information remains unknown. An IPv4/IPv6 pair is only shown when the server
  has evidence linking the addresses; an address alone cannot establish
  someone's precise physical location.
- This is an administrator report of locally recorded login activity. Its
  implementation does not require sending login addresses to an external
  geolocation service.
- Tests: [tests/officesGroupedByPerson.test.cjs](../../../../tests/officesGroupedByPerson.test.cjs)
  and [tests/playwright/specs/admin-office-location.e2e.js](../../../../tests/playwright/specs/admin-office-location.e2e.js).

## Commits

- [Location shown in the address reports](https://github.com/wekan/wekan/commit/d43968d888a7f40f9940b318dcd9c4f99edf95bc)
 - [Restore the legacy Offices login history](https://github.com/wekan/wekan/commit/c5d32a5cc0e6c0768b5d473f223e286e42f61a25)
 - [Country login locations, shared with Admin Panel / People](https://github.com/wekan/wekan/commit/ff9d0bab8b63bee6ef70c70decf82a852f5bb2ba)
 - [Available initials in the Offices people column](https://github.com/wekan/wekan/commit/480074969b5aa80cf776a44c5b48196b536884f0)
 - [Login addresses grouped by person](https://github.com/wekan/wekan/commit/3539f2bbf33a5481f2cc0cf4569d725e19c509c9)
 - [Admin Panel / Problems / Offices: where people log in from, grouped](https://github.com/wekan/wekan/commit/961ff6cb47437c2eaff2ea4354caf64b676ef8af)
 - [Who logs in from where, with users shown as initials or avatar](https://github.com/wekan/wekan/commit/d8d1863dba897b4db53d0342f36f269a73655165)
