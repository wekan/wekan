import { Exporter } from './exporter';
/* global JsonRoutes */
if (Meteor.isServer) {
  // todo XXX once we have a real API in place, move that route there
  // todo XXX also  share the route definition between the client and the server
  // so that we could use something like
  // `ApiRoutes.path('boards/export', boardId)``
  // on the client instead of copy/pasting the route path manually between the
  // client and the server.
  /**
   * @operation exportJson
   * @tag Boards
   *
   * @summary This route is used to export the board to a json file format.
   *
   * @description If user is already logged-in, pass loginToken as param
   * "authToken": '/api/boards/:boardId/export?authToken=:token'
   *
   * See https://blog.kayla.com.au/server-side-route-authentication-in-meteor/
   * for detailed explanations
   *
   * @param {string} boardId the ID of the board we are exporting
   * @param {string} authToken the loginToken
   */
  JsonRoutes.add('get', '/api/boards/:boardId/export', function(req, res) {
    const boardId = req.params.boardId;
    let user = null;
    const loginToken = req.query.authToken;
    if (loginToken) {
      const hashToken = Accounts._hashLoginToken(loginToken);
      user = Meteor.users.findOne({
        'services.resume.loginTokens.hashedToken': hashToken,
      });
    } else if (!Meteor.settings.public.sandstorm) {
      Authentication.checkUserId(req.userId);
      user = Users.findOne({ _id: req.userId, isAdmin: true });
    }
    const exporter = new Exporter(boardId);
    if (exporter.canExport(user)) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: exporter.build(),
      });
    } else {
      // we could send an explicit error message, but on the other hand the only
      // way to get there is by hacking the UI so let's keep it raw.
      JsonRoutes.sendResult(res, 403);
    }
  });

  /**
   * @operation exportCSV/TSV
   * @tag Boards
   *
   * @summary This route is used to export the board to a CSV or TSV file format.
   *
   * @description If user is already logged-in, pass loginToken as param
   *
   * See https://blog.kayla.com.au/server-side-route-authentication-in-meteor/
   * for detailed explanations
   *
   * @param {string} boardId the ID of the board we are exporting
   * @param {string} authToken the loginToken
   * @param {string} delimiter delimiter to use while building export. Default is comma ','
   */
  Picker.route('/api/boards/:boardId/export/csv', function(params, req, res) {
    const boardId = params.boardId;
    let user = null;
    const loginToken = params.query.authToken;
    if (loginToken) {
      const hashToken = Accounts._hashLoginToken(loginToken);
      user = Meteor.users.findOne({
        'services.resume.loginTokens.hashedToken': hashToken,
      });
    } else if (!Meteor.settings.public.sandstorm) {
      Authentication.checkUserId(req.userId);
      user = Users.findOne({
        _id: req.userId,
        isAdmin: true,
      });
    }
    const exporter = new Exporter(boardId);
    if (exporter.canExport(user)) {
      body = params.query.delimiter
        ? exporter.buildCsv(params.query.delimiter)
        : exporter.buildCsv();
      res.writeHead(200, {
        'Content-Length': body.length,
        'Content-Type': params.query.delimiter ? 'text/csv' : 'text/tsv',
      });
      res.write(body);
      res.end();
    } else {
      res.writeHead(403);
      res.end('Permission Error');
    }
  });
}
