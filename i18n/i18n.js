import I18N from 'meteor/ostrio:i18n';
import { HTTP } from 'meteor/http';
import languages from './languages';

/**
 * @private the actual i18n handler implementation
 */
const i18nImpl = new I18N({
  i18n: {
    settings: {
      defaultLocale: 'en',
      en: {
        code: 'en',
        isoCode: 'en-US',
        name: 'English',
      },
      fi: {
        code: 'fi',
        isoCode: 'fi-FI',
        name: 'Suomi',
      },
    },
  },
});

export const TAPi18n = {}; // TODO refactor to generic "i18n" name

TAPi18n.setLanguage = function(language) {
  let supported = languages.includes(language);

  if (!supported && language.includes('-')) {
    language = language.split('-')[0];
    supported = language.includes(language);
  }

  if (!supported) {
    console.warn('[i18n]: language not supported:', language, 'fallback to [en]');
    language = 'en'; // fallback
  }

  // fetching the respective i18n config
  // from public route and assign it to our
  // i18n provider implementation
  HTTP.get(`i18n/${language}.i18n.json`, {}, (err, data) => {
    if (err) return console.error(err);

    const { content } = data;
    const translation = JSON.parse(content);
    const newL10n = { [language]: translation };

    i18nImpl.addl10n(newL10n);
    i18nImpl.setLocale(language);
  });
};

TAPi18n.__ = function(str) {
  return i18nImpl.get(str);
};
