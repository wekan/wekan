// WeKan RAM-usage event logger (Admin Panel → Problems → RAM usage): the start
// and end of each sustained memory-pressure period, through server/lib/resourceLog.js.
import { resourceRecorder } from '/server/lib/resourceLog';

export const record = resourceRecorder({
  stream: 'ram', category: 'ram', bleed: 'RamBleed', source: 'ramMonitor',
});

export default { record };
