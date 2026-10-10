import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Cards from '/models/cards';
import CustomFields from '/models/customFields';
import Activities from '/models/activities';

// #5681: linked custom fields. Linking needs edit rights on both cards; a
// change to a linked field is copied to the field of the same name on the
// other card, in the chosen direction, without echoing back, never for an
// admin-only field, and only while the link's creator can still edit both.
// Node test: tests/customFieldLinks.test.cjs.
describe('Linked custom fields', function () {
  this.timeout(30000);
  const call = (userId, name, ...args) => Meteor.server.method_handlers[name].apply({ userId }, args);
  const valueOf = async (cardId, fieldId) =>
    ((await Cards.rawCollection().findOne({ _id: cardId })).customFields || []).find(f => f._id === fieldId)?.value ?? null;
  const setValue = async (cardId, fieldId, value) => {
    const card = await Cards.findOneAsync(cardId);
    const index = card.customFields.findIndex(f => f._id === fieldId);
    await Cards.updateAsync(cardId, { $set: { [`customFields.${index}.value`]: value } });
  };

  it('links two cards, carries values by field name in the chosen direction, and enforces the rules', async function () {
    if (!Meteor.isAppTest) this.skip();
    const writer = Random.id(), outsider = Random.id();
    const b1 = Random.id(), b2 = Random.id(), hidden = Random.id();
    const c1 = Random.id(), c2 = Random.id(), c3 = Random.id(), secretCard = Random.id();
    const f = { op1: Random.id(), st1: Random.id(), sal1: Random.id(), op2: Random.id(), st2: Random.id(),
      re2: Random.id(), sal2: Random.id(), op3: Random.id() };
    const boardIds = [b1, b2, hidden];
    const member = (userId, extra = {}) => ({ userId, isAdmin: true, isActive: true, ...extra });
    try {
      await Meteor.users.rawCollection().insertMany([
        { _id: writer, username: `cfl-writer-${writer}` }, { _id: outsider, username: `cfl-outsider-${outsider}` },
      ]);
      await Boards.rawCollection().insertMany([
        { _id: b1, title: 'test1', permission: 'private', members: [member(writer), member(outsider)] },
        { _id: b2, title: 'test2', permission: 'private', members: [member(writer)] },
        { _id: hidden, title: 'Hidden', permission: 'private', members: [member(outsider)] },
      ]);
      for (const boardId of boardIds) {
        await Swimlanes.rawCollection().insertOne({ _id: `${boardId}-lane`, boardId, title: 'Lane', sort: 0 });
        await Lists.rawCollection().insertOne({ _id: `${boardId}-list`, boardId, title: 'List', sort: 0 });
      }
      const def = (_id, name, type, boardId, extra = {}) => ({ _id, name, type, boardIds: [boardId], settings: {},
        showOnCard: false, automaticallyOnCard: false, alwaysOnCard: false, showLabelOnMiniCard: false, ...extra });
      const items = (pairs) => ({ settings: { dropdownItems: pairs.map(([_id, name]) => ({ _id, name })) } });
      await CustomFields.rawCollection().insertMany([
        def(f.op1, 'Operation', 'text', b1), def(f.st1, 'Status', 'dropdown', b1, items([['s1o', 'Open'], ['s1d', 'Done']])),
        def(f.sal1, 'Salary', 'number', b1, { adminOnly: true }),
        def(f.op2, 'operation', 'text', b2), def(f.st2, 'STATUS', 'dropdown', b2, items([['s2d', 'done'], ['s2o', 'open']])),
        def(f.re2, 'Remarks', 'text', b2), def(f.sal2, 'Salary', 'number', b2),
        def(f.op3, 'Operation', 'text', hidden),
      ]);
      const card = (_id, boardId, title, fields) => ({ _id, boardId, listId: `${boardId}-list`, swimlaneId: `${boardId}-lane`,
        title, sort: 0, archived: false, type: 'cardType-card', customFields: fields.map(id => ({ _id: id, value: null })) });
      await Cards.rawCollection().insertMany([
        card(c1, b1, 'Test card1', [f.op1, f.st1, f.sal1]),
        card(c2, b2, 'Test card1 - Processing', [f.op2, f.st2, f.re2, f.sal2]),
        card(c3, b1, 'Another', [f.op1]),
        card(secretCard, hidden, 'Secret', [f.op3]),
      ]);
      await Cards.rawCollection().updateOne({ _id: c2 }, { $set: { 'customFields.2.value': 'checked by Ann' } });

      // Negative: an unreadable card is "not found", a card cannot link to
      // itself, and somebody who cannot edit the other card cannot link it.
      await assert.rejects(call(writer, 'linkCardCustomFields', c1, secretCard, 'both'), /field-link-not-found/);
      await assert.rejects(call(writer, 'linkCardCustomFields', c1, c1, 'both'), /field-link-self/);
      await assert.rejects(call(outsider, 'linkCardCustomFields', c1, c2, 'both'), /field-link-not-found/);
      await assert.rejects(call(writer, 'linkCardCustomFields', c1, c2, 'sideways'), /Match/);
      await assert.rejects(call(null, 'linkCardCustomFields', c1, c2, 'both'), /not-authorized/);

      // One way, by the card link, from the worker's card to the main card.
      const info = await call(writer, 'linkCardCustomFields', c1, `https://wekan.example/b/${b2}/test2/${c2}`, 'send');
      assert.equal(info.cardId, c2);
      assert.deepEqual(info.fields.map(n => n.toLowerCase()).sort(), ['operation', 'status']);
      assert.equal((await Cards.rawCollection().findOne({ _id: c2 })).customFieldLinks[0].mode, 'receive');

      await setValue(c1, f.op1, 'Weld');
      await setValue(c1, f.st1, 's1d');
      await setValue(c1, f.sal1, 5000);
      assert.equal(await valueOf(c2, f.op2), 'Weld');
      assert.equal(await valueOf(c2, f.st2), 's2d', 'a dropdown value goes over by its item name');
      assert.equal(await valueOf(c2, f.re2), 'checked by Ann', 'a field only the main card has is left alone');
      assert.equal(await valueOf(c2, f.sal2), null, 'an admin-only value is never carried');
      // The propagated write is recorded like any other card write.
      assert.ok(await Activities.findOneAsync({ cardId: c2, activityType: 'setCustomField', customFieldId: f.op2 }));

      // Negative: one way means the main card sends nothing back.
      await setValue(c2, f.op2, 'Grind');
      assert.equal(await valueOf(c1, f.op1), 'Weld');

      // Both ways: a change on either card reaches the other, and stops there.
      await call(writer, 'linkCardCustomFields', c1, c2, 'both');
      await setValue(c2, f.op2, 'Paint');
      assert.equal(await valueOf(c1, f.op1), 'Paint');
      await setValue(c1, f.op1, 'Pack');
      assert.equal(await valueOf(c2, f.op2), 'Pack');
      const writes = await Activities.find({ cardId: { $in: [c1, c2] }, activityType: 'setCustomField' }).countAsync();
      await setValue(c1, f.op1, 'Pack');
      assert.equal(await Activities.find({ cardId: { $in: [c1, c2] }, activityType: 'setCustomField' }).countAsync(),
        writes, 'an unchanged value writes nothing');

      // A ring c1 <-> c2, c2 <-> c3, c3 <-> c1 settles after one round.
      await call(writer, 'linkCardCustomFields', c2, c3, 'both');
      await call(writer, 'linkCardCustomFields', c3, c1, 'both');
      await setValue(c3, f.op1, 'Ship');
      assert.equal(await valueOf(c1, f.op1), 'Ship');
      assert.equal(await valueOf(c2, f.op2), 'Ship');

      // Negative: the creator loses edit rights on the main card - the link
      // stops writing; and an archived card neither sends nor receives.
      await Boards.rawCollection().updateOne({ _id: b2 }, { $pull: { members: { userId: writer } } });
      await setValue(c1, f.op1, 'Stop');
      assert.equal(await valueOf(c2, f.op2), 'Ship');
      await Boards.rawCollection().updateOne({ _id: b2 }, { $push: { members: member(writer) } });
      await Cards.rawCollection().updateOne({ _id: c2 }, { $set: { archived: true } });
      await setValue(c1, f.op1, 'Archived');
      assert.equal(await valueOf(c2, f.op2), 'Ship');
      await Cards.rawCollection().updateOne({ _id: c2 }, { $set: { archived: false } });

      // Negative: a client cannot write the link field itself.
      const deny = Cards._validators.update.deny;
      let denied = false;
      for (const rule of deny) {
        try { if (await rule(outsider, { _id: c1, boardId: b1 }, ['customFieldLinks'], { $set: { customFieldLinks: [] } })) denied = true; }
        catch (_) { /* another rule that needs more of the card */ }
      }
      assert.ok(denied);

      // Unlinking needs edit rights on both cards, and removes both sides.
      await assert.rejects(call(outsider, 'unlinkCardCustomFields', c1, c2), /not-authorized/);
      await call(writer, 'unlinkCardCustomFields', c1, c2);
      assert.ok(!(await Cards.rawCollection().findOne({ _id: c1 })).customFieldLinks.some(l => l.cardId === c2));
      assert.ok(!(await Cards.rawCollection().findOne({ _id: c2 })).customFieldLinks.some(l => l.cardId === c1));

      // A deleted card leaves no link behind.
      await Cards.removeAsync(c3);
      assert.ok(!(await Cards.rawCollection().findOne({ _id: c2 })).customFieldLinks.some(l => l.cardId === c3));
      assert.deepEqual(await call(writer, 'cardCustomFieldLinksInfo', c1), []);
    } finally {
      await Activities.rawCollection().deleteMany({ boardId: { $in: boardIds } });
      await Cards.rawCollection().deleteMany({ boardId: { $in: boardIds } });
      await CustomFields.rawCollection().deleteMany({ boardIds: { $in: boardIds } });
      await Lists.rawCollection().deleteMany({ boardId: { $in: boardIds } });
      await Swimlanes.rawCollection().deleteMany({ boardId: { $in: boardIds } });
      await Boards.rawCollection().deleteMany({ _id: { $in: boardIds } });
      await Meteor.users.rawCollection().deleteMany({ _id: { $in: [writer, outsider] } });
    }
  });
});
