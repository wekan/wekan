# Method and publish guards

The two attack surfaces an agent must audit on every PR.

## Method checklist

For every `Meteor.methods({ ... })` entry:

- [ ] `check()` on every argument.
- [ ] `this.userId` guard when authentication is required.
- [ ] Role check when elevated privileges are required (e.g.
      `alanning:roles`).
- [ ] `Meteor.Error(code, reason, details?)` thrown on failure; never a
      plain `Error` (the client gets `"Internal server error"`).
- [ ] `*Async` Mongo on the server. Sync Mongo is removed in Meteor 3.
- [ ] `DDPRateLimiter.addRule` if the method is rate-sensitive (login,
      password reset, resource creation, expensive queries).

```javascript
Meteor.methods({
  async addItem(payload) {
    check(payload, { title: String, qty: Match.Integer });
    if (!this.userId) throw new Meteor.Error("not-authorized");

    return await Items.insertAsync({
      ...payload,
      ownerId: this.userId,
      createdAt: new Date(),
    });
  },
});
```

## Publication checklist

For every `Meteor.publish(...)`:

- [ ] `this.userId` filter when data is user-specific.
- [ ] `fields` projection limiting columns.
- [ ] `limit` and `sort` on unbounded collections.
- [ ] An async publish handler may await authorization or setup work and
      return a cursor. Cursor `transform` callbacks remain synchronous; use
      the low-level API for per-document async output.

```javascript
Meteor.publish("items.mine", function () {
  if (!this.userId) return this.ready();
  return Items.find(
    { ownerId: this.userId },
    {
      fields: { title: 1, qty: 1, updatedAt: 1 },
      sort: { updatedAt: -1 },
      limit: 200,
    },
  );
});
```

## Sensitive-fields denylist

For `Meteor.users`:

```javascript
Meteor.publish("users.public", function () {
  if (!this.userId) return this.ready();
  return Meteor.users.find(
    {},
    { fields: { username: 1, profile: 1 }, limit: 200 },
  );
});
```

Never publish `services.*`. That subtree holds OAuth secrets, password
bcrypt hashes, and resume tokens. Do not publish every user's `emails` field by
default. Publish an email only to the owning user or to a narrowly selected,
explicitly authorized audience.

## Audit packages

```bash
meteor add audit-argument-checks
```

Crashes the request when a method or publish handler runs without
`check()` covering every argument. Dev-time signal; safe to leave on in
production too.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/tutorials/security/security.md
