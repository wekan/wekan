'use strict';

// One copy of WeKan's text autolinks, for the app (models/lib/attachedCards.js,
// models/lib/customFieldLinks.js) and for the wekan-markdown package, which
// cannot import app code but can import an npm package. Before this package
// the markdown package carried its own copies of all three, kept in step by
// hand and by tests that compared the source text.

module.exports = {
  ...require('./externalLinkAutolink'),
  ...require('./externalLinkRules'),
  ...require('./cardUrlAutolink'),
};
