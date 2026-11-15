import {can} from './core.mjs';
// A Discord role name, user-supplied wallet or unsigned token listing never grants authority.
export function freshVerified(s,now=Date.now()){return Boolean(s?.verified===true&&s.wallet&&s.discordId&&Array.isArray(s.tokenIds)&&Number.isSafeInteger(s.expiresAt)&&s.expiresAt>now&&s.expiresAt<=now+300000);}
export function mintedRole({snapshot,roleManifest,tokenRole='audience',now=Date.now()}){if(!freshVerified(snapshot,now))return 'audience';const held=new Set(snapshot.tokenIds.map(String));return Object.entries(roleManifest).some(([id,role])=>held.has(id)&&role===tokenRole)?tokenRole:'audience';}
export function allow({snapshot,role,ability,now=Date.now()}){return role==='audience'?can(role,ability):freshVerified(snapshot,now)&&can(role,ability);}
