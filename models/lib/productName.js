'use strict';

// Returns the configured Product name (Admin Panel / Settings / Layout /
// Product name, stored as Settings.productName) or the default 'WeKan' brand
// when none is set. Used so migrations and other branded UI show the admin's
// Product name instead of the hard-coded WeKan brand.
function productNameOrDefault(productName) {
  if (typeof productName === 'string') {
    const trimmed = productName.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return 'WeKan';
}

module.exports = { productNameOrDefault };
