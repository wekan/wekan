# Adding a card filter

Bundled client modules can register a filter through `Filter.providers`. One
registration connects its sidebar template, query, reset behavior and saved
state. The creation/modification recency controls use this interface too.
This is an API for trusted application code, not an installer for uploaded code.

For example, import this module from the application's client entry point to
add an exact-title filter using the existing compiled text-input template:

```js
import { ReactiveVar } from 'meteor/reactive-var';
import { Filter } from '/client/lib/filter';

const title = new ReactiveVar('');
const unregister = Filter.providers.register({
  id: 'example.exact-title',
  version: 1,
  scope: 'board',
  template: 'textFilterProvider',
  data: () => ({
    labelKey: 'filter-card-title-label',
    get: () => title.get(),
    set: value => title.set(value),
  }),
  isActive: () => title.get() !== '',
  selector: () => ({ title: title.get() }),
  reset: () => title.set(''),
  capture: () => title.get(),
  validate: value => typeof value === 'string' && value.length <= 512,
  restore: value => title.set(value),
});

// When removing the extension, unregister() resets it and removes its view.
```

Use a unique namespaced ID: lowercase letters and digits separated by dots or
hyphens, starting with a letter, at most 128 characters. Duplicate IDs are
rejected. `version` is a positive integer describing the saved-state format.
Registration returns an idempotent function that resets and removes the filter.

`template` names a compiled Blaze template. `data()` supplies its data context.
The default location is before the advanced-expression input; `section: 'dates'`
puts it in the date controls. A custom template can provide checkboxes, selects
or several inputs. Its helpers must read reactive state. After user changes,
call `Filter.resetExceptions()` so cards temporarily retained while being
edited no longer escape the new filter. The provided `textFilterProvider`
template already does this and expects `{ labelKey, get, set }`.

`isActive()` and `selector()` are synchronous reactive reads. Active selectors
combine with the other filters using AND. Return a Mongo/Minimongo selector
supported by the existing board query path. Registering a selector does not
publish new fields, create server joins or grant permission. New fields must
also be supported by server publication/projection and lazy card loading.
For joins, use an authorized server publication and an ID selector; the existing
text and movement filters and `server/lib/publishBoardMatches.js` demonstrate
permission checks, observer cleanup and retraction after permission changes.

`scope: 'board'` resets on board-to-board navigation; `scope: 'global'` retains
state across that navigation. Clear filters resets both. `reset()` must restore
the inactive default and release resources such as active timers or subscriptions.
Dispose any extension-wide observers when removing the module as well.

`capture()` returns JSON-compatible state, including the inactive default.
`validate(value)` must return exactly `true` for accepted state and must not
mutate live state. `restore(value)` must synchronously accept every value its
validator accepts. Reset/restore callbacks must not throw. The registry validates
all saved providers before resetting any current filters; it cannot roll back
arbitrary side effects from faulty extension callbacks.

Saved combinations with extensions use version 2 and store each provider's
`{ version, value }`. Unknown providers, unsupported versions and invalid values
refuse the whole apply operation before changing selections. Keep the provider
ID and version stable for compatible releases; incompatible versions currently
require recreating the saved choice. Version 1 combinations still load and
reset extensions to their defaults. The built-in recency provider keeps its
existing version 1 field; `legacyPreset` is reserved for that implementation.

The server validates extension state as bounded JSON data; only the registered
client provider knows its meaning. The complete combination is limited to
65,536 JSON characters, at most 100 providers and 20 nesting levels per value.
Dates must be serialized as strings/numbers. Functions, non-finite numbers and
prototype-related object keys are rejected. Saved choices remain private to
their owner and board, using the existing saved-filter access checks.
