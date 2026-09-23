import { Utils } from '/client/lib/utils';
const { resolveDateFormat } = require('/models/lib/dateFormatPolicy');
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';

// What a server-rendered export needs to know about the reader, and cannot work
// out on its own (#6586).
//
// A PDF export is built on the SERVER: it reads the card out of the database and
// writes the file. That is the right place for it, and it costs the two things
// the browser knows and the server does not.
//
// The TIME ZONE is the reported bug - "the time is not in the user set timezone
// (-2h wrong for Europe/Berlin)". Dates are stored in UTC, and a profile carries
// no timezone in WeKan, so the only place the reader's zone exists is the
// browser. `Intl.DateTimeFormat().resolvedOptions().timeZone` is the IANA name
// ("Europe/Berlin"), which is exactly what the server's own Intl wants back.
//
// The LANGUAGE is on the profile of a logged-in user, and the server prefers that
// - but a PUBLIC board's export has no logged-in user to read it off, and the
// language the reader is looking at WeKan in is the one the export should be in.
// The Excel card export already takes a `lang` query param for this reason; the
// PDF exports now do the same.
//
// The DATE FORMAT is the third, and the reason is the same shape: the opened
// card renders dates using the enabled member, board or global preference.
// An export that printed 2026-08-14 for a card
// showing 14-08-2026 would be the same card in two formats.
//
// All three are best-effort: an old runtime with no Intl, a language that is not
// set yet, or no preference at all must not stop a download. The server falls
// back to UTC, English and YYYY-MM-DD.

export function browserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch (error) {
    return '';
  }
}

// Match the card's enabled member > board > global date-format preference.
export function cardDateFormat() {
  const setting = ReactiveCache.getCurrentSetting();
  const board = Utils.getCurrentBoard();
  try {
    const currentUser = ReactiveCache.getCurrentUser();
    if (currentUser) return resolveDateFormat(currentUser.getDateFormat(), setting, board, currentUser.profile?.dateFormatOverride);
    return resolveDateFormat(null, setting, board);
  } catch (error) {
    return resolveDateFormat(null, setting, board);
  }
}

export function currentLanguage() {
  try {
    return TAPi18n.getLanguage()
      || (navigator.languages && navigator.languages[0])
      || navigator.language
      || '';
  } catch (error) {
    return '';
  }
}

// The query params every server-rendered export link carries, so a second export
// cannot quietly grow a third spelling of them.
export function exportLocaleParams() {
  return {
    tz: browserTimezone(),
    lang: currentLanguage(),
    dateFormat: cardDateFormat(),
  };
}
