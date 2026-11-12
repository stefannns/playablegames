import React,{useCallback,useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {uiCss,useUiStage,loadConfig} from './playable-ui.js';

const TIERS=[{id:'tier_0',name:'GOATED',color:'#ec3046'},{id:'tier_1',name:'TOP TIER',color:'#f87923'},
 {id:'tier_2',name:'MAIN CHARACTER',color:'#ecb100'},{id:'tier_3',name:'NPC',color:'#1cac48'},{id:'tier_4',name:'COOKED',color:'#176bce'}];
const ITEMS=[{id:'skinny',name:'Very Skinny'},{id:'slim',name:'Slim'},{id:'average',name:'Average'},{id:'toned',name:'Toned'},
 {id:'athletic',name:'Athletic'},{id:'muscular',name:'Muscular'},{id:'obese',name:'Obese'},{id:'extreme',name:'Extremely Obese'}];
const CSS=`${uiCss}
*{box-sizing:border-box}html,body,#root{width:100%;height:100%;margin:0;overflow:hidden;background:#080a0e}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#f4f6f8;-webkit-tap-highlight-color:transparent}
button{font:inherit}.app{width:100%;height:100%;padding:var(--ui-top) var(--ui-side) var(--ui-bottom);background:#080a0e;position:relative}
.stage{width:100%;height:100%;min-height:0;display:flex;flex-direction:column}
.header{flex:0 0 calc(36px * var(--ui-scale));text-align:center;display:flex;align-items:flex-start;justify-content:center}
.instruction{margin:0;font-size:calc(18px * var(--ui-scale));line-height:1.4;color:#dce2ed;overflow-wrap:anywhere}
.board{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;border:1px solid #465163;border-radius:12px;background:#171b22;display:flex;flex-direction:column}
.tier-row{flex:1 0 auto;min-height:52px;display:flex;border-bottom:1px solid #465163}.tier-row:last-child{border-bottom:0}
.tier-label{flex:0 0 82px;max-width:35%;padding:5px;border:0;border-right:1px solid #ffffff38;color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;font-size:13px;line-height:1.25;font-weight:800;overflow-wrap:anywhere;cursor:pointer}
.tier-label:focus-visible{outline-offset:-3px}.tier-content{flex:1;min-width:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(44px,1fr));grid-auto-rows:44px;gap:8px;padding:6px;align-content:center}
.tier-row.drag-over .tier-content{background:#2d3544;box-shadow:inset 0 0 0 2px #aec8ff}
.pool{flex:0 0 calc(168px * var(--ui-scale) + 20px);padding-top:12px;min-height:0}
.pool-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-rows:calc(84px * var(--ui-scale));gap:8px}
.card-slot{min-width:0;min-height:0;display:flex;align-items:center;justify-content:center}
.card{width:100%;height:100%;padding:0;border:2px solid transparent;border-radius:8px;overflow:hidden;background:#fff;cursor:grab;touch-action:none;user-select:none}
.card[aria-pressed="true"]{border-color:#77b7ff;box-shadow:0 0 0 2px #77b7ff}.card:disabled{cursor:default}
.card img{display:block;width:100%;height:100%;object-fit:contain;pointer-events:none}.placeholder{width:100%;height:100%;border:1px dashed #8491a8;border-radius:8px}
.drag-ghost{position:fixed;left:0;top:0;z-index:50;width:66px;height:88px;pointer-events:none;border-radius:9px;background:#fff;overflow:hidden;transform:translate(-50%,-50%);box-shadow:0 8px 24px #0008}.drag-ghost img{width:100%;height:100%;object-fit:contain}
.complete-note{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}.complete-note p{margin:0;font-size:18px;line-height:1.4;text-align:center}.again{border:0;border-radius:12px;background:#287b53;color:#fff;padding:10px 22px;font-size:18px}
`;
function flatten(raw){const result={};for(const group of ['tweaks','texts','images'])for(const item of raw[group]||[])result[item.id]=item.value??item.path;return result;}
function initial(){return {pool:ITEMS.map(item=>item.id),...Object.fromEntries(TIERS.map(tier=>[tier.id,[]]))};}
function moveItem(state,item,target,index){const next=Object.fromEntries(Object.entries(state).map(([key,items])=>[key,items.filter(id=>id!==item)]));const dest=[...next[target]];dest.splice(Math.max(0,Math.min(index,dest.length)),0,item);next[target]=dest;return next;}

function App(){
 const [cfg,setCfg]=useState(null),[lists,setLists]=useState(initial),[drag,setDrag]=useState(null),[selected,setSelected]=useState(null),[hasInteracted,setHasInteracted]=useState(false);
 const stageRef=useRef(null),listsRef=useRef(lists),dragRef=useRef(null),audioRef=useRef(null);
 useUiStage(stageRef,!!cfg);
 useEffect(()=>{let alive=true;loadConfig().then(raw=>{if(alive)setCfg(flatten(raw));});return()=>{alive=false;};},[]);
 const finished=lists.pool.length===0;
 const imageFor=id=>cfg?.[`IMG_${id.toUpperCase()}`]||`./assets/body_${id}_v2.webp`;
 const ensureAudio=useCallback(()=>{try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return null;if(!audioRef.current||audioRef.current.state==='closed')audioRef.current=new Audio();if(audioRef.current.state==='suspended')audioRef.current.resume().catch(()=>{});return audioRef.current;}catch{return null;}},[]);
 const sound=useCallback(complete=>{const ctx=ensureAudio();if(!ctx)return;try{const now=ctx.currentTime;const notes=complete?[523.25,659.25,783.99]:[440];notes.forEach((frequency,index)=>{const oscillator=ctx.createOscillator(),gain=ctx.createGain(),start=now+index*.09;oscillator.type=complete?'triangle':'sine';oscillator.frequency.setValueAtTime(frequency,start);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.12,start+.015);gain.gain.exponentialRampToValueAtTime(.0001,start+(complete?.32:.12));oscillator.connect(gain);gain.connect(ctx.destination);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};oscillator.start(start);oscillator.stop(start+(complete?.34:.14));});}catch{}},[ensureAudio]);
 const place=useCallback((item,target,index)=>{const before=listsRef.current;if(before.pool.length===0)return;const next=moveItem(before,item,target,index);listsRef.current=next;setLists(next);setSelected(null);setHasInteracted(true);sound(before.pool.length>0&&next.pool.length===0);},[sound]);
 const cancel=useCallback(()=>{dragRef.current=null;setDrag(null);document.querySelectorAll('.tier-row.drag-over').forEach(row=>row.classList.remove('drag-over'));},[]);
 useEffect(()=>{
   const move=e=>{const current=dragRef.current;if(!current||current.pointerId!==e.pointerId)return;e.preventDefault();current.moved ||= Math.hypot(e.clientX-current.startX,e.clientY-current.startY)>6;if(current.moved)setHasInteracted(true);setDrag({...current,x:e.clientX,y:e.clientY});document.querySelectorAll('.tier-row.drag-over').forEach(row=>row.classList.remove('drag-over'));document.elementFromPoint(e.clientX,e.clientY)?.closest?.('[data-tier]')?.classList.add('drag-over');};
   const end=e=>{const current=dragRef.current;if(!current||current.pointerId!==e.pointerId)return;if(!current.moved){setSelected(current.itemId);setHasInteracted(true);}else{const row=document.elementFromPoint(e.clientX,e.clientY)?.closest?.('[data-tier]');if(row){const cards=[...row.querySelectorAll('[data-tier-card]')];const index=cards.findIndex(card=>{const bounds=card.getBoundingClientRect();return e.clientY<bounds.top+bounds.height&&e.clientX<bounds.left+bounds.width/2;});place(current.itemId,row.dataset.tier,index<0?cards.length:index);}}cancel();};
   const abort=e=>{if(e.pointerId===undefined||dragRef.current?.pointerId===e.pointerId)cancel();};
   const hidden=()=>{if(document.hidden){cancel();const ctx=audioRef.current;audioRef.current=null;if(ctx&&ctx.state!=='closed')ctx.close().catch(()=>{});}};
   window.addEventListener('pointermove',move,{passive:false});window.addEventListener('pointerup',end);window.addEventListener('pointercancel',abort);window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',hidden);
   return()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',abort);window.removeEventListener('blur',cancel);document.removeEventListener('visibilitychange',hidden);const ctx=audioRef.current;if(ctx&&ctx.state!=='closed')ctx.close().catch(()=>{});};
 },[cancel,place]);
 const start=(e,itemId,originId)=>{if(finished||e.button!==0||e.isPrimary===false||dragRef.current)return;e.preventDefault();ensureAudio();const next={itemId,originId,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,moved:false};dragRef.current=next;setDrag(next);stageRef.current.setPointerCapture?.(e.pointerId);};
 const card=(id,location)=>{const item=ITEMS.find(item=>item.id===id),active=drag?.itemId===id;return <div key={id} className="card-slot" data-tier-card={location!=='pool'?'':undefined}>{active?<div className="placeholder"/>:<button type="button" className="card" disabled={finished} aria-label={item.name} aria-pressed={selected===id} onPointerDown={e=>start(e,id,location)} onClick={e=>{if(e.detail===0&&!finished){ensureAudio();setSelected(id);setHasInteracted(true);}}}><img src={imageFor(id)} alt={item.name} draggable={false}/></button>}</div>;};
 if(!cfg)return null;
 return <><style>{CSS}</style><main ref={stageRef} className="app ui-game" aria-label={cfg.GAME_TITLE||'FROM GOATED TO COOKED'} onLostPointerCapture={e=>{if(dragRef.current?.pointerId===e.pointerId)cancel();}}><section className="stage">
   <header className="header"><p className={`instruction ${!hasInteracted?'ui-float':''}`} style={{visibility:!hasInteracted||selected?'visible':'hidden'}}>{selected?'Tap a tier':'Drag to rank'}</p></header>
   <div className="board" aria-label="Tier list">{TIERS.map((tier,index)=><div className="tier-row" data-tier={tier.id} key={tier.id}>
     <button type="button" className="tier-label" disabled={!selected||finished} style={{background:tier.color,color:index<4?'#10131b':'#fff'}} aria-label={`Place selected item in ${cfg[`TIER_${index}`]||tier.name}`} onClick={()=>{if(selected)place(selected,tier.id,listsRef.current[tier.id].length);}}>{cfg[`TIER_${index}`]||tier.name}</button>
     <div className="tier-content">{lists[tier.id].map(id=>card(id,tier.id))}</div>
   </div>)}</div>
   <section className="pool" aria-label="Body types to rank">{finished?<div className="complete-note"><p>Your list is ready</p><button type="button" className="again" onClick={()=>{cancel();const next=initial();listsRef.current=next;setLists(next);setSelected(null);setHasInteracted(false);}}>Again</button></div>:<div className="pool-grid">{lists.pool.map(id=>card(id,'pool'))}</div>}</section>
 </section></main>{drag&&<div className="drag-ghost" style={{left:drag.x,top:drag.y}} aria-hidden="true"><img src={imageFor(drag.itemId)} alt=""/></div>}</>;
}
createRoot(document.getElementById('root')).render(<App/>);
