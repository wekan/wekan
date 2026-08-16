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
// card renders its dates with the reader's `dateFormat` preference, and for a
// reader who is not logged in that preference lives in localStorage - a place
// the server has no access to. An export that printed 2026-08-14 for a card
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

// The date format the OPENED CARD is showing, worked out exactly as
// client/components/cards/cardDate.js works it out - the profile's setting, and
// for a reader who is not logged in the localStorage value the card view falls
// back to, which the server cannot see at all. An export of a card should print
// its dates the way the card prints them.
export function cardDateFormat() {
  try {
    const currentUser = ReactiveCache.getCurrentUser();
    if (currentUser) return currentUser.getDateFormat();
    return window.localStorage.getItem('dateFormat') || 'YYYY-MM-DD';
  } catch (error) {
    return 'YYYY-MM-DD';
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
