# Evaluation cases for `meteor-pubsub`

## Case 1: missing auth filter

Prompt: "Why are documents from other users showing up in my client when I
subscribe to this publication?"

```javascript
Meteor.publish("items", function () {
  return Items.find({});
});
```

Pass if the agent adds `this.userId` filtering and an `ownerId` selector.

## Case 2: async join

Prompt: "I want my feed publication to include the author username. The
cursor transform crashed with 'returned a Promise'."

Pass if the agent rewrites to the low-level publish API with
`observeChangesAsync`.

## Case 3: strategy choice

Prompt: "My server runs out of memory under load. I publish a real-time
activity feed to every user."

Pass if the agent chooses `NO_MERGE` only when the collection is owned by one
publication and explains that it tracks sent IDs for removals on unsubscribe.
It may choose `NO_MERGE_NO_HISTORY` only for a send-and-forget queue whose
consumer owns cleanup, and must warn that no removals are sent on stop. Fail if
it calls either strategy stateless without qualification.

## Case 4: unsubscribe

Prompt: "How do I stop the subscription when the user leaves the page?"

Pass if the agent stores the handle and calls `.stop()` in unmount/cleanup.

## Case 5: async handler returning a cursor

Prompt: "My publication awaits a membership lookup and then returns
`Items.find({ teamId })`. Does an async `Meteor.publish` handler require the
low-level API?"

Pass if the agent says Meteor awaits async publish handlers and accepts the
returned cursor. Fail if it rejects the handler only because it returns a
Promise. It may recommend the low-level API only for custom or per-document
async output.

## Case 6: ordered async join

Prompt: "My `observeChangesAsync` `added` callback awaits a user lookup. Under
bursty updates, later changes overtake earlier joins and rejected lookups only
appear in logs."

Pass if the agent explains that live delivery does not await each callback,
serializes dependent work with a per-subscription Promise queue, registers
observer teardown with `this.onStop`, and defines a terminal error policy such
as `this.error`. Fail if it assumes `async added()` alone provides
backpressure.

## Case 7: publication error lifecycle

Prompt: "Can I call `this.error(err)` to report a warning and keep the
subscription alive?"

Pass if the agent says `this.error` stops the subscription and sends the error
to the client. It should recommend a separate data or logging channel for a
non-fatal warning.

## Case 8: optimistic resubscribe in beta.1

Prompt: "With NO_MERGE_NO_HISTORY and a pending optimistic method write, resubscribing sends another added for the same document. What changes with ddp-client 3.4.2-beta360.1, and who clears documents on unsubscribe?"

Pass if the agent: Describes merging server fields into the saved snapshot while stub values remain visible until writes settle. Retains application-owned cleanup; does not claim new history or removals on unsubscribe. Scopes cleanup to owned data instead of clearing a shared collection or prescribing private collection handles as a generic fix.
Fail if it contradicts these boundaries or invents unsupported APIs.

## Case 9: earlier optimistic duplicate add

Prompt: "Our Meteor 3.5.2 client throws Server sent add for existing id only while a stub write is outstanding during resubscribe. Is duplicate-added tolerance already guaranteed on this version?"

Pass if the agent: Checks client package and pending-write path, identifies the beta.1 fix boundary, and recommends a compatible tested upgrade or app-level sequencing. Does not claim all older clients support that path or switch publication strategies without considering ownership/cleanup.
Fail if it contradicts these boundaries or invents unsupported APIs.
