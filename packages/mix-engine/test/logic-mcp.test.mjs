import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const {handleToolCall,sanitizeParams}=createRequire(import.meta.url)('../logic-mcp/server.js');
test('numeric params reject strings, NaN and injection attempts',async()=>{
 for(const bad of ['1 \n do shell script "id"',NaN,Infinity,{},null,'3'])assert.ok((await handleToolCall('navigate_goto_marker',{markerIndex:bad})).error);
});
test('text params are escaped and cannot close the AppleScript string',()=>{
 const r=sanitizeParams({newName:'x" & (do shell script "id") & "'},['newName']);
 assert.equal(r.value.newName,'x\\" & (do shell script \\"id\\") & \\"');
 assert.ok(sanitizeParams({newName:'a\nb'},['newName']).error);assert.ok(sanitizeParams({newName:''},['newName']).error);assert.ok(sanitizeParams({newName:'a'.repeat(200)},['newName']).error);
});
test('unknown tools and missing params fail without running anything',async()=>{
 assert.ok((await handleToolCall('nope',{})).error);assert.ok((await handleToolCall('navigate_goto_marker',{})).error);
});
