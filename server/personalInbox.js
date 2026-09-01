import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { WebApp } from 'meteor/webapp';
import { DEFAULT_BOARD_THEME_COLOR } from '/config/const';
import { ReactiveCache } from '/imports/reactiveCache';
import Attachments from '/models/attachments';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';
import { sendJsonResult } from '/server/apiMiddleware';
const { isHelperBoardTitle } = require('/models/lib/helperBoards');
const {
  PERSONAL_INBOX_TITLE,
  PERSONAL_INBOX_LIST_TITLE,
  PERSONAL_INBOX_SWIMLANE_TITLE,
  personalInboxResourceIds,
  normalizeCaptureUrl,
  isOwnedPersonalInbox,
  isPersonalInboxCard,
} = require('/models/lib/personalInbox');
const {
  normalizeAllowedSenders,
  senderIsAllowed,
  generateEmailInboxToken,
  hashEmailInboxToken,
  verifyEmailInboxToken,
  normalizeEmailInboxPayload,
  emailCaptureDescription,
} = require('/models/lib/emailInboxCapture');
const {
  normalizeConnectorTypes,
  normalizeConnectorOrigins,
  connectorTypeIsAllowed,
  connectorOriginIsAllowed,
  generateConnectorToken,
  hashConnectorToken,
  verifyConnectorToken,
  normalizeConnectorPayload,
  connectorCaptureDescription,
} = require('/models/lib/connectorCapture');

const ownerMember = userId => ({
  userId,
  isAdmin: true,
  isActive: true,
  isNoComments: false,
  isCommentOnly: false,
  isWorker: false,
});

async function insertIfMissing(collection, id, document) {
  const existing = await collection.findOneAsync(id);
  if (existing) return existing;
  try {
    await collection.insertAsync({ _id: id, ...document });
  } catch (error) {
    // Two tabs can provision the same deterministic resource concurrently.
    // Only tolerate that exact race; any other insert failure remains visible.
    const raced = await collection.findOneAsync(id);
    if (!raced) throw error;
    return raced;
  }
  return await collection.findOneAsync(id);
}

export async function ensurePersonalInbox(userId) {
  const ids = personalInboxResourceIds(userId);
  if (!ids) throw new Meteor.Error('not-authorized');

  let board = await insertIfMissing(Boards, ids.boardId, {
    title: PERSONAL_INBOX_TITLE,
    permission: 'private',
    type: 'board',
    color: DEFAULT_BOARD_THEME_COLOR,
    migrationVersion: 1,
    personalInboxOwnerId: userId,
    members: [ownerMember(userId)],
  });
  if (!isOwnedPersonalInbox(board, userId)) {
    throw new Meteor.Error('not-authorized');
  }
  if (
    board.color !== DEFAULT_BOARD_THEME_COLOR ||
    (Array.isArray(board.customThemeColors) && board.customThemeColors.length)
  ) {
    await Boards.updateAsync(ids.boardId, {
      $set: { color: DEFAULT_BOARD_THEME_COLOR },
      $unset: { customThemeColors: '' },
    });
    board = await Boards.findOneAsync(ids.boardId);
  }

  const swimlane = await insertIfMissing(Swimlanes, ids.swimlaneId, {
    title: PERSONAL_INBOX_SWIMLANE_TITLE,
    boardId: ids.boardId,
    sort: 0,
  });
  const list = await insertIfMissing(Lists, ids.listId, {
    title: PERSONAL_INBOX_LIST_TITLE,
    boardId: ids.boardId,
    swimlaneId: '',
    sort: 0,
  });

  if (swimlane.boardId !== ids.boardId || list.boardId !== ids.boardId) {
    throw new Meteor.Error('personal-inbox-corrupt');
  }
  return ids;
}

async function ownedInboxBoard(userId) {
  const ids = personalInboxResourceIds(userId);
  if (!ids) return null;
  const board = await Boards.findOneAsync(ids.boardId);
  return isOwnedPersonalInbox(board, userId) ? board : null;
}

async function capturePersonalInboxCard(userId, capture) {
  const title = capture.title.trim().slice(0, 1000);
  if (!title) throw new Meteor.Error('personal-inbox-title-required');
  const description = (capture.description || '').trim().slice(0, 100000);
  const captureSourceUrl = normalizeCaptureUrl(capture.sourceUrl);
  if (captureSourceUrl === null) {
    throw new Meteor.Error('personal-inbox-invalid-url');
  }

  const ids = await ensurePersonalInbox(userId);
  const board = await ownedInboxBoard(userId);
  if (!board) throw new Meteor.Error('not-authorized');
  const lastCard = await Cards.findOneAsync(
    { boardId: ids.boardId, listId: ids.listId, archived: false },
    { sort: { sort: -1 }, fields: { sort: 1 } },
  );
  const sort = lastCard && Number.isFinite(lastCard.sort) ? lastCard.sort + 1 : 0;
  const capturedAt = new Date();
  const doc = {
    title,
    description,
    boardId: ids.boardId,
    listId: ids.listId,
    swimlaneId: ids.swimlaneId,
    sort,
    type: 'cardType-card',
    cardNumber: await board.getNextCardNumber(),
    userId,
    captureSourceType: capture.captureSourceType || 'quick-capture',
    captureSourceUrl: captureSourceUrl || undefined,
    capturedAt,
    capturedBy: userId,
    receivedAt: capturedAt,
  };
  if (capture.captureEmailFrom) doc.captureEmailFrom = capture.captureEmailFrom;
  if (capture.captureEmailMessageId) {
    doc.captureEmailMessageId = capture.captureEmailMessageId;
  }
  if (Array.isArray(capture.captureEmailAttachments)) {
    doc.captureEmailAttachments = capture.captureEmailAttachments;
  }
  const cardId = await Cards.insertAsync(doc);
  return { ...ids, cardId };
}

Meteor.methods({
  async 'personalInbox.ensure'() {
    if (!this.userId) throw new Meteor.Error('not-authorized');
    return await ensurePersonalInbox(this.userId);
  },

  async 'personalInbox.capture'(payload) {
    check(
      payload,
      Match.ObjectIncluding({
        title: String,
        description: Match.Maybe(String),
        sourceUrl: Match.Maybe(String),
      }),
    );
    if (!this.userId) throw new Meteor.Error('not-authorized');
    return await capturePersonalInboxCard(this.userId, {
      title: payload.title,
      description: payload.description,
      sourceUrl: payload.sourceUrl,
      captureSourceType: 'quick-capture',
    });
  },

  async 'personalInbox.emailToken.rotate'(allowedSenders) {
    check(allowedSenders, Match.Maybe([String]));
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const token = generateEmailInboxToken();
    await Meteor.users.updateAsync(this.userId, {
      $set: {
        'profile.personalInboxEmailTokenHash': hashEmailInboxToken(token),
        'profile.personalInboxEmailAllowedSenders': normalizeAllowedSenders(allowedSenders),
      },
    });
    return {
      token,
      endpoint: '/api/inbox/email',
    };
  },

  async 'personalInbox.emailToken.disable'() {
    if (!this.userId) throw new Meteor.Error('not-authorized');
    await Meteor.users.updateAsync(this.userId, {
      $unset: {
        'profile.personalInboxEmailTokenHash': '',
      },
      $set: {
        'profile.personalInboxEmailAllowedSenders': [],
      },
    });
    return true;
  },

  async 'personalInbox.connectorToken.rotate'(options) {
    check(options, Match.Maybe(Object));
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const token = generateConnectorToken();
    const connectorTypes = normalizeConnectorTypes(options && options.types);
    if (!connectorTypes.length) {
      throw new Meteor.Error('personal-inbox-connector-type-required');
    }
    await Meteor.users.updateAsync(this.userId, {
      $set: {
        'profile.personalInboxConnectorTokenHash': hashConnectorToken(token),
        'profile.personalInboxConnectorTypes': connectorTypes,
        'profile.personalInboxConnectorOrigins': normalizeConnectorOrigins(
          options && options.origins,
        ),
      },
    });
    return {
      token,
      endpoint: '/api/inbox/connector',
      types: connectorTypes,
    };
  },

  async 'personalInbox.connectorToken.disable'() {
    if (!this.userId) throw new Meteor.Error('not-authorized');
    await Meteor.users.updateAsync(this.userId, {
      $unset: {
        'profile.personalInboxConnectorTokenHash': '',
      },
      $set: {
        'profile.personalInboxConnectorTypes': [],
        'profile.personalInboxConnectorOrigins': [],
      },
    });
    return true;
  },

  async 'personalInbox.move'(cardId, destinationBoardId, destinationListId) {
    check(cardId, String);
    check(destinationBoardId, String);
    check(destinationListId, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');

    const card = await Cards.findOneAsync(cardId);
    const inboxBoard = card ? await Boards.findOneAsync(card.boardId) : null;
    if (!isPersonalInboxCard(card, inboxBoard, this.userId)) {
      throw new Meteor.Error('not-authorized');
    }

    const destinationBoard = await Boards.findOneAsync({
      _id: destinationBoardId,
      archived: false,
      type: 'board',
    });
    if (
      !destinationBoard ||
      destinationBoard.personalInboxOwnerId ||
      isHelperBoardTitle(destinationBoard.title) ||
      !allowIsBoardMemberWithWriteAccess(this.userId, destinationBoard)
    ) {
      throw new Meteor.Error('not-authorized');
    }
    const destinationList = await Lists.findOneAsync({
      _id: destinationListId,
      boardId: destinationBoardId,
      archived: false,
    });
    if (!destinationList) throw new Meteor.Error('not-authorized');

    const destinationSwimlane = await destinationBoard.getDefaultSwimlineAsync();
    if (!destinationSwimlane) throw new Meteor.Error('personal-inbox-no-destination');
    const lastCard = await Cards.findOneAsync(
      { boardId: destinationBoardId, listId: destinationListId, archived: false },
      { sort: { sort: -1 }, fields: { sort: 1 } },
    );
    const sort = lastCard && Number.isFinite(lastCard.sort) ? lastCard.sort + 1 : 0;

    await card.move(
      destinationBoardId,
      destinationSwimlane._id,
      destinationListId,
      sort,
    );
    // Card.move updates attachment metadata too; await the same update here so
    // this method does not report success before every attachment is authorized
    // through the destination board.
    await Attachments.collection.updateAsync(
      { 'meta.cardId': cardId },
      {
        $set: {
          'meta.boardId': destinationBoardId,
          'meta.listId': destinationListId,
          'meta.swimlaneId': destinationSwimlane._id,
        },
      },
      { multi: true },
    );

    return {
      cardId,
      boardId: destinationBoardId,
      listId: destinationListId,
      swimlaneId: destinationSwimlane._id,
    };
  },
});

WebApp.handlers.post('/api/inbox/email', async function(req, res) {
  try {
    const token =
      req.headers['x-wekan-inbox-token'] ||
      (req.body && req.body.token) ||
      '';
    const normalized = normalizeEmailInboxPayload(req.body || {});
    if (!normalized.valid) {
      sendJsonResult(res, {
        code: 400,
        data: { error: normalized.error },
      });
      return;
    }

    const email = normalized.email;
    const user = email.userId
      ? await Meteor.users.findOneAsync(email.userId)
      : null;
    if (
      !user ||
      !verifyEmailInboxToken(user, token) ||
      !senderIsAllowed(user, email.sender)
    ) {
      sendJsonResult(res, {
        code: 401,
        data: { error: 'not-authorized' },
      });
      return;
    }

    const result = await capturePersonalInboxCard(user._id, {
      title: email.title,
      description: emailCaptureDescription(email),
      sourceUrl: email.sourceUrl,
      captureSourceType: 'email',
      captureEmailFrom: email.sender,
      captureEmailMessageId: email.messageId,
      captureEmailAttachments: email.attachments,
    });
    sendJsonResult(res, {
      code: 200,
      data: {
        ...result,
        captureSourceType: 'email',
      },
    });
  } catch (error) {
    sendJsonResult(res, {
      code: error.statusCode || error.code || 500,
      data: { error: error.error || error.reason || error.message || 'Error' },
    });
  }
});

WebApp.handlers.post('/api/inbox/connector', async function(req, res) {
  try {
    const token =
      req.headers['x-wekan-connector-token'] ||
      (req.body && req.body.token) ||
      '';
    const normalized = normalizeConnectorPayload(req.body || {});
    if (!normalized.valid) {
      sendJsonResult(res, {
        code: 400,
        data: { error: normalized.error },
      });
      return;
    }

    const connector = normalized.connector;
    const user = await Meteor.users.findOneAsync(connector.userId);
    if (
      !user ||
      !verifyConnectorToken(user, token) ||
      !connectorTypeIsAllowed(user, connector.type) ||
      !connectorOriginIsAllowed(user, connector.origin)
    ) {
      sendJsonResult(res, {
        code: 401,
        data: { error: 'not-authorized' },
      });
      return;
    }

    const result = await capturePersonalInboxCard(user._id, {
      title: connector.title,
      description: connectorCaptureDescription(connector),
      sourceUrl: connector.sourceUrl,
      captureSourceType: connector.type,
    });
    sendJsonResult(res, {
      code: 200,
      data: {
        ...result,
        captureSourceType: connector.type,
      },
    });
  } catch (error) {
    sendJsonResult(res, {
      code: error.statusCode || error.code || 500,
      data: { error: error.error || error.reason || error.message || 'Error' },
    });
  }
});

Meteor.publish('personalInbox', async function() {
  if (!this.userId) return this.ready();
  const board = await ownedInboxBoard(this.userId);
  if (!board) return this.ready();
  const boardId = board._id;
  return [
    Boards.find({ _id: boardId, personalInboxOwnerId: this.userId }),
    Lists.find({ boardId, archived: false }),
    Swimlanes.find({ boardId, archived: false }),
    Cards.find({ boardId, archived: false }),
    Attachments.collection.find({ 'meta.boardId': boardId }),
  ];
});
