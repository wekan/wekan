# `dupontbertrand:cluster`

Use this package only to preserve `meteorhacks:cluster` behavior needed by an
existing system. Read the [Meteor guide](https://docs.meteor.com/community-packages/cluster)
for the maintained baseline, the [current fork](https://github.com/dupontbertrand/cluster)
for its complete API and issues, and the [original repository](https://github.com/meteorhacks/cluster)
for historical behavior.

## Baseline

- Meteor 3.4+, Node 22, tested on Linux.
- Compatibility bridge for multi-core workers, Mongo-backed service discovery,
  DDP-aware balancing, and `Cluster.discoverConnection()`.
- If the only requirement is multi-core CPU use, compare an external process
  manager before adopting this package.

```bash
meteor add dupontbertrand:cluster
```

```bash
CLUSTER_WORKERS_COUNT=auto meteor run
```

For service discovery, set `CLUSTER_DISCOVERY_URL`, `CLUSTER_SERVICE`, and an
appropriate worker count. `Cluster.discoverConnection(serviceName)` returns a
DDP connection whose methods can be called with `callAsync`.

## Required checks

- Do not enable `CLUSTER_PUBLIC_SERVICES` or `Cluster.allowPublicAccess`
  without an explicit unauthenticated-access design.
- Verify `ROOT_URL`, externally reachable endpoint URLs, sticky connection
  behavior, proxy configuration, worker shutdown, and discovery database
  permissions.
- Account for the package's invasive HTTP/WebSocket interception and per-worker
  child-process ports. The Meteor guide notes no Windows testing.
- Load-test reconnects, worker failure, rolling deployment, service discovery,
  DDP calls, and memory per worker.
- Use `meteor-deployment` for the production architecture and rollout.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/community-packages/cluster.md
