'use strict';

// A first draft of the accessibility statement (docs/Compliance/README.md
// row 6.1, WP-13): the parts [WAD] Art. 7(1) asks a public sector body's
// statement to have - the conformance status, what is not accessible and
// why, how to give feedback, the enforcement procedure, and the date - for
// Admin Panel / Settings / Accessibility to offer as the starting text. The
// operator completes it: who they are, their contact, their country's
// enforcement body, and anything they changed or added to WeKan.
//
// What it says about WeKan is what WeKan tests:
// tests/playwright/specs/45-axe-accessibility.e2e.js scans the pages with axe
// against WCAG 2.0, 2.1 and 2.2 A and AA, and checks that keyboard focus is
// never hidden. Pure: tests/accessibilityStatementDraft.test.cjs.

function draftAccessibilityStatement(today = new Date()) {
  const date = today.toISOString().slice(0, 10);
  return [
    '# Accessibility statement',
    '',
    '(The name of the organisation - fill in) wants this WeKan to be accessible, following the Web Content Accessibility Guidelines (WCAG) 2.2, level AA.',
    '',
    '## Compliance status',
    '',
    'This WeKan is **partially conformant** with WCAG 2.2 AA: most of it conforms, and the parts listed below do not yet fully.',
    '',
    'Its pages are tested automatically against the WCAG 2.0, 2.1 and 2.2 A and AA rules and for keyboard focus that is never hidden. Automated tests cover only part of WCAG, so this is not a full conformance claim.',
    '',
    '## Content that is not accessible',
    '',
    '- Content people add - card descriptions, comments, attachments, images without text alternatives - is as accessible as its authors make it.',
    '- Moving cards, lists and swimlanes by dragging has a menu alternative on each (Move card, Move list, Move swimlane).',
    '- (Anything else you know of - fill in.)',
    '',
    '## Feedback and contact',
    '',
    'If something in this WeKan is not accessible to you, tell us: (e-mail address or form - fill in). We answer within (number - fill in) days.',
    '',
    '## Enforcement procedure',
    '',
    'If our answer does not satisfy you, you can contact (your country\'s enforcement body for the Web Accessibility Directive, with its address - fill in).',
    '',
    '## Preparation of this statement',
    '',
    `This statement was prepared on ${date}, from WeKan's automated accessibility tests and (your own review - fill in). It was last reviewed on ${date}.`,
    '',
  ].join('\n');
}

module.exports = { draftAccessibilityStatement };
