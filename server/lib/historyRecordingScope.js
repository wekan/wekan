import { AsyncLocalStorage } from 'node:async_hooks';

/*
 * "Do not record what a restore itself writes."
 *
 * A restore deliberately goes back through the ordinary collection setters
 * (History.md §8.2), so validation, the collection hooks and Activities all run
 * exactly as they do for a human edit - `.direct` would skip them and is not
 * used. The cost of that correctness is that the field-diffing `after.update`
 * hook sees the restore's own write and records it as an ordinary `edited`
 * change. Restoring one title therefore left TWO rows in History: the `restored`
 * row the restore wrote on purpose, and an `edited` row nobody made, describing
 * the same write, sitting directly above it.
 *
 * So recording - and only recording - is switched off for the duration of the
 * applier. Everything else the write triggers still happens.
 *
 * AsyncLocalStorage rather than a module-level boolean: the server handles
 * several requests at once and a plain flag set during one user's restore would
 * silently swallow another user's edit that happened to land inside the same
 * window. A store is per async context and follows the awaits of the call that
 * opened it, so it can only ever cover the restore's own writes.
 */
const storage = new AsyncLocalStorage();

/** Run `fn` with history recording suppressed for whatever it writes. */
export function withoutRecording(fn) {
  return storage.run(true, fn);
}

/** True while inside withoutRecording - checked by the recording hooks. */
export function isRecordingSuppressed() {
  return storage.getStore() === true;
}
