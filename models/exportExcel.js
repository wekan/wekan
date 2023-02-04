import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { runOnServer } from './runOnServer';

runOnServer(function() {
  // the ExporterExcel class is only available on server and in order to import
  // it here we use runOnServer to have it inside a function instead of an
  // if (Meteor.isServer) block
  import { ExporterExcel } from './server/ExporterExcel';
  import { Picker } from 'meteor/communitypackages:picker';

  // todo XXX once we have a real API in place, move that route there
  // todo XXX also  share the route definition between the client and the server
  // so that we could use something like
  // `ApiRoutes.path('boards/exportExcel', boardId)``
  // on the client instead of copy/pasting the route path manually between the
  // client and the server.
  /**
   * @operation exportExcel
   * @tag Boards
   *
   * @summary This route is used to export the board Excel.
   *
   * @description If user is already logged-in, pass loginToken as param
   * "authToken": '/api/boards/:boardId/exportExcel?authToken=:token'
   *
   * See https://blog.kayla.com.au/server-side-route-authentication-in-meteor/
   * for detailed explanations
   *
   * @param {string} boardId the ID of the board we are exporting
   * @param {string} authToken the loginToken
   */
  Picker.route('/api/boards/:boardId/exportExcel', function (params, req, res) {
    const boardId = params.boardId;
    let user = null;
    let impersonateDone = false;
    let adminId = null;
    const loginToken = params.query.authToken;
    if (loginToken) {
      const hashToken = Accounts._hashLoginToken(loginToken);
      user = ReactiveCache.getUser({
        'services.resume.loginTokens.hashedToken': hashToken,
      });
      adminId = user._id.toString();
      impersonateDone = ReactiveCache.getImpersonatedUser({ adminId: adminId });
    } else if (!Meteor.settings.public.sandstorm) {
      Authentication.checkUserId(req.userId);
      user = ReactiveCache.getUser({
        _id: req.userId,
        isAdmin: true,
      });
    }

    let userLanguage = 'en';
    if(user && user.profile){
      userLanguage = user.profile.language
    }

    const exporterExcel = new ExporterExcel(boardId, userLanguage);
    if (exporterExcel.canExport(user) || impersonateDone) {
      if (impersonateDone) {
        ImpersonatedUsers.insert({
          adminId: adminId,
          boardId: boardId,
          reason: 'exportExcel',
        });
      }
      exporterExcel.build(res);
    } else {
      res.end(TAPi18n.__('user-can-not-export-excel'));
    }
  });
});
