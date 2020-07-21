import sanitizeXss from 'xss';

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

      return HTML.Raw(sanitizeXss(Markdown(text)));
	}));
}
