// What a finished check-native.mjs run means. Pure, so it is tested without Bun.
//
// Both FreeBSD Bun jobs reached the native check and then ran into the
// supervisor's three-minute deadline with no output at all: the run was
// SIGKILLed with its buffered console output, so the log could not say whether
// an operation hung or every check had passed and Bun hung while exiting - a
// known FreeBSD deadlock in JSC's thread-suspend handshake (oven-sh/bun#44595,
// fix proposed in #44596). The check now writes each step unbuffered, and this
// tells the two apart:
//
//   exit 0                                    passed
//   killed at the deadline AFTER the marker   passed; warn that Bun hung on exit
//   anything else                             failed, naming the last step
export const PASS_MARKER = 'Native Bun checks passed on';
export const STEP_PREFIX = 'native check: ';

export function nativeCheckVerdict({ status, signal, error, stdout = '', stderr = '' }) {
  const passed = stdout.split(/\r?\n/).some(line => line.startsWith(PASS_MARKER));
  if (status === 0 && !error) {
    if (!passed) return { ok: false, message: 'Native Bun check exited 0 without reporting that every check passed' };
    return { ok: true };
  }
  const timedOut = error?.code === 'ETIMEDOUT' || signal === 'SIGKILL';
  if (timedOut && passed) {
    return {
      ok: true,
      warning: 'Every native check passed, then Bun did not exit and was killed at the deadline '
        + '(FreeBSD exit deadlock, oven-sh/bun#44595).',
    };
  }
  const steps = stderr.split(/\r?\n/).filter(line => line.startsWith(STEP_PREFIX));
  const last = steps.at(-1);
  const where = last ? ` (last step: ${last.slice(STEP_PREFIX.length)})` : ' (before the first package)';
  const how = timedOut ? 'did not finish before the deadline' : `failed: ${error?.message || `exit ${status}`}`;
  return { ok: false, message: `Native Bun check ${how}${where}` };
}
