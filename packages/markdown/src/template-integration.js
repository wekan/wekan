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
