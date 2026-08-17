import RecoveryEvents from '/models/recoveryEvents';

const { resolveClientKey } = require('/server/lib/loginAttemptThrottle');
const { classifyAddress } = require('/models/lib/ipAddress');

// Append one proxy-aware Recovery audit row. One connection has one address,
// so exactly one of ipv4 / ipv6 is populated; IPv4-mapped IPv6 is normalized
// into ipv4 by the same classifier used by the other Problems reports.
export async function recordRecoveryAudit({
  type,
  user,
  connection,
  done,
  deletedData = false,
  boards = [],
  detail,
  severity,
}) {
  const rawAddress = resolveClientKey({
    headers: connection?.httpHeaders,
    socketAddress: connection?.clientAddress,
    forwardedCount: process.env.HTTP_FORWARDED_COUNT,
  });
  const { ipv4, ipv6 } = classifyAddress(rawAddress);
  const boundedBoards = (Array.isArray(boards) ? boards : []).slice(0, 200);

  return RecoveryEvents.record(type, {
    done: done === true,
    deletedData: deletedData === true,
    userId: user?._id || undefined,
    username: user?.username || undefined,
    ipv4: ipv4 || undefined,
    ipv6: ipv6 || undefined,
    boardIds: boundedBoards.map(board => String(board?._id || '')).filter(Boolean),
    boardTitles: boundedBoards.map(board => String(board?.title || '(unknown title)')),
    detail,
    severity: severity || (done ? 'info' : 'error'),
    source: 'admin-panel',
  });
}

export default { recordRecoveryAudit };
