import fs from 'node:fs';
import path from 'node:path';
export function organizationName(value) {
  if (typeof value!=='string' || !/^[A-Za-z0-9][A-Za-z0-9-]{0,99}$/.test(value)) throw new Error('Invalid GitHub organization name');
  return value;
}
export function namespace(value) {
  if (typeof value!=='string' || !value.split('/').every(s=>/^[A-Za-z0-9_.-]{1,100}$/.test(s) && s!=='.' && s!=='..')) throw new Error('Invalid destination organization namespace');
  return value;
}
export function validateOrganizations(value) {
  if(value.version!==1 || !Array.isArray(value.organizations))throw new Error('Invalid organization settings');
  const seen=new Set();
  for(const item of value.organizations){organizationName(item.source);if(seen.has(item.source.toLowerCase()))throw new Error('Duplicate source organization');seen.add(item.source.toLowerCase());for(const target of ['gitlab','codeberg','sourceforge'])namespace(item.destinations?.[target]);if(item.destinations.codeberg.includes('/')||item.destinations.sourceforge.includes('/'))throw new Error('Only GitLab supports subgroup namespaces');}
  if(value.selected!==null && !value.organizations.some(o=>o.source===value.selected))throw new Error('Selected organization does not exist');
  return value;
}
export function loadOrganizations(root) {
  const file=path.join(root,'.tools/mirror/organizations.json');
  return validateOrganizations(fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{version:1,selected:'wekan',organizations:[{source:'wekan',destinations:{gitlab:'wekan',codeberg:'wekan',sourceforge:'wekan'}}]});
}
export function saveOrganizations(root,value){validateOrganizations(value);const file=path.join(root,'.tools/mirror/organizations.json');fs.mkdirSync(path.dirname(file),{recursive:true});const incoming=file+`.incoming-${process.pid}`;fs.writeFileSync(incoming,JSON.stringify(value,null,2)+'\n');fs.renameSync(incoming,file);}
export function setOrganization(value,item,oldSource){
  organizationName(item.source);const next=structuredClone(value),index=oldSource?next.organizations.findIndex(o=>o.source===oldSource):-1;
  if(oldSource && index<0)throw new Error('Organization to edit does not exist');
  if(index<0)next.organizations.push(item);else next.organizations[index]=item;
  next.selected=item.source;return validateOrganizations(next);
}
export function removeOrganization(value,source){const next=structuredClone(value);next.organizations=next.organizations.filter(o=>o.source!==source);if(next.selected===source)next.selected=next.organizations[0]?.source || null;return validateOrganizations(next);}
