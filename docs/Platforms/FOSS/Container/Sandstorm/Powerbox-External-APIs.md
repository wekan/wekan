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

## Outgoing webhooks

A grain has no network of its own, so an outgoing webhook (Board menu →
Outgoing Webhooks) reaches its address only once a board admin allows it:
each saved webhook has **Allow this grain to reach this address**, which opens
the Powerbox for exactly that address's API. After it is approved the form
says so, and the webhook is sent through the bridge proxy with that grant.

- The grant belongs to the address, not to the person who approved it: board
  activity sends the webhook whoever caused it. It is listed, and can be
  revoked, in the grain's Sandstorm settings like any other connection.
- What is approved is the address's parent path:
  `https://hooks.example.com/services/T1/B2/X3` is approved as
  `https://hooks.example.com/services/T1/B2`. The bridge joins the approved
  API and the request path with a `/`, so this is what makes the webhook
  arrive at its exact address, with no trailing slash added.
- A changed address needs approving again. An address with a user name or
  password in it cannot be approved: the proxy owns the `Authorization`
  header. Put a token in the path or query, or in the webhook's token field.
- Off Sandstorm nothing changes: webhooks go out directly, through the SSRF
  guard (`server/lib/ssrfGuard.js`), as before.

`imports/sandstorm/egress.mjs` (`webhookGrantFor`, `grantCovers`) decides
what is approved and what a grant covers; `server/sandstormEgress.js`
(`webhookFetch`) sends every webhook - immediate, grouped and stored - and
falls back to the SSRF-guarded `fetchSafe` off Sandstorm or for an address no
grant covers. `tests/sandstormWebhookEgress.test.cjs` runs it against a fake
bridge proxy.

## The REST API, from outside the grain

The other direction: a script or service calling WeKan's
[REST API](../../../../API/REST-API.md) in a grain. Create an API key for the
grain in Sandstorm (the key icon in the grain's top bar) and send requests to
the API host it shows, with the key as `Authorization: Bearer <key>`. Sandstorm
keeps that header for the key, so the WeKan login token is not used: the
bridge says who is calling instead, and WeKan acts as that user
(`models/lib/sandstormApiIdentity.js`, `server/apiMiddleware.js`).

- The key's user must have opened the grain at least once, so that WeKan has
  an account for them; a key never creates one. A disabled account stays
  refused.
- A key without the participate permission reads only: anything but GET is
  answered as nobody. Board roles apply on top, as for every API call.
- Off Sandstorm the `X-Sandstorm-*` headers are never believed - anybody
  could send them - and only WeKan tokens count.

## List sync

A list that syncs from an issue tracker (List menu → List Sync) reaches it
from a grain the same way: save the source, then **Allow this grain to reach
this tracker** opens the Powerbox for the tracker's API -
`https://api.github.com`, `<GitLab>/api/v4` or `<Gitea/Forgejo>/api/v1`. The
grant belongs to that tracker, so every list syncing from it uses it, and the
periodic sync job needs no signed-in user.

| Tracker | From a grain |
| --- | --- |
| GitHub | public repositories (GitHub reads its token only from the `Authorization` header, which the bridge replaces) |
| GitLab | public and private: the token is sent as the `private_token` query parameter, because the bridge drops `PRIVATE-TOKEN` |
| Gitea, Forgejo | public repositories (their token headers are dropped, and query-string tokens are off by default) |
| Jira | not possible: Jira signs in only with a Basic `Authorization` header |

`imports/sandstorm/egress.mjs` (`syncApiRoot`, `grantRootCandidates`) decides
what is approved; `server/sandstormEgress.js` (`syncFetch`) fetches, and
`server/lib/listSyncFetch.js` uses it only in a grain - everywhere else the
SSRF guard, as before. `tests/sandstormSyncEgress.test.cjs` runs it against a
fake bridge proxy.
