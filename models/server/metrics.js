import { Meteor } from 'meteor/meteor';
import Users from '../users';

function acceptedIpAddress(ipAddress) {
  const trustedIpAddress = process.env.METRICS_ACCEPTED_IP_ADDRESS;
  return (
    trustedIpAddress !== undefined &&
    trustedIpAddress.split(',').includes(ipAddress)
  );
}

// Resolve the client IP used for the METRICS_ACCEPTED_IP_ADDRESS allowlist.
//
// Security fix (reported by meifukun): the endpoint previously trusted the
// client-supplied `X-Forwarded-For` header UNCONDITIONALLY, so anyone who could
// reach /metrics directly could send `X-Forwarded-For: <whitelisted-ip>` and pass
// the allowlist. By default we now use ONLY the real socket peer address.
//
// Operators genuinely behind reverse proxies can opt back in with
// METRICS_TRUST_PROXY set to the number of trusted proxy hops (e.g. `1`). The
// client IP is then read from the Nth position from the RIGHT of the XFF chain —
// the address your own proxy appended, which a client cannot forge — so a forged
// left-most entry is ignored.
function metricsClientIp(req) {
  const remote = req.socket.remoteAddress;
  const trust = process.env.METRICS_TRUST_PROXY;
  if (!trust || trust === 'false' || trust === '0') {
    return remote;
  }
  const xff = req.headers['x-forwarded-for'];
  if (!xff) return remote;
  const list = String(xff).split(',').map(s => s.trim()).filter(Boolean);
  if (!list.length) return remote;
  const hops = parseInt(trust, 10);
  const n = Number.isInteger(hops) && hops > 0 ? hops : 1;
  const idx = list.length - n;
  return idx >= 0 ? list[idx] : remote;
}

function accessToken(req) {
  const valid_token = process.env.METRICS_ACCESS_TOKEN;
  let token;
  if (req.headers && req.headers.authorization) {
    var parts = req.headers.authorization.split(" ");

    if (parts.length === 2) {
      var scheme = parts[0];
      var credentials = parts[1];

      if (/^Bearer$/i.test(scheme)) {
        token = credentials;
      }
    }
  }
  if (!token && req.query && req.query.access_token) {
    token = req.query.access_token;
  }
  return (
    token !== undefined &&
    valid_token !== undefined &&
    token == valid_token
  );
}

const getBoardTitleWithMostActivities = async (dateWithXdaysAgo, nbLimit) => {
  return await Activities.rawCollection()
    .aggregate([
      {
        $match: { modifiedAt: { $gte: dateWithXdaysAgo } },
      },
      {
        $group: { _id: '$boardId', count: { $sum: 1 } },
      },
      {
        $sort: { count: -1 },
      },
      {
        $lookup: { from: 'boards', localField: '_id', foreignField: '_id', as: 'lookup' },
      },
      {
        $project: { 'lookup.title': 1, count: 1 },
      },
    ])
    .limit(nbLimit)
    .toArray();
};

const getBoards = async (boardIds) => {
  const ret = await ReactiveCache.getBoards({ _id: { $in: boardIds } });
  return ret;
};
Meteor.startup(() => {
  WebApp.handlers.use('/metrics', async (req, res, next) => {
    try {
      // Client-supplied X-Forwarded-For is trusted ONLY when METRICS_TRUST_PROXY
      // is set (see metricsClientIp); by default the real socket address is used
      // so a forged XFF cannot bypass METRICS_ACCEPTED_IP_ADDRESS.
      const ipAddress = metricsClientIp(req);

      // List of trusted ip adress will be found in environment variable "METRICS_ACCEPTED_IP_ADDRESS" (separeted with commas)
      if (acceptedIpAddress(ipAddress) || (accessToken(req))) {
        let metricsRes = '';
        let resCount = 0;
        //connected users
        metricsRes += '# Number of connected users\n';

        // Get number of connected user by using meteor socketJs
        const allOpenedSockets = Meteor.server.stream_server.open_sockets;
        let connectedUserIds = [];
        allOpenedSockets.forEach(
          (socket) =>
            socket._meteorSession.userId !== null &&
            connectedUserIds.push(socket._meteorSession.userId),
        );
        resCount = connectedUserIds.length; // KPI 1
        metricsRes += 'wekan_connectedUsers ' + resCount + '\n';

        //registered users
        metricsRes += '# Number of registered users\n';

        // Get number of registered user
        resCount = (await ReactiveCache.getUsers({})).length; // KPI 2
        metricsRes += 'wekan_registeredUsers ' + resCount + '\n';
        resCount = 0;

        //board numbers
        metricsRes += '# Number of registered boards\n';

        // Get number of registered boards
        resCount = (await ReactiveCache.getBoards({ archived: false, type: 'board' })).length; // KPI 3
        metricsRes += 'wekan_registeredboards ' + resCount + '\n';
        resCount = 0;

        //board numbers by registered users
        metricsRes += '# Number of registered boards by registered users\n';

        // Get number of registered boards by registered users
        resCount =
          (await ReactiveCache.getBoards({ archived: false, type: 'board' })).length /
          (await ReactiveCache.getUsers({})).length; // KPI 4
        metricsRes +=
          'wekan_registeredboardsBysRegisteredUsers ' + resCount + '\n';
        resCount = 0;

        //board numbers with only one member
        metricsRes += '# Number of registered boards\n';

        // Get board numbers with only one member
        resCount = (await ReactiveCache.getBoards({
          archived: false,
          type: 'board',
          members: { $size: 1 },
        })).length; // KPI 5
        metricsRes +=
          'wekan_registeredboardsWithOnlyOneMember ' + resCount + '\n';
        resCount = 0;

        // KPI 6 : - store last login date
        //         KPI 6 = count where date of last connection > x days
        // Cutting in label since 5 days / 10 days / 20 days / 30 days

        //Number of users with last connection dated 5 days ago
        metricsRes +=
          '# Number of users with last connection dated 5 days ago\n';

        // Get number of users with last connection dated 5 days ago
        let xdays = 5;
        let dateWithXdaysAgo = new Date(
          new Date() - xdays * 24 * 60 * 60 * 1000,
        );
        resCount = (await ReactiveCache.getUsers({
          lastConnectionDate: { $gte: dateWithXdaysAgo },
        })).length; // KPI 5
        metricsRes +=
          'wekan_usersWithLastConnectionDated5DaysAgo ' + resCount + '\n';
        resCount = 0;

        metricsRes +=
          '# Number of users with last connection dated 10 days ago\n';

        // Get number of users with last connection dated 10 days ago
        xdays = 10;
        dateWithXdaysAgo = new Date(new Date() - xdays * 24 * 60 * 60 * 1000);
        resCount = (await ReactiveCache.getUsers({
          lastConnectionDate: { $gte: dateWithXdaysAgo },
        })).length; // KPI 5
        metricsRes +=
          'wekan_usersWithLastConnectionDated10DaysAgo ' + resCount + '\n';
        resCount = 0;

        metricsRes +=
          '# Number of users with last connection dated 20 days ago\n';

        // Get number of users with last connection dated 20 days ago
        xdays = 20;
        dateWithXdaysAgo = new Date(new Date() - xdays * 24 * 60 * 60 * 1000);
        resCount = (await ReactiveCache.getUsers({
          lastConnectionDate: { $gte: dateWithXdaysAgo },
        })).length; // KPI 5
        metricsRes +=
          'wekan_usersWithLastConnectionDated20DaysAgo ' + resCount + '\n';
        resCount = 0;

        metricsRes +=
          '# Number of users with last connection dated 30 days ago\n';

        // Get number of users with last connection dated 20 days ago
        xdays = 30;
        dateWithXdaysAgo = new Date(new Date() - xdays * 24 * 60 * 60 * 1000);
        resCount = (await ReactiveCache.getUsers({
          lastConnectionDate: { $gte: dateWithXdaysAgo },
        })).length; // KPI 5
        metricsRes +=
          'wekan_usersWithLastConnectionDated30DaysAgo ' + resCount + '\n';
        resCount = 0;
        // TO DO:
        // connection average: ((disconnection date - last connection date) + (last average)) / 2
        // KPI 7 : sum of connection average / number of users (ignore users with 0 average)

        metricsRes +=
          '# Top 10 boards with most activities dated 30 days ago\n';
        //Get top 10 table with most activities in current month
        const boardTitleWithMostActivities = await getBoardTitleWithMostActivities(
          dateWithXdaysAgo,
          xdays,
        );

        const boardWithMostActivities = boardTitleWithMostActivities.map(
          (board) => board.lookup[0].title,
        );

        boardWithMostActivities.forEach((title, index) => {
          metricsRes +=
            `wekan_top10BoardsWithMostActivities{n="${title}"} ${
              index + 1
            }` + '\n';
        });

        res.writeHead(200); // HTTP status
        res.end(metricsRes);
      } else {
        // If the request carried an X-Forwarded-For header but was still denied,
        // that is a likely forged-whitelisted-IP attempt (MetricsBleed) — record it.
        if (req.headers['x-forwarded-for']) {
          try {
            require('/server/lib/securityLog').record({
              key: 'spoofing.xff', action: 'blocked', source: 'metrics',
              detail: 'denied /metrics with X-Forwarded-For present (socket ' + (req.socket && req.socket.remoteAddress) + ')',
            });
          } catch (e) { /* logging must never break the endpoint */ }
        }
        res.writeHead(401); // HTTP status
        res.end(
          'IpAddress: ' +
            ipAddress +
            ' is not authorized to perform this action !!\n',
        );
      }
    } catch (e) {
      res.writeHead(500); // HTTP status
      res.end(e.toString());
    }
  });
});
