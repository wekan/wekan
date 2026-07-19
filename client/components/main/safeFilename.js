import { Template } from 'meteor/templating';

const { cleanFileName, sanitizeDownloadFileName } = require('/imports/lib/fileNameDisplay');

// Global helpers for showing filenames safely EVERYWHERE (card attachments, admin
// panel, etc.). No template needed — a filename is always shown as a plain, clean
// string:
//   {{cleanFilename name}}    -> URL-decoded, invisible chars removed, exploit
//                                markup (HTML/JS/XML) removed, whitespace collapsed
//   {{downloadFilename name}} -> the same, but never empty (falls back to "download")
if (!Template.__safeFilenameHelpersRegistered) {
  Template.registerHelper('cleanFilename', name => cleanFileName(name));
  Template.registerHelper('downloadFilename', name => sanitizeDownloadFileName(name));
  Template.__safeFilenameHelpersRegistered = true;
}
