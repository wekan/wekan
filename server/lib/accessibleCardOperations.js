import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Cards, { cardCreation } from '/models/cards';
import CustomFields from '/models/customFields';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import {
  allowIsBoardAdmin,
  allowIsBoardMember,
  allowIsBoardMemberWithWriteAccess,
  canAssignCardMember,
  computeSortForIndex,
} from '/server/lib/utils';
import { canEditCardOrLinkedCard } from '/server/lib/linkedCardPermission';
import { assertParentCardIsVisible, canUserSeeBoard } from '/server/lib/visibleBoardIds';
import { tripCanary } from '/server/lib/canary';
import { CARD_COLORS } from '/models/metadata/colors';
import { STICKER_PICKER } from '/models/metadata/stickers';
import {
  DEFAULT_DEPENDENCY_COLOR,
  DEFAULT_DEPENDENCY_ICON,
  DEPENDENCY_ICON_CHOICES,
  DEPENDENCY_TYPE_IDS,
  normalizeDependencies,
} from '/models/metadata/dependencies';

const MAX_CARD_DESCRIPTION_LENGTH = 1024 * 1024;
const CARD_DATE_FIELDS = ['receivedAt', 'startAt', 'dueAt', 'endAt'];
const MAX_CARD_LOCATIONS = 100;
const MAX_CARD_STICKERS = 200;
const MAX_CARD_CUSTOM_FIELDS = 500;
const MAX_CARD_DEPENDENCIES = 500;
const MAX_BALLOT_QUESTION_LENGTH = 10000;
const POKER_STATES = [
  'one', 'two', 'three', 'five', 'eight', 'thirteen', 'twenty', 'forty',
  'oneHundred', 'unsure',
];

function refuseCardWrite(userId, detail) {
  tripCanary('board.write-without-capability', { userId, detail });
  throw new Meteor.Error('not-authorized');
}

async function editablePlacement(userId, boardId, listId, swimlaneId) {
  if (!userId) throw new Meteor.Error('not-authorized');
  const [board, list, swimlane] = await Promise.all([
    Boards.findOneAsync(boardId), Lists.findOneAsync(listId), Swimlanes.findOneAsync(swimlaneId),
  ]);
  if (!board || !list || !swimlane || list.boardId !== boardId
    || swimlane.boardId !== boardId || list.archived === true || swimlane.archived === true) {
    refuseCardWrite(userId, 'card placement did not match one active board/list/swimlane');
  }
  if (!allowIsBoardMemberWithWriteAccess(userId, board)) {
    refuseCardWrite(userId, 'card placement board did not grant write access');
  }
  return { board, list, swimlane };
}

async function createAccessibleCard(userId, input) {
  const boardId = String(input?.boardId || '');
  const listId = String(input?.listId || '');
  const swimlaneId = String(input?.swimlaneId || '');
  const title = String(input?.title || '').trim().slice(0, 1000);
  if (!title) throw new Meteor.Error('card-title-required');
  const { board } = await editablePlacement(userId, boardId, listId, swimlaneId);
  const siblings = await Cards.find({
    boardId, listId, swimlaneId, archived: false, deletedAt: null,
  }, { fields: { sort: 1 }, sort: { sort: 1, _id: 1 } }).fetchAsync();
  let position = input?.position === 'top' ? 0 : siblings.length;
  const relativeCardId = String(input?.relativeCardId || '');
  if (relativeCardId) {
    const relativeIndex = siblings.findIndex(card => card._id === relativeCardId);
    if (relativeIndex < 0) {
      refuseCardWrite(userId, 'relative card did not belong to the submitted destination');
    }
    position = relativeIndex + (input?.position === 'below' ? 1 : 0);
  }
  const automaticFields = await CustomFields.find({ boardIds: boardId }, {
    fields: { automaticallyOnCard: 1, alwaysOnCard: 1 },
  }).fetchAsync();
  const customFields = automaticFields
    .filter(field => field.automaticallyOnCard || field.alwaysOnCard)
    .map(field => ({ _id: field._id, value: null }));
  const cardId = await Cards.direct.insertAsync({
    title, boardId, listId, swimlaneId,
    sort: computeSortForIndex(siblings, position),
    cardNumber: await board.getNextCardNumber(),
    userId, members: [], assignees: [], labelIds: [], customFields,
    type: 'cardType-card',
  });
  const card = await Cards.findOneAsync(cardId);
  await cardCreation(userId, card);
  return cardId;
}

async function moveAccessibleCard(userId, cardId, direction) {
  if (!['up', 'down'].includes(direction)) throw new Meteor.Error('invalid-card-direction');
  const card = await Cards.findOneAsync({ _id: cardId, archived: false, deletedAt: null });
  if (!card) throw new Meteor.Error('not-found');
  await editablePlacement(userId, card.boardId, card.listId, card.swimlaneId);
  const siblings = await Cards.find({
    boardId: card.boardId, listId: card.listId, swimlaneId: card.swimlaneId,
    archived: false, deletedAt: null,
  }, { fields: { sort: 1 }, sort: { sort: 1, _id: 1 } }).fetchAsync();
  const index = siblings.findIndex(item => item._id === card._id);
  const target = index + (direction === 'up' ? -1 : 1);
  if (index < 0 || target < 0 || target >= siblings.length) return false;
  const withoutCard = siblings.filter(item => item._id !== card._id);
  const newPosition = direction === 'up' ? target : target + 1;
  const newSort = computeSortForIndex(withoutCard, newPosition);
  await card.move(card.boardId, card.swimlaneId, card.listId, newSort);
  return true;
}

async function moveAccessibleCardToList(userId, input) {
  const boardId = String(input?.boardId || '');
  const card = await editableCard(userId, input?.cardId, boardId);
  await editablePlacement(userId, boardId, String(input?.listId || ''), card.swimlaneId);
  const siblings = await Cards.find({
    boardId, listId: String(input.listId), swimlaneId: card.swimlaneId,
    archived: false, deletedAt: null, _id: { $ne: card._id },
  }, { fields: { sort: 1 }, sort: { sort: 1, _id: 1 } }).fetchAsync();
  const position = input?.position === 'bottom' ? siblings.length : 0;
  await card.move(boardId, card.swimlaneId, String(input.listId),
    computeSortForIndex(siblings, position));
  return true;
}

async function editableCard(userId, cardId, expectedBoardId) {
  if (!userId) throw new Meteor.Error('not-authorized');
  const card = await Cards.findOneAsync({ _id: String(cardId || ''), deletedAt: null });
  if (!card) throw new Meteor.Error('not-found');
  if (expectedBoardId && card.boardId !== expectedBoardId) {
    refuseCardWrite(userId, 'card did not belong to the submitted route board');
  }
  if (!(await canEditCardOrLinkedCard(userId, card))) {
    refuseCardWrite(userId, 'card did not grant direct or delegated write access');
  }
  return card;
}

async function authorizeContentTarget(userId, card) {
  if (card.type === 'cardType-linkedCard') {
    const target = await Cards.findOneAsync({ _id: card.linkedId, deletedAt: null });
    if (!target || !(await canEditCardOrLinkedCard(userId, target))) {
      refuseCardWrite(userId, 'linked card target did not grant write access');
    }
  } else if (card.type === 'cardType-linkedBoard') {
    const target = await Boards.findOneAsync(card.linkedId);
    if (!target || !allowIsBoardAdmin(userId, target)) {
      refuseCardWrite(userId, 'linked board target did not grant administrator access');
    }
  }
}

async function accessibleLocationTarget(userId, input) {
  const card = await editableCard(userId, input?.cardId, String(input?.boardId || ''));
  await authorizeContentTarget(userId, card);
  if (card.type === 'cardType-linkedBoard') throw new Meteor.Error('invalid-card-type');
  const target = card.type === 'cardType-linkedCard'
    ? await Cards.findOneAsync({ _id: card.linkedId, deletedAt: null }) : card;
  if (!target) throw new Meteor.Error('not-found');
  const locations = target.getLocations().map(location => ({
    _id: String(location._id || ''), name: String(location.name || ''),
    address: String(location.address || ''),
    ...(typeof location.latitude === 'number' ? { latitude: location.latitude } : {}),
    ...(typeof location.longitude === 'number' ? { longitude: location.longitude } : {}),
  }));
  if (locations.length > MAX_CARD_LOCATIONS) throw new Meteor.Error('too-many-card-locations');
  return { target, locations };
}

function cardLocationCoordinate(value, maximum) {
  if (value === undefined || value === null || String(value).trim() === '') return undefined;
  const raw = String(value).trim();
  if (raw.length > 40 || !/^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)) {
    throw new Meteor.Error('invalid-card-location-coordinate');
  }
  const coordinate = Number(raw);
  if (!Number.isFinite(coordinate) || Math.abs(coordinate) > maximum) {
    throw new Meteor.Error('invalid-card-location-coordinate');
  }
  return coordinate;
}

async function saveAccessibleCardLocation(userId, input) {
  const { target, locations } = await accessibleLocationTarget(userId, input);
  const locationId = String(input?.locationId || '');
  if (locationId.length > 200) throw new Meteor.Error('invalid-card-location');
  const name = String(input?.name ?? '').trim();
  const address = String(input?.address ?? '').trim();
  if (name.length > 1000 || address.length > 1000) {
    throw new Meteor.Error('card-location-text-too-long');
  }
  const location = {
    _id: locationId || Random.id(), name, address,
  };
  const latitude = cardLocationCoordinate(input?.latitude, 90);
  const longitude = cardLocationCoordinate(input?.longitude, 180);
  if (latitude !== undefined) location.latitude = latitude;
  if (longitude !== undefined) location.longitude = longitude;
  if (locationId) {
    const index = locations.findIndex(item => item._id === locationId);
    if (index < 0) refuseCardWrite(userId, 'card location did not belong to the content card');
    locations[index] = location;
  } else {
    if (locations.length >= MAX_CARD_LOCATIONS) throw new Meteor.Error('too-many-card-locations');
    locations.push(location);
  }
  for (const item of locations) if (item._id === 'legacy') item._id = Random.id();
  await Cards.updateAsync(target._id, {
    $set: { locations, locationName: '', locationAddress: '' },
    $unset: { locationLatitude: '', locationLongitude: '' },
  });
  return location._id;
}

async function removeAccessibleCardLocation(userId, input) {
  const { target, locations } = await accessibleLocationTarget(userId, input);
  const locationId = String(input?.locationId || '');
  const index = locations.findIndex(item => item._id === locationId);
  if (!locationId || locationId.length > 200 || index < 0) {
    refuseCardWrite(userId, 'card location did not belong to the content card');
  }
  locations.splice(index, 1);
  for (const item of locations) if (item._id === 'legacy') item._id = Random.id();
  await Cards.updateAsync(target._id, {
    $set: { locations, locationName: '', locationAddress: '' },
    $unset: { locationLatitude: '', locationLongitude: '' },
  });
  return true;
}

async function accessibleStickerTarget(userId, input) {
  const card = await editableCard(userId, input?.cardId, String(input?.boardId || ''));
  await authorizeContentTarget(userId, card);
  if (card.type === 'cardType-linkedBoard') throw new Meteor.Error('invalid-card-type');
  const target = card.type === 'cardType-linkedCard'
    ? await Cards.findOneAsync({ _id: card.linkedId, deletedAt: null }) : card;
  if (!target) throw new Meteor.Error('not-found');
  const stickers = (target.stickers || []).map(sticker => ({ ...sticker }));
  if (stickers.length > MAX_CARD_STICKERS) throw new Meteor.Error('too-many-card-stickers');
  return { target, stickers };
}

async function setAccessibleCardSticker(userId, input) {
  const { target, stickers } = await accessibleStickerTarget(userId, input);
  if (typeof input?.enabled !== 'boolean') throw new Meteor.Error('invalid-card-sticker-state');
  const icon = String(input?.icon || '');
  const highlight = String(input?.highlight || '');
  const catalog = STICKER_PICKER.find(sticker => sticker.icon === icon
    && String(sticker.highlight || '') === highlight);
  if (!catalog) throw new Meteor.Error('invalid-card-sticker');
  const index = stickers.findIndex(sticker => sticker.icon === icon
    && String(sticker.highlight || '') === highlight);
  if (input.enabled && index < 0) {
    if (stickers.length >= MAX_CARD_STICKERS) throw new Meteor.Error('too-many-card-stickers');
    stickers.push({
      icon, ...(highlight ? { highlight } : {}),
      ...(catalog.name ? { name: catalog.name } : {}), position: stickers.length,
    });
  } else if (!input.enabled && index >= 0) {
    stickers.splice(index, 1);
  }
  stickers.forEach((sticker, position) => { sticker.position = position; });
  await Cards.updateAsync(target._id, { $set: { stickers } });
  return true;
}

async function removeAccessibleCardStickerAt(userId, input) {
  const { target, stickers } = await accessibleStickerTarget(userId, input);
  const rawIndex = String(input?.index ?? '');
  if (!/^\d+$/.test(rawIndex)) throw new Meteor.Error('invalid-card-sticker-index');
  const index = Number(rawIndex);
  if (!Number.isSafeInteger(index) || index >= stickers.length) {
    refuseCardWrite(userId, 'card sticker index did not belong to the content card');
  }
  stickers.splice(index, 1);
  stickers.forEach((sticker, position) => { sticker.position = position; });
  await Cards.updateAsync(target._id, { $set: { stickers } });
  return true;
}

async function accessibleCustomFieldTarget(userId, input) {
  const card = await editableCard(userId, input?.cardId, String(input?.boardId || ''));
  await authorizeContentTarget(userId, card);
  if (card.type === 'cardType-linkedBoard') throw new Meteor.Error('invalid-card-type');
  const target = card.type === 'cardType-linkedCard'
    ? await Cards.findOneAsync({ _id: card.linkedId, deletedAt: null }) : card;
  if (!target) throw new Meteor.Error('not-found');
  const board = await Boards.findOneAsync(target.boardId, { fields: { allowsCustomFields: 1 } });
  if (!board || board.allowsCustomFields === false) {
    throw new Meteor.Error('custom-fields-disabled');
  }
  const definition = await CustomFields.findOneAsync({
    _id: String(input?.customFieldId || ''), boardIds: target.boardId,
  });
  if (!definition) {
    refuseCardWrite(userId, 'custom field definition did not belong to the content board');
  }
  const customFields = (target.customFields || []).map(field => ({
    _id: String(field?._id || ''), value: field?.value,
  }));
  if (customFields.length > MAX_CARD_CUSTOM_FIELDS) {
    throw new Meteor.Error('too-many-card-custom-fields');
  }
  return { target, definition, customFields };
}

async function setAccessibleCardCustomFieldAssigned(userId, input) {
  if (typeof input?.assigned !== 'boolean') {
    throw new Meteor.Error('invalid-custom-field-state');
  }
  const { target, definition, customFields } = await accessibleCustomFieldTarget(userId, input);
  const index = customFields.findIndex(field => field._id === definition._id);
  if (input.assigned && index < 0) {
    if (customFields.length >= MAX_CARD_CUSTOM_FIELDS) {
      throw new Meteor.Error('too-many-card-custom-fields');
    }
    customFields.push({ _id: definition._id, value: null });
  } else if (!input.assigned && index >= 0) {
    customFields.splice(index, 1);
  }
  await Cards.updateAsync(target._id, { $set: { customFields } });
  return input.assigned;
}

function completeCustomFieldNumber(rawValue, integer) {
  const raw = String(rawValue ?? '').trim();
  if (!raw) return '';
  const normalized = integer ? raw : raw.replace(/,/g, '.');
  const expression = integer
    ? /^-?\d+$/ : /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
  if (normalized.length > 100 || !expression.test(normalized)) {
    throw new Meteor.Error('invalid-custom-field-value');
  }
  const value = Number(normalized);
  if (!Number.isFinite(value) || Math.abs(value) > 1e15
    || (integer && !Number.isSafeInteger(value))) {
    throw new Meteor.Error('invalid-custom-field-value');
  }
  return value;
}

function accessibleCustomFieldValue(definition, inputValue) {
  switch (definition.type) {
    case 'text': {
      const value = String(inputValue ?? '');
      if (value.length > MAX_CARD_DESCRIPTION_LENGTH) {
        throw new Meteor.Error('custom-field-value-too-long');
      }
      return value;
    }
    case 'number':
      return completeCustomFieldNumber(inputValue, true);
    case 'currency':
      return completeCustomFieldNumber(inputValue, false);
    case 'checkbox':
      if (typeof inputValue !== 'boolean') throw new Meteor.Error('invalid-custom-field-value');
      return inputValue;
    case 'date': {
      const raw = inputValue instanceof Date
        ? inputValue.toISOString() : String(inputValue ?? '').trim();
      if (!raw) return '';
      if (raw.length > 40
        || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(raw)) {
        throw new Meteor.Error('invalid-custom-field-value');
      }
      const value = new Date(raw);
      if (!Number.isFinite(value.getTime())) throw new Meteor.Error('invalid-custom-field-value');
      return value;
    }
    case 'dropdown': {
      const value = String(inputValue ?? '');
      if (value && !(definition.settings?.dropdownItems || [])
        .some(item => item._id === value)) {
        throw new Meteor.Error('invalid-custom-field-value');
      }
      return value;
    }
    case 'stringtemplate': {
      const values = Array.isArray(inputValue)
        ? inputValue : String(inputValue ?? '').split(/\r?\n/);
      if (values.length > 200) throw new Meteor.Error('custom-field-value-too-long');
      const normalized = values.map(value => String(value));
      if (normalized.some(value => value.length > 1000)
        || normalized.reduce((size, value) => size + value.length, 0) > 100000) {
        throw new Meteor.Error('custom-field-value-too-long');
      }
      return normalized.filter(value => value.trim());
    }
    default:
      throw new Meteor.Error('invalid-custom-field-type');
  }
}

async function updateAccessibleCardCustomField(userId, input) {
  const { target, definition, customFields } = await accessibleCustomFieldTarget(userId, input);
  const index = customFields.findIndex(field => field._id === definition._id);
  if (index < 0) throw new Meteor.Error('custom-field-not-on-card');
  customFields[index].value = accessibleCustomFieldValue(definition, input?.value);
  await Cards.updateAsync(target._id, { $set: { customFields } });
  return true;
}

async function accessibleDependencyTarget(userId, input) {
  const card = await editableCard(userId, input?.cardId, String(input?.boardId || ''));
  await authorizeContentTarget(userId, card);
  if (card.type === 'cardType-linkedBoard') throw new Meteor.Error('invalid-card-type');
  const target = card.type === 'cardType-linkedCard'
    ? await Cards.findOneAsync({ _id: card.linkedId, deletedAt: null }) : card;
  if (!target) throw new Meteor.Error('not-found');
  const dependencies = normalizeDependencies(target.cardDependencies);
  if (dependencies.length > MAX_CARD_DEPENDENCIES) {
    throw new Meteor.Error('too-many-card-dependencies');
  }
  return { target, dependencies };
}

async function saveAccessibleCardDependency(userId, input) {
  const { target, dependencies } = await accessibleDependencyTarget(userId, input);
  const targetCardId = String(input?.targetCardId || '');
  if (!targetCardId || targetCardId === target._id) {
    throw new Meteor.Error('invalid-card-dependency');
  }
  const dependencyCard = await Cards.findOneAsync({
    _id: targetCardId, boardId: target.boardId, archived: { $ne: true }, deletedAt: null,
  }, { fields: { _id: 1 } });
  if (!dependencyCard) {
    refuseCardWrite(userId, 'dependency target did not belong to the active content board');
  }
  const type = String(input?.type || '');
  const color = String(input?.color || '').toLowerCase();
  const icon = String(input?.icon || '');
  if (!DEPENDENCY_TYPE_IDS.includes(type) || !/^#[0-9a-f]{6}$/.test(color)
    || !DEPENDENCY_ICON_CHOICES.includes(icon)) {
    throw new Meteor.Error('invalid-card-dependency');
  }
  const index = dependencies.findIndex(dependency => dependency.cardId === targetCardId);
  const entry = { cardId: targetCardId, type, color, icon };
  if (index < 0) {
    if (dependencies.length >= MAX_CARD_DEPENDENCIES) {
      throw new Meteor.Error('too-many-card-dependencies');
    }
    dependencies.push(entry);
  } else {
    dependencies[index] = entry;
  }
  await Cards.updateAsync(target._id, { $set: { cardDependencies: dependencies } });
  return true;
}

async function removeAccessibleCardDependency(userId, input) {
  const { target, dependencies } = await accessibleDependencyTarget(userId, input);
  const targetCardId = String(input?.targetCardId || '');
  const index = dependencies.findIndex(dependency => dependency.cardId === targetCardId);
  if (index < 0) throw new Meteor.Error('card-dependency-not-found');
  dependencies.splice(index, 1);
  await Cards.updateAsync(target._id, { $set: { cardDependencies: dependencies } });
  return true;
}

function accessibleBallotEnd(value) {
  if (value === undefined || value === null || String(value).trim() === '') return undefined;
  const raw = value instanceof Date ? value.toISOString() : String(value).trim();
  if (raw.length > 40
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(raw)) {
    throw new Meteor.Error('invalid-ballot-end');
  }
  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) throw new Meteor.Error('invalid-ballot-end');
  return date;
}

async function accessibleBallotTarget(userId, input, write) {
  if (!userId) throw new Meteor.Error('not-authorized');
  const boardId = String(input?.boardId || '');
  const card = write
    ? await editableCard(userId, input?.cardId, boardId)
    : await Cards.findOneAsync({ _id: String(input?.cardId || ''), boardId, deletedAt: null });
  if (!card) throw new Meteor.Error('not-found');
  if (!write && !(await canUserSeeBoard(userId, card.boardId))) {
    refuseCardWrite(userId, 'ballot route board was not visible');
  }
  if (write) await authorizeContentTarget(userId, card);
  if (card.type === 'cardType-linkedBoard') throw new Meteor.Error('invalid-card-type');
  const target = card.type === 'cardType-linkedCard'
    ? await Cards.findOneAsync({ _id: card.linkedId, deletedAt: null }) : card;
  if (!target) throw new Meteor.Error('not-found');
  const board = await Boards.findOneAsync(target.boardId);
  if (!board) throw new Meteor.Error('not-found');
  return { target, board };
}

function canonicalVote(vote) {
  return {
    question: String(vote?.question || ''), public: vote?.public === true,
    allowNonBoardMembers: vote?.allowNonBoardMembers === true,
    positive: [...new Set((vote?.positive || []).filter(value => typeof value === 'string'))]
      .slice(0, 100000),
    negative: [...new Set((vote?.negative || []).filter(value => typeof value === 'string'))]
      .slice(0, 100000),
    ...(vote?.end instanceof Date && Number.isFinite(vote.end.getTime()) ? { end: vote.end } : {}),
  };
}

async function updateAccessibleCardVote(userId, input) {
  const { target } = await accessibleBallotTarget(userId, input, true);
  const action = String(input?.action || '');
  if (action === 'remove') {
    await Cards.updateAsync(target._id, {
      $unset: { vote: '' }, $set: { modifiedAt: new Date(), dateLastActivity: new Date() },
    });
    return true;
  }
  if (action === 'end') {
    if (!target.vote) throw new Meteor.Error('vote-not-found');
    const end = accessibleBallotEnd(input?.end);
    const modifier = end ? { $set: { 'vote.end': end } } : { $unset: { 'vote.end': '' } };
    modifier.$set = { ...(modifier.$set || {}), modifiedAt: new Date(), dateLastActivity: new Date() };
    await Cards.updateAsync(target._id, modifier);
    return true;
  }
  if (action !== 'configure') throw new Meteor.Error('invalid-vote-action');
  const question = String(input?.question || '').trim();
  if (!question || question.length > MAX_BALLOT_QUESTION_LENGTH
    || typeof input?.public !== 'boolean' || typeof input?.allowNonBoardMembers !== 'boolean') {
    throw new Meteor.Error('invalid-vote');
  }
  const vote = {
    question, public: input.public, allowNonBoardMembers: input.allowNonBoardMembers,
    positive: [], negative: [],
  };
  const end = accessibleBallotEnd(input?.end);
  if (end) vote.end = end;
  await Cards.updateAsync(target._id, {
    $set: { vote, modifiedAt: new Date(), dateLastActivity: new Date() },
  });
  return true;
}

async function castAccessibleCardVote(userId, input) {
  const { target, board } = await accessibleBallotTarget(userId, input, false);
  const vote = canonicalVote(target.vote);
  if (!vote.question || (vote.end && vote.end.getTime() <= Date.now())) {
    throw new Meteor.Error('vote-closed');
  }
  if (!allowIsBoardMember(userId, board) && !vote.allowNonBoardMembers) {
    refuseCardWrite(userId, 'vote did not allow this participant');
  }
  const state = input?.state;
  if (state !== true && state !== false && state !== null) {
    throw new Meteor.Error('invalid-vote-state');
  }
  vote.positive = vote.positive.filter(id => id !== userId);
  vote.negative = vote.negative.filter(id => id !== userId);
  if (state === true) vote.positive.push(userId);
  if (state === false) vote.negative.push(userId);
  await Cards.updateAsync(target._id, {
    $set: { vote, modifiedAt: new Date(), dateLastActivity: new Date() },
  });
  return state;
}

function canonicalPoker(poker) {
  const normalized = {
    question: poker?.question === true,
    allowNonBoardMembers: poker?.allowNonBoardMembers === true,
  };
  for (const state of POKER_STATES) {
    normalized[state] = [...new Set((poker?.[state] || [])
      .filter(value => typeof value === 'string'))].slice(0, 100000);
  }
  if (poker?.end instanceof Date && Number.isFinite(poker.end.getTime())) {
    normalized.end = poker.end;
  }
  if (Number.isSafeInteger(poker?.estimation) && Math.abs(poker.estimation) <= 1e15) {
    normalized.estimation = poker.estimation;
  }
  return normalized;
}

async function updateAccessibleCardPoker(userId, input) {
  const { target } = await accessibleBallotTarget(userId, input, true);
  const action = String(input?.action || '');
  if (['finish', 'replay', 'estimation', 'remove'].includes(action)) {
    const routeBoard = await Boards.findOneAsync(String(input?.boardId || ''));
    if (!allowIsBoardAdmin(userId, routeBoard)) {
      refuseCardWrite(userId, `planning poker ${action} required board admin`);
    }
  }
  if (action === 'remove') {
    await Cards.updateAsync(target._id, {
      $unset: { poker: '' }, $set: { modifiedAt: new Date(), dateLastActivity: new Date() },
    });
    return true;
  }
  if (action === 'configure') {
    if (typeof input?.allowNonBoardMembers !== 'boolean') {
      throw new Meteor.Error('invalid-poker');
    }
    const poker = { question: true, allowNonBoardMembers: input.allowNonBoardMembers };
    for (const state of POKER_STATES) poker[state] = [];
    const end = accessibleBallotEnd(input?.end);
    if (end) poker.end = end;
    await Cards.updateAsync(target._id, {
      $set: { poker, modifiedAt: new Date(), dateLastActivity: new Date() },
    });
    return true;
  }
  if (!target.poker?.question) throw new Meteor.Error('poker-not-found');
  if (action === 'end' || action === 'finish') {
    const end = action === 'finish' ? new Date() : accessibleBallotEnd(input?.end);
    const modifier = end ? { $set: { 'poker.end': end } } : { $unset: { 'poker.end': '' } };
    modifier.$set = { ...(modifier.$set || {}), modifiedAt: new Date(), dateLastActivity: new Date() };
    await Cards.updateAsync(target._id, modifier);
    return true;
  }
  if (action === 'replay') {
    const poker = canonicalPoker(target.poker);
    for (const state of POKER_STATES) poker[state] = [];
    delete poker.end;
    delete poker.estimation;
    await Cards.updateAsync(target._id, {
      $set: { poker, modifiedAt: new Date(), dateLastActivity: new Date() },
    });
    return true;
  }
  if (action === 'estimation') {
    const estimation = completeCustomFieldNumber(input?.estimation, true);
    const modifier = estimation === ''
      ? { $unset: { 'poker.estimation': '' } }
      : { $set: { 'poker.estimation': estimation } };
    modifier.$set = { ...(modifier.$set || {}), modifiedAt: new Date(), dateLastActivity: new Date() };
    await Cards.updateAsync(target._id, modifier);
    return true;
  }
  throw new Meteor.Error('invalid-poker-action');
}

async function accessibleCardMetricTarget(userId, input) {
  const card = await editableCard(userId, input?.cardId, String(input?.boardId || ''));
  await authorizeContentTarget(userId, card);
  if (card.type === 'cardType-linkedBoard') {
    const target = await Boards.findOneAsync(card.linkedId);
    if (!target) throw new Meteor.Error('not-found');
    return { card, target, collection: Boards };
  }
  const target = card.type === 'cardType-linkedCard'
    ? await Cards.findOneAsync({ _id: card.linkedId, deletedAt: null }) : card;
  if (!target) throw new Meteor.Error('not-found');
  return { card, target, collection: Cards };
}

async function updateAccessibleCardMetric(userId, input) {
  const { card, target, collection } = await accessibleCardMetricTarget(userId, input);
  const action = String(input?.action || '');
  const now = new Date();
  if (action === 'due-complete') {
    if (typeof input?.value !== 'boolean') throw new Meteor.Error('invalid-card-due-state');
    const routeBoard = await Boards.findOneAsync(card.boardId, { fields: { allowsDueComplete: 1 } });
    if (routeBoard?.allowsDueComplete !== true) throw new Meteor.Error('card-due-complete-disabled');
    await collection.updateAsync(target._id, {
      $set: { dueComplete: input.value, modifiedAt: now },
    });
    return input.value;
  }
  if (action === 'spent-time') {
    if (typeof input?.isOvertime !== 'boolean') throw new Meteor.Error('invalid-card-time');
    const raw = String(input?.value ?? '').trim();
    if (!raw) {
      await collection.updateAsync(target._id, {
        $unset: { spentTime: '' }, $set: { isOvertime: false, modifiedAt: now },
      });
      return null;
    }
    const spentTime = completeCustomFieldNumber(raw, false);
    if (spentTime < 0) throw new Meteor.Error('invalid-card-time');
    await collection.updateAsync(target._id, {
      $set: { spentTime, isOvertime: input.isOvertime, modifiedAt: now },
    });
    return spentTime;
  }
  throw new Meteor.Error('invalid-card-metric-action');
}

async function updateAccessibleCardParent(userId, input) {
  const card = await editableCard(userId, input?.cardId, String(input?.boardId || ''));
  await authorizeContentTarget(userId, card);
  if (card.type === 'cardType-linkedBoard') throw new Meteor.Error('invalid-card-type');
  const target = card.type === 'cardType-linkedCard'
    ? await Cards.findOneAsync({ _id: card.linkedId, deletedAt: null }) : card;
  if (!target) throw new Meteor.Error('not-found');
  const rawParentId = input?.parentCardId;
  const parentCardId = rawParentId === null || rawParentId === undefined
    || String(rawParentId) === '' ? null : String(rawParentId);
  if (parentCardId && parentCardId.length > 200) throw new Meteor.Error('invalid-card-parent');
  if (parentCardId) {
    await assertParentCardIsVisible(userId, parentCardId);
    let ancestorId = parentCardId;
    const seen = new Set();
    while (ancestorId) {
      if (ancestorId === target._id || seen.has(ancestorId)) {
        throw new Meteor.Error('circular-subtask');
      }
      seen.add(ancestorId);
      if (seen.size > 10000) throw new Meteor.Error('card-tree-too-large');
      const ancestor = await Cards.findOneAsync({ _id: ancestorId, deletedAt: null }, {
        fields: { parentId: 1 },
      });
      if (!ancestor) throw new Meteor.Error('invalid-card-parent');
      ancestorId = ancestor.parentId || null;
    }
  }
  const now = new Date();
  const modifier = parentCardId
    ? { $set: { parentId: parentCardId, modifiedAt: now, dateLastActivity: now } }
    : { $unset: { parentId: '' }, $set: { modifiedAt: now, dateLastActivity: now } };
  await Cards.updateAsync(target._id, modifier);
  return parentCardId;
}

async function castAccessibleCardPoker(userId, input) {
  const { target, board } = await accessibleBallotTarget(userId, input, false);
  const poker = canonicalPoker(target.poker);
  if (!poker.question || (poker.end && poker.end.getTime() <= Date.now())) {
    throw new Meteor.Error('poker-closed');
  }
  if (!allowIsBoardMember(userId, board) && !poker.allowNonBoardMembers) {
    refuseCardWrite(userId, 'planning poker did not allow this participant');
  }
  const state = input?.state;
  if (state !== null && !POKER_STATES.includes(state)) {
    throw new Meteor.Error('invalid-poker-state');
  }
  const pull = {};
  for (const name of POKER_STATES) {
    if (name !== state) pull[`poker.${name}`] = userId;
  }
  const now = new Date();
  const modifier = {
    $pull: pull,
    $set: { modifiedAt: now, dateLastActivity: now },
  };
  if (state) modifier.$addToSet = { [`poker.${state}`]: userId };
  await Cards.updateAsync(target._id, modifier);
  return state;
}

async function updateAccessibleCardContent(userId, input) {
  const card = await editableCard(userId, input?.cardId, String(input?.boardId || ''));
  const field = input?.field;
  if (!['title', 'description'].includes(field)) throw new Meteor.Error('invalid-card-field');
  await authorizeContentTarget(userId, card);
  let value = String(input?.value ?? '');
  if (field === 'title') value = value.trim().slice(0, 1000);
  else if (value.length > MAX_CARD_DESCRIPTION_LENGTH) {
    throw new Meteor.Error('description-too-long');
  }
  if (field === 'title') await card.setTitle(value);
  else await card.setDescription(value);
  return true;
}

async function updateAccessibleCardSort(userId, input) {
  const boardId = String(input?.boardId || '');
  const card = await editableCard(userId, input?.cardId, boardId);
  await editablePlacement(userId, boardId, card.listId, card.swimlaneId);
  const rawValue = String(input?.sort ?? '').trim();
  if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(rawValue)) {
    throw new Meteor.Error('invalid-card-sort');
  }
  const sort = Number(rawValue);
  if (!Number.isFinite(sort) || Math.abs(sort) > 1e15) {
    throw new Meteor.Error('invalid-card-sort');
  }
  await card.move(boardId, card.swimlaneId, card.listId, sort);
  return true;
}

async function updateAccessibleCardDate(userId, input) {
  const card = await editableCard(userId, input?.cardId, String(input?.boardId || ''));
  const field = String(input?.field || '');
  if (!CARD_DATE_FIELDS.includes(field)) throw new Meteor.Error('invalid-card-date-field');
  await authorizeContentTarget(userId, card);
  const rawValue = input?.value instanceof Date
    ? input.value.toISOString() : String(input?.value ?? '').trim();
  if (!rawValue) {
    await card[`unset${field[0].toUpperCase()}${field.slice(1, -2)}`]();
    return true;
  }
  if (rawValue.length > 40
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(rawValue)) {
    throw new Meteor.Error('invalid-card-date');
  }
  const date = new Date(rawValue);
  if (!Number.isFinite(date.getTime())) throw new Meteor.Error('invalid-card-date');
  const method = {
    receivedAt: 'setReceived', startAt: 'setStart', dueAt: 'setDue', endAt: 'setEnd',
  }[field];
  await card[method](date);
  return true;
}

async function updateAccessibleCardColor(userId, input) {
  const card = await editableCard(userId, input?.cardId, String(input?.boardId || ''));
  await authorizeContentTarget(userId, card);
  let color = String(input?.color ?? '').trim().toLowerCase();
  if (color === 'white') color = '';
  if (color && !CARD_COLORS.includes(color) && !/^#[0-9a-f]{6}$/.test(color)) {
    throw new Meteor.Error('invalid-card-color');
  }
  await card.setColor(color || null);
  return true;
}

async function setAccessibleCardLabel(userId, input) {
  const card = await editableCard(userId, input?.cardId, String(input?.boardId || ''));
  await authorizeContentTarget(userId, card);
  if (typeof input?.enabled !== 'boolean') throw new Meteor.Error('invalid-card-label-state');
  if (card.type === 'cardType-linkedBoard') throw new Meteor.Error('invalid-card-type');
  const target = card.type === 'cardType-linkedCard'
    ? await Cards.findOneAsync({ _id: card.linkedId, deletedAt: null }) : card;
  if (!target) throw new Meteor.Error('not-found');
  const board = await Boards.findOneAsync(target.boardId, { fields: { labels: 1 } });
  const labelId = String(input?.labelId || '');
  if (!board || !(board.labels || []).some(label => label._id === labelId)) {
    refuseCardWrite(userId, 'card label did not belong to the content board');
  }
  if (input.enabled) await target.addLabel(labelId);
  else await target.removeLabel(labelId);
  return true;
}

async function setAccessibleCardPerson(userId, input) {
  const field = String(input?.field || '');
  const targetUserId = String(input?.targetUserId || '');
  const boardId = String(input?.boardId || '');
  if (!['members', 'assignees'].includes(field)) {
    throw new Meteor.Error('invalid-card-person-field');
  }
  if (!targetUserId || targetUserId.length > 200 || typeof input?.enabled !== 'boolean') {
    throw new Meteor.Error('invalid-card-person');
  }
  if (!userId) throw new Meteor.Error('not-authorized');
  const [card, routeBoard] = await Promise.all([
    Cards.findOneAsync({ _id: String(input?.cardId || ''), boardId, deletedAt: null }),
    Boards.findOneAsync(boardId),
  ]);
  if (!card || !routeBoard) {
    refuseCardWrite(userId, 'card person route did not match a card and board');
  }
  const workerSelfAssignment = field === 'assignees' && targetUserId === userId
    && card.type !== 'cardType-linkedCard' && card.type !== 'cardType-linkedBoard'
    && routeBoard.hasWorker(userId);
  if (!workerSelfAssignment) {
    if (!(await canEditCardOrLinkedCard(userId, card))) {
      refuseCardWrite(userId, 'card person field did not grant write access');
    }
    await authorizeContentTarget(userId, card);
  }
  if (card.type === 'cardType-linkedBoard') throw new Meteor.Error('invalid-card-type');
  const target = card.type === 'cardType-linkedCard'
    ? await Cards.findOneAsync({ _id: card.linkedId, deletedAt: null }) : card;
  if (!target) throw new Meteor.Error('not-found');
  const targetBoard = target.boardId === routeBoard._id
    ? routeBoard : await Boards.findOneAsync(target.boardId);
  if (input.enabled && !canAssignCardMember(targetBoard, targetUserId)) {
    refuseCardWrite(userId, 'card person was not an active content-board member');
  }
  const method = input.enabled
    ? (field === 'members' ? 'assignMember' : 'assignAssignee')
    : (field === 'members' ? 'unassignMember' : 'unassignAssignee');
  await target[method](targetUserId);
  return true;
}

async function identityContentTarget(userId, input, field) {
  const card = await editableCard(userId, input?.cardId, String(input?.boardId || ''));
  await authorizeContentTarget(userId, card);
  if (card.type === 'cardType-linkedBoard') throw new Meteor.Error('invalid-card-type');
  const target = card.type === 'cardType-linkedCard'
    ? await Cards.findOneAsync({ _id: card.linkedId, deletedAt: null }) : card;
  if (!target) throw new Meteor.Error('not-found');
  const board = await Boards.findOneAsync(target.boardId);
  const allowed = field === 'requesters' || field === 'requestedBy'
    ? board?.allowsRequestedBy !== false : board?.allowsAssignedBy !== false;
  if (!allowed) throw new Meteor.Error('card-identity-disabled');
  return { target, board };
}

async function updateAccessibleCardIdentityText(userId, input) {
  const field = String(input?.field || '');
  if (!['requestedBy', 'assignedBy'].includes(field)) {
    throw new Meteor.Error('invalid-card-identity-text-field');
  }
  const { target } = await identityContentTarget(userId, input, field);
  const value = String(input?.value ?? '').trim();
  if (value.length > 1000) throw new Meteor.Error('card-identity-text-too-long');
  await target[field === 'requestedBy' ? 'setRequestedBy' : 'setAssignedBy'](value);
  return true;
}

async function setAccessibleCardIdentity(userId, input) {
  const field = String(input?.field || '');
  if (!['requesters', 'assigners'].includes(field)) {
    throw new Meteor.Error('invalid-card-identity-field');
  }
  const targetUserId = String(input?.targetUserId || '');
  if (!targetUserId || targetUserId.length > 200 || typeof input?.enabled !== 'boolean') {
    throw new Meteor.Error('invalid-card-identity');
  }
  const { target, board } = await identityContentTarget(userId, input, field);
  if (input.enabled && !canAssignCardMember(board, targetUserId)) {
    refuseCardWrite(userId, 'card identity was not an active content-board member');
  }
  const method = input.enabled
    ? (field === 'requesters' ? 'assignRequester' : 'assignAssigner')
    : (field === 'requesters' ? 'unassignRequester' : 'unassignAssigner');
  await target[method](targetUserId);
  return true;
}

async function editableCardTree(userId, root) {
  const pending = [root];
  const seen = new Set();
  while (pending.length) {
    const card = pending.shift();
    if (seen.has(card._id)) throw new Meteor.Error('invalid-card-tree');
    seen.add(card._id);
    if (seen.size > 10000) throw new Meteor.Error('card-tree-too-large');
    if (!(await canEditCardOrLinkedCard(userId, card))) {
      refuseCardWrite(userId, 'a descendant card did not grant write access');
    }
    const children = await Cards.find({ parentId: card._id, deletedAt: null }).fetchAsync();
    pending.push(...children);
  }
}

async function setAccessibleCardArchived(userId, input) {
  const card = await editableCard(userId, input?.cardId, String(input?.boardId || ''));
  const archived = input?.archived;
  if (typeof archived !== 'boolean') throw new Meteor.Error('invalid-card-archive-state');
  await editableCardTree(userId, card);
  if (archived) await card.archive();
  else await card.restore();
  return true;
}

export {
  createAccessibleCard,
  editableCard,
  editablePlacement,
  moveAccessibleCard,
  moveAccessibleCardToList,
  removeAccessibleCardLocation,
  removeAccessibleCardDependency,
  removeAccessibleCardStickerAt,
  saveAccessibleCardLocation,
  setAccessibleCardSticker,
  setAccessibleCardCustomFieldAssigned,
  saveAccessibleCardDependency,
  castAccessibleCardVote,
  castAccessibleCardPoker,
  setAccessibleCardLabel,
  setAccessibleCardIdentity,
  setAccessibleCardPerson,
  setAccessibleCardArchived,
  updateAccessibleCardColor,
  updateAccessibleCardDate,
  updateAccessibleCardIdentityText,
  updateAccessibleCardMetric,
  updateAccessibleCardParent,
  updateAccessibleCardSort,
  updateAccessibleCardCustomField,
  updateAccessibleCardContent,
  updateAccessibleCardVote,
  updateAccessibleCardPoker,
};
