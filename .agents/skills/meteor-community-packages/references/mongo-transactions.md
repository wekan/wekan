# `jam:mongo-transactions`

Use `jam:mongo-transactions` to run standard Meteor collection writes in a
MongoDB transaction without manually forwarding a session. Read the
[Meteor guide](https://docs.meteor.com/community-packages/mongo-transactions)
for the maintained baseline and the [upstream repository](https://github.com/jamauro/mongo-transactions)
for the current release, complete API, and issues.

## Baseline

- Meteor 2.8.1+, including Meteor 3.
- Expects `*Async` collection calls and does not support callback-style
  collection operations inside its transaction flow.
- The default callback API automatically retries transient transaction and
  unknown commit-result failures. `{ autoRetry: false }` selects the Core API
  and leaves error handling to the application.

```bash
meteor add jam:mongo-transactions
```

```javascript
import { Mongo } from "meteor/mongo";

const result = await Mongo.withTransaction(async () => {
  const invoiceId = await Invoices.insertAsync(invoice);
  await Items.updateAsync(itemId, { $inc: { quantity: -1 } });
  return { invoiceId };
});
```

Pass ordinary Mongo transaction options as the second argument. Use
`Mongo.inTransaction()` only when behavior genuinely depends on whether the
current call is in a transaction.

## Required checks

- Verify transaction support against the deployed Mongo topology and service
  tier, not only local development.
- Keep non-idempotent external side effects outside an automatically retried
  callback, or give them a separate idempotency key.
- Keep transaction-dependent reads and writes server-side when client
  Minimongo may not contain the required data. Client simulation is not a real
  database transaction.
- Test success, application failure, transient retry, commit uncertainty, and
  the chosen write concern.
- Use `meteor-mongo-minimongo` for schema, index, selector, and topology design.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/community-packages/mongo-transactions.md
