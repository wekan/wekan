'use strict';

// Returns the configured Product name (Admin Panel / Settings / Layout /
// Product name, stored as Settings.productName) or the default 'Jalor' brand
// when none is set. Used so migrations and other branded UI show the admin's
// Product name instead of the hard-coded product brand.
//
// Jalor: this ONE function is where the product's own name lives. Everything
// that shows a brand - the document title, the header logo's alternative text,
// the import page, the migration dashboard - resolves through it, so renaming
// the fork is this string and the assets beside it, not a search and replace
// across the tree. The upstream project's name stays in LICENSE, in the
// copyright notices and in the documentation, where it is attribution and not
// branding.
function productNameOrDefault(productName) {
  if (typeof productName === 'string') {
    const trimmed = productName.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return 'Jalor';
}

export { productNameOrDefault };
