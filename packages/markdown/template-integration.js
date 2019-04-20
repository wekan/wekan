if (Package.ui) {
	var Template = Package.templating.Template;
	var UI = Package.ui.UI;
	var HTML = Package.htmljs.HTML;
	var Blaze = Package.blaze.Blaze; // implied by `ui`

	UI.registerHelper('markdown', new Template('markdown', function () {
		var self = this;
		var text = "";
		if(self.templateContentBlock) {
			text = Blaze._toText(self.templateContentBlock, HTML.TEXTMODE.STRING);
		}

		return HTML.Raw(Markdown(text));
	}));
}
