# Evaluation cases for `migrate-to-meteor-3`

A human runs these prompts against Claude Code and Cursor with the skill
installed and verifies the agent loads the skill and produces the expected
output.

## Case 1: missing await on server-side find

Prompt:

```
I just upgraded to Meteor 3. This method returns undefined on the server,
but it worked in 2.x:

  Meteor.methods({
    listPosts() {
      return Posts.find({ published: true }).fetch();
    },
  });

What did I miss?
```

Pass if the agent suggests `await Posts.find(...).fetchAsync()` and marks
the method `async`. Bonus pass if the agent points at
`references/async-rewrites.md`.

## Case 2: implicit global ReferenceError

Prompt:

```
After updating to Meteor 3 my server crashes on boot with
ReferenceError: PostsShowController is not defined. The file that defines
it just has `PostsShowController = RouteController.extend({...})` at the top.
```

Pass if the agent identifies the implicit-global pattern, suggests
`const PostsShowController = ...` (or `export`), and points at
`references/module-system.md`.

## Case 3: Iron Router silent failure

Prompt:

```
Some of my Iron Router routes load the template but the data is missing.
No errors. The publication never starts. I'm on Meteor 3.
```

Pass if the agent identifies the controller naming-convention lookup
breakage and suggests adding `controller: <Name>` explicitly to the
route definition.

## Case 4: lost reactivity after async helper rewrite

Prompt:

```
After migrating this Blaze helper, the page renders once and never updates
when the underlying user document changes:

  async user() {
    await Meteor.callAsync('profiles.prepare', this.userId);
    return Meteor.users.findOneAsync(this.userId);
  }
```

Pass if the agent explains that client Minimongo supports both sync and async
APIs, and that the query loses the computation because it runs after the first
`await`. Accept either simplifying the helper to synchronous Minimongo when
the preparation step is unnecessary, or wrapping the later query with
`Tracker.withComputation`. Fail if it claims all async Minimongo queries are
nonreactive.

## Case 5: forEach with await skips items

Prompt:

```
This loop runs but my insertedIds is empty afterwards:

  const insertedIds = [];
  items.forEach(async (item) => {
    const id = await Items.insertAsync(item);
    insertedIds.push(id);
  });
  return insertedIds;
```

Pass if the agent identifies that `forEach` does not await the callback,
and rewrites to `for...of` or `Promise.all`.

## Case 6: cursor transform errors out

Prompt:

```
My publication errors with "publish function returned a Promise":

  Meteor.publish('feed', function () {
    return Posts.find({}, { transform: async (doc) => {
      doc.author = await Users.findOneAsync(doc.authorId);
      return doc;
    }});
  });
```

Pass if the agent calls out that cursor `transform` must be synchronous
and proposes either a separate publication for users or the low-level
publish API.

## Case 7: Atmosphere package fails to resolve

Prompt:

```
After `meteor update --release=3` my build fails because
old-atmosphere-package needs api.versionsFrom('1.5') and there is no
3.x-compatible version on Packosphere.
```

Pass if the agent walks through the triage matrix (replace, fork, remove)
and describes how to fork minimally, update `api.versionsFrom`, and link
from `lib/` into `packages/`.

## Case 8: async propagation through callers

Prompt:

```javascript
function findOrder(id) {
  return Orders.findOne(id);
}

function calculateTotal(id) {
  return findOrder(id).total;
}

function buildInvoice(id) {
  return { total: calculateTotal(id) };
}

Meteor.methods({
  createInvoice(id) {
    return buildInvoice(id);
  },
});
```

"Migrate this call chain to Meteor 3. Do not change only the Mongo call."

Pass if the agent traces the complete caller chain, replaces `findOne` with
`findOneAsync`, awaits the result before reading `.total`, propagates Promise
handling through `buildInvoice`, and stops at the method boundary. Accept
direct Promise forwarding where no resolved value is consumed. Fail if any
caller still treats a Promise as the resolved value.

## Case 9: synchronous constructor boundary

Prompt:

```javascript
class Invoice {
  constructor(orderId) {
    this.order = Orders.findOne(orderId);
  }
}
```

"Migrate this class to Meteor 3 while preserving construction correctness."

Pass if the agent does not mark the constructor async. It must introduce an
async factory or require a preloaded order, await `findOneAsync` outside the
constructor, and keep object construction synchronous.

## Case 10: async publication returning a cursor

Prompt:

```javascript
Meteor.publish("posts.byTeam", async function (teamId) {
  const member = await Memberships.findOneAsync({ teamId, userId: this.userId });
  if (!member) return this.ready();
  return Posts.find({ teamId });
});
```

"Does returning this Promise break the publication in Meteor 3?"

Pass if the agent says the async handler is supported and Meteor awaits it
before processing the cursor. Fail if it requires the low-level publish API
only because the handler returns a Promise.

## Case 11: userId outside an invocation

Prompt: "A background job calls `Meteor.userId()` and throws. Should I replace
it with `await Meteor.userIdAsync()`?"

Pass if the agent states that `Meteor.userIdAsync()` does not exist, explains
that `Meteor.userId()` reads method/publication invocation context, and passes
the user ID explicitly into the background job.

## Case 12: client Accounts callback locus

Prompt: "After moving to Meteor 3.4, must I replace client
`Accounts.createUser(options, callback)` and
`Meteor.loginWithPassword(user, password, callback)`?"

Pass if the agent says both callback forms remain supported on the client,
mentions `Accounts.createUserAsync`, and does not suggest
`Meteor.loginWithPasswordAsync` before Meteor 3.5.

## Case 13: Atmosphere package file APIs

Prompt: "My Meteor 3 package still uses `api.addFiles` and `api.export`. Are
those APIs removed, and must I convert it to `api.mainModule`?"

Pass if the agent says all three APIs remain supported, treats
`api.mainModule` as a modular design choice, and avoids an unnecessary
rewrite.

## Case 14: startup migration propagation

Prompt:

```javascript
Meteor.startup(() => {
  Migrations.migrateTo("latest").catch(console.error);
});
```

"Why can requests run before the migration finishes?"

Pass if the agent returns or awaits the migration Promise from the startup
hook and does not swallow a migration failure that should stop startup.

## Case 15: scheduler discards a Promise

Prompt:

```javascript
cron.schedule("0 * * * *", () => {
  runCleanupAsync();
});
```

"The cleanup rejects, but my local try/catch never sees it and the process
sometimes exits. Is marking the callback async enough?"

Pass if the agent checks whether this scheduler observes returned Promises,
requires explicit rejection handling when it does not, and proposes forcing a
rejection to validate the failure policy. Fail if it adds `async` without
examining the callback contract.

## Case 16: semantically wrong async rewrite

Prompt:

```javascript
await Meteor.users.findOneAsync(
  { "services.ldap.id": ldapId },
  { $set: { username } },
);
```

"This was produced while converting Mongo calls for Meteor 3. It runs without
a syntax error, but the username is unchanged."

Pass if the agent identifies that a read API was given an update modifier,
rewrites it to the appropriate `updateAsync` operation, and reads the document
back in the validation. Fail if it treats the `Async` suffix as sufficient.

## Case 17: database-backed allow rule

Prompt: "A legacy `Collection.allow` rule performs a server database lookup.
Can I keep it while moving from Meteor 2.16 to Meteor 3.4?"

Pass if the agent prefers a method migration, distinguishes the Meteor 2
preparation stage from the Meteor 3 boundary, confirms that Meteor 3 awaits an
async validator, and tests both an allowed and denied client mutation.

## Case 18: arrow handler loses invocation context

Prompt:

```javascript
Meteor.publish('items.mine', () => {
  if (!this.userId) return this.ready();
  return Items.find({ ownerId: this.userId });
});
```

"The publication compiles after the Meteor 3 migration, but every subscriber
looks logged out. Should I replace every arrow inside the function?"

Pass if the agent changes the outer publication handler to an ordinary
function, explains that Meteor supplies its invocation context through `this`,
and preserves nested arrows that intentionally capture that context. It must
validate authenticated and unauthenticated subscriptions. Fail if it rewrites
all arrows indiscriminately or replaces `this.userId` with a nonexistent async
API.

## Case 19: callback RPC to `callAsync`

Prompt: "Migrate this client call without losing its error handling:
`Meteor.call('orders.create', input, (error, id) => saveResult(error, id))`."

Pass if the agent uses `await Meteor.callAsync` inside `try`/`catch`, passes the
resolved ID to the success path, and passes the rejection to the existing
error path. It should keep `Meteor.call` only when a callback-only consumer
requires it.

## Case 20: Express 5 WebApp route

Prompt: "After Meteor 3.1, my `WebApp.connectHandlers` route with `/files/*`
stopped matching. Migrate it to the current API."

Pass if the agent moves new code to `WebApp.handlers`, replaces the unnamed
wildcard with an Express 5 named wildcard, and preserves middleware order.
Fail if it says the deprecated alias was removed outright.

## Case 21: async EnvironmentVariable wrapper

Prompt: "A Meteor 2 package patches `Meteor.publish` by nesting
`EnvironmentVariable.withValue` inside the publication handler. After moving
to Meteor 3, code after an `await` loses the `Meteor.userId()` publication
context. Diagnose it and update the wrapper to the current v3-docs placement."

Pass if the agent places `withValue` at the patch wrapper's top level around
the original `publish.call`, returns the scoped result, and leaves the invoked
handler to call the original function without another `withValue`. It must
validate `Meteor.userId()` or the publication invocation before and after an
`await`. Fail if it keeps the nested scope inside the invoked handler.

## Case 22: raw Mongo callback

Prompt: "This Meteor 2 code never calls its callback on Meteor 3:
`Posts.rawCollection().findOne({ _id }, callback)`."

Pass if the agent explains that MongoDB driver 6 removed callback overloads
and rewrites the operation to `await Posts.rawCollection().findOne({ _id })`
with `try`/`catch` at the owning async boundary.

## Case 23: Meteor TypeScript imports become `any`

Prompt: "After moving to Meteor 3, every `meteor/*` TypeScript import is `any`
and the editor reports duplicate identifiers."

Pass if the agent adds `zodern:types`, enables `preserveSymlinks`, maps
`meteor/*` to `.meteor/local/types/packages.d.ts`, and restarts the TypeScript
server. It must keep generated types out of source control.

## Case 24: React Suspense is optional

Prompt: "Must every Meteor 3 React component switch from
`meteor/react-meteor-data` to the `/suspense` import?"

Pass if the agent says the classic hooks remain supported, requires an
upstream Suspense boundary only when choosing the suspense import, and uses a
stable key for suspense `useTracker`. It must inspect `.meteor/versions`, note
that Suspense began in `react-meteor-data` 2.7.0 and Meteor 3 compatibility in
3.0.0, and prefer 3.0.0+ for the migrated app. If it converts `useFind`, it
must change the signature. Fail if it rewrites every client Minimongo read to
an async API or claims async reads always lose reactivity.

## Case 25: `bindEnvironment` capture timing

Prompt: "A global event emitter is wrapped with `Meteor.bindEnvironment` at
server startup. Later, events created by logged-in methods still see no
`Meteor.userId()`. Why?"

Pass if the agent explains that the wrapper captured the startup environment,
not a future method invocation. It should pass `this.userId` explicitly in the
event/job data or create the wrapper inside the invocation. It must not claim
that `bindEnvironment` invents invocation context or changes arrow-function
`this`.

## Case 26: non-Meteor `callAsync` rejection

Prompt: "After migrating to `callAsync`, a client stub throws `TypeError` and
the catch block fails again while reading `error.error`."

Pass if the agent keeps `Meteor.Error` for intentional server-visible failures
but explains that local, misuse, and transport rejections may have another
shape. It must narrow the caught value before reading Meteor-specific fields.

## Case 27: installer alternative

Prompt: "Our Linux setup uses `curl https://install.meteor.com/ | sh`. Must we
replace it because Meteor 3 phased it out?"

Pass if the agent says `npx meteor` is the primary cross-platform command but
curl remains a documented Linux and macOS alternative. It checks the selected
CLI's host Node prerequisite and does not add the installer to project
dependencies.

## Case 28: fresh CLI installation near miss

Prompt: "There is no Meteor application yet. Install the Meteor 3 CLI on this
new Windows workstation and make sure PATH works."

Pass if the agent routes the fresh workstation and PATH workflow to
`meteor-cli-installation`. Fail if it starts an application code migration or
offers the Linux and macOS shell installer on Windows.
