# `dupontbertrand:mail-preview`

Use this package for an in-browser development preview of Accounts and custom
emails. Read the [Meteor guide](https://docs.meteor.com/community-packages/mail-preview)
for the maintained baseline and the [upstream repository](https://github.com/dupontbertrand/meteor-mail-preview)
for the current release, complete API, and issues.

## Baseline

- Meteor 3.4+, Rspack-compatible Atmosphere package.
- Marked `devOnly`, so it should be excluded from production builds.
- Captures mail through `Email.hookSend()` and serves the development UI at
  `/__meteor_mail__/`.
- Keeps up to 50 messages in memory. The oldest message is evicted when the
  limit is exceeded.

```bash
meteor add dupontbertrand:mail-preview
meteor run
```

Trigger an Accounts email or `Email.sendAsync()`, then open
`http://localhost:3000/__meteor_mail__/`. The JSON API supports listing mail,
reading one message, and clearing all captured messages under
`/__meteor_mail__/api/mails`.

## Required checks

- Verify the current package release against the upstream repository before
  installation.
- Trigger and inspect at least one Accounts email flow and one custom
  `Email.sendAsync()` flow. Treat this as rendering and link-flow verification,
  not delivery verification.
- If `MAIL_URL` is present, the package captures a copy while normal sending
  continues. Avoid sending development messages to real recipients.
- Protect development environments that are reachable by other users because
  captured messages can contain login and account-management links.
- Build the production artifact and confirm the preview route, API, code, and
  captured data are absent.
- Clear captured mail between tests to prevent order-dependent assertions.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/community-packages/mail-preview.md
