// Board View / Shop (docs/Features/Board-Header/Board-Views/Shop.md): one
// document per order, to number the orders of a shop and to count them for the
// rate limit. The order itself - its lines, the buyer's name and contact
// details - is the card in the Orders list (server/shop.js); this keeps no
// personal data. Written only by server/shop.js, never published.
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

const ShopOrders = new Mongo.Collection('shopOrders');

if (Meteor.isServer) {
  ShopOrders.deny({ insert: () => true, update: () => true, remove: () => true });
  Meteor.startup(async () => {
    try {
      // One number per shop and year: two orders placed at once can not both
      // take it, the second is numbered again (server/shop.js insertNumbered).
      await ShopOrders.rawCollection().createIndex({ boardId: 1, year: 1, sequence: 1 }, { unique: true });
      await ShopOrders.rawCollection().createIndex({ boardId: 1, createdAt: -1 });
    } catch (e) { /* an index that can not be made leaves the numbering to its retry */ }
  });
}

export default ShopOrders;
