/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import Cards from '/models/cards';
import { JiraCreator } from '/models/jiraCreator';

// #3392: importing a Jira board maps Jira issue links (`issuelinks`) best-effort
// to card-to-card dependencies ("Red Strings"). "blocks" link types become
// blocks / is-blocked-by by direction; everything else becomes related-to.
// Links to issues not in the import (or self-links) are skipped.

describe('JiraCreator dependency mapping (#3392)', function () {
  let updateStub;

  beforeEach(function () {
    updateStub = sinon.stub(Cards.direct, 'updateAsync').resolves(1);
  });

  afterEach(function () {
    updateStub.restore();
  });

  function runWith(issuelinks, key = 'PROJ-1') {
    const creator = new JiraCreator({});
    creator.cardsByKey = { 'PROJ-1': 'idA', 'PROJ-2': 'idB', 'PROJ-3': 'idC' };
    const data = { issues: [{ key, fields: { issuelinks } }] };
    return creator.createDependencies(data).then(() => creator);
  }

  it('maps an outward "Blocks" link to type blocks', async function () {
    await runWith([{ type: { name: 'Blocks' }, outwardIssue: { key: 'PROJ-2' } }]);
    expect(updateStub.calledOnce).to.equal(true);
    const [id, modifier] = updateStub.getCall(0).args;
    expect(id).to.equal('idA');
    expect(modifier.$set.cardDependencies).to.have.length(1);
    expect(modifier.$set.cardDependencies[0]).to.include({ cardId: 'idB', type: 'blocks' });
  });

  it('maps an inward "Blocks" link to type is-blocked-by', async function () {
    await runWith([{ type: { name: 'Blocks' }, inwardIssue: { key: 'PROJ-3' } }]);
    const [, modifier] = updateStub.getCall(0).args;
    expect(modifier.$set.cardDependencies[0]).to.include({ cardId: 'idC', type: 'is-blocked-by' });
  });

  it('maps non-block link types to related-to', async function () {
    await runWith([{ type: { name: 'Relates' }, outwardIssue: { key: 'PROJ-2' } }]);
    const [, modifier] = updateStub.getCall(0).args;
    expect(modifier.$set.cardDependencies[0]).to.include({ cardId: 'idB', type: 'related-to' });
  });

  it('produces normalized entries with default color and icon', async function () {
    await runWith([{ type: { name: 'Blocks' }, outwardIssue: { key: 'PROJ-2' } }]);
    const [, modifier] = updateStub.getCall(0).args;
    const dep = modifier.$set.cardDependencies[0];
    expect(dep).to.have.property('color');
    expect(dep).to.have.property('icon');
  });

  it('skips links whose target issue is not part of the import', async function () {
    await runWith([{ type: { name: 'Blocks' }, outwardIssue: { key: 'NOPE-9' } }]);
    expect(updateStub.called).to.equal(false);
  });

  it('skips self-links', async function () {
    await runWith([{ type: { name: 'Blocks' }, outwardIssue: { key: 'PROJ-1' } }]);
    expect(updateStub.called).to.equal(false);
  });

  it('does not write when an issue has no links', async function () {
    await runWith([]);
    expect(updateStub.called).to.equal(false);
  });
});
