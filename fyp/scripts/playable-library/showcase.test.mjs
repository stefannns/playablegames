import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CREATURE_DRAW_IDS,TIME_CAMERA_ID,selectReviewShowcase,showcaseFrameSource,showcaseGameCount} from '../../src/page/home/components/playable_batch_showcase.mjs';
const source=await readFile(new URL('../../src/page/home/components/playable_batch_games.ts',import.meta.url),'utf8');
const entries=Object.entries(JSON.parse(source.match(/PLAYABLE_BATCH_GAMES = (\{.*?\}) as const/s)[1]));
test('Normal batch/other routes keep their full 78-game list',()=>{assert.equal(selectReviewShowcase(entries,'?review=batch'),null);assert.equal(selectReviewShowcase(entries,'?showcase=unknown'),null);assert.equal(entries.length,78)});
test('Named feed contains exactly current51 then2; swiping wraps only between those games',()=>{
  const selected=selectReviewShowcase(entries,'?review=batch&showcase=creature-draw&revision=abc123');
  assert.deepEqual(selected.map(([,g])=>g.taskId),CREATURE_DRAW_IDS);assert.deepEqual(selected.map(([,g])=>g.number),[51,2]);
  assert(selected.every(([,g])=>g.src.includes('showcaseRevision=abc123')));assert(selected.every(([,g])=>g.src.includes('review=batch-')));
  assert.equal(selected[(1+1)%selected.length][1].number,51);assert.equal(selected[(0+1)%selected.length][1].number,2);
});
test('Missing identities fail closed; untrusted revision cannot become another URL',()=>{
  assert.throws(()=>selectReviewShowcase(entries.slice(0,1),'?showcase=creature-draw'),/Missing showcase game/);
  const selected=selectReviewShowcase(entries,'?showcase=creature-draw&revision=https://evil.invalid/');assert(selected.every(([,g])=>g.src.startsWith('/resource/playable-batch/')&&!g.src.includes('evil')));
});
test('Individual links contain only their own current game and cannot enter the full library',()=>{
  for(const [name,id,number] of [['creature-sandbox',CREATURE_DRAW_IDS[0],51],['draw-face',CREATURE_DRAW_IDS[1],2],['time-camera',TIME_CAMERA_ID,61]]){
    const search='?review=batch&showcase='+name+'&revision=individual123';
    const selected=selectReviewShowcase(entries,search);
    assert.equal(showcaseGameCount(search),1);
    assert.equal(selected.length,1);assert.equal(selected[0][1].taskId,id);assert.equal(selected[0][1].number,number);
    assert(selected[0][1].src.includes('showcaseRevision=individual123'));
    const other=CREATURE_DRAW_IDS.find(v=>v!==id),source='/resource/playable-batch/'+other+'/game.html';
    assert.equal(showcaseFrameSource('playable-batch-'+other,source,search),source);
  }
  assert.equal(selectReviewShowcase(entries,'?showcase=__proto__'),null);
  assert.equal(showcaseGameCount('?review=batch'),null);assert.equal(showcaseGameCount('?showcase=creature-draw'),2);
});
test('Separate entry pages have fixed identities, safe phone chrome and no alternate-game query override',async()=>{
  for(const [name,id,title] of [['creature-sandbox',CREATURE_DRAW_IDS[0],'Creature Sandbox'],['draw-face',CREATURE_DRAW_IDS[1],'Draw Face'],['time-camera',TIME_CAMERA_ID,'Time Camera']]){
    const page=await readFile(new URL('../../public/fyp-'+name+'.html',import.meta.url),'utf8');
    assert(page.includes('data-showcase="'+name+'"'));assert(page.includes('data-task="'+id+'"'));assert(page.includes('<title>'+title+' · FYP</title>'));
    assert(page.includes('hostProvidesPhoneChrome:false'));assert(!page.includes('query.get'));
  }
});
test('Actual playable stage uses revision for both initial frame and exit/reload',async()=>{
  const id='playable-batch-'+CREATURE_DRAW_IDS[0],src='/resource/playable-batch/'+CREATURE_DRAW_IDS[0]+'/game.html?review=batch';
  assert.equal(showcaseFrameSource(id,src,'?review=batch'),src);
  assert.equal(showcaseFrameSource('playable-other',src,'?showcase=creature-draw'),src);
  assert(showcaseFrameSource(id,src,'?showcase=creature-draw&revision=abc123').endsWith('showcaseRevision=abc123'));
  const stage=await readFile(new URL('../../src/page/home/components/playable_feed.tsx',import.meta.url),'utf8');
  assert(stage.includes('showcaseFrameSource(contentId, content.src, window.location.search)'));
  assert.equal((stage.match(/\$\{frameSource\}#services=/g)||[]).length,2);
  assert(stage.includes('showcaseGameCount(window.location.search) === 1'));
  assert(stage.includes('style={singleShowcase ? { visibility: "hidden" } : undefined} disabled={singleShowcase}'));
});
test('Standalone entry preserves original phone chrome and supports either first game',async()=>{
  const page=await readFile(new URL('../../public/fyp-51-2.html',import.meta.url),'utf8');
  for(const part of ['showcase',"'creature-draw'",...CREATURE_DRAW_IDS,'safe-area:set','hostProvidesPhoneChrome:false','height:100dvh'])assert(page.includes(part),part);
  assert(page.includes("query.get('game') === '2'"));
  assert(!/127\.0\.0\.1|\/Users\//.test(page));
});
