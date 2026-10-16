// WeKan CPU-usage event logger (Admin Panel → Problems → CPU usage): the start
// and end of each sustained high-CPU period, through server/lib/resourceLog.js.
import { resourceRecorder } from '/server/lib/resourceLog';

export const record = resourceRecorder({
  stream: 'cpu', category: 'cpu', bleed: 'CpuBleed', source: 'cpuMonitor',
});

export default { record };
