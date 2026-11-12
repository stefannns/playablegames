import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pilotRoot,pilotPrefix,pilotFileForRequest,pilotPreview} from './pilot_preview.mjs';
import {selectReviewShowcase,showcaseGameCount} from '../../src/page/home/components/playable_batch_showcase.mjs';

test('Pilot serves live game assets only, and never a process document',()=>{
  assert.equal(pilotFileForRequest('/resource/playable-library/01/index.html'),undefined);
  for(const request of ['','missing.png','../process/conversion-log.txt','%2e%2e/process/conversion-log.txt','assets%5c..%5cgame.js','%00','%ZZ','.hidden'])assert.equal(pilotFileForRequest(pilotPrefix+request),null,request);
  assert.equal(pilotFileForRequest(pilotPrefix+'game.html?host=fyp'),pilotRoot+'game.html');
  assert.equal(pilotFileForRequest(pilotPrefix+'vendor/wasm/vision_wasm_internal.wasm'),pilotRoot+'vendor/wasm/vision_wasm_internal.wasm');
});
test('Pilot is opt-in, one-game only, and omitted from the normal batch catalog',()=>{
  const source=readFileSync(new URL('../../src/page/home/components/playable_pilot_games.ts',import.meta.url),'utf8');
  assert(source.includes('"playable-batch-catch-the-beat-pilot"'));
  const entry=['playable-batch-catch-the-beat-pilot',{taskId:'catch-the-beat-pilot',title:'Catch the Beat',description:'Test',src:pilotPrefix+'game.html?host=fyp'}];
  assert.equal(selectReviewShowcase([entry],'?review=batch'),null);
  const selected=selectReviewShowcase([entry],'?review=batch&showcase=catch-the-beat&revision=pilot1');
  assert.equal(selected.length,1);assert.equal(showcaseGameCount('?showcase=catch-the-beat'),1);
  assert(selected[0][1].src.includes('host=fyp'));assert(selected[0][1].src.includes('showcaseRevision=pilot1'));
  assert(!readFileSync(new URL('../../src/page/home/components/playable_batch_games.ts',import.meta.url),'utf8').includes('catch-the-beat'));
  assert.equal(pilotPreview().apply,'serve');
});
test('Preview uses the existing FYP runtime and preserves direct mode',()=>{
  const qa=readFileSync(new URL('../../../2026-10-20-catch-the-beat-playable/qa.html',import.meta.url),'utf8');
  assert(qa.includes('showcase=catch-the-beat'));
  assert(qa.includes("mode==='fyp'?[402,874]"));
  assert(qa.includes('hostProvidesPhoneChrome:false'));
  assert(qa.includes('game/game.html?revision=eh-port-1'));
});
