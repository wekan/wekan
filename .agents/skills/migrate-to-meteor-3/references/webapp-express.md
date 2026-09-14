# WebApp switched to Express 5

Meteor 3 replaced Connect with Express inside the `webapp` package, and
Meteor 3.1 upgraded that to Express 5. Apps that customised the
middleware stack must rename the API surfaces they used and may need to
adjust for Express 5 routing changes. Existing routes that mounted
middleware on `WebApp.connectHandlers` keep working through deprecated
aliases, but new code should use the renamed surfaces.

## API rename matrix

| Meteor 2.x                                  | Meteor 3.x                              |
|---------------------------------------------|-----------------------------------------|
| `WebApp.connectHandlers.use(mw)`            | `WebApp.handlers.use(mw)`               |
| `WebApp.rawConnectHandlers.use(mw)`         | `WebApp.rawHandlers.use(mw)`            |
| `WebApp.connectApp`                         | `WebApp.expressApp`                     |
| (no equivalent)                             | `WebApp.express()` factory              |
| (no equivalent)                             | `WebApp.express.Router()` router        |
| (no equivalent)                             | `WebApp.express.{json,raw,static,text,urlencoded}` |

The old names continue to work as aliases, but are deprecated. New code
should use the renamed surfaces.

## Mounting a route

```javascript
import { WebApp } from 'meteor/webapp';

WebApp.handlers.get('/hello', (req, res) => {
  res.send('Hello World');
});
```

Or mount a sub-application:

```javascript
import { WebApp } from 'meteor/webapp';

const app = WebApp.express();
app.get('/hello', (req, res) => res.send('Hello World'));

WebApp.handlers.use(app);
```

## Router-level middleware

```javascript
import { WebApp } from 'meteor/webapp';

const router = WebApp.express.Router();

router.use((req, res, next) => {
  // runs on every request through this router
  next();
});

router.use('/hello/:name', (req, res, next) => {
  console.log('Request URL:', req.originalUrl);
  next();
});

WebApp.handlers.use('/', router);
```

## Async `WebAppInternals` methods

Several internal methods that customise the static-asset pipeline became
async in Meteor 3. Add `await` at every call site:

- `await WebAppInternals.reloadClientPrograms()`
- `await WebAppInternals.pauseClient()`
- `await WebAppInternals.generateClientProgram()`
- `await WebAppInternals.generateBoilerplate()`
- `await WebAppInternals.setInlineScriptsAllowed()`
- `await WebAppInternals.enableSubresourceIntegrity()`
- `await WebAppInternals.setBundledJsCssUrlRewriteHook()`
- `await WebAppInternals.setBundledJsCssPrefix()`
- `await WebAppInternals.getBoilerplate()`

## Express 5 specifics (Meteor 3.1+)

Express 5 itself introduces a few changes that bite when upgrading from
Express 4. Meteor 3.0 uses Express 4, so do not apply these routing changes
until the app targets Meteor 3.1+:

- Path matching changed: `*` and unnamed wildcards now require named
  parameters (`/foo/*name`). Update any custom path patterns.
- Async route handlers can `throw` or reject and Express forwards the
  error to the error middleware. Previously this would crash the process.
- `req.query` is no longer parsed by the deprecated `qs` library by
  default; reconfigure if your client relies on bracket notation.

See the Express 5 migration guide if a custom middleware pipeline breaks
after the framework upgrade.

## Backporting

For projects that want to start migrating middleware before the framework
flip, a community backport (`harry97:webapp`) ships an Express-based
`webapp` on Meteor 2.17. Once the project is on 3.x, remove the backport
and use the core `webapp` package.

## Symptoms after the upgrade

- Middleware mounted on `WebApp.connectHandlers` still runs but logs a
  deprecation warning. Migrate to `WebApp.handlers` at your convenience.
- On Meteor 3.1+, routes that used unnamed wildcards no longer match. Express
  5 path semantics changed; rename to named parameters. Meteor 3.0 retains
  Express 4 routing behavior.
- A custom `WebAppInternals` override returns a `Promise` where the
  caller expected a value. Add `await`.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/v3-migration-docs/breaking-changes/index.md
