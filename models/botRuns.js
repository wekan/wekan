import { Mongo } from 'meteor/mongo';

// Board Settings / Bots: one document per time a card is handed to a bot
// (models/lib/botRuns.js). Written only by the server - a dispatch, and what
// the bot's runner reports through WeKan's REST API - and published only to
// the board's admins, in the Bots view.
const BotRuns = new Mongo.Collection('bot_runs');

if (Meteor.isServer) {
  BotRuns.deny({ insert: () => true, update: () => true, remove: () => true });
}

export default BotRuns;
