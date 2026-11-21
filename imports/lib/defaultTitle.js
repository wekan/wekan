// The title shown for a swimlane, list or board that carries the default one
// (#4742, #4763). A swimlane created without a name is titled 'Default' - or,
// on older data, holds the error text i18n returned when the 'default' key was
// an object ("key 'default ... returned an object instead of string."). Both
// show as the translated 'defaultdefault', or as 'Default' when even that
// translation is missing. Any other title is shown as it is.
//
// This fixes the symptom rather than renaming every such swimlane in the
// database, which on a large instance would be very slow. Five templates and
// the move/copy dialog each used to carry this function; they now call this
// one. Pure: tests/defaultTitle.test.cjs.
const BROKEN_PREFIX = "key 'default";
const BROKEN_SUFFIX = 'returned an object instead of string.';

function isBrokenDefault(text) {
  return text.startsWith(BROKEN_PREFIX) && text.endsWith(BROKEN_SUFFIX);
}

function displayDefaultTitle(title, translate) {
  if (typeof title !== 'string') return title;
  if (title !== 'Default' && !isBrokenDefault(title)) return title;
  const translated = `${translate('defaultdefault')}`;
  if (isBrokenDefault(title) && isBrokenDefault(translated)) return 'Default';
  return translated;
}

module.exports = { displayDefaultTitle };
