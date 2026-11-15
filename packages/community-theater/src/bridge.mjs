// Portable adapter contracts; implementation must live behind private tenant boundaries.
export const capabilities=Object.freeze([
 {name:'research.sources',effect:'read',input:'SourcePacket',output:'CitedResearch'},
 {name:'world.propose',effect:'draft',input:'CitedResearch',output:'WorldProposal'},
 {name:'cinema.storyboard',effect:'draft',input:'ApprovedScene',output:'ShotManifest'},
 {name:'cinema.render',effect:'bounded_job',input:'ShotManifest',output:'ArtifactReceipt'},
 {name:'cinema.check',effect:'review',input:'ArtifactReceipt',output:'IndependentVerdict'},
 {name:'cinema.publish',effect:'human_gate',input:'IndependentVerdict',output:'PublicationReceipt'}
]);
export function validateEnvelope(x){
 if(!x||typeof x!=='object')throw Error('invalid_envelope');
 for(const k of ['worldId','workId','from','to','capability','inputDigest'])if(typeof x[k]!=='string'||!x[k])throw Error('missing_'+k);
 if(!Number.isSafeInteger(x.attempt)||x.attempt<1||!Number.isFinite(x.budgetLimit)||x.budgetLimit<0||!Number.isSafeInteger(x.leaseUntil))throw Error('invalid_limits');
 if(!capabilities.some(c=>c.name===x.capability))throw Error('unapproved_capability');
 if(!/^[0-9a-f]{64}$/.test(x.inputDigest))throw Error('invalid_input_digest');
 return Object.freeze({...x,key:x.worldId+':'+x.workId+':'+x.attempt});
}
export class A2AInbox{
 constructor(){this.queue=new Map();}
 accept(raw){const x=validateEnvelope(raw);if(this.queue.has(x.key))return{duplicate:true,item:this.queue.get(x.key)};this.queue.set(x.key,{...x,state:'queued'});return{duplicate:false,item:this.queue.get(x.key)};}
 ack(key,identity){const x=this.queue.get(key);if(!x||x.to!==identity||x.state!=='queued'||Date.now()>x.leaseUntil)throw Error('ack_denied');x.state='acked';return x;}
}
