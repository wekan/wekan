import { ReactiveVar } from 'meteor/reactive-var';

// The page's path as the header bar computes it: "All Boards / Remaining",
// "Admin Panel / Settings / Version".
//
// The header is the one thing rendered on every page and the one place that
// already works this out - it draws the path as the title's tooltip - and the
// browser tab needs the same words. Rather than compute it twice, or have
// `Utils` import a page component (which once ran a module before its own
// template was registered and threw), the header PUBLISHES it here and anyone
// who needs it reads it.
//
// A leaf: this module imports nothing but ReactiveVar, so it cannot be half of
// an import cycle. docs/Features/Board/Starred.md
export const headerPathVar = new ReactiveVar('');
