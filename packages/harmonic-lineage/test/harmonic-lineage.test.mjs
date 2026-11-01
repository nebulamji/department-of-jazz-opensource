import test from 'node:test';import assert from 'node:assert/strict';
import {C,noteHz,frequencyColor,wavelengthXYZ} from '../src/harmonic-lineage.mjs';
import {encodeITA2,decodeITA2,js8Offset,js8Tone,JS8_COSTAS} from '../src/radio.mjs';
test('exact c, octave folding and CIE interpolation; no pitch-class palette',()=>{
 assert.equal(C,299792458);assert.equal(noteHz(69),440);assert.equal(noteHz(81),880);
 const a=frequencyColor(440);assert.ok(Math.abs(a.wavelengthNm-619.6810276874617)<1e-9);assert.equal(a.hex,'#e1002d');
 for(let m=0;m<128;m++){const x=frequencyColor(noteHz(m)),y=frequencyColor(noteHz(m)*2);assert.ok(Math.abs(x.wavelengthNm-y.wavelengthNm)<1e-9);assert.equal(x.hex,y.hex);}
 assert.notEqual(frequencyColor(440).hex,frequencyColor(432).hex);
 assert.deepEqual(wavelengthXYZ(500.5),wavelengthXYZ(500).map((v,i)=>(v+wavelengthXYZ(501)[i])/2));
});
test('ITA2 round trip and JS8 tone rule',()=>{
 assert.equal(decodeITA2(encodeITA2('JAZZ 73')),'JAZZ 73');assert.equal(decodeITA2(encodeITA2('HELLO, WORLD 1959')),'HELLO, WORLD 1959');
 assert.throws(()=>encodeITA2('é'));
 assert.deepEqual([...JS8_COSTAS],[4,2,5,6,1,3,0]);
 const tones={A:6,B:7,C:0,D:1,E:2,F:3,G:4};for(const [n,mid] of Object.entries({A:69,B:71,C:60,D:62,E:64,F:65,G:67}))assert.equal(js8Tone(mid),tones[n],n);
 assert.ok(js8Offset(69)>=500&&js8Offset(69)<1000);
});
