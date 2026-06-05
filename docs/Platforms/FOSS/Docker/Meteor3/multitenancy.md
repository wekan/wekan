# Multitenancy

Run several WeKan instances (one per customer / domain) on the same
Linux host. Two supported topologies, pick whichever fits your
deployment.

## a) Recommended — one host, many WeKan domains, `uws` + `changeStreams`

Highest DDP throughput and lowest reactive latency.

Configure each instance with:

- `DDP_TRANSPORT=uws`
- `METEOR_REACTIVITY_ORDER=changeStreams,oplog,polling`
- A **distinct** `Meteor.settings.packages['ddp-server'].uws.port`
  per instance (`5001`, `5002`, `5003`, … in the example below)
- `network_mode: "host"` (or any setup that shares one kernel
  network namespace)
- The same MongoDB replica set (separate logical databases per
  tenant)

Why the distinct `uws.port`: the `uws` DDP transport runs its own
internal WebSocket proxy server on a dedicated TCP port (default
`127.0.0.1:5001`) and forwards public WebSocket upgrades into it.
The internal listen socket is opened exclusively, so each instance
in the same kernel netns must declare its own internal port.

Working example: see [`docker-compose-multitenancy.yml`](../../../../../docker-compose-multitenancy.yml)
in the repository root.

Sketch of the per-tenant environment block:

```yaml
environment:
  - PORT=8081                                                # public HTTP port
  - ROOT_URL=https://tenant1.example.com
  - MONGO_URL=mongodb://127.0.0.1:27017/wekan_tenant1?replicaSet=rs0
  - DDP_TRANSPORT=uws
  - METEOR_REACTIVITY_ORDER=changeStreams,oplog,polling
  - METEOR_SETTINGS={"packages":{"ddp-server":{"uws":{"port":5001,"host":"127.0.0.1"}}}}
```

For tenant 2, bump `PORT`, `ROOT_URL`, the MongoDB database name, and
the `uws.port` (e.g. `5002`). The reverse proxy in front of WeKan
keeps routing customer domains to each tenant's public `PORT`
exactly as before — the internal `uws.port` is never exposed.

### Verifying the configuration

From the host (or from inside any container sharing the netns):

```sh
cat /proc/net/tcp | awk '$4 == "0A" {print $2}' | sort | uniq -c
```

Each `uws.port` should appear exactly once. `0x1389` is `5001`,
`0x138A` is `5002`, etc. If you see `2 0100007F:1389`, two tenants
are trying to share the default port; reconfigure their
`METEOR_SETTINGS.uws.port` to distinct values and restart.

### If you forget to set a distinct `uws.port`

The second tenant to start refuses the bind and Meteor throws at
startup with an actionable error:

```text
Error: uWebSockets.js: failed to listen on 127.0.0.1:5001 (address already in use).
  Another Meteor instance in this network namespace is already bound to this port.
  Set a distinct Meteor.settings.packages["ddp-server"].uws.port (or .host) for each instance.
```

Add a `METEOR_SETTINGS` line with a free port to the failing
service, restart.

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
