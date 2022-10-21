import { Meteor } from 'meteor/meteor';
import Users from '../users';

function acceptedIpAddress(ipAddress) {
  const trustedIpAddress = process.env.WEKAN_METRICS_ACCEPTED_IP_ADDRESS;
  return (
    trustedIpAddress !== undefined &&
    trustedIpAddress.split(',').includes(ipAddress)
  );
}

const getBoardIdWithMostActivities = (dateWithXdaysAgo, nbLimit) => {
  return Promise.await(
    Activities.rawCollection()
      .aggregate([
        {
          $match: {
            modifiedAt: { $gte: dateWithXdaysAgo },
          },
        },
        { $group: { _id: '$boardId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .limit(nbLimit)
      .toArray(),
  );
};

const getBoards = (boardIds) => {
  return Boards.find({ _id: { $in: boardIds } }).fetch();
};
Meteor.startup(() => {
  WebApp.connectHandlers.use('/metrics', (req, res, next) => {
    try {
      const ipAddress =
        req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      // if(process.env.TRUST_PROXY_FORXARD)
      // {
      //   const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress
      // }else{
      //   const ipAddress = req.socket.remoteAddress
      // }

      // List of trusted ip adress will be found in environment variable "WEKAN_METRICS_ACCEPTED_IP_ADDRESS" (separeted with commas)
      if (acceptedIpAddress(ipAddress)) {
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
        resCount = Users.find({}).count(); // KPI 2
        metricsRes += 'wekan_registeredUsers ' + resCount + '\n';
        resCount = 0;

        //board numbers
        metricsRes += '# Number of registered boards\n';

        // Get number of registered boards
        resCount = Boards.find({ archived: false, type: 'board' }).count(); // KPI 3
        metricsRes += 'wekan_registeredboards ' + resCount + '\n';
        resCount = 0;

        //board numbers by registered users
        metricsRes += '# Number of registered boards by registered users\n';

        // Get number of registered boards by registered users
        resCount =
          Boards.find({ archived: false, type: 'board' }).count() /
          Users.find({}).count(); // KPI 4
        metricsRes +=
          'wekan_registeredboardsBysRegisteredUsers ' + resCount + '\n';
        resCount = 0;

        //board numbers with only one member
        metricsRes += '# Number of registered boards\n';

        // Get board numbers with only one member
        resCount = Boards.find({
          archived: false,
          type: 'board',
          members: { $size: 1 },
        }).count(); // KPI 5
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
        resCount = Users.find({
          lastConnectionDate: { $gte: dateWithXdaysAgo },
        }).count(); // KPI 5
        metricsRes +=
          'wekan_usersWithLastConnectionDated5DaysAgo ' + resCount + '\n';
        resCount = 0;

        metricsRes +=
          '# Number of users with last connection dated 10 days ago\n';

        // Get number of users with last connection dated 10 days ago
        xdays = 10;
        dateWithXdaysAgo = new Date(new Date() - xdays * 24 * 60 * 60 * 1000);
        resCount = Users.find({
          lastConnectionDate: { $gte: dateWithXdaysAgo },
        }).count(); // KPI 5
        metricsRes +=
          'wekan_usersWithLastConnectionDated10DaysAgo ' + resCount + '\n';
        resCount = 0;

        metricsRes +=
          '# Number of users with last connection dated 20 days ago\n';

        // Get number of users with last connection dated 20 days ago
        xdays = 20;
        dateWithXdaysAgo = new Date(new Date() - xdays * 24 * 60 * 60 * 1000);
        resCount = Users.find({
          lastConnectionDate: { $gte: dateWithXdaysAgo },
        }).count(); // KPI 5
        metricsRes +=
          'wekan_usersWithLastConnectionDated20DaysAgo ' + resCount + '\n';
        resCount = 0;

        metricsRes +=
          '# Number of users with last connection dated 30 days ago\n';

        // Get number of users with last connection dated 20 days ago
        xdays = 30;
        dateWithXdaysAgo = new Date(new Date() - xdays * 24 * 60 * 60 * 1000);
        resCount = Users.find({
          lastConnectionDate: { $gte: dateWithXdaysAgo },
        }).count(); // KPI 5
        metricsRes +=
          'wekan_usersWithLastConnectionDated30DaysAgo ' + resCount + '\n';
        resCount = 0;
        // TO DO:
        // connection average: ((disconnection date - last connection date) + (last average)) / 2
        // KPI 7 : sum of connection average / number of users (ignore users with 0 average)

        metricsRes +=
          '# Top 10 boards with most activities dated 30 days ago\n';
        //Get top 10 table with most activities in current month
        const boardIdWithMostActivities = getBoardIdWithMostActivities(
          dateWithXdaysAgo,
          xdays,
        );
        const boardWithMostActivities = boardIdWithMostActivities.map(
          (board) => board._id,
        );

        getBoards(boardWithMostActivities).forEach((board, index) => {
          metricsRes +=
            `wekan_top10BoardsWithMostActivities{n=${board.title}} ${
              index + 1
            }` + '\n';
        });

        res.writeHead(200); // HTTP status
        res.end(metricsRes);
      } else {
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
