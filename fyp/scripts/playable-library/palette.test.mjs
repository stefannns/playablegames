import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const root=new URL('../../',import.meta.url);
const source=fs.readFileSync(new URL('src/page/home/components/playable_palette.ts',root),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;

// Execute the real hook with deterministic React lifecycle and frame stand-ins.
// No browser, game-input injection, hardware permissions or network are involved.
function runtime(){
  let current;const listeners=new Set(),scheduled=[];
  const React={
    useState(seed){
      const target=current;
      if(!target.initialized){target.state=typeof seed==='function'?seed():seed;target.initialized=true;}
      return[target.state,value=>{target.state=typeof value==='function'?value(target.state):value;target.updates++;}];
    },
    useLayoutEffect(effect,deps){
      const target=current;
      if(!target.deps||deps.some((dep,index)=>dep!==target.deps[index])){
        target.cleanup?.();target.deps=deps;target.cleanup=effect();
      }
    },
  };
  const module={exports:{}};
  vm.runInNewContext(code,{
    module,exports:module.exports,require:name=>{assert.equal(name,'react');return React;},
    window:{addEventListener:(type,fn)=>{assert.equal(type,'message');listeners.add(fn);},removeEventListener:(_type,fn)=>listeners.delete(fn),matchMedia:()=>({matches:false})},
    ResizeObserver:class{observe(){}disconnect(){}},
    requestAnimationFrame:fn=>{scheduled.push(fn);return scheduled.length;},cancelAnimationFrame(){},performance:{now:()=>0},
  });
  const band=rgb=>Array.from({length:384},()=>[...rgb,255]).flat();
  function card(){
    const frame={contentWindow:{}},screen={getBoundingClientRect:()=>({height:844})};
    const element={dataset:{playing:'false'},querySelector:selector=>selector==='iframe'?frame:null,closest:()=>screen};
    const h={state:undefined,initialized:false,updates:0,element,frame,ref:{current:element},deps:null,cleanup:null};
    h.render=media=>{current=h;return module.exports.usePlayablePalette(h.ref,media);};
    h.emit=(top,bottom,overrides={})=>{
      const event={source:frame.contentWindow,data:{type:'playable-palette',top:band(top),bottom:band(bottom)},...overrides};
      for(const receive of listeners)receive(event);
    };
    h.close=()=>h.cleanup?.();
    return h;
  }
  return{card,scheduled,listeners,api:module.exports};
}
const colors=style=>[style['--playable-top-rgb'],style['--playable-bottom-rgb']];

test('cold unknown games use neutral chrome rather than the lawn blue/green fallback',()=>{
  const h=runtime().card();
  assert.deepEqual(colors(h.render('/resource/playable-batch/cold/game.html')),['23 23 23','23 23 23']);
});
test('the first valid palette installs both bands immediately without a fallback-color animation',()=>{
  const r=runtime(),h=r.card(),src='/resource/playable-batch/dark/game.html';h.render(src);
  h.emit([8,4,15],[14,6,22]);
  const style=h.render(src);
  assert.deepEqual(colors(style),['8 4 15','14 6 22']);assert.equal(style['--playable-screen-height'],'844px');
  assert.equal(r.scheduled.length,0);
});
test('revisiting and loop clones start directly in the cached game colors',()=>{
  const r=runtime(),a=r.card(),src='/resource/playable-batch/cached/game.html';a.render(src);a.emit([30,20,40],[15,10,25]);
  const expected=colors(a.render(src));a.close();
  assert.deepEqual(colors(r.card().render(src)),expected);
  assert.equal(r.scheduled.length,0);
});
test('recycled cards cannot show the previous game colors while a different game loads',()=>{
  const r=runtime(),h=r.card();h.render('/old');h.emit([10,60,100],[10,70,110]);
  assert.deepEqual(colors(h.render('/old')),['10 60 100','10 70 110']);
  assert.deepEqual(colors(h.render('/new')),['23 23 23','23 23 23']);
  h.emit([40,12,18],[32,8,14]);assert.deepEqual(colors(h.render('/new')),['40 12 18','32 8 14']);
});
test('foreign windows, malformed bands and gameplay changes cannot recolor the initial feed preview',()=>{
  const r=runtime(),h=r.card(),src='/guard';h.render(src);
  for(const overrides of [{source:{}},{data:{type:'unknown'}},{data:{type:'playable-palette',top:[1],bottom:[2]}},{data:{type:'playable-palette',top:Array(1536).fill(999),bottom:Array(1536).fill(0)}}])h.emit([1,2,3],[1,2,3],overrides);
  assert.deepEqual(colors(h.render(src)),['23 23 23','23 23 23']);
  h.element.dataset.playing='true';h.emit([60,20,10],[65,25,15]);
  assert.deepEqual(colors(h.render(src)),['23 23 23','23 23 23']);
  h.element.dataset.playing='false';h.emit([20,10,30],[18,8,28]);h.emit([10,90,10],[10,100,10]);
  assert.deepEqual(colors(h.render(src)),['20 10 30','18 8 28']);h.close();assert.equal(r.listeners.size,0);
});
test('real green artwork and established color/lightness calculations remain supported',()=>{
  const r=runtime();assert.deepEqual(colors(r.card().render('/resource/playable-feed/pocket-game.html')),['19 37 19','15 91 5']);
  assert.deepEqual(Array.from(r.api.adjustLightness([250,249,246])),[174,173,170]);
  assert.equal(r.api.dominantColor(new Uint8ClampedArray(1536)),undefined);
});
test('upstream bright-color saturation cap preserves hue, neutrals and below-threshold colors',()=>{
  const {adjustLightness}=runtime().api;
  assert.deepEqual(Array.from(adjustLightness([240,200,120])),[155,121,52]);
  assert.deepEqual(Array.from(adjustLightness([250,248,242])),[173,171,165]);
  assert.deepEqual(Array.from(adjustLightness([135,206,235])),[59,130,159]);
  assert.deepEqual(Array.from(adjustLightness([255,255,0])),[255,255,0]);
  assert.deepEqual(Array.from(adjustLightness([20,12,8])),[20,12,8]);
});
test('normal-feed masks match the approved upstream gradient without tuner or footer expansion',()=>{
  const css=fs.readFileSync(new URL('src/page/home/components/playable_feed.css',root),'utf8');
  const top=css.match(/\.playable-feed-tint-top \{[^}]*\}/)[0];
  const bottom=css.match(/\.playable-feed-tint-bottom \{[^}]*\}/)[0];
  assert(top.includes('height:calc(var(--tint-header) + 68.8px)'));
  assert(top.includes('calc(var(--tint-header) - 2px)'));
  assert(top.includes('calc(var(--tint-header) + 34px)'));
  assert(bottom.includes('height:calc(var(--playable-screen-height, 100%) * .24)'));
  assert(bottom.includes('/ .4) 25%')&&bottom.includes('calc(100% - 89px)'));
  assert(!bottom.includes('--playable-footer-height')&&!css.includes('!important'));
  assert(css.includes('.playable-feed-card:not([data-playing="true"]) .playable-stage { border-radius:0; }'));
  assert(css.includes('.playable-feed-card[data-playing="true"] .playable-stage { border-radius:32px; }'));
});
test('only neighboring cards are prewarmed; placeholders and tint bands have no unrelated color transition',()=>{
  const feed=fs.readFileSync(new URL('src/page/home/components/playable_feed.tsx',root),'utf8');
  const home=fs.readFileSync(new URL('src/page/home/home_page.tsx',root),'utf8');
  const css=fs.readFileSync(new URL('src/page/home/components/playable_feed.css',root),'utf8');
  assert(feed.includes('root: batch ? frame.current.closest("[data-vertical-snap-pager-root=\'true\']") ?? frame.current.closest("[data-app-frame-root=\'true\']") : null'));
  assert(feed.includes('rootMargin: "100% 0px"'));
  assert(home.includes('Math.min(distance, list.length - distance) > 1'));
  assert(home.includes('gestureFill={false}'));
  assert(!css.includes('background:#87ceeb')&&!css.includes('background:#342317')&&!css.includes('transition:background-color'));
  assert(css.includes('prefers-reduced-motion:reduce'));
});
