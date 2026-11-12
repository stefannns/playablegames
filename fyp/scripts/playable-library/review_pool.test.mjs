import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {selectReviewPool} from '../../src/page/home/components/playable_review_pool.mjs';
import {selectReviewShowcase} from '../../src/page/home/components/playable_batch_showcase.mjs';
const project=path.resolve(import.meta.dirname,'../..'),review=path.resolve(project,'../2026-10-05-all-files-review');
const model=createRequire(import.meta.url)(review+'/batch-filter.js');
const source=fs.readFileSync(project+'/src/page/home/components/playable_batch_games.ts','utf8');
const catalog=JSON.parse(source.match(/export const PLAYABLE_BATCH_GAMES = (\{.*?\}) as const;/s)[1]),entries=Object.entries(catalog);
const poolSearch=ids=>'?' + new URLSearchParams({review:'batch',reviewPool:ids.join(',')});
const batchIds=model.batch1TaskIds,otherIds=entries.map(([,game])=>game.taskId).filter(id=>!batchIds.includes(id));
test('No opt-in means the ordinary native review and standalone showcase stay unchanged',()=>{
  assert.equal(selectReviewPool(entries,'?review=batch'),entries);assert.equal(selectReviewPool(entries,''),entries);
  assert.equal(selectReviewPool(entries,'?reviewPool='+batchIds.join(',')),entries);
  const showcase=selectReviewShowcase(entries,'?review=batch&showcase=creature-draw');assert.equal(showcase.length,2);
  assert.deepEqual(selectReviewPool(showcase,'?review=batch&showcase=creature-draw'),showcase);
});
test('Category pools are exactly 38/40/78, in existing registry order, with original identity/number',()=>{
  for(const [ids,size] of [[batchIds,38],[otherIds,40],[entries.map(([,game])=>game.taskId),78]]){
    const selected=selectReviewPool(entries,poolSearch(ids));assert.equal(selected.length,size);
    assert.deepEqual(selected.map(([,game])=>game.taskId),ids);
    assert(selected.every(([id,game])=>catalog[id]===game));
  }
});
test('Actual looping order is 3 to 6 in Batch 1, wraps 77 to 1, and reverses',()=>{
  const pool=selectReviewPool(entries,poolSearch(batchIds)),step=(number,direction)=>pool[(pool.findIndex(([,game])=>game.number===number)+direction+pool.length)%pool.length][1].number;
  assert.equal(step(3,1),6);assert.equal(step(72,1),77);assert.equal(step(77,1),1);assert.equal(step(1,-1),77);
  const other=selectReviewPool(entries,poolSearch(otherIds));assert.equal(other[0][1].number,4);assert.equal(other.at(-1)[1].number,78);
});
test('Unknown, malicious and duplicate IDs never widen a valid subset or change catalogue order',()=>{
  const a=batchIds[0],b=batchIds[2],search=poolSearch(['__proto__','missing','../secret',b,a,a]);
  const selected=selectReviewPool(entries,search);assert.deepEqual(selected.map(([,game])=>game.taskId),[a,b]);
  assert.equal(entries.length,78);assert.equal(Object.keys(catalog).length,78);
});
test('An entirely invalid or empty requested pool falls back to one known game, never all78',()=>{
  for(const ids of [[],['missing'],['__proto__','../../bad'],['x'.repeat(200)]]){
    const selected=selectReviewPool(entries,poolSearch(ids));assert.equal(selected.length,1);assert.equal(selected[0],entries[0]);
  }
  assert.deepEqual(selectReviewPool([],poolSearch(['missing'])),[]);
});
test('Native registry routing is review-only and host chrome/gesture pager are not replaced',()=>{
  const config=fs.readFileSync(project+'/src/page/home/components/feed_item_card.config.ts','utf8');
  assert.match(config,/if \(isBatchReview\(\)\) return selectReviewPool\(Object.entries\(PLAYABLE_BATCH_GAMES\), window.location.search\)\.map\(toFeedGame\);/);
  assert(config.indexOf('if (showcase) return showcase.map(toFeedGame);')<config.indexOf('return selectReviewPool('));
  const home=fs.readFileSync(project+'/src/page/home/home_page.tsx','utf8');
  assert.match(home,/reviewPool:new URLSearchParams\(window.location.search\)\.get\("reviewPool"\)/);
  assert.match(home,/\n          loop\n/);
});
test('Actual trusted selection receiver rejects out-of-pool IDs while stepping stays in the filtered list',()=>{
  const home=fs.readFileSync(project+'/src/page/home/home_page.tsx','utf8');
  const receiver=home.match(/const receive = \(event: MessageEvent\) => \{[\s\S]*?\n    \};/)[0].replace('(event: MessageEvent)','(event)');
  const contents=selectReviewPool(entries,poolSearch(batchIds)).map(([id])=>({id}));
  const parent={},state={index:2,jumps:0},context={window:{parent},reviewHost:'http://127.0.0.1:54770',PLAYABLE_BATCH_GAMES:catalog,homeFeedItemContents:contents,
    playableNavigation:{close(){}},pagerRef:{current:{jumpToLogical(index){state.index=index;state.jumps++;},next(){state.index=(state.index+1)%contents.length;},prev(){state.index=(state.index-1+contents.length)%contents.length;}}},setActiveFeedIndex:index=>{state.index=index;}};
  const receive=vm.runInNewContext(receiver+'\nreceive;',context),send=data=>receive({source:parent,origin:context.reviewHost,data});
  send({type:'playable-batch-step',direction:'next'});assert.equal(catalog[contents[state.index].id].number,6);
  const before=state.index;send({type:'playable-batch-select',taskId:otherIds[0]});assert.equal(state.index,before);assert.equal(state.jumps,0);
  send({type:'playable-batch-select',taskId:batchIds.at(-1)});send({type:'playable-batch-step',direction:'next'});assert.equal(catalog[contents[state.index].id].number,1);
});
