class CustomField {
  constructor(definition) {
    this.definition = definition;
  }
}

export class CustomFieldStringTemplate extends CustomField {
  constructor(definition) {
    super(definition);
    this.format = definition.settings.stringtemplateFormat;
    this.separator = definition.settings.stringtemplateSeparator;
  }

  getFormattedValue(rawValue) {
    return (rawValue ?? [])
      .filter(value => !!value.trim())
      .map(value => this.format.replace(/[%$]\{.+?[^0-9]\}/g, match => {
        if (match.match(/%\{value\}/i)) return value;
        const expression = match.replace(/^\$/, '');
        try {
          const replacement = JSON.parse(expression);
          return value.replace(new RegExp(replacement.regex, replacement.flags), replacement.replace);
        } catch (error) {
          console.error(error);
          return '';
        }
      }))
      .join(this.separator ?? '');
  }
}
