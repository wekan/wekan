// Every language's names for the columns WeKan's CSV and Excel exports write
// (models/lib/csvImportMapping.js HEADER_I18N_KEYS). An export is written in
// the exporting user's language, so importing it back - possibly by somebody
// who uses another language - has to know all of them. Loaded once, on the
// first CSV or Excel import, and kept: the translation files do not change
// while the server runs.
import languages from '/imports/i18n/languages';
import { unwrapI18nModule } from '/imports/i18n/loadHelpers';
import { pickHeaderTranslations } from '/models/lib/csvImportMapping';

let loading = null;

export function importHeaderNames() {
  if (!loading) {
    loading = (async () => {
      const out = {};
      for (const [key, language] of Object.entries(languages)) {
        if (!language || typeof language.load !== 'function') continue;
        try {
          out[key] = pickHeaderTranslations(unwrapI18nModule(await language.load()));
        } catch (error) {
          // One language that fails to load only loses its own names.
        }
      }
      return out;
    })();
  }
  return loading;
}
