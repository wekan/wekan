import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import Attachments from '/models/attachments';
import { fileStoreStrategyFactory as attachmentsFactory } from '/models/attachments.server';
import { fileStoreStrategyFactory as avatarsFactory } from '/models/avatars.server';
import { rename } from '/models/lib/fileStoreStrategy';
import { correctedNameForStoredFile } from '/models/lib/fileTypeCorrection';

// Correct the extensions of ALREADY-uploaded files.
//
// New uploads are corrected in the onAfterUpload hooks; this method fixes files
// that were stored BEFORE that hook existed (the field problem: a file saved with
// the wrong/missing extension opens the wrong app on double-click). It reuses the
// general, storage-agnostic detector (fileTypeCorrection.js) which streams only a
// small header of each file to WRITABLE_PATH/files/temp, detects the type with the
// `file` command, then deletes the temp file — so it works for filesystem, GridFS
// and cloud storage without loading whole files into RAM.
//
// Admin-only and BOUNDED (processes at most `limit` files per call) so it never
// stalls a large instance; call repeatedly until `remaining` is 0.

async function correctBatch(collection, factory, limit) {
  const result = { checked: 0, corrected: 0, errors: 0, examples: [] };
  // Read directly from the collection so this works for both Attachments and Avatars.
  const cursor = collection.find({}, { limit });
  const docs = await cursor.fetchAsync();

  // Governor: label the activity and yield the CPU between files when the machine
  // is already busy, so this batch never starves other software (see cpuMonitor).
  let cpu;
  try { cpu = require('/server/lib/cpuMonitor'); cpu.setActivity('correcting file extensions'); } catch (e) { /* optional */ }

  for (const fileObj of docs) {
    result.checked++;
    if (cpu) { try { await cpu.pauseIfBusy(); } catch (e) { /* best effort */ } }
    try {
      const { name, changed, detectedMime } = await correctedNameForStoredFile(fileObj, factory);
      if (changed && name) {
        const from = fileObj.name;
        rename(fileObj, name, factory);
        result.corrected++;
        if (result.examples.length < 20) {
          result.examples.push({ from, to: name });
        }
        // Log to Admin Panel / Problems: who uploaded, why, when, where.
        try {
          const { sanitizationReasons } = require('/models/lib/uploadFileName');
          await require('/server/lib/filenameSanitizeLog').logFilenameSanitized({
            fileObj, source: 'existingFileCorrection',
            reasons: sanitizationReasons(from, detectedMime || fileObj.type, name),
            from, to: name,
          });
        } catch (e) { /* best effort */ }
      }
    } catch (error) {
      result.errors++;
      console.error('[correctFileExtensions] failed for', fileObj && fileObj._id, error);
    }
  }
  if (cpu) { try { cpu.setActivity(''); } catch (e) { /* best effort */ } }
  return result;
}

Meteor.methods({
  // Correct up to `limit` attachment (and optionally avatar) extensions. Returns
  // per-collection counts. Admin only.
  async 'correctFileExtensions.run'(limit = 200, includeAvatars = true) {
    check(limit, Match.Optional(Number));
    check(includeAvatars, Match.Optional(Boolean));

    const user = await ReactiveCache.getCurrentUser();
    if (!(user && user.isAdmin)) {
      throw new Meteor.Error('not-authorized', 'Only admins can correct file extensions');
    }

    const cap = Math.max(1, Math.min(1000, Number(limit) || 200));
    const attachments = await correctBatch(Attachments, attachmentsFactory, cap);

    let avatars = null;
    if (includeAvatars) {
      try {
        const Avatars = require('/models/avatars').default;
        avatars = await correctBatch(Avatars, avatarsFactory, cap);
      } catch (e) {
        console.error('[correctFileExtensions] avatars pass failed:', e);
      }
    }

    return { attachments, avatars };
  },
});
