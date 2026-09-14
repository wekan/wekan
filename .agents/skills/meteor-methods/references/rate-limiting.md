# `DDPRateLimiter.addRule`

`DDPRateLimiter.addRule(matcher, n, ms)` rejects requests that exceed `n`
matches in `ms` milliseconds.

## Matcher shape

```text
{
  type: "method" | "subscription",
  name: string | RegExp | (name) => boolean,
  userId: (userId) => boolean,
  clientAddress: (addr) => boolean,
  connectionId: (id) => boolean,
}
```

(Schema notation, not executable JavaScript.)

Any subset of keys is allowed. Missing keys match everything.

## Common patterns

```javascript
// Per-user method limit
DDPRateLimiter.addRule(
  { type: "method", name: "addItem", userId: (uid) => Boolean(uid) },
  5,
  10000,
);

// Per-IP login attempts
DDPRateLimiter.addRule(
  {
    type: "method",
    name: "login",
    clientAddress: () => true,
  },
  5,
  60000,
);

// All publications, per user
DDPRateLimiter.addRule(
  { type: "subscription", userId: (uid) => Boolean(uid) },
  100,
  60000,
);
```

## Removing a rule

`addRule` returns an id. Pass it to `removeRule` to drop the limit (useful
for tests).

```javascript
const ruleId = DDPRateLimiter.addRule(
  { type: "method", name: "addItem" },
  5,
  10000,
);

// later, e.g. in a test teardown
DDPRateLimiter.removeRule(ruleId);
```

The default login rule shipped with `accounts-base` is removed by
`Accounts.removeDefaultRateLimit()`.

## Async matchers (Meteor 3.5+)

Matchers may return `Promise<boolean>`. Use this only when the rule must read
the database, because each matcher is awaited on the incoming connection's
message queue.

```javascript
DDPRateLimiter.addRule(
  {
    type: "method",
    name: "reports.generate",
    async userId(userId) {
      if (!userId) return true;
      const user = await Meteor.users.findOneAsync(userId, {
        fields: { subscriptionTier: 1 },
      });
      return user?.subscriptionTier !== "premium";
    },
  },
  2,
  60000,
);
```

Keep synchronous matchers for values already present on the invocation. A
rejected async matcher fails the invocation; test that error path. Every
matcher field also contributes to the bucket key. Include `userId`,
`clientAddress`, or `connectionId` when the limit must be scoped rather than
global.

## Custom error message

```javascript
const ruleId = DDPRateLimiter.addRule(rule, 1, 60000);
DDPRateLimiter.setErrorMessageOnRule(
  ruleId,
  (data) => `Slow down. Try again in ${Math.ceil(data.timeToReset / 1000)}s.`,
);
```

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/api/DDPRateLimiter.md
