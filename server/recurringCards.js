import { SyncedCron } from 'meteor/percolate:synced-cron';
import { Cards } from '/models/cards.js'; 

SyncedCron.add({
  name: 'Create recurring cards',
  schedule(parser) {

    return parser.text('at 12:00 am');
  },
  job() {
    const now = new Date();
    Cards.find({ isRecurring: true }).forEach(card => {

      if (card.recurrencePattern === 'daily') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const alreadyExists = Cards.findOne({
          title: card.title,
          createdAt: { $gte: today },
          listId: card.listId,
        });
        if (!alreadyExists) {

          const { _id, createdAt, updatedAt, ...cardData } = card;
          Cards.insert({
            ...cardData,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

    });
  },
});
