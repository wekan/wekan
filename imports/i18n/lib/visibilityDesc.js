// Board visibility popup / create-board popup: the sub-name text shown under
// "Private" and "Public" (boardVisibilityList in
// client/components/boards/boardHeader.jade). An admin can set Settings.
// customPrivateBoardDesc / customPublicBoardDesc (Admin Panel / Settings /
// Visibility) to replace the hardcoded 'private-desc' / 'public-desc' i18n
// text with their own wording - e.g. "Public boards are only public within
// our organization" rather than public on the internet (issue #4421).
//
// Pure logic, no Meteor/Blaze import, so it is unit-testable on its own
// (see tests/visibilityDesc.test.cjs) and reusable as a plain function from
// a Blaze helper.
//
// customText: the admin-set string (Settings.customPrivateBoardDesc/
//   customPublicBoardDesc), or falsy/undefined/whitespace-only if unset.
// translate: a function(key) -> translated string, e.g. TAPi18n.__.
// i18nKey: the fallback i18n key, e.g. 'private-desc' / 'public-desc'.
//
// Empty/whitespace-only customText is treated the same as unset, so a
// setting an admin cleared back to blank returns to the exact previous
// behavior rather than showing an empty sub-name.
function visibilityDesc(customText, translate, i18nKey) {
  const trimmed = typeof customText === 'string' ? customText.trim() : '';
  if (trimmed) {
    return trimmed;
  }
  return translate(i18nKey);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = visibilityDesc;
  module.exports.visibilityDesc = visibilityDesc;
}
