// WeKan disk-usage event logger (Admin Panel → Problems → Disk usage): the start
// and end of each filesystem's high-usage period, through server/lib/resourceLog.js.
import { resourceRecorder } from '/server/lib/resourceLog';

export const record = resourceRecorder({
  stream: 'disk', category: 'disk', bleed: 'DiskBleed', source: 'diskMonitor',
});

export default { record };
