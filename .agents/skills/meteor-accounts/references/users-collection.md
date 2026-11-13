# Choose the Accounts users collection

`Accounts.config({ collection })` already exists on older releases. The Meteor
3.6 pairing (`accounts-base@3.4.0`) fixes collection switching,
publication lookup and setup. Inspect `.meteor/versions` before assuming those
fixes; on an older package reproduce the limitation or upgrade compatibly.

Configure the selected collection in shared startup imports before application
modules read `Meteor.users` or register validators. Use the same name and policy
on both runtimes:

```javascript
import { Accounts } from "meteor/accounts-base";

Accounts.config({ collection: "appUsers" });
```

This selects the collection; it does not copy existing user documents. Plan
any data migration separately. On the default Accounts singleton,
`Accounts.users` and `Meteor.users` refer to the selected collection. Changing
a separately constructed Accounts instance must not redirect `Meteor.users`.
Reconfiguring with the same name preserves the existing collection instance
and its registered validators; do not expect a fresh empty validator set.

## Client-write policy

Meteor 3.6 setup adds account indexes to a custom collection. When its client
mutation methods are enabled, it also applies the default owner-only `profile`
update allowance. Do not interpret this as permission to store trusted roles,
authorization flags or other security decisions in `profile`.

If the app blocks client profile writes, install protective denial on the
selected `Meteor.users` server-side before serving requests:

```javascript
import { Meteor } from "meteor/meteor";

Meteor.users.deny({ update: () => true });
```

Preserve existing restrictive denial until replacement authenticated methods
and a verified client-write policy are active. Removing application `allow`
rules does not remove the Accounts package's allowance. A collection created
with `defineMutationMethods: false` still receives account indexes on Meteor 3.6
but has no client mutation validators for Accounts to register. Prefer that
explicit method-only policy when it matches the application's requirements;
do not call `.allow()`/`.deny()` on such a collection.

Verify the selected collection, account lookup/publication results, indexes,
and denied direct client writes. Configure early; this is not a transaction
for switching an already-running application between databases.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/tutorials/accounts/accounts.md
