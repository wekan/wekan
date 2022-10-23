import DOMPurify from 'dompurify';

var Markdown = require('markdown-it')({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
});

import markdownItMermaid from "@wekanteam/markdown-it-mermaid";

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
  Markdown.linkify.add(urlschemes[i]+":",'http:');
}

var emoji = require('markdown-it-emoji');
var mathjax = require('markdown-it-mathjax3');
Markdown.use(emoji);
Markdown.use(mathjax);

// Try to fix Mermaid Diagram error: Maximum call stack size exceeded.
// Added bigger text size for Diagram.
// https://github.com/wekan/wekan/issues/4251
// https://stackoverflow.com/questions/66825888/maximum-text-size-in-diagram-exceeded-mermaid-js
// https://github.com/mermaid-js/mermaid/blob/74b1219d62dd76d98d60abeeb36d4520f64faceb/src/defaultConfig.js#L39
// https://github.com/wekan/cli-table3
// https://www.npmjs.com/package/@wekanteam/markdown-it-mermaid
// https://github.com/wekan/markdown-it-mermaid
Markdown.use(markdownItMermaid,{
  maxTextSize: 200000,
});

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
