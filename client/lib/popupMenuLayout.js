// Long option menus can share columns; forms and specialized widgets keep their
// own layouts. Inspect only the active stack entry so a parent menu cannot widen
// a child form. No options or permission guards are added or removed here.
export function updatePopupMenuColumns(popup) {
  const content = popup.querySelector('.content-container > .content:not(.no-height)');
  const lists = content ? Array.from(content.children).filter(el => el.matches('ul.pop-over-list, ul.edit-labels-pop-over')) : [];
  const count = lists.reduce((total, list) => total + list.querySelectorAll('li').length, 0);
  const searchFields = 'input[type=search], input.card-members-filter, input.card-assignees-filter, input.card-identity-filter';
  const hasSearch = !!content?.querySelector(searchFields);
  const keepSearchLayout = hasSearch && content.classList.contains('popup-menu-columns');
  const hasWidget = !!content?.querySelector(`form, input:not(${searchFields}), textarea, select, table, .palette-colors`);
  // The language picker has its own fullscreen, regional-column layout.
  const specialized = popup.dataset?.popup === 'changeLanguagePopup';
  const eligible = (count >= 8 || keepSearchLayout) && !hasWidget && !specialized;
  for (const entry of popup.querySelectorAll('.content-container > .content')) {
    const wanted = eligible && entry === content;
    if (entry.classList.contains('popup-menu-columns') !== wanted) entry.classList.toggle('popup-menu-columns', wanted);
  }
  if (popup.classList.contains('pop-over--menu-columns') !== eligible) popup.classList.toggle('pop-over--menu-columns', eligible);
  return eligible;
}
