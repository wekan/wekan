import sanitizeXss from 'xss';
var Markdown = require('markdown-it')({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
});

// Additional  safeAttrValue function to allow for other specific protocols
// See https://github.com/leizongmin/js-xss/issues/52#issuecomment-241354114
function mySafeAttrValue(tag, name, value, cssFilter) {
  // only when the tag is 'a' and attribute is 'href'
  // then use your custom function
  if (tag === 'a' && name === 'href') {
    // only filter the value if starts with 'cbthunderlink:' or 'aodroplink'
    if (/^thunderlink:/ig.test(value) ||
        /^cbthunderlink:/ig.test(value) ||
        /^aodroplink:/ig.test(value) ||
        /^onenote:/ig.test(value) ||
        /^file:/ig.test(value) ||
        /^abasurl:/ig.test(value) ||
        /^conisio:/ig.test(value) ||
        /^mailspring:/ig.test(value)) {
      return value;
    }
    else {
      // use the default safeAttrValue function to process all non cbthunderlinks
      return sanitizeXss.safeAttrValue(tag, name, value, cssFilter);
    }
  } else {
    // use the default safeAttrValue function to process it
    return sanitizeXss.safeAttrValue(tag, name, value, cssFilter);
  }
};

var emoji = require('markdown-it-emoji');
Markdown.use(emoji);

if (Package.ui) {
  const Template = Package.templating.Template;
  const UI = Package.ui.UI;
  const HTML = Package.htmljs.HTML;
  const Blaze = Package.blaze.Blaze; // implied by `ui`

  UI.registerHelper('markdown', new Template('markdown', function () {
    const self = this;
    let text = '';
    if (self.templateContentBlock) {
      text = Blaze._toText(self.templateContentBlock, HTML.TEXTMODE.STRING);
    }

    return HTML.Raw(sanitizeXss(Markdown.render(text), { safeAttrValue: mySafeAttrValue }));
  }));
}
