# Template lifecycle and component boundaries

Use this reference when a Blaze component owns reactive state, subscriptions,
DOM integrations, external listeners, child communication, or a programmatic
View.

## Lifecycle contract

| Hook | DOM available | Use it for |
|------|---------------|------------|
| `onCreated` | No | Instance state, `this.autorun`, `this.subscribe`, non-DOM setup |
| `onRendered` | Yes | `this.find`, `this.findAll`, `this.$`, focus, widget initialization |
| `onDestroyed` | No reliable live DOM | Undo timers, observers, listeners, widgets, registrations, and pending callbacks |

Properties attached to the instance in `onCreated` remain available to
helpers, events, and later lifecycle hooks. Use ordinary functions for hooks so
Blaze can bind `this` to the instance.

`this.autorun` stops its computation when the instance is destroyed.
`this.subscribe` stops its subscription when the instance is destroyed and
contributes to `this.subscriptionsReady()` and the built-in
`Template.subscriptionsReady` helper.

## Local reactive state

| Shape | Use | Package |
|-------|-----|---------|
| One value | `ReactiveVar` | `reactive-var`, included by the current Blaze scaffold |
| Several named values | `ReactiveDict` | Add `reactive-dict` when the app does not have it |
| State shared across unrelated screens | An explicit application store | Keep ownership outside template instances |

```javascript
import { ReactiveDict } from "meteor/reactive-dict";

Template.filters.onCreated(function () {
  this.state = new ReactiveDict();
  this.state.setDefault({
    query: "",
    showDone: false,
  });
});

Template.filters.helpers({
  query() {
    return Template.instance().state.get("query");
  },
});
```

Create per-instance state in `onCreated`, not at module scope. Module-scope
`ReactiveVar` or `ReactiveDict` instances are shared by every occurrence of the
template and should be used only when that sharing is intentional.

## Presentational and data-owning templates

A data-owning template subscribes, reads Minimongo, and passes named values to
children. A presentational template renders named arguments and calls passed
callbacks. This keeps children reusable without hiding their dependencies.

```html
<template name="taskPage">
  {{#if Template.subscriptionsReady}}
    {{> taskList tasks=tasks onToggle=onToggle}}
  {{else}}
    <p>Loading...</p>
  {{/if}}
</template>

<template name="taskList">
  {{#each task in tasks}}
    {{> taskRow task=task onToggle=onToggle}}
  {{/each}}
</template>
```

```javascript
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Tasks } from "/imports/api/tasks";

Template.taskPage.onCreated(function () {
  this.subscribe("tasks.mine");
});

Template.taskPage.helpers({
  tasks() {
    return Tasks.find({}, { sort: { createdAt: -1 } });
  },
  onToggle() {
    return (taskId, done) => Meteor.callAsync("tasks.setDone", taskId, done);
  },
});

Template.taskRow.events({
  "change .js-done"(event) {
    this.onToggle(this.task._id, event.currentTarget.checked);
  },
});
```

Do not use a global helper or ancestor lookup merely to avoid passing one
argument. Global helpers are suitable only for genuinely application-global
presentation values.

## Reactive data contexts

`templateInstance.data` is current but nonreactive. Inside a helper, use the
helper data context or `Template.currentData()`. Inside a template-owned
autorun, use `Template.currentData()` to establish a dependency:

```javascript
Template.comments.onCreated(function () {
  this.autorun(() => {
    const { postId } = Template.currentData();
    this.subscribe("comments.byPost", postId);
  });
});
```

Prefer named `#each item in items` bindings. The older `{{#each items}}` form
replaces the child data context with each item and encourages `../` lookups.

Use `Template.dynamic` when the template identity is reactive:

```html
{{> Template.dynamic template=panelName data=panelData}}
```

Validate `panelName` against an application-owned allowlist when it originates
from a route, method result, or stored user data.

## DOM integration and cleanup

Scope component lookup to `this.find`, `this.findAll`, or `this.$`. Initialize
imperative libraries only after the relevant nodes exist, then destroy them:

```javascript
import { Tracker } from "meteor/tracker";

Template.chart.onRendered(function () {
  const instance = this;

  instance.autorun(() => {
    if (!instance.subscriptionsReady()) return;

    Tracker.afterFlush(() => {
      if (instance.view.isDestroyed || instance.chart) return;
      instance.chart = createChart(instance.find(".js-chart"));
    });
  });
});

Template.chart.onDestroyed(function () {
  this.chart?.destroy();
});
```

Reactive updates that change widget input should call the widget's update API
after a flush. Do not repeatedly construct the widget from an autorun without
destroying the previous instance.

External resources need explicit ownership:

```javascript
import { ReactiveVar } from "meteor/reactive-var";

Template.resizeAware.onCreated(function () {
  this.width = new ReactiveVar(window.innerWidth);
  this.onResize = () => this.width.set(window.innerWidth);
  window.addEventListener("resize", this.onResize);
});

Template.resizeAware.onDestroyed(function () {
  window.removeEventListener("resize", this.onResize);
});
```

Apply the same pairing to `setInterval`, `MutationObserver`,
`IntersectionObserver`, sockets, and third-party registrations.

## Programmatic rendering

Use template inclusion for ordinary application UI. When another DOM system
requires a programmatically mounted template, retain the returned View and
remove it through Blaze:

```javascript
const host = document.createElement("div");
document.body.appendChild(host);

const view = Blaze.renderWithData(
  Template.tooltip,
  { text: "Saved" },
  host,
);

Blaze.remove(view);
host.remove();
```

Removing `host` directly can leave Blaze computations alive. `Blaze.toHTML`
returns a string and does not preserve live DOM reactivity.

Further API detail:

- [Templates API](https://www.blazejs.org/api/templates.html)
- [Reusable Blaze components](https://www.blazejs.org/guide/reusable-components)
- [Blaze programmatic API](https://www.blazejs.org/api/blaze.html)
