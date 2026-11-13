# Change Streams recovery

Inspect `.meteor/versions`, MongoDB server version/topology, selected reactivity
order and the first failing observer event. `mongo@2.6.0` shipped with Meteor
3.6 requires MongoDB 6.0.9+ or 7+ for `$changeStreamSplitLargeEvent`. Earlier
3.5 packages accepted MongoDB 6+. The 3.5.3 source already reopens and resyncs
after lost history; it lacks split-event assembly, residual `BSONObjectTooLarge`
classification and the new fence holds during resync. Do not describe all
recovery as new in 3.6. An independent package update/backport must be checked
by its resolved version and source.

| Evidence | Action |
|---|---|
| MongoDB 6.0.8 or standalone server | Verify fallback to a configured eligible driver. Oplog needs `MONGO_OPLOG_URL`; otherwise retain polling. Do not remove the server eligibility check. |
| Change event exceeds the 16 MB BSON event limit | The driver splits and reassembles the event before delivering it to observers or releasing its write fences. This does not increase MongoDB's document size limit. |
| Connection drops between fragments | The driver retains the partial event and resumes after the last received fragment. Do not implement application-level fragment delivery or discard events by timestamp. |
| Lost change-stream history, another non-resumable error, or residual `BSONObjectTooLarge` | The driver reopens the stream and resynchronizes observers against the collection before releasing pending writes. Retrying the unusable resume token indefinitely is not recovery. |
| Client remains stale after recovery | Compare initial and live query results, observer changes and DDP messages for the same records. Use `meteor-debugging` to locate the first divergence. Preserve selectors/projections and test a supported fallback if needed. |

Reproduce large-event and reconnect behavior in a disposable database before
changing production reactivity. A transient resumable network error is not
proof that stream history was lost. Do not delete application data, clear
Minimongo or bypass write-fence coordination to hide the symptom.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/performance/change-streams-observer-driver.md
