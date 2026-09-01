import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { WebApp } from 'meteor/webapp';
import { Random } from 'meteor/random';
import getSlug from 'limax';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Users from '/models/users';
import { DEFAULT_BOARD_THEME_COLOR } from '/config/const';
import { sendJsonResult } from '/server/apiMiddleware';
const {
  normalizeReviewableTemplatePackage,
} = require('/models/lib/templatePackage');

const TEMPLATE_CONTAINER_TITLE = 'Templates';
const CARD_TEMPLATES_TITLE = 'Card Templates';
const LIST_TEMPLATES_TITLE = 'List Templates';
const BOARD_TEMPLATES_TITLE = 'Board Templates';
const INSTALLED_PACKAGES_LIST_TITLE = 'Installed Packages';

const ownerMember = userId => ({
  userId,
  isAdmin: true,
  isActive: true,
  isNoComments: false,
  isCommentOnly: false,
  isWorker: false,
});

async function insertTemplateContainer(userId) {
  const boardId = await Boards.insertAsync({
    title: TEMPLATE_CONTAINER_TITLE,
    slug: 'templates',
    permission: 'private',
    type: 'template-container',
    color: DEFAULT_BOARD_THEME_COLOR,
    members: [ownerMember(userId)],
  });
  const cardSwimlaneId = await Swimlanes.insertAsync({
    title: CARD_TEMPLATES_TITLE,
    boardId,
    sort: 1,
    type: 'template-container',
  });
  const listSwimlaneId = await Swimlanes.insertAsync({
    title: LIST_TEMPLATES_TITLE,
    boardId,
    sort: 2,
    type: 'template-container',
  });
  const boardSwimlaneId = await Swimlanes.insertAsync({
    title: BOARD_TEMPLATES_TITLE,
    boardId,
    sort: 3,
    type: 'template-container',
  });
  await Users.updateAsync(userId, {
    $set: {
      'profile.templatesBoardId': boardId,
      'profile.cardTemplatesSwimlaneId': cardSwimlaneId,
      'profile.listTemplatesSwimlaneId': listSwimlaneId,
      'profile.boardTemplatesSwimlaneId': boardSwimlaneId,
    },
  });
  return { boardId, boardSwimlaneId };
}

async function ensureTemplateContainer(userId) {
  const user = await Users.findOneAsync(userId, {
    fields: {
      'profile.templatesBoardId': 1,
      'profile.boardTemplatesSwimlaneId': 1,
    },
  });
  const profile = (user && user.profile) || {};
  const existingBoard = profile.templatesBoardId
    ? await Boards.findOneAsync(profile.templatesBoardId)
    : null;
  const existingBoardSwimlane = profile.boardTemplatesSwimlaneId
    ? await Swimlanes.findOneAsync(profile.boardTemplatesSwimlaneId)
    : null;
  if (existingBoard && existingBoardSwimlane) {
    return {
      boardId: existingBoard._id,
      boardSwimlaneId: existingBoardSwimlane._id,
    };
  }
  return await insertTemplateContainer(userId);
}

async function ensureInstalledPackagesList(boardId, swimlaneId) {
  const existing = await Lists.findOneAsync({
    boardId,
    swimlaneId,
    title: INSTALLED_PACKAGES_LIST_TITLE,
    archived: false,
  });
  if (existing) return existing._id;
  return await Lists.insertAsync({
    title: INSTALLED_PACKAGES_LIST_TITLE,
    boardId,
    swimlaneId,
    sort: 1,
    type: 'list',
  });
}

async function rollbackTemplateInstall(created) {
  await Cards.removeAsync({ _id: { $in: created.cardIds } });
  await Lists.removeAsync({ _id: { $in: created.listIds } });
  await Swimlanes.removeAsync({ _id: { $in: created.swimlaneIds } });
  await Boards.removeAsync({ _id: { $in: created.boardIds } });
}

async function installPackage(userId, payload) {
  const normalized = normalizeReviewableTemplatePackage(payload);
  if (!normalized.valid) throw new Meteor.Error(normalized.error, normalized.field);

  const templateContainer = await ensureTemplateContainer(userId);
  const containerListId = await ensureInstalledPackagesList(
    templateContainer.boardId,
    templateContainer.boardSwimlaneId,
  );
  const now = new Date();
  const created = {
    boardIds: [],
    swimlaneIds: [],
    listIds: [],
    cardIds: [],
  };

  try {
    const boardId = await Boards.insertAsync({
      title: normalized.package.title,
      slug: getSlug(normalized.package.title) || 'template-board',
      description: normalized.package.description,
      permission: 'private',
      type: 'template-board',
      color: DEFAULT_BOARD_THEME_COLOR,
      members: [ownerMember(userId)],
      templatePackageId: normalized.package.packageId,
      templatePackageReviewHash: normalized.review.hash,
      templatePackageInstalledBy: userId,
      templatePackageInstalledAt: now,
    });
    created.boardIds.push(boardId);

    const swimlaneId = await Swimlanes.insertAsync({
      title: 'Default',
      boardId,
      sort: 1,
      type: 'swimlane',
    });
    created.swimlaneIds.push(swimlaneId);

    const board = await Boards.findOneAsync(boardId);
    for (const [listIndex, list] of normalized.package.lists.entries()) {
      const listId = await Lists.insertAsync({
        title: list.title,
        boardId,
        swimlaneId,
        sort: listIndex + 1,
        type: 'list',
      });
      created.listIds.push(listId);

      for (const [cardIndex, card] of list.cards.entries()) {
        const cardId = await Cards.insertAsync({
          title: card.title,
          description: card.description,
          boardId,
          listId,
          swimlaneId,
          sort: cardIndex + 1,
          type: 'cardType-card',
          cardNumber: await board.getNextCardNumber(),
          userId,
        });
        created.cardIds.push(cardId);
      }
    }

    const containerBoard = await Boards.findOneAsync(templateContainer.boardId);
    const linkedCardId = await Cards.insertAsync({
      title: normalized.package.title,
      boardId: templateContainer.boardId,
      listId: containerListId,
      swimlaneId: templateContainer.boardSwimlaneId,
      sort: Date.now(),
      type: 'cardType-linkedBoard',
      linkedId: boardId,
      cardNumber: await containerBoard.getNextCardNumber(),
      userId,
    });
    created.cardIds.push(linkedCardId);

    return {
      boardId,
      linkedCardId,
      templatesBoardId: templateContainer.boardId,
      templatesListId: containerListId,
      review: normalized.review,
      packageId: normalized.package.packageId,
      title: normalized.package.title,
      slug: board.slug || 'template-board',
    };
  } catch (error) {
    await rollbackTemplateInstall(created);
    throw error;
  }
}

Meteor.methods({
  async 'templatePackages.install'(payload) {
    check(payload, Object);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    return await installPackage(this.userId, payload);
  },
});

WebApp.handlers.post('/api/template-packages/install', async function(req, res) {
  try {
    if (!req.userId) {
      sendJsonResult(res, {
        code: 401,
        data: { error: 'not-authorized' },
      });
      return;
    }
    const result = await installPackage(req.userId, req.body || {});
    sendJsonResult(res, {
      code: 200,
      data: result,
    });
  } catch (error) {
    sendJsonResult(res, {
      code: error.statusCode || error.code || 400,
      data: { error: error.error || error.reason || error.message || 'Error' },
    });
  }
});

export { installPackage };
