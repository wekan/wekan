markdown
========

GitHub flavored markdown parser for Meteor based on marked.js newest version, updated by xet7.

GFM tables and linebreaks are enabled by default.


Usage
-----

Anywhere inside your template add markdown block and write markdown inside.

Example:

```
{{#markdown}}

...markdown text here...

{{/markdown}}
```

That's it!


Thanks to:
----------

- Christopher Jeffrey for <a href="https://github.com/chjj/marked" target="_blank">marked.js</a>

- Bozhao Yu for original <a href="https://github.com/yubozhao/meteor-markdown" target="_blank">meteor-markdown</a> package (I just made this package compatible with Meteor 0.9+)

- Bernhard Millauer - for contributions to this package

- <a href="https://github.com/xet7">xet7</a> for updating to newest GFM package.

License
-------
MIT
