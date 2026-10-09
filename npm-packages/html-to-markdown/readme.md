# Html to markdown converter

Html to markdown converter is a dependency free converter which replaces html with a valid markdown syntax. I have just started working on it, so all tags may not be supported.

## Supported Platforms

1. Web browsers.
2. NodeJs

## Tags Supported

1. h1,h2,h3,h4,h5,h6
2. p
3. ul,ol
4. blockquote,
5. pre
6. bold,strong
7. italic,em

## Converting Html Documents

```javascript
var converter = require('@wekanteam/html-to-markdown');
var markdown = converter.convert('<h2>Happy Journey</h2>');
```

## Extending to add your own formatters.

```javascript
var converter = require('@wekanteam/html-to-markdown');
converter.use(function (html) {
  // making required changes
  // and return new html
})
```
