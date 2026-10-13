# Sandstorm Powerbox: external APIs

A Sandstorm grain has no network access of its own. To import from, or export
to, an outside service such as Trello, WeKan asks the user for permission
through the Sandstorm **Powerbox**, the same way the Sandstorm WordPress app is
allowed to reach wordpress.org for plugin updates.

## What the user sees

On the Trello import page, and in **Board Settings → Export → Trello**, a
grain shows **Allow access to Trello**. It opens the Powerbox, which offers
`https://api.trello.com/1` (the user may also type another address). Once
approved, the page says **This grain may reach Trello.** The grant belongs to
that user. It is listed, and can be revoked, in the grain's Sandstorm settings,
and **Forget** removes it from WeKan. It ends by itself when the user loses
access to the grain.

## How it works

1. The client sends a `powerboxRequest` for an `ApiSession` whose
   `canonicalUrl` is the service's API (`sandstorm.js`,
   `sandstormRequestExternalApi`). The descriptor is a constant built by
   `apiSessionDescriptor()` in `imports/sandstorm/bridgeClient.mjs`;
   `tests/sandstormApiEgress.test.mjs` rebuilds it, and the same generator
   reproduces the example in Sandstorm's own documentation byte for byte.
2. The server redeems the one-time claim token at
   `POST http://http-bridge/session/<session id>/claim` on
   sandstorm-http-bridge's proxy, with `requiredPermissions: ["participate"]`,
   and keeps the permanent access token it gets back, per user and service,
   in the server-only collection `sandstorm_api_grants`
   (`server/sandstormEgress.js`, method `sandstormClaimApiGrant`). The token is
   never sent to a browser.
3. A request to the service goes to the bridge's `HTTP_PROXY` as
   `http://<host>/<path after canonicalUrl>?<query>` with
   `Authorization: Bearer <access token>` (`imports/sandstorm/egress.mjs`,
   `proxyFetch`). The proxy picks the service by the token and forwards the
   path and query to it.

Code that starts work for a user runs it with `runAsEgressUser(userId, …)`, so
the request finally made deep inside the importer or exporter uses that user's
grant.

## Limits

- The proxy keeps the `Authorization` header for its own token, and
  Sandstorm's external driver forwards only its whitelisted request headers.
  A service has to accept its credentials another way. Trello's REST API takes
  `key` and `token` query parameters, so it works; downloading a file uploaded
  to Trello needs an `Authorization: OAuth` header, so it does not. The import
  counts those files as left out, and they can be added with Trello's
  attachments `.zip`.
- Only the granted API is reachable: board backgrounds, avatars and stickers
  on other hosts are skipped.

## Adding another service

Add it to `EXTERNAL_APIS` in `imports/sandstorm/egress.mjs` (its
`canonicalUrl`, without a trailing `/`), add its descriptor to
`externalApiDescriptors` in `sandstorm.js` (generated with
`apiSessionDescriptor()`), and send its requests through `sandstormFetch()`
when `isSandstormServer()` is true. The test rebuilds every descriptor, so a
mismatch fails.

## Sources

- [Sandstorm: Powerbox](https://docs.sandstorm.io/en/latest/developing/powerbox/)
- `src/sandstorm/api-session.capnp` and `src/sandstorm/bridge-proxy.c++` in
  [sandstorm-io/sandstorm](https://github.com/sandstorm-io/sandstorm)
