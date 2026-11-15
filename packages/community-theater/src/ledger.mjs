import {appendFileSync,mkdirSync,existsSync,readFileSync} from 'node:fs';import{dirname}from'node:path';import{digest}from'./core.mjs';
export class Ledger{constructor(file){this.file=file;mkdirSync(dirname(file),{recursive:true});}
 append(e){appendFileSync(this.file,JSON.stringify(e)+'\n',{mode:0o600});}
 read(){if(!existsSync(this.file))return [];let prev='0'.repeat(64);const events=readFileSync(this.file,'utf8').split('\n').filter(Boolean).map(JSON.parse);for(const e of events){const{hash,...fields}=e;if(e.previous!==prev||digest(fields)!==hash)throw Error('ledger_integrity_failed');prev=hash;}return events;}
}
