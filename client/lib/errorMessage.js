import { TAPi18n } from '/imports/i18n';

// What to tell somebody when a call failed, in their language. A Meteor.Error
// whose code is a translation key ('error-notAllowed', 'error-board-notAdmin')
// shows that translation. Anything else shows the translated "Something went
// wrong", with the server's own reason after it when it gave one: that reason
// is English, but it is what an admin needs to find the cause.
//
// Before this, each alert() fell back to its own English sentence ("Failed to
// archive board", "Could not add the member.") - 25 of them, untranslated.
export function errorMessage(error) {
  const code = error && typeof error.error === 'string' ? error.error : '';
  if (code) {
    const translated = TAPi18n.__(code);
    if (translated && translated !== code) return translated;
  }
  const generic = TAPi18n.__('error-undefined');
  const reason = error && (error.reason || error.message);
  return reason ? `${generic} (${reason})` : generic;
}
