# Publication strategies

## `SERVER_MERGE` (default)

The server maintains a per-client view of every published document and only
sends diffs. Highest memory cost; lowest bandwidth. Right for typical apps
where the working set per client is small.

## `NO_MERGE`

The server does not merge fields across publications, but it remembers the
document IDs sent by this subscription. It can therefore send removals when
the subscription stops. Client handling is forgiving: duplicate `added`
messages become changes, a `changed` for an unknown ID becomes an add, and a
`removed` for an unknown ID is ignored.

Use this when a collection is supplied by only one publication. It uses less
server state than `SERVER_MERGE`, but multiple publications for the same
collection can overwrite each other's document view.

## `NO_MERGE_NO_HISTORY`

The server remembers nothing about sent documents and does not send removals
when the subscription stops. Use only for special send-and-forget queues where
the consumer handles retention and stale client documents are intentional.

## Setting the strategy

Strategies are set per collection name, not per publication.

```javascript
import { DDPServer } from "meteor/ddp-server";

Meteor.server.setPublicationStrategy(
  "feed",
  DDPServer.publicationStrategies.NO_MERGE,
);

// Read it back
Meteor.server.getPublicationStrategy("feed");
```

## Choosing

- Default app (collaborative editor, dashboards): `SERVER_MERGE`.
- Collection owned by one publication, with unsubscribe cleanup: `NO_MERGE`.
- Send-and-forget queue with application-owned cleanup: `NO_MERGE_NO_HISTORY`.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/api/meteor.md#publication-strategies
