import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const project=fileURLToPath(new URL('../../',import.meta.url));
const review=resolve(project,'../2026-10-05-all-files-review');
const index=await readFile(resolve(review,'index.html'),'utf8');
const original=JSON.parse(index.match(/const games = (\[.*?\]);/s)[1]);
const imported=JSON.parse((await readFile(resolve(review,'batch-1012-games.js'),'utf8')).match(/window\.PlayableImportedGames = (\[.*?\]);/s)[1]);
const {normalize}=createRequire(import.meta.url)(resolve(review,'review-catalog.js'));
const games=normalize([...original,...imported]);
const source=await readFile(resolve(project,'src/page/home/components/playable_batch_games.ts'),'utf8');
const catalog=JSON.parse(source.match(/export const PLAYABLE_BATCH_GAMES = (\{.*?\}) as const;/s)[1]);

test('all 78 games match the review list including five Effect House conversions',()=>{
  assert.equal(Object.keys(catalog).length,games.length); assert.equal(games.length,78);
  assert.equal(games.at(-1).taskId,'eh_makeover_20261020');
  assert.ok(Object.values(catalog).some(game=>game.taskId==='playable2_20261001230052_xrken6b'));
  assert.deepEqual(games.map(game=>game.taskId), [...original,...imported].filter(game=>!['07b_lifesim_ss41g7','playable_20260909035048_1wdfrh','playable2_20261001225856_15hv2j','playable2_20261001225937_72e2ez','playable2_20261001230147_id39lj'].includes(game.taskId)).map(game=>game.taskId));
  for(const game of games){
    const item=catalog['playable-batch-'+game.taskId];
    assert.equal(item.number,game.number); assert.equal(item.title,game.number+'. '+game.name);
    assert.ok(item.src.startsWith('/resource/playable-batch/'));
    assert.ok(!JSON.stringify(item).includes('zip'));
  }
});

test('height simulator controls revision survives the FYP mirror for cache-safe updates',()=>{
  const src=catalog['playable-batch-height_together_20261019'].src;
  assert.equal(new URL(src,'http://localhost').searchParams.get('controls'),'coffee-arm-clearance-20261020');
  assert.equal(new URL(src,'http://localhost').searchParams.get('review'),'batch-20261013-1');
});

test('upward/next order follows the consecutive numbering and wraps at 78',async()=>{
  const registry=await readFile(resolve(project,'src/page/home/components/feed_item_card.config.ts'),'utf8');
  assert(registry.includes('if (isBatchReview()) return selectReviewPool(Object.entries(PLAYABLE_BATCH_GAMES), window.location.search).map(toFeedGame);'));
  const list=Object.values(catalog);
  const next=number=>list[(list.findIndex(game=>game.number===number)+1)%list.length].number;
  for(let number=1;number<=games.length;number++)assert.equal(next(number),number===games.length?1:number+1);
});

test('mirrored entry, bundles and configuration retain the latest working packages',async()=>{
  for(const game of games){
    const entry=resolve(review,game.src.split('?')[0]),dir=dirname(entry);
    const mirror=resolve(project,'public/resource/playable-batch',game.taskId);
    const html=await readFile(entry,'utf8'), copied=await readFile(resolve(mirror,basename(entry)),'utf8');
    assert.equal(copied.replace('<script src="/resource/playable-batch/review-host.js"></script><script src="/resource/playable-feed/pocket-host.js" data-seed-random="off"></script>','').replace('<head>\n','<head>'),html);
    for(const name of ['game.config.json','bundle.js']) {
      try{const before=await readFile(resolve(dir,name));assert.deepEqual(await readFile(resolve(mirror,name)),before);}catch(error){if(error.code!=='ENOENT')throw error;}
    }
  }
});

test('review integration preserves AppFrame and scopes mode/sandbox/loading changes',async()=>{
  const home=await readFile(resolve(project,'src/page/home/home_page.tsx'),'utf8');
  const feed=await readFile(resolve(project,'src/page/home/components/playable_feed.tsx'),'utf8');
  const registry=await readFile(resolve(project,'src/page/home/components/feed_item_card.config.ts'),'utf8');
  assert.ok(registry.includes('if (isBatchReview())'));
  assert.ok(feed.includes('setLoaded(entry.isIntersecting)'));
  assert.ok(feed.includes('"about:blank"'));
  assert.ok(home.includes('Math.min(distance, list.length - distance) > 1'));
  assert.ok(home.includes('event.source !== window.parent || event.origin !== reviewHost'));
  const host=await readFile(resolve(review,'batch-view.js'),'utf8');
  assert.ok(host.includes("frame.src = 'about:blank'"));
  assert.ok(host.includes('event.source !== frame.contentWindow || event.origin !== mockOrigin'));
  assert.ok(host.includes("dialog.showModal()"));
  assert.ok(host.includes('hostProvidesPhoneChrome:false'));
  assert.ok(host.includes('Choose game<select aria-label="Choose game">'));
  assert.ok(host.includes('picker.value = game.taskId'));
  assert.ok(host.includes("type:'playable-batch-select',taskId:picker.value"));
});

test('trusted direct selection jumps to every listed game and preserves subsequent stepping',async()=>{
  const home=await readFile(resolve(project,'src/page/home/home_page.tsx'),'utf8');
  // Execute the actual message receiver with a pager stand-in; no browser or hardware access.
  const receiver=home.match(/const receive = \(event: MessageEvent\) => \{[\s\S]*?\n    \};/)[0].replace('(event: MessageEvent)','(event)');
  const contents=Object.keys(catalog).map(id=>({id}));
  const parent={},state={index:0,closed:0,jumps:0};
  const context={
    window:{parent},reviewHost:'http://127.0.0.1:54770',PLAYABLE_BATCH_GAMES:catalog,
    homeFeedItemContents:contents,playableNavigation:{close(){state.closed++;}},
    pagerRef:{current:{
      jumpToLogical(index){state.index=index;state.jumps++;},
      prev(){state.index=(state.index-1+contents.length)%contents.length;},
      next(){state.index=(state.index+1)%contents.length;},
    }},setActiveFeedIndex(index){state.index=index;},
  };
  const receive=vm.runInNewContext(receiver+'\nreceive;',context);
  const send=(data,overrides={})=>receive({source:parent,origin:context.reviewHost,data,...overrides});
  for(const game of Object.values(catalog)){
    send({type:'playable-batch-select',taskId:game.taskId});
    assert.equal(catalog[contents[state.index].id].taskId,game.taskId);
  }
  const jumps=state.jumps,closed=state.closed;
  for(const data of [null,{type:'unknown'},{type:'playable-batch-select',taskId:null},{type:'playable-batch-select',taskId:'missing'},{type:'playable-batch-select',taskId:'playable2_20261001230052_xrken6'},{type:'playable-batch-select',taskId:'playable2_20261013020814_woay2o'},...['playable2_20261001225856_15hv2j','playable2_20261001225937_72e2ez','playable2_20261001230147_id39lj'].map(taskId=>({type:'playable-batch-select',taskId})),{type:'playable-batch-select',taskId:'__proto__'},{type:'playable-batch-step',direction:'invalid'}])send(data);
  send({type:'playable-batch-select',taskId:games[0].taskId},{source:{}});
  send({type:'playable-batch-select',taskId:games[0].taskId},{origin:'https://untrusted.example'});
  assert.equal(state.jumps,jumps);assert.equal(state.closed,closed);
  for(const [number,expected] of [[12,13],[47,48],[48,49],[49,50],[53,54],[59,60],[63,64],[68,69],[69,70],[70,71],[71,72],[72,73],[73,74],[74,75],[75,76],[76,77],[77,78],[78,1]]){
    send({type:'playable-batch-select',taskId:games.find(game=>game.number===number).taskId});
    send({type:'playable-batch-step',direction:'next'});
    assert.equal(catalog[contents[state.index].id].number,expected);
    send({type:'playable-batch-step',direction:'previous'});
    assert.equal(catalog[contents[state.index].id].number,number);
  }
  context.reviewHost='null';
  send({type:'playable-batch-select',taskId:games[0].taskId});
  assert.equal(catalog[contents[state.index].id].number,1);
});
test('play-mode upward swipe calls next; downward swipe reverses without intercepting game input',async()=>{
  const feed=await readFile(resolve(project,'src/page/home/components/playable_feed.tsx'),'utf8');
  assert(feed.includes('usePlayableExitGesture("up", onNext ?? onBack, onPrevious)'));
  assert(feed.includes('"Swipe up for next game"'));assert(!feed.includes('Swipe down for next game'));
  const gesture=(await readFile(resolve(project,'src/page/home/components/playable_exit_gesture.ts'),'utf8'))
    .replace(/import .*?;\n/,'').replace('export function','function')
    .replace('direction: "left" | "up" | "down", onExit: () => void, onReverse?: () => void','direction, onExit, onReverse')
    .replace('useRef<{ id: number; x: number; y: number; time: number; dragging: boolean } | null>','useRef')
    .replaceAll('event: PointerEvent<HTMLElement>','event').replace('event: MouseEvent<HTMLElement>','event');
  const make=vm.runInNewContext(gesture+'\nusePlayableExitGesture;',{useRef:current=>({current})});
  const calls=[];const handlers=make('up',()=>calls.push('next'),()=>calls.push('previous'));
  const point=y=>({isPrimary:true,button:0,pointerId:1,clientX:50,clientY:y,timeStamp:y===200?0:200,currentTarget:{setPointerCapture(){}},preventDefault(){},stopPropagation(){}});
  for(const y of [100,300]){handlers.onPointerDownCapture(point(200));handlers.onPointerMoveCapture(point(y));handlers.onPointerUpCapture(point(y));}
  assert.deepEqual(calls,['next','previous']);
});

function gateHarness() {
  const listeners=new Map(),parent={},calls={camera:0,play:0};
  const streams=[];
  class Context {constructor(){this.state='running';}async suspend(){this.state='suspended';}async resume(){this.state='running';}async close(){this.state='closed';}}
  class Media {async play(){calls.play++;}pause(){this.paused=true;}}
  const window={parent,AudioContext:Context,addEventListener:(name,callback)=>listeners.set(name,callback)};
  const navigator={mediaDevices:{async getUserMedia(){calls.camera++;const track={stopped:false,stop(){this.stopped=true;}};const stream={getTracks:()=>[track]};streams.push(stream);return stream;}}};
  const execute=code=>vm.runInNewContext(code,{window,parent,navigator,HTMLMediaElement:Media,location:{origin:'http://127.0.0.1:5173'},DOMException});
  return {window,navigator,Media,calls,streams,execute,activate(active,overrides={}){listeners.get('message')({source:parent,origin:'http://127.0.0.1:5173',data:{type:'playable-active',active},...overrides});},close(){listeners.get('pagehide')();}};
}
test('camera and audio wait for real play-mode activation; foreign messages are ignored',async()=>{
  const h=gateHarness();h.execute(await readFile(resolve(project,'public/resource/playable-batch/review-host.js'),'utf8'));
  const camera=h.navigator.mediaDevices.getUserMedia({video:true});
  const context=new h.window.AudioContext(),sound=new h.Media();
  const media=sound.play(),audio=context.resume();
  await Promise.resolve();assert.equal(h.calls.camera,0);assert.equal(h.calls.play,0);assert.equal(context.state,'suspended');
  h.activate(true,{source:{}});h.activate(true,{origin:'https://unrelated.example'});
  await Promise.resolve();assert.equal(h.calls.camera,0);
  h.activate(true);await Promise.all([camera,media,audio]);
  assert.equal(h.calls.camera,1);assert.equal(h.calls.play,1);assert.equal(context.state,'running');
  h.close();await Promise.resolve();assert.equal(context.state,'closed');assert.equal(sound.paused,true);assert.equal(h.streams[0].getTracks()[0].stopped,true);
});
