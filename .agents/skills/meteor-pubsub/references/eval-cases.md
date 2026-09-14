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
