# Module system, strict mode, implicit globals

Meteor 3 enforces ES module semantics on every file that uses `import`,
`export`, or top-level `await`. Strict mode is the default. Implicit
file-scoped globals (assignment without `var` / `let` / `const`) no longer
become visible to other files. Apps that relied on the pre-1.7 eager-loading
behavior surface a lot of `ReferenceError: X is not defined` at startup.

## The implicit-global pattern

Pre-3 Meteor allowed:

```javascript
// pre-3: visible to every file that loaded later
PostsShowController = RouteController.extend({ /* ... */ });
Search              = { query: function () { /* ... */ } };
SearchResults       = function (params) { /* ... */ };
```

After the upgrade, every line above throws `ReferenceError` at runtime.

## The fix

For file-local symbols, declare with `const` / `let`:

```javascript
const PostsShowController = RouteController.extend({ /* ... */ });
const Search              = { query: async function () { /* ... */ } };
```

For symbols shared across files, export and import:

```javascript
// lib/search-results.js
export function SearchResults(params) { /* ... */ }

// client/main.js
import { SearchResults } from '../lib/search-results';
```

## Finding the offenders

Grep for assignments at the start of a line that start with a capital letter
and have no declaration:

```bash
grep -nE '^[A-Z][A-Za-z0-9_]+ = ' -- 'client/**/*.js' 'lib/**/*.js' 'server/**/*.js'
```

Every hit either becomes a `const` or moves to `export`. Iterate
fix-restart-fix until the server boots cleanly.

## Explicit import trees

Meteor's standard bundler retains backward-compatible eager loading when an
app has no `meteor.mainModule`. Explicit entry points are recommended because
they make load order and dependencies deterministic. They are required when
the app adopts the Rspack integration, which does not auto-discover an entry.

With `mainModule`, `client/main.js` must import every Blaze `.html` template
and every helper or event file it needs:

```javascript
// client/main.js
import './main.import.less';

import './views/application/layout.html';
import './views/application/layout.js';
import './views/posts/show.html';
import './views/posts/show.js';

import '../lib/router.js';
import '../lib/collections/posts.js';
```

Symptoms of a missed import:

- `{{> myTemplate}}` renders nothing. The template was never registered.
- Template helpers and event handlers do not fire. The `.js` file was not
  loaded.
- The console logs `Template.X is not defined`.

## The Iron Router controller trap

Iron Router auto-discovers controllers by name: `route('postsShow', ...)`
looks for a global called `PostsShowController`. In Meteor 3 that global
does not exist; `const PostsShowController = ...` is module-scoped. The
route still renders its template, but `onBeforeAction`, `waitOn`, and
`data` never run. Subscriptions never fire. Minimongo stays empty. There
is no error.

Fix every route definition:

```javascript
// broken in Meteor 3: relies on global lookup
this.route('postsShow', {
  path: '/posts/:slug',
});

// works: explicit controller reference
this.route('postsShow', {
  path: '/posts/:slug',
  controller: PostsShowController,
});
```

Do not rely on Iron Router's naming convention in Meteor 3 at all. Pass
`controller:` on every route that has one.

## Strict mode side effects

- Assignment to an undeclared variable throws. No more "oops, typo".
- `arguments.callee` is not available.
- Duplicate parameter names throw.
- Octal literals (`010`) throw. Use `0o10`.
- `with` is disallowed.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/v3-migration-docs/api/global-variables.md
