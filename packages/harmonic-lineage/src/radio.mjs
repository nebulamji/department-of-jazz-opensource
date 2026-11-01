// Radio lineage: RTTY (ITA2, ITU-T S.1) encode/decode and the JS8-style tone rule. Pure functions, no dependencies.
export const JS8_COSTAS=Object.freeze([4,2,5,6,1,3,0]);
export const JS8_BAND=Object.freeze([500,1000]);
export const js8Offset=note=>{ensure(Number.isInteger(note),'bad note');let hz=440*2**((note-69)/12);while(hz<500)hz*=2;while(hz>=1000)hz/=2;return hz;};
export const js8Tone=note=>Math.min(7,Math.floor((js8Offset(note)-500)/62.5));
const LTRS=31,FIGS=27;
const letterTable=['','E','\n','A',' ','S','I','U','\r','D','R','J','N','F','C','K','T','Z','L','W','H','Y','P','Q','O','B','G','','M','X','V',''];
// Exclude national/private assignments, answerback and bell. Apostrophe uses ASCII presentation.
const figures={1:'3',3:'-',5:"'",6:'8',7:'7',10:'4',12:',',14:':',15:'(',16:'5',17:'+',18:')',19:'2',21:'6',22:'0',23:'1',24:'9',25:'?',28:'.',29:'/',30:'='};
const control={2:'\n',4:' ',8:'\r'};
const letterCode=new Map(letterTable.map((c,i)=>[c,i]).filter(([c])=>c));
const figureCode=new Map(Object.entries(figures).map(([n,c])=>[c,Number(n)]));
const ensure=(p,m)=>{if(!p)throw new Error(m);};
export function encodeITA2(text){
 ensure(typeof text==='string'&&text.length<=200000,'bad ITA2 text');let mode=LTRS;const out=[LTRS];
 for(const ch of text){if(Object.values(control).includes(ch)){out.push(letterCode.get(ch));continue;}
  const target=letterCode.has(ch)?LTRS:figureCode.has(ch)?FIGS:null;ensure(target!==null,`unsupported ITA2 character ${JSON.stringify(ch)}`);
  if(target!==mode){out.push(target);mode=target;}out.push(target===LTRS?letterCode.get(ch):figureCode.get(ch));
 }return Uint8Array.from(out);
}
export function decodeITA2(units){
 ensure((Array.isArray(units)||units instanceof Uint8Array)&&units.length>0&&units.length<=300000,'bad ITA2 units');
 ensure(units[0]===LTRS||units[0]===FIGS,'initial shift required');let mode=units[0],out='';
 for(const n of units){ensure(Number.isInteger(n)&&n>=0&&n<32,'bad five-bit unit');if(n===LTRS||n===FIGS){mode=n;continue;}
  const c=control[n]??(mode===LTRS?letterTable[n]:figures[n]);ensure(c!==undefined&&c!=='','unsupported control or private assignment');out+=c;
 }return out;
}
export const wireElements=units=>[...units].map(n=>{ensure(Number.isInteger(n)&&n>=0&&n<32,'bad unit');return Array.from({length:5},(_,b)=>(n>>b)&1).join('');});
