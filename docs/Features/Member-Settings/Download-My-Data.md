# Member Settings / Download my data

## What it is

**Download my data** gives you everything this WeKan holds about you, in one
`.zip` of JSON files: your account (without secrets), your cards, comments,
attachments' records, time entries, workload, notifications, sign-in
addresses and the rest. It is your right of access and portability ([GDPR]
Art. 15(3) and 20(1), and the equivalents of row 1.1 in
[the compliance analysis](../../Compliance/README.md)), so every account has it
and no setting turns it off.

## Read more

- [Right of access](https://en.wikipedia.org/wiki/Right_of_access_to_personal_data)
  on Wikipedia.
- [The personal-data inventory](../../Compliance/Data-Inventory.md): which
  collection holds what about a person.
- [Edit Profile](Edit-Profile.md): deleting or anonymising your account.

## How to use it

1. Click your username or avatar at the top right.
2. Click **Privacy and my data**, then **Download my data**.
3. The browser saves `wekan-personal-data-<your username>.zip`.

The same popup lists **Where I am signed in**: every session of your account,
this browser first, when each signed in (and when it was last active, where
idle logout records it), each with **Sign out**, which ends just that one.
An administrator can end every session of an account with **Log out
everywhere** in Admin Panel / People; that is in the Audit log.

The same popup lists **Where I signed in from**: each address your account
signed in from, how many times, and the first and last time - the sign-in
addresses WeKan keeps for `LOGIN_ADDRESS_RETENTION_DAYS`. It also lists the
versions of the terms and the privacy notice you accepted, when this WeKan
asks for acceptance.

An administrator can download the same for any account:
`/api/user/export?authToken=<their own token>&userId=<the account's id>`.
Every such download is recorded in Admin Panel / People / Audit log as
`exportUserPersonalData`.

## How the numbers are calculated

- **What is in it**: `manifest.json` (what is in the file, row counts, and
  what is NOT in it with the reason), `user.json` (your account without
  `services`) and `data/<collection>.json` for every collection that has rows
  about you.
- **Which collections**: every collection the personal-data inventory
  (`models/lib/personalDataInventory.js`) says holds personal data, asked by
  the fields it names as linking a row to a person; a field that holds a
  username is asked with your username. Collections that cannot be asked that
  way are listed in the manifest's `notIncluded` with the reason.
- **Shared rows**: of a board, a card or a list only what identifies it and
  your part in it (your membership, the roles you have on a card) - their
  content is in the board exports.
- **Secrets**: a field whose name says it is a password, token, secret, key,
  hash, salt, credential or signature is left out at every depth.
- **Size**: at most 20000 rows per collection (`MAX_ROWS`); a collection with
  more says `cut: true` in the manifest.

## How it works in WeKan

- [models/lib/personalDataExport.js](../../../models/lib/personalDataExport.js)
  plans the export from the inventory and removes secrets (pure).
- [server/lib/personalDataExport.js](../../../server/lib/personalDataExport.js)
  runs the plan against the database.
- [server/routes/personalDataExport.js](../../../server/routes/personalDataExport.js)
  serves `GET /api/user/export`; who may download whose is
  [models/lib/personalDataExportAccess.js](../../../models/lib/personalDataExportAccess.js).
- Tested by [tests/personalDataExport.test.cjs](../../../tests/personalDataExport.test.cjs).

## Commits
