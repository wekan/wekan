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
    const ret = (rawValue ?? [])
      .filter(value => !!value.trim())
      .map(value => {
        let _ret = this.format.replace(/[%$]\{.+?[^0-9]\}/g, function(_match) {
          let __ret;
          if (_match.match(/%\{value\}/i)) {
            __ret = value;
          } else {
            _match = _match.replace(/^\$/, "");
            try {
              const _json = JSON.parse(_match);
              __ret =  value.replace(new RegExp(_json.regex, _json.flags), _json.replace);
            } catch (err) {
              console.error(err);
            }
          }
          return __ret;
        });
        return _ret;
      })
      .join(this.separator ?? '');
    return ret;
  }
}
