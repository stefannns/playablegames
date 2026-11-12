import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const root=new URL('../../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const transpile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React}}).outputText;
const tapModule={exports:{}};
vm.runInNewContext(transpile(read('src/components/utilities/feed_preview_tap.ts')),{module:tapModule,exports:tapModule.exports});
const create=()=>tapModule.exports.createFeedPreviewTap();

test('stationary release returns its target only once; touch jitter is tolerated',()=>{
  const tap=create(),button={};tap.start(button,1,100,200,0);tap.move(1,104,203);
  assert.equal(tap.release(1,104,203,250),button);assert.equal(tap.release(1,104,203,251),null);
});
test('vertical, horizontal and out-and-back drags never become a play tap',()=>{
  for(const [x,y] of [[100,160],[150,200],[108,208]]){
    const tap=create();tap.start({},1,100,200,0);tap.move(1,x,y);
    assert.equal(tap.release(1,100,200,300),null);
  }
});
test('cancellation, missing targets, long presses and mismatched pointer releases do not play',()=>{
  const tap=create();tap.start({},1,0,0,0);tap.cancel();assert.equal(tap.release(1,0,0,1),null);
  tap.start(null,1,0,0,0);assert.equal(tap.release(1,0,0,1),null);
  tap.start({},1,0,0,0);assert.equal(tap.release(1,0,0,601),null);
  tap.start({},1,0,0,0);assert.equal(tap.release(2,0,0,100),null);
});

// Execute the real pager's pointer handlers and release physics. The only stand-ins
// are DOM/RAF/GSAP layout primitives; no browser or hidden input injection is used.
function pipeline(){
  const source=transpile(read('src/components/utilities/vertical_snap_pager.tsx'));
  const slice=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
  const controls=slice('const isInteractiveTarget =','const onLostPointerCapture =');
  const physics=slice('const getReleaseTargetIndex =','/** 统一收口');
  let now=0;const frames=[],calls={plays:0,captures:0,indices:[]};
  class Element{
    constructor(kind){this.kind=kind;this.isConnected=true;this.disabled=false;}
    closest(selector){return selector==='[data-feed-photo-carousel]'?null:selector.includes('data-feed-preview-tap')?(this.kind==='preview'?this:null):this.kind==='blank'?null:this;}
    matches(selector){return this.kind==='preview'&&selector==='button[data-feed-preview-tap]';}
    click(){calls.plays++;}
  }
  const dragRef={current:{pointerId:null,isDragging:false,trackY:-844,activeIndex:1,height:844,width:390}};
  const context={Element,Math,performance:{now:()=>now},dragRef,
    feed_preview_tap_1:{createFeedPreviewTap:()=>create()},previewTap:create(),
    root:{style:{},setPointerCapture(){calls.captures++;}},track:{},gsap_1:{gsap:{killTweensOf(){}}},
    horizontalSwipeRef:{current:{}},applyLayout(){},attachWindowListeners(){},detachWindowListeners(){},
    overlay:null,setOverlayOpacity:null,setOverlayBg:null,lastFill:null,
    setTrackY(){},moveRaf:null,pendingMoveX:null,pendingMoveY:null,pendingMoveTime:null,horizontalVisitorStarted:false,
    requestAnimationFrame:fn=>{frames.push(fn);return frames.length;},cancelAnimationFrame(){},
    useExtendedLoop:false,logicalCount:3,extendedCount:3,VELOCITY_FILTER_ALPHA:.35,OVERSCROLL_RESISTANCE:.35,
    DISTANCE_COMMIT_RATIO:.2,FLICK_VELOCITY_THRESHOLD:.35,FLICK_MIN_TRAVEL_PX:12,
    clamp:(n,min,max)=>Math.max(min,Math.min(max,n)),
  };
  vm.createContext(context);
  context.finishDrag=()=>{
    if(context.pendingMoveY!==null)context.handlers.flush();
    calls.indices.push(context.handlers.releaseIndex());
    context.previewTap.cancel();dragRef.current.isDragging=false;dragRef.current.pointerId=null;
  };
  vm.runInContext(physics+controls+'\nhandlers={down:onPointerDown,move:onPointerMove,up:onPointerUpOrCancel,flush:flushPendingMove,releaseIndex:getReleaseTargetIndex};',context);
  const event=(target,type='pointerdown',options={})=>({target,type,pointerId:1,clientX:100,clientY:400,pointerType:'touch',isPrimary:true,button:0,buttons:1,cancelable:true,preventDefault(){this.prevented=true;},...options});
  return {calls,context,Element,event,advance:ms=>{now+=ms;},down:e=>context.handlers.down(e),move:e=>context.handlers.move(e),up:e=>context.handlers.up(e)};
}
test('real pager captures a preview tap and activates exactly once after release',()=>{
  const p=pipeline(),target=new p.Element('preview');p.down(p.event(target));p.advance(120);p.up(p.event(target,'pointerup'));
  assert.equal(p.calls.captures,1);assert.equal(p.calls.plays,1);assert.deepEqual(p.calls.indices,[1]);
  p.up(p.event(target,'pointerup'));assert.equal(p.calls.plays,1);
});
test('real pager swipes upward to next and downward to previous without entering play',()=>{
  for(const [clientY,next] of [[130,2],[670,0]]){
    const p=pipeline(),target=new p.Element('preview');p.down(p.event(target));p.advance(200);p.move(p.event(target,'pointermove',{clientY}));
    p.advance(40);p.up(p.event(target,'pointerup',{clientY}));
    assert.equal(p.calls.plays,0);assert.deepEqual(p.calls.indices,[next]);
  }
});
test('real pager does not launch after cancellation, multi-touch or long press',()=>{
  for(const mode of ['cancel','multi','long','right','secondary']){
    const p=pipeline(),target=new p.Element('preview');
    p.down(p.event(target,'pointerdown',mode==='right'?{pointerType:'mouse',button:2}:mode==='secondary'?{isPrimary:false}:{}));
    if(mode==='multi')p.down(p.event(target,'pointerdown',{pointerId:2,isPrimary:false}));
    p.advance(mode==='long'?900:120);p.up(p.event(target,mode==='cancel'?'pointercancel':'pointerup'));
    assert.equal(p.calls.plays,0,mode);
  }
});
test('real pager leaves social and other real controls alone; plain feed drags do not play',()=>{
  for(const kind of ['social','blank']){
    const p=pipeline(),target=new p.Element(kind);p.down(p.event(target));p.advance(100);p.up(p.event(target,'pointerup'));
    assert.equal(p.calls.plays,0);assert.equal(p.calls.captures,kind==='blank'?1:0);
  }
});
test('preview uses a named native button, has no nested controls and is absent in play mode',()=>{
  const feed=read('src/page/home/components/playable_feed.tsx'),css=read('src/page/home/components/playable_feed.css');
  const hit=feed.match(/\{!playing && <button[^]*?<\/button>\}/)[0];
  assert(hit.includes('data-feed-preview-tap')&&hit.includes('aria-label={`Play ${content.title}`}'));
  assert.equal((hit.match(/<button/g)||[]).length,1);assert(hit.includes('<span className="playable-launch">'));
  assert(css.includes('top:var(--playable-header-height')&&css.includes('bottom:var(--app-tabbar-height'));
  assert(css.includes('.playable-preview-hit:focus-visible'));
});
test('original tab component blocks route callbacks only in display-only mode',()=>{
  const source=read('src/components/app/tabbar.tsx');
  const body=source.match(/onClick=\{\(\) => \{([^]*?)\}\}/)[1];
  for(const displayOnly of [true,false]){
    const calls=[];vm.runInNewContext(body,{displayOnly,onChange:i=>calls.push(i),index:3});
    assert.deepEqual(calls,displayOnly?[]:[3]);
  }
  assert(source.includes('displayOnly = false')&&source.includes('aria-disabled={displayOnly || undefined}'));
});
test('entering and leaving play sends the actual state before same-URL reload',()=>{
  const source=read('src/page/home/components/playable_feed.tsx');
  const start=source.indexOf('    const iframe = frame.current;'),end=source.indexOf('  }, [playing, frameSource, loaded]);',start);
  assert(start>=0&&end>start);
  for(const [previous,playing,loaded]of[[false,true,true],[true,false,true],[false,false,true],[true,false,false]]){
    const calls=[],iframe={contentWindow:{postMessage:data=>calls.push({active:data.active})},set src(value){calls.push({src:value})}},wasPlaying={current:previous};
    vm.runInNewContext(source.slice(start,end),{frame:{current:iframe},wasPlaying,playing,loaded,frameSource:'/game.html?revision=current'});
    assert.deepEqual(calls[0],{active:playing});assert.equal(wasPlaying.current,playing);
    assert.equal(calls.length,previous&&!playing&&loaded?2:1);
    if(calls.length===2)assert.equal(calls[1].src,'/game.html?revision=current#services=');
  }
});
