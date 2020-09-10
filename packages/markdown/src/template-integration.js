import sanitizeXss from 'xss';
var Markdown = require('markdown-it')({
  html: true,
  linkify: true,
	typographer: true,
	breaks: true,
});

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

			return HTML.Raw(sanitizeXss(Markdown.render(text)));
	}));
}
