import { AsyncLocalStorage } from 'node:async_hooks';

const copies = new AsyncLocalStorage();

// Copies insert cards and activities, which can trigger another copy rule.
// A copy action may run once per causal copy chain; independent events
// have separate contexts and may copy the same source again.
export async function copyRuleCard({ activity, action, cache, canWrite }) {
  const destinationId = action.boardId || activity.boardId;
  if (![activity.cardId, activity.boardId, activity.userId, destinationId,
    action.listId, action.swimlaneId].every(value => typeof value === 'string' && value)) return null;
  const key = action._id || JSON.stringify([activity.boardId, destinationId, action.listId, action.swimlaneId]);
  const chain = copies.getStore() || new Set();
  if (chain.has(key)) return null;
  return copies.run(new Set([...chain, key]), async () => {
    const card = await cache.getCard(activity.cardId);
    if (!card || card.boardId !== activity.boardId || card.archived) return null;
    const [source, destination, list, swimlane] = await Promise.all([
      cache.getBoard(card.boardId), cache.getBoard(destinationId),
      cache.getList(action.listId), cache.getSwimlane(action.swimlaneId),
    ]);
    if (!source || !destination || source.archived || destination.archived ||
      !canWrite(activity.userId, source) || !canWrite(activity.userId, destination) ||
      !list || list.archived || list.boardId !== destinationId ||
      !swimlane || swimlane.archived || swimlane.boardId !== destinationId) return null;
    // Keep the cached source unchanged, including its placement and sort order.
    const copy = Object.assign(Object.create(Object.getPrototypeOf(card)), card);
    copy.sort = (await card.getSort(list._id, swimlane._id, false)) + 1;
    return await copy.copy(destinationId, swimlane._id, list._id);
  });
}
