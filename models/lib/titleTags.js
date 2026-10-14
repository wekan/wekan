'use strict';

// #1273: what a new card's title keeps when a #label or @member is picked
// while it is typed. By default the "#label" / "@member" text is replaced by
// the label or member itself (nothing is left in the title); with the Member
// Settings switch on, the text stays too, as it was typed. Pure:
// tests/titleTags.test.cjs.

function titleTagText(kind, item, keep) {
  if (!keep || !item) return '';
  if (kind === 'member') return item.username ? `@${item.username} ` : '';
  if (kind === 'label') {
    const name = item.name || item.color;
    return name ? `#${name} ` : '';
  }
  return '';
}

module.exports = { titleTagText };
