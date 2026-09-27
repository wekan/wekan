'use strict';
const {test,expect}=require('../fixtures');
const db=require('../helpers/db');

test('anonymous LDAP login with an empty password cannot create a session and records a security summary',async({page,user})=>{
 await page.goto('/sign-in');
 await page.waitForFunction(()=>typeof Meteor!=='undefined'&&Meteor.status().connected);
 const before=db.findOne('users',{_id:user.id}).services.resume.loginTokens.length;
 const result=await page.evaluate(username=>new Promise(resolve=>{
  Accounts.callLoginMethod({methodArguments:[{ldap:true,ldapOptions:{},username,ldapPass:''}],
   userCallback:error=>resolve({error:error?.error,userId:Meteor.userId()})});
 }),user.username);
 expect(result.error).toBeTruthy();expect(result.userId).toBeNull();
 expect(db.findOne('users',{_id:user.id}).services.resume.loginTokens.length).toBe(before);
 await expect.poll(()=>db.find('eventlog',{bleed:'LdapBindBleed'}).length).toBeGreaterThan(0);
 await expect(page.locator('#at-field-password')).toBeVisible();
});
