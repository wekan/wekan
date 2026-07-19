import { Template } from 'meteor/templating';

const {
  fileNameSegments,
  hasInvisibleChars,
  decodeFileNameSafe,
  fileNamePlain,
  sanitizeDownloadFileName,
} = require('/imports/lib/fileNameDisplay');

// The reusable +safeFilename(name=...) template reads `this.name`.
Template.safeFilename.helpers({
  fnHasInvisible() {
    return hasInvisibleChars(decodeFileNameSafe(this.name));
  },
  fnSegments() {
    return fileNameSegments(this.name);
  },
});

// Global helpers usable in ANY template:
//   {{filenamePlain name}}    -> decoded name, invisible chars shown as [U+XXXX NAME]
//                                (plain string — for title="" / alt / JS text)
//   {{downloadFilename name}} -> decoded name with invisible chars REMOVED
//                                (for the download="" attribute / saved file name)
if (!Template.__safeFilenameHelpersRegistered) {
  Template.registerHelper('filenamePlain', name => fileNamePlain(name));
  Template.registerHelper('downloadFilename', name => sanitizeDownloadFileName(name));
  Template.__safeFilenameHelpersRegistered = true;
}
