# Multitenancy

Run several WeKan instances (one per customer / domain) on the same
Linux host. Two supported topologies, pick whichever fits your
deployment.

Both run **one WeKan Node.js server per tenant**, and that is still the topology to
pick when customers must not share a process.

**One server can also serve every domain**, with Organizations as the tenants:
each Organization claims its own hostnames, carries its own branding and theme, has
its own administrators, and can be backed up and restored on its own. It is enabled
with `MULTITENANCY=true` (and `MULTITENANCY_TRUST_PROXY_HOST=true` when a trusted
proxy sets `X-Forwarded-Host`). What it isolates — and what it deliberately does not,
which is why the per-process topology below stays supported — is
[Multitenancy design](../../../../../Design/Multitenancy/Multitenancy.md), option D.

## a) Recommended — one host, many WeKan domains, `sockjs` + `changeStreams`

Highest DDP throughput and lowest reactive latency.

Configure each instance with:

- `DDP_TRANSPORT=sockjs`
- `METEOR_REACTIVITY_ORDER=changeStreams,oplog,polling`
- `network_mode: "host"` (or any setup that shares one kernel
  network namespace)
- The same MongoDB replica set (separate logical databases per
  tenant)

Working example: see [`docker-compose-multitenancy.yml`](../../../../../../docker-compose-multitenancy.yml)
in the repository root.

Sketch of the per-tenant environment block:

```yaml
environment:
  - PORT=8081                                                # public HTTP port
  - ROOT_URL=https://tenant1.example.com
  - MONGO_URL=mongodb://127.0.0.1:27017/wekan_tenant1?replicaSet=rs0
  - DDP_TRANSPORT=sockjs
  - METEOR_REACTIVITY_ORDER=changeStreams,oplog,polling
```

For tenant 2, bump `PORT`, `ROOT_URL` and the MongoDB database name. WeKan's
published bundles contain SockJS, not uWebSockets.js, so there is no separate
internal `uws.port` to allocate.

## b) Alternative — `sockjs` + `oplog` (maximum proxy compatibility)

Use this if your reverse proxy / load balancer cannot guarantee
WebSocket upgrade pass-through, or if some clients sit on networks
that block raw WebSocket. SockJS will fall back to HTTP long-polling
on those clients.

```yaml
- DDP_TRANSPORT=sockjs
- METEOR_REACTIVITY_ORDER=oplog,polling
```

No per-tenant `uws.port` configuration is needed because `sockjs`
does not run a separate internal listen socket. The trade-off is
lower DDP throughput compared to `uws`.

## Reference

- Meteor 3.5 DDP transport docs, including the multi-tenant section:
  <https://docs.meteor.com/performance/ddp-transport#multitenancy>
- Meteor changeStreams reactivity driver:
  <https://docs.meteor.com/performance/change-streams-observer-driver>
