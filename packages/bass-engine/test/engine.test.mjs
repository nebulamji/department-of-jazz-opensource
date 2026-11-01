import test from 'node:test';import assert from 'node:assert/strict';
import {resolveNamedStandard,transposeProgression,detectKeyFromProgression,extractTuneNameAndKey,getChordRoot,getChordQuality} from '../src/index.ts';
test('transposes and reads chords',()=>{
 assert.deepEqual(transposeProgression(['Cmaj7','Am7','Dm7','G7'],'C','F').length,4);
 assert.equal(getChordRoot('F#m7'),'F#');assert.ok(getChordQuality('G7').length>0);
 assert.equal(typeof detectKeyFromProgression(['Dm7','G7','Cmaj7']),'string');
});
test('named standards come only from the supplied source',()=>{
 const src={lookup:t=>/blues/i.test(t)?{title:'Test Blues',key:'F',progression:['F7','Bb7','F7','F7']}:null};
 const hit=resolveNamedStandard('Test Blues in G',null,src);assert.ok(hit);assert.equal(hit.progression.length,12);
 assert.equal(resolveNamedStandard('Unknown Tune',null,src),null);
 assert.equal(extractTuneNameAndKey('Autumn Leaves in Bb').extractedKey,'Bb');
});
