import DOMPurify from 'dompurify';

var Markdown = require('markdown-it')({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
});

import markdownItMermaid from "@liradb2000/markdown-it-mermaid";

/*
// Static URL Scheme Listing
var urlschemes = [
  "aodroplink",
  "thunderlink",
  "cbthunderlink",
  "onenote",
  "file",
  "abasurl",
  "conisio",
  "mailspring"
];

// Better would be a field in the admin backend to set this dynamically
// instead of putting all known or wanted url schemes here hard into code
// but i was not able to access those settings
// var urlschemes = currentSetting.automaticLinkedUrlSchemes.split('\n');

// put all url schemes into the linkify configuration to automatically make it clickable
for(var i=0; i<urlschemes.length;i++){
  //console.log("adding autolink for "+urlschemes[i]);
  Markdown.linkify.add(urlschemes[i]+":",'http:');
}

// Additional  safeAttrValue function to allow for other specific protocols
// See https://github.com/leizongmin/js-xss/issues/52#issuecomment-241354114
function mySafeAttrValue(tag, name, value, cssFilter) {
  // only when the tag is 'a' and attribute is 'href'
  // then use your custom function
  if (tag === 'a' && name === 'href') {
    // only filter the value if starts with an registered url scheme
    urlscheme = value.split(/:/);
    //console.log("validating "+urlscheme[0]);
    if(urlschemes.includes(urlscheme[0])) return value;
    else {
      // use the default safeAttrValue function to process all non cbthunderlinks
      return sanitizeXss.safeAttrValue(tag, name, value, cssFilter);
    }
//  } else if (tag === 'svg') {
//    return `<img src="data:image/svg+xml;base64,` + atob(value) + `"></img>`;
  } else {
    // use the default safeAttrValue function to process it
    return sanitizeXss.safeAttrValue(tag, name, value, cssFilter);
  }
};
*/

var emoji = require('markdown-it-emoji');
Markdown.use(emoji);
Markdown.use(markdownItMermaid);

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

    return HTML.Raw(DOMPurify.sanitize(Markdown.render(text), {ALLOW_UNKNOWN_PROTOCOLS: true}));
  }));
}
