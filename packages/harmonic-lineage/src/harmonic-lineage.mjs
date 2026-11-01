// Inspectable frequency study. No randomness, audio engine, physical sound/light conversion or plate solver.
import {CIE_FIRST_NM,CIE_XYZ} from './data/cie-1931-380-760.mjs';
export const PROFILE='jazzcats-optical-octave-380-760-v1';
export const C=299792458;
export const DATA=Object.freeze({creator:'International Commission on Illumination (CIE)',year:2019,doi:'10.25039/CIE.DS.xvudnb9b',license:'CC BY-SA 4.0',licenseURL:'https://creativecommons.org/licenses/by-sa/4.0/',sourceSHA256:'fa663e3535a7e0763a745993a1f0a192eb0275ac46ad2d1befd7626841e713c1',adaptation:'Unchanged 1nm XYZ values excerpted for 380..760nm; linear interpolation.'});
const check=(b,m)=>{if(!b)throw Error(m);};
export function noteHz(midi,a4=440){check(Number.isInteger(midi)&&midi>=0&&midi<=127,'MIDI note outside 0..127');check(Number.isFinite(a4)&&a4>=400&&a4<=480,'A4 outside 400..480 Hz');return a4*2**((midi-69)/12);}
export function wavelengthXYZ(nm){check(Number.isFinite(nm)&&nm>=380&&nm<=760,'Wavelength outside this profile');const p=nm-CIE_FIRST_NM,i=Math.floor(p),t=p-i;return CIE_XYZ[i].map((v,c)=>v+((CIE_XYZ[Math.min(i+1,380)][c])-v)*t);}
export function displayColor(xyz){
 check(Array.isArray(xyz)&&xyz.length===3&&xyz.every(n=>Number.isFinite(n)&&n>=0)&&xyz.some(n=>n>0),'Positive finite XYZ required');
 const sum=xyz.reduce((a,b)=>a+b,0),[X,Y,Z]=xyz.map(v=>v/sum);
 // XYZ D65 to linear sRGB. A spectrum-locus color is usually outside sRGB.
 const raw=[3.2404542*X-1.5371385*Y-.4985314*Z,-.969266*X+1.8760108*Y+.041556*Z,.0556434*X-.2040259*Y+1.0572252*Z];
 // Declared display policy, not physiology: add equal linear-RGB white to remove
 // negative channels, then normalize the largest channel to .75. Never hide clipping.
 const whiteAdded=Math.max(0,-Math.min(...raw)),positive=raw.map(v=>v+whiteAdded),peak=Math.max(...positive),linear=positive.map(v=>.75*v/peak);
 const encoded=linear.map(v=>v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055),hex='#'+encoded.map(v=>Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0')).join('');
 return {hex,xy:[X,Y],sourceXYZ:[...xyz],rawLinearRGB:raw,whiteAdded,displayLinearRGB:linear,displayPolicy:'Equal-channel linear-RGB white addition, peak=.75, sRGB transfer; approximate gamut-mapped preview, not emitted spectral light.'};
}
export function frequencyColor(audioHz){
 check(Number.isFinite(audioHz)&&audioHz>=1&&audioHz<=100000,'Frequency outside 1..100000 Hz');
 const minimum=C/(760e-9),maximum=C/(380e-9);let octaveShift=Math.ceil(Math.log2(minimum/audioHz)),opticalHz=audioHz*2**octaveShift;
 if(opticalHz>=maximum){octaveShift--;opticalHz=audioHz*2**octaveShift;}
 check(opticalHz>=minimum*(1-1e-14)&&opticalHz<maximum,'Optical fold failed');const wavelengthNm=C/opticalHz*1e9;
 return {audioHz,octaveShift,opticalHz,wavelengthNm,...displayColor(wavelengthXYZ(Math.min(760,Math.max(380,wavelengthNm))))};
}
export const PAIRS=Object.freeze({equalThird:{label:'Equal-tempered third',ratio:2**(4/12),cycles:4,rational:null},justThird:{label:'Just third / 5:4',ratio:5/4,cycles:4,rational:[5,4]},equalFifth:{label:'Equal-tempered fifth',ratio:2**(7/12),cycles:2,rational:null},justFifth:{label:'Just fifth / 3:2',ratio:3/2,cycles:2,rational:[3,2]},octave:{label:'Octave / 2:1',ratio:2,cycles:1,rational:[2,1]},golden:{label:'Golden ratio / comparison',ratio:(1+Math.sqrt(5))/2,cycles:8,rational:null}});
export function oscillatorStudy({rootHz=noteHz(60),pair='justFifth',phase=0,samples=1200}={}){
 check(Object.hasOwn(PAIRS,pair),'Unknown oscillator pair');check(Number.isFinite(phase)&&phase>=0&&phase<=Math.PI*2,'Phase outside 0..2pi');check(Number.isInteger(samples)&&samples>=120&&samples<=4000,'Samples outside 120..4000');const p=PAIRS[pair],root=frequencyColor(rootHz),upper=frequencyColor(rootHz*p.ratio);
 const points=Array.from({length:samples+1},(_,i)=>{const t=p.cycles*i/samples;return [Math.sin(2*Math.PI*t),Math.sin(2*Math.PI*p.ratio*t+phase)];});
 return {profile:PROFILE,pair,label:p.label,root,upper,ratio:p.ratio,cycles:p.cycles,windowSeconds:p.cycles/rootHz,phase,closedByExactRatio:p.rational!==null,exactRatio:p.rational,endpointError:Math.hypot(points.at(-1)[0]-points[0][0],points.at(-1)[1]-points[0][1]),points,model:'Ideal orthogonal sinusoidal oscillators; x=sin(2pi*f*t), y=sin(2pi*ratio*f*t+phase). Not a Chladni plate, RF decoder or universal note-shape law.',data:DATA,claims:{physicalSoundToLightConversion:false,uniqueNaturalNoteColor:false,plateSimulation:false,musicEngineIntegrated:false}};
}
export function curveSVG(study){
 check(study?.profile===PROFILE&&Array.isArray(study.points)&&study.points.length<=4001,'Bad oscillator study');check(/^#[0-9a-f]{6}$/i.test(study.upper?.hex),'Bad curve color');
 const d=study.points.map(([x,y],i)=>{check(Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x)<=1.000001&&Math.abs(y)<=1.000001,'Invalid oscillator point');return `${i?'L':'M'}${(160+x*138).toFixed(3)},${(160-y*138).toFixed(3)}`;}).join(' ');
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320"><title>Calculated two-oscillator figure</title><desc>Frequency ratio and phase determine the curve; not a vibration-plate simulation.</desc><rect width="320" height="320" fill="#101925"/><path d="M22 160H298M160 22V298" stroke="#465164" stroke-width=".5"/><path d="${d}" fill="none" stroke="${study.upper.hex}" stroke-width="1.4"/></svg>`;
}
export function recolorStudy(original){
 check(original?.score?.events&&Array.isArray(original.paints),'Signal study required');const palette=new Map(original.score.events.filter(e=>e.note!==null).map(e=>[e.index,frequencyColor(e.hz)]));
 const paints=original.paints.map(p=>{const c=palette.get(p.event);check(c,'Glyph has no sounding event');return {...p,color:c.hex};});
 return {...original,paints,harmonicPalette:{profile:PROFILE,sourceArtHash:original.artHash,palette:[...palette].map(([event,c])=>({event,...c})),data:DATA,exportIsAdaptation:true},artHash:null,recipeHash:null};
}
