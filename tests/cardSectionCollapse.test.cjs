'use strict';

// Every section of an opened card collapses, from its own caret.
// Run: node tests/cardSectionCollapse.test.cjs
//
// A card had ONE caret, in its header, which collapsed the whole card - and
// Activities had an EYE beside its heading. Everything else was a heading with
// no control at all, and the `hr`s between sections were written by hand where
// somebody remembered one.
//
// Now each section - Labels, Date Format, Members, Dependencies, Sort, Custom
// Fields, Description, Checklists, Subtasks, Attachments, Comments and
// Activities - has a caret that collapses it, and one rule above it. Both come
// from ONE template, `cardSectionHeader`, so eleven sections cannot end up with
// ten separators and nine carets.
//
// Activities starts CLOSED and everything else open: a card is opened to read
// the card, and its history is the thing you go looking for.
//
// THE EYE WAS NOT THE SAME AS THE CARET, which is worth writing down because it
// looks like a straight swap. `showActivities: false` - the default - subscribed
// to `activityType: 'addComment'` ONLY (server/publications/activities.js), so
// the eye chose between "comments" and "the whole history" as well as showing
// and hiding. With it gone: a closed section subscribes to nothing at all, and
// an opened one asks for the whole history.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const jade = read('client/components/cards/cardDetails.jade');
const customFieldsJade = read('client/components/cards/cardCustomFields.jade');
const js = read('client/components/cards/cardDetails.js');
const css = read('client/components/cards/cardDetails.css');
const activities = read('client/components/activities/activities.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('cardSectionCollapse:');

const SECTIONS = [
  'labels', 'date-format', 'members', 'dependencies', 'sort', 'custom-fields',
  'description', 'checklists', 'subtasks', 'attachments', 'comments', 'activities',
];

test('every named section has a caret header', () => {
  for (const section of SECTIONS) {
    assert.ok(new RegExp(`\\+cardSectionHeader\\(section="${section}"`).test(jade),
      `${section} has a section header`);
  }
});

test('and its content is behind that section\'s own switch', () => {
  for (const section of SECTIONS) {
    assert.ok(new RegExp(`isSectionOpen "${section}"`).test(jade),
      `${section} collapses`);
  }
});

test('the rule and the caret come from ONE template', () => {
  const header = jade.slice(jade.indexOf('template(name="cardSectionHeader")'));
  assert.ok(/hr\.card-details-section-rule/.test(header.slice(0, 400)),
    'the separator is part of the header');
  assert.ok(/js-toggle-card-section/.test(header.slice(0, 600)), 'and so is the toggle');
  // Which is what stops a section from having a rule and no caret, or two rules.
  const headers = (jade.match(/\+cardSectionHeader\(section=/g) || []).length;
  assert.ok(headers >= SECTIONS.length,
    `every section uses it (${headers} of ${SECTIONS.length})`);
});

test('Activities starts collapsed, everything else open', () => {
  assert.ok(/COLLAPSED_BY_DEFAULT = \['activities'\]/.test(js),
    'activities is the one that starts closed');
  assert.ok(/state === undefined \? true : state/.test(js),
    'and an unknown section defaults to OPEN - a new one must show up, not hide');
});

test('the caret mirrors in RTL, and only when closed', () => {
  // The rule lives in one module, shared with the board sidebar's Activities
  // heading: the same control must not point different ways in one language.
  assert.ok(/caretClassFor\(isCardSectionOpen\(section\)\)/.test(js),
    'the card asks the shared rule');
  const caret = fs.readFileSync(
    path.join(ROOT, 'client/lib/sectionCaret.js'), 'utf8');
  assert.ok(/if \(isOpen\) return 'fa-caret-down'/.test(caret),
    'open is always down');
  assert.ok(/rtl \? 'fa-caret-left' : 'fa-caret-right'/.test(caret),
    'closed points the way the reader reads');
  assert.ok(/getLanguageDirection/.test(caret), 'read from the language, not guessed');
});

test('the heading is operable by keyboard, not only by mouse', () => {
  const header = jade.slice(jade.indexOf('template(name="cardSectionHeader")'));
  assert.ok(/role="button"/.test(header.slice(0, 600)) && /tabindex="0"/.test(header.slice(0, 600)),
    'it announces itself as a button and can be focused');
  assert.ok(/'keydown \.js-toggle-card-section'/.test(js), 'and Enter/Space toggle it');
  assert.ok(/cursor: pointer/.test(css), 'while a mouse sees a button too');
});

// ── the eye ────────────────────────────────────────────────────────────────

test('the Activities eye is gone, with its handler', () => {
  assert.ok(!/activities-eye-toggle/.test(jade), 'no eye in the template');
  assert.ok(!/js-toggle-show-activities-card/.test(js), 'and no handler left behind');
});

test('removing it did not quietly turn the history into comments-only', () => {
  // The trap: `showActivities` defaults to false, and false means
  // `activityType: 'addComment'` in the publication. With the eye gone and
  // nothing left to set the flag, an opened section would have shown comments
  // only - a feature lost by accident rather than by decision.
  assert.ok(/mode === 'card'[\s\S]{0,1400}ret = true;/.test(activities),
    'a card section that is open always asks for the whole history');
  assert.ok(!/card\?\.showActivities \?\?/.test(activities),
    'an old persisted false value cannot reduce the opened feed to comments');
  assert.ok(/comments ONLY/.test(activities),
    'and the reason the default flipped is written down');
  const publication = read('server/publications/activities.js');
  assert.ok(/activityType: 'addComment'/.test(publication),
    'the publication still has both modes; only the card default changed');
});

test('a closed Activities section subscribes to nothing at all', () => {
  // The cheaper half of what the eye was for, without a control for it.
  const right = jade.slice(jade.indexOf('.card-details-right'));
  const open = right.indexOf('isSectionOpen "activities"');
  const render = right.indexOf('+activities(card=this');
  assert.ok(open !== -1 && open < render,
    'the +activities templates are inside the open branch, so nothing subscribes while closed');
});

test('the sections not in the list are left alone (negative)', () => {
  // Stickers, Location, the four dates, Creator, Assignees and Spent time were
  // not asked for and keep the headings they had.
  for (const untouched of ['card-details-item-stickers', 'card-details-item-location',
    'card-details-item-received', 'card-details-item-creator']) {
    const at = jade.indexOf(untouched);
    assert.ok(at !== -1, `${untouched} is still there`);
    const block = jade.slice(at, at + 200);
    assert.ok(/h3\.card-details-item-title/.test(block),
      `${untouched} keeps its plain heading`);
  }
});

test('the GROUP is the full-width row, and its fields share rows inside it', () => {
  // `.card-details-items` is a wrapping flex row. The group is what takes a
  // whole row now, so its rule spans the card - and the fields inside it sit
  // side by side, which is what puts Assignee and Creator beside Members
  // rather than under them.
  assert.ok(/\.card-details-items \.card-details-group \{[\s\S]{0,120}flex: 0 0 100%/.test(css),
    'a group is a full-width row');
  assert.ok(/\.card-details-group-body \{[\s\S]{0,140}display: flex[\s\S]{0,60}flex-wrap: wrap/.test(css),
    'and its body wraps its fields');
  assert.ok(/\.card-details-group-body \.card-details-item \{[\s\S]{0,60}flex-grow: 1/.test(css),
    'which share the width between them');
  assert.ok(/\.card-details-section-rule \{[\s\S]{0,80}width: 100%/.test(css),
    'so the rule in a group spans the card');
  // The class that made an individual FIELD full width is gone with the
  // grouping - it is what put Assignee and Creator on the next line.
  assert.ok(!/card-details-item-members\.card-details-section/.test(jade),
    'no field is a full-width row of its own any more');
});

test('the Custom Fields layout toggle switches grid and one-per-row classes', () => {
  const sectionAt = jade.indexOf(
    '+cardSectionHeader(section="custom-fields"',
  );
  const section = jade.slice(sectionAt, jade.indexOf('\n      if getVoteQuestion', sectionAt));
  assert.match(section, /layoutToggle=true layoutOnePerRow=customFieldsGrid/,
    'Custom Fields asks its shared header for the selector');
  const headerAt = jade.indexOf('template(name="cardSectionHeader")');
  const header = jade.slice(headerAt,
    jade.indexOf('template(name="editCardTitleForm")', headerAt));
  assert.ok(header.indexOf('if isSectionOpen section') <
    header.indexOf('button.custom-fields-layout-toggle'),
  'the selector is rendered only while the section is expanded');
  assert.ok(header.indexOf('| {{_ label}}') <
    header.indexOf('button.custom-fields-layout-toggle') &&
    header.indexOf('button.custom-fields-layout-toggle') <
    header.indexOf('if menuClass'),
  'the selector sits between the section title and hamburger menu');
  assert.match(jade,
    /card-details-group-body\(class="\{\{#if customFieldsGrid\}\}custom-fields-one-per-row\{\{else\}\}custom-fields-grid\{\{\/if\}\}"\)/,
    'the saved user preference reaches the custom-fields container');
  assert.match(css,
    /\.custom-fields-grid \{[\s\S]*?display: grid;[\s\S]*?grid-template-columns: repeat\(auto-fit, minmax\(min\(160px, 100%\), 1fr\)\)/,
    'off automatically fits more grid columns when the card becomes wider');
  assert.match(css,
    /\.custom-fields-grid > \.card-details-item-customfield \{[\s\S]*?max-width: none[\s\S]*?min-width: 0/,
    'the old per-field width ceiling cannot hold the grid to three columns');
  assert.match(css,
    /\.custom-fields-one-per-row > \.card-details-item-customfield \{[\s\S]*?flex: 0 0 100%[\s\S]*?max-width: 100%/,
    'on makes every custom field a full row');
  assert.match(js,
    /'click #toggleCustomFieldsGridButton'\(event\)[\s\S]*?event\.stopPropagation\(\)[\s\S]*?Meteor\.call\('toggleCustomFieldsGrid'\)/,
    'the switch still persists the preference');
  const collapseAt = js.indexOf("'click .js-toggle-card-section'(event)");
  const collapse = js.slice(collapseAt, js.indexOf('\n  },', collapseAt));
  assert.match(collapse,
    /event\.target\.closest\('#toggleCustomFieldsGridButton'\)\) return/,
    'the header refuses to collapse when its layout selector was clicked');
  assert.match(jade,
    /button\.custom-fields-layout-toggle#toggleCustomFieldsGridButton[\s\S]*?fa-th-large[\s\S]*?fa-list/,
    'the control uses the paired Grid / List icon pattern');
  assert.match(jade,
    /layoutOnePerRow\}\}list-active\{\{else\}\}grid-active[\s\S]*?grid-icon[\s\S]*?unless layoutOnePerRow[\s\S]*?list-icon[\s\S]*?if layoutOnePerRow/,
    'the icon matching the saved layout is active');
  assert.match(css,
    /\.custom-fields-layout-toggle \.grid-icon\.active,[\s\S]*?\.custom-fields-layout-toggle \.list-icon\.active \{[\s\S]*?background: var\(--theme-accent, #2980b9\)[\s\S]*?opacity: 1/,
    'the active icon is a filled theme-colored chip');
  assert.match(css,
    /\.card-details \.custom-fields-layout-toggle \{[\s\S]*?background: transparent;[\s\S]*?border: 0;/,
    'the layout toggle has no white background or dark border');
});

test('the group caret sits ON the first field\'s title, not on a line of its own', () => {
  // "Can there be at one line Labels Stickers Location" - the group header was a
  // second line repeating the first field's name. It IS that field's title now:
  // one row of titles, the caret at the start of it, the + buttons on the row
  // below.
  for (const [key, field] of Object.entries({
    labels: 'card-details-item-labels',
    'date-format': 'card-details-item-date-format',
    members: 'card-details-item-members',
    dependencies: 'card-details-item-dependencies',
    sort: 'card-details-sort-order',
  })) {
    const at = jade.indexOf(field);
    assert.ok(at !== -1, `${field} is there`);
    const block = jade.slice(at, at + 260);
    assert.ok(new RegExp(`\\+cardSectionHeader\\(section="${key}"[^)]*noRule=true`).test(block),
      `${key}: the header is the field's own title`);
    assert.ok(!/h3\.card-details-item-title/.test(block),
      `${key}: and there is no second title under it`);
  }
});

test('the other fields keep plain titles, on the same row', () => {
  // Stickers and Location, Assignee and Creator: a title each, no caret, and
  // their content on the line below - so the titles read as one row.
  const group = jade.slice(jade.indexOf('card-details-group-members'),
    jade.indexOf('card-details-group-dependencies'));
  for (const field of ['card-details-item-assignees', 'card-details-item-creator']) {
    const at = group.indexOf(field);
    assert.ok(at !== -1, `${field} is in the group`);
    const block = group.slice(at, at + 200);
    assert.ok(/h3\.card-details-item-title/.test(block), `${field} has a plain title`);
    assert.ok(!/cardSectionHeader/.test(block), `${field} has no caret of its own`);
  }
});

test('the rule sits on the GROUP, above the row of titles', () => {
  // It cannot be inside a field any more - that is what made it short.
  for (const key of ['date-format', 'members', 'dependencies', 'sort']) {
    const at = jade.indexOf(`card-details-group-${key}`);
    const block = jade.slice(at, at + 200);
    assert.ok(/hr\.card-details-section-rule/.test(block), `${key} has its rule at group level`);
  }
  // Labels is first and has none, as before.
  const labels = jade.slice(jade.indexOf('card-details-group-labels'), jade.indexOf('card-details-group-date-format'));
  assert.ok(!/hr\.card-details-section-rule/.test(labels), 'the first group has no rule above it');
});

// ── groups ────────────────────────────────────────────────────────────────

test('a group folds its whole family, from ONE caret', () => {
  // "the caret at left side of Labels should hide what is below of text labels,
  // like labels +, stickers, location". Labels, Stickers and Location are one
  // group; the caret belongs to the group, not to each field in it.
  for (const key of ['labels', 'date-format', 'members', 'dependencies', 'sort']) {
    assert.ok(new RegExp(`\\.card-details-group\\.card-details-group-${key}`).test(jade),
      `${key} is a group`);
  }
  const labels = jade.slice(jade.indexOf('card-details-group-labels'),
    jade.indexOf('card-details-group-date-format'));
  for (const member of ['card-details-item-stickers', 'card-details-item-location']) {
    assert.ok(labels.includes(member), `${member} folds with Labels`);
  }
  assert.ok(labels.indexOf('isSectionOpen "labels"') < labels.indexOf('card-details-item-stickers'),
    'and they are inside the fold, not beside it');
});

test('a field has no caret and no fold of its own (negative)', () => {
  // #1591 drew a caret on every .card-details-item title and hid everything
  // after that title when it was clicked. The section carets replaced it, and
  // for a while BOTH ran: a click on a section's heading is also a click on a
  // field title, so the field the heading is drawn on was folded by the old
  // handler and left that way - its own caret having been suppressed inside a
  // group, there was nothing left to open it. The Date Format select is the one
  // that showed it: it sits under that heading, so it disappeared for good.
  assert.ok(!/\.card-details-item > \.card-details-item-title::after/.test(css),
    'no per-field caret');
  assert.ok(!/\.card-details-item\.is-collapsed/.test(css), 'and no per-field fold');
  assert.ok(!/'click \.card-details-item > \.card-details-item-title'/.test(js),
    'nor a handler to set one');
  // What folds a field is its SECTION, and only the heading carries a handle.
  assert.ok(/js-toggle-card-section/.test(js), 'the section heading is the handle');
});

test('the Date Format selector is inside its open section', () => {
  // The regression this replaced: the select is a sibling of the heading the
  // group's caret is drawn on, which is exactly what the old fold hid.
  const group = jade.slice(jade.indexOf('card-details-group-date-format'),
    jade.indexOf('card-details-group-members'));
  assert.ok(/select\.js-date-format-selector/.test(group), 'the select is there');
  assert.ok(group.indexOf('cardSectionHeader(section="date-format"')
    < group.indexOf('select.js-date-format-selector'),
    'under the section heading');
  assert.ok(/if isSectionOpen "date-format"\n\s+\.card-details-item-content/.test(group),
    'and shown whenever that section is open - the only thing that hides it');
});

test('Members comes first in its group, then Assignee, then Creator', () => {
  const group = jade.slice(jade.indexOf('card-details-group-members'),
    jade.indexOf('card-details-group-dependencies'));
  const members = group.indexOf('allowsMembers');
  const assignee = group.indexOf('allowsAssignee');
  const creator = group.indexOf('allowsCreator');
  assert.ok(members !== -1 && assignee !== -1 && creator !== -1, 'all three are there');
  assert.ok(members < assignee && assignee < creator,
    'Members, Assignee, Creator - in that order');
});

test('a collapsed group shows its caret, its icon and its name, and nothing else', () => {
  // The header is the first field's title, and EVERYTHING after it folds: that
  // field's own content, and every field beside it. So a closed group is one
  // line - "only caret and icon and text Members".
  for (const key of ['labels', 'date-format', 'members', 'dependencies', 'sort']) {
    const at = jade.indexOf(`card-details-group-${key}`);
    const next = jade.indexOf('.card-details-group.card-details-group-', at + 10);
    const block = jade.slice(at, next === -1 ? at + 3000 : next);
    const header = block.indexOf('+cardSectionHeader');
    assert.ok(header !== -1, `${key} has its header`);
    // The field's own content folds...
    const firstGuard = block.indexOf(`isSectionOpen "${key}"`, header);
    assert.ok(firstGuard > header, `${key}: the field's content is behind the switch`);
    // ...and so does everything after it, when the group has more than one field.
    const guards = (block.match(new RegExp(`isSectionOpen "${key}"`, 'g')) || []).length;
    const fields = (block.match(/\.card-details-item\./g) || []).length;
    assert.ok(fields === 1 || guards >= 2,
      `${key}: ${fields} fields need the siblings behind the switch too`);
  }
});

test('Requested By and Assigned By select a member with + or edit free text', () => {
  for (const [field, getter] of [['requester', 'getRequestedBy'], ['assigner', 'getAssignedBy']]) {
    const at = jade.indexOf(`js-card-details-${field}`);
    assert.ok(at !== -1, `${field} is there`);
    const block = jade.slice(at, at + 1200);
    assert.ok(new RegExp(`js-select-${field}`).test(block), `${field} + opens its picker`);
    assert.ok(/i\.fa\.fa-plus/.test(block), 'with the plus in it');
    assert.ok(/\.card-details-person-controls[\s\S]*js-open-inlined-form/.test(block),
      `${field}: the free-text editor remains beside the member picker`);
    assert.ok(new RegExp(`title="\\{\\{#if ${getter}\\}\\}\\{\\{_ 'edit'\\}\\}\\{\\{else\\}\\}\\{\\{_ 'add'\\}\\}`)
      .test(block), `${field}: the tooltip says Edit or Add from the value`);
    assert.ok(new RegExp(`aria-label="\\{\\{#if ${getter}\\}\\}\\{\\{_ 'edit'\\}\\}\\{\\{else\\}\\}\\{\\{_ 'add'\\}\\}`)
      .test(block), `${field}: the accessible name says Edit or Add from the value`);
    assert.ok(/i\.fa\.fa-pencil-square-o\(aria-hidden="true"\)[\s\S]*else[\s\S]*i\.fa\.fa-plus\(aria-hidden="true"\)/
      .test(block), `${field}: pencil edits and plus adds without visible text`);
  }
  // And it is the class Members' button is styled by, not a new look.
  const members = jade.slice(jade.indexOf('allowsMembers'), jade.indexOf('allowsAssignee'));
  assert.ok(/\.member\.add-member\.card-details-item-add-button/.test(members),
    'which is the button Members uses');
});

// ── what the restructuring must not have taken with it ─────────────────────
//
// Moving eleven sections around with a script is how markup disappears without
// anything failing: the file still compiles, the tests still pass, and a card is
// missing a row nobody looks at until they need it. These are the pieces that
// were lost once and put back.

test('the card button row is still there', () => {
  assert.ok(/\+cardButtons\(_id=_id boardId=boardId\)/.test(jade),
    'the whole button row was dropped by a slice that used it as a boundary');
});

test('a custom field still shows its NAME', () => {
  // The wrapper renders the field title before selecting its type-specific
  // value editor, so every value remains identifiable in either layout.
  const at = jade.indexOf('.card-details-item.card-details-item-customfield');
  assert.ok(/\n\s+\+cardCustomField/.test(jade.slice(at, at + 250)),
    'the field wrapper is included');
  const wrapperAt = customFieldsJade.indexOf('template(name="cardCustomField")');
  const wrapper = customFieldsJade.slice(wrapperAt,
    customFieldsJade.indexOf('template(name="customFieldCopyButton")', wrapperAt));
  assert.ok(/= definition\.name/.test(wrapper), 'the field name is rendered');
  assert.ok(wrapper.indexOf('= definition.name') < wrapper.indexOf('+Template.dynamic'),
    'above its type-specific value');
});

test('the Attachments heading can still show its count', () => {
  assert.ok(/count=attachmentCount/.test(jade), 'the header takes a count');
  assert.ok(/if count\n\s+\|  \(\{\{count\}\}\)/.test(jade), 'and shows it when there is one');
  assert.ok(/allowsAttachmentCountOnCard/.test(js),
    'only when the board asks for it, which is the setting that governed it');
});

test('the End date has ONE add button (negative)', () => {
  // A stray second `i.fa.fa-plus` appeared beside it - a bare icon, not a
  // button, from a slice that duplicated a line.
  const at = jade.indexOf('card-details-item-end');
  const block = jade.slice(at, at + 500);
  const pluses = (block.match(/i\.fa\.fa-plus/g) || []).length;
  assert.strictEqual(pluses, 1, 'one plus in the End date item');
});

test('the Copy card link button wears the theme', () => {
  // It had `.btn` only, so it fell back to the plain grey button whose dark
  // label is nearly invisible on a dark theme. `.primary` is the themed one -
  // the board accent with white text - and it is NAMED in forms.css beside the
  // other buttons that wear it rather than given a copy of those rules.
  assert.ok(/button\.primary\.js-copy-card-link-to-clipboard/.test(jade),
    'the button is a themed one');
  const forms = read('client/components/forms/forms.css');
  const rule = forms.slice(forms.indexOf('button.primary,'));
  assert.ok(/background: var\(--theme-accent/.test(rule.slice(0, 200)),
    'which paints it with the theme accent');
  assert.ok(/color: #fff/.test(rule.slice(0, 260)), 'and writes on it in white');
});

console.log(`\ncardSectionCollapse: ${passed} tests passed`);
