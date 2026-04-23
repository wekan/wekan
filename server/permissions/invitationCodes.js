import Boards from '/models/boards';

Boards.deny({
  fetch: ['members'],
});
