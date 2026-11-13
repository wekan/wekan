# Blaze template diagnostics

Read the earliest error and resolved Blaze/templating versions before changing
packages or bundler configuration. Compilation failures stop startup; runtime
failures happen after the template has compiled.

## Compile failures

| Error signature | Failing pattern | Repair |
|---|---|---|
| `Reactive HTML attributes must either have a constant name` and `BLOCKOPEN is not allowed here` | `<input type="checkbox" {{#if flag}}checked{{/if}}>` | Use `<input type="checkbox" checked="{{flag}}">` with a boolean helper, or a single attribute-dictionary helper. |
| `TRIPLE template tag is not allowed in an HTML attribute` | `<div class="small {{{raw}}}">` | Use `class="small {{raw}}"`. Triple braces are for trusted HTML content, not attribute interpolation. |
| `Expected "li" end tag` | `<ul><li>a<li>b</ul>` | Close both items: `<ul><li>a</li><li>b</li></ul>`. Spacebars requires the closing tags even where browser HTML parsing permits omission. |
| `Template can't be named "let"` | `<template name="let">` | Rename the template and its references to a non-reserved name, such as `letPanel`. |

A built-in block inside a quoted attribute value is valid:
`class="small {{#if flag}}on{{/if}}"`. Literal `import` text inside
`<pre><code>` is also valid; do not treat it as an executed JavaScript import.

During `meteor run`, `=> Errors prevented startup:` and the browser's
`Meteor App - Error` page can report the same compile failure. The development
proxy displays tool logs in that page; its presence does not establish a
browser runtime failure. Read the terminal's file, line and first compiler
message, fix that template, then verify compilation and rendering. For an
unknown failure outside template compilation, use `meteor-debugging`.

## Runtime traps

| Symptom | Cause | Repair |
|---|---|---|
| `{{> panel}}` throws `Expected template or null, found: true` despite a defined `panel` template | The current template's `panel` helper wins before template-name lookup and returns a boolean. | Rename the helper to `isPanel` or `panelData`; keep the inclusion targeting the template. Do not reinstall templating or convert the boolean to a template. |
| `Template.instance()` is `null` after `await` in an event handler | Blaze restores its synchronous template-instance scope when the handler returns its Promise. Tracker computation scope is a separate concern. | Use the handler's `instance` argument, or capture the instance before awaiting. Before DOM work, account for a template destroyed while the request was pending. |
| `event.dataTransfer` is missing in a drag handler with jQuery loaded | jQuery 3.7.1 wraps native events without copying `dataTransfer`; native Blaze mode passes the native event. | Read `(event.originalEvent || event).dataTransfer`. Handle synthetic events that have no transfer object. Do not require or remove jQuery solely to access this property. |

Keep the handler's instance and own method errors:

```javascript
Template.editor.events({
  async "click .save"(event, instance) {
    event.preventDefault();
    try {
      await Meteor.callAsync("items.save");
      if (!instance.view.isDestroyed) instance.saved.set(true);
    } catch (error) {
      if (!instance.view.isDestroyed) instance.saveError.set(error);
    }
  },
  "dragstart .item"(event) {
    const transfer = (event.originalEvent || event).dataTransfer;
    if (transfer) transfer.setData("text/plain", this._id);
  },
});
```

The example assumes `saved` and `saveError` ReactiveVars initialized in
`onCreated`. Initialize error/success state for each new save as appropriate
for the UI; the example isolates instance retention and rejection ownership.

## Evidence

- [Attribute template-tag validation](https://github.com/meteor/blaze/blob/068f0c09f4851bdc150e2e30f1a09bae3700914b/packages/spacebars-compiler/templatetag.js)
- [HTML closing-tag validation](https://github.com/meteor/blaze/blob/068f0c09f4851bdc150e2e30f1a09bae3700914b/packages/html-tools/parse.js)
- [Reserved template names](https://github.com/meteor/blaze/blob/068f0c09f4851bdc150e2e30f1a09bae3700914b/packages/templating-tools/compile-tags-with-spacebars.js)
- [Helper and template lookup](https://github.com/meteor/blaze/blob/068f0c09f4851bdc150e2e30f1a09bae3700914b/packages/blaze/lookup.js)
- [Template-instance scope and event arguments](https://github.com/meteor/blaze/blob/068f0c09f4851bdc150e2e30f1a09bae3700914b/packages/blaze/template.js)
- [jQuery 3.7.1 event wrapping](https://github.com/jquery/jquery/blob/3.7.1/src/event.js)
- [Meteor development error page](https://github.com/meteor/meteor/blob/4c94e92457c06cb73082a8d59908257bf6b518d1/tools/runners/run-proxy.js)
