import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Activities from '/models/activities';
import { RulesHelper } from '/server/rulesHelper';
import { Notifications } from '/server/notifications/notifications';
import { getFeatureFlags } from '/models/lib/featureFlags';
const { randomUUID } = require('node:crypto');
const { createSyncHookedActivities } = require('/server/lib/syncHookedActivities');
const { createSyncEffectPlanner } = require('/server/lib/syncEffects');
const { syncOperationEffectId } = require('/server/lib/syncOperationApply');
const { persistSyncCreationActivity } = require('/server/lib/syncCreationActivity');

describe('Sync hooked activity adapter', function () {
  this.timeout(30000);
  it('preserves saved payloads, defers delivery until acknowledgement and respects disabled recording', async function () {
    if (!Meteor.isAppTest) this.skip();
    const cardId=Random.id(),boardId=Random.id(),listId=Random.id(),swimlaneId=Random.id(),userId=Random.id();
    const step={kind:'create',cardId,before:null,after:{_id:cardId,boardId,listId,swimlaneId,title:'Saved'}};
    const context={operationId:randomUUID(),index:0};
    const effectId=syncOperationEffectId(context.operationId,0);
    const plan=createSyncEffectPlanner({policy:{activities:true,notifications:true},userId,username:'author',createdAt:new Date(1000),
      list:{_id:listId,boardId,title:'List'},swimlanes:[{_id:swimlaneId,boardId,title:'Lane'}]})(step,context);
    const flags=getFeatureFlags(),oldFlags={...flags};
    const oldRules=RulesHelper.executeRules,oldUsers=Notifications.getUsers;
    let rules=0,notifications=0,deliveries=0;
    try {
      flags.disableActivities=false;flags.disableNotifications=false;
      RulesHelper.executeRules=async()=>{rules++;};
      Notifications.getUsers=async()=>{notifications++;return [];};
      const activities=createSyncHookedActivities({activities:Activities,plan,step,effectId,userId,
        withActor:(actor,fn)=>DDP._CurrentMethodInvocation.withValue({userId:actor,isSimulation:false},fn)});
      const options={activities,plan:plan.activities,assertCurrent:async()=>{},completeDelivery:async()=>{deliveries++;throw new Error('delivery interrupted');}};
      await assert.rejects(persistSyncCreationActivity(options),/delivery interrupted/);
      assert.deepEqual(await activities.findOneAsync(plan.activities.activity._id),plan.activities.activity);
      assert.equal(rules,0);assert.equal(notifications,0);assert.equal(deliveries,1);
      await persistSyncCreationActivity({...options,completeDelivery:async({effectId:id})=>{deliveries++;return id;}});
      assert.equal(await Activities.find({cardId}).countAsync(),1);assert.equal(deliveries,2);
      await Activities.rawCollection().deleteOne({_id:plan.activities.activity._id});
      flags.disableActivities=true;
      await assert.rejects(persistSyncCreationActivity(options),/sync-activity-unconfirmed/);
      assert.equal(await Activities.find({cardId}).countAsync(),0);assert.equal(deliveries,2);
      flags.disableActivities=false;
      await Activities.insertAsync({_id:Random.id(),activityType:'createCard',cardId,createdAt:new Date(0)});
      assert.equal(rules,1);assert.ok(notifications>0);
      const ordinary=await Activities.findOneAsync({cardId});assert.ok(ordinary.createdAt.getTime()>1000);
    } finally {
      RulesHelper.executeRules=oldRules;Notifications.getUsers=oldUsers;Object.assign(flags,oldFlags);
      await Activities.rawCollection().deleteMany({cardId});
    }
  });
});
