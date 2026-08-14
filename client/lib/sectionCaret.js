import { TAPi18n } from '/imports/i18n';

// The caret in front of a collapsible section's heading.
//
// Down when the section is open. When it is closed it points the way the
// reader's eye travels - to the RIGHT in English and to the LEFT in Arabic,
// Hebrew and Persian - because a caret is an arrow saying "there is more this
// way", and in a mirrored page "this way" is the other way.
//
// One function, because the card's eleven sections and the board sidebar's
// Activities are the same control and must not point different directions in
// the same language.
export function caretClassFor(isOpen) {
  if (isOpen) return 'fa-caret-down';
  const rtl =
    (TAPi18n.getLanguageDirection && TAPi18n.getLanguageDirection()) === 'rtl';
  return rtl ? 'fa-caret-left' : 'fa-caret-right';
}
