var qE=["C3","D3","E3","G3","A3","C4","D4","E4","G4","A4","C5","D5","E5","G5","A5"],Df=qE.length;
var melodyStrings=(()=>{
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function geometry(w,h){
    const scale=Math.min(w/390,h/598),left=30*scale,right=w-left;
    return {w,h,scale,left,right,top:78*scale,bottom:h-184*scale,step:(right-left)/15};
  }
  const xAt=(g,i)=>g.left+g.step*(i+.5);
  const indexAt=(g,x)=>clamp(Math.floor((x-g.left)/g.step),0,14);
  const inside=(g,p)=>p.x>=g.left-g.step/2&&p.x<=g.right+g.step/2&&p.y>=g.top&&p.y<=g.bottom;
  function pluck(s,now,amplitude,life){s.time=now;s.amplitude=clamp(amplitude,2,18);s.life=clamp(life,500,5000);}
  function offset(s,u,now,reduce){
    const held=s.hold;
    if(held){const y=clamp(held.u,.025,.975);return held.bend*(u<=y?u/y:(1-u)/(1-y));}
    const age=Math.max(0,now-s.time),decay=Math.exp(-5*age/s.life);
    if(age>=s.life||decay*s.amplitude<.06||reduce)return 0;
    const seconds=age/1000;
    return s.amplitude*decay*(Math.sin(Math.PI*u)*Math.sin(seconds*s.frequency*2*Math.PI)+.22*Math.sin(2*Math.PI*u)*Math.sin(seconds*s.frequency*4*Math.PI+.4));
  }
  function metal(ctx,x,y,r){
    const fill=ctx.createRadialGradient(x-r*.3,y-r*.35,.1,x,y,r);
    fill.addColorStop(0,'#f4e8d0');fill.addColorStop(.35,'#b2a58d');fill.addColorStop(.75,'#716754');fill.addColorStop(1,'#322c25');
    ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(26,19,13,.7)';ctx.lineWidth=.8;ctx.stroke();
    ctx.strokeStyle='#4a4235';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-r*.44,y-r*.12);ctx.lineTo(x+r*.44,y+r*.12);ctx.stroke();
  }
  function backdrop(ctx,g,texture){
    const {w,h,scale}=g;
    const base=ctx.createLinearGradient(0,0,w,h);base.addColorStop(0,'#765235');base.addColorStop(.55,'#64452f');base.addColorStop(1,'#4d3628');ctx.fillStyle=base;ctx.fillRect(0,0,w,h);
    // Reuse the original replaceable wood, softened at render time. Keep the
    // broad grain but suppress fine pores/contrast behind the musical lines.
    if(texture){ctx.save();ctx.globalAlpha=.48;ctx.filter='blur(1.25px)';const r=Math.max((w+8)/texture.width,(h+8)/texture.height),tw=texture.width*r,th=texture.height*r;ctx.drawImage(texture,(w-tw)/2,(h-th)/2,tw,th);ctx.restore();}
    const shade=ctx.createLinearGradient(0,0,w,0);shade.addColorStop(0,'rgba(25,13,7,.16)');shade.addColorStop(.3,'rgba(255,212,152,.03)');shade.addColorStop(1,'rgba(25,13,7,.22)');ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
    for(const y of [g.top,g.bottom]){
      ctx.shadowColor='rgba(31,15,4,.5)';ctx.shadowBlur=7*scale;ctx.shadowOffsetY=4*scale;
      const rail=ctx.createLinearGradient(0,y-10*scale,0,y+10*scale);rail.addColorStop(0,'#7b512e');rail.addColorStop(.12,'#ba8752');rail.addColorStop(.28,'#865634');rail.addColorStop(1,'#4b2e1d');
      ctx.fillStyle=rail;ctx.fillRect(20*scale,y-9*scale,w-40*scale,18*scale);
      ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.fillStyle='#dbc294';ctx.fillRect(24*scale,y-1.7*scale,w-48*scale,3.4*scale);
      ctx.fillStyle='rgba(249,229,185,.5)';ctx.fillRect(24*scale,y-1.7*scale,w-48*scale,.7*scale);
      metal(ctx,29*scale,y-6*scale,1.8*scale);metal(ctx,w-29*scale,y-6*scale,1.8*scale);
    }
    for(let i=0;i<15;i++){
      const x=xAt(g,i);
      metal(ctx,x,g.top-21*scale,4.4*scale);
      ctx.fillStyle='#413225';ctx.fillRect(x-1.3*scale,g.top-29*scale,2.6*scale,12*scale);
      ctx.fillStyle='#bcb39b';ctx.fillRect(x-1*scale,g.top-28*scale,1.5*scale,3*scale);
      metal(ctx,x,g.bottom+20*scale,3*scale);
      ctx.strokeStyle=i<6?'#b99a66':'#cbc6b2';ctx.lineWidth=(i<6?1.45:.9)*scale;
      ctx.beginPath();ctx.moveTo(x,g.top-19*scale);ctx.lineTo(x,g.top);ctx.moveTo(x,g.bottom);ctx.lineTo(x,g.bottom+17*scale);ctx.stroke();
    }
  }
  function draw(ctx,g,strings,now,reduce,lineWidth,highlight){
    const span=g.bottom-g.top,scale=g.scale;
    function path(s,x,shift){ctx.beginPath();for(let n=0;n<=56;n++){const u=n/56,px=x+offset(s,u,now,reduce)+shift,py=g.top+u*span;n?ctx.lineTo(px,py):ctx.moveTo(px,py);}}
    for(let i=0;i<15;i++){
      const s=strings[i],x=xAt(g,i),gauge=(i<6?1.8-i*.1:1.04-(i-6)*.035)*scale*clamp(lineWidth/4,.65,1.5);
      path(s,x,2*scale);ctx.strokeStyle='rgba(34,19,9,.32)';ctx.lineWidth=gauge+1.4*scale;ctx.stroke();
      path(s,x,0);ctx.strokeStyle=i<6?'#6f5131':'#716f63';ctx.lineWidth=gauge+.65*scale;ctx.stroke();
      path(s,x,-.28*scale);ctx.strokeStyle=i<6?'#d1b078':'#d6d7ce';ctx.lineWidth=gauge*.69;ctx.stroke();
      path(s,x,-.38*scale);ctx.strokeStyle=i<6?'#f0d29e':'#fff2d4';ctx.lineWidth=Math.max(.28*scale,gauge*.22);ctx.stroke();
      if(i<6){ctx.strokeStyle='rgba(62,39,17,.6)';ctx.lineWidth=.45*scale;ctx.beginPath();const count=Math.ceil(span/(2.2*scale));for(let n=1;n<count;n++){const u=n/count,px=x+offset(s,u,now,reduce),py=g.top+u*span;ctx.moveTo(px-gauge*.6,py-.28*scale);ctx.lineTo(px+gauge*.6,py+.28*scale);}ctx.stroke();}
      if(s.hold){const y=g.top+clamp(s.hold.u,0,1)*span;
        const sheen=ctx.createLinearGradient(0,y-28*scale,0,y+28*scale);sheen.addColorStop(0,'rgba(255,235,176,0)');sheen.addColorStop(.5,`rgba(255,235,176,${clamp(highlight/40,.12,.55)})`);sheen.addColorStop(1,'rgba(255,235,176,0)');
        path(s,x,0);ctx.strokeStyle=sheen;ctx.lineWidth=gauge+1.2*scale;ctx.stroke();
      }
    }
  }
  function createStrings(){return Array.from({length:15},(_,i)=>({time:-10000,amplitude:0,life:1500,frequency:9+i*.65,hold:null}));}
  function drawLines(ctx,g,strokes,elapsed=null){
    ctx.save();ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
    ctx.lineCap='round';ctx.lineJoin='round';
    const between=(a,b,time)=>{const t=clamp((time-a.time)/Math.max(1,b.time-a.time),0,1);return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};};
    const trace=(stroke,shift,until)=>{ctx.beginPath();let count=0,previous=null;for(const p of stroke){if(until!==null&&p.time>until){if(previous){const q=between(previous,p,until);ctx.lineTo(g.left+q.x*(g.right-g.left)+shift,g.top+q.y*(g.bottom-g.top)+shift);count++;}break;}const x=g.left+p.x*(g.right-g.left)+shift,y=g.top+p.y*(g.bottom-g.top)+shift;count++?ctx.lineTo(x,y):ctx.moveTo(x,y);previous=p;}if(count===1){const p=stroke[0];ctx.lineTo(g.left+p.x*(g.right-g.left)+shift+.01,g.top+p.y*(g.bottom-g.top)+shift);}ctx.stroke();};
    const gold=ctx.createLinearGradient(g.left,g.top,g.right,g.bottom);
    gold.addColorStop(0,'#e1ab4b');gold.addColorStop(.16,'#fff3c5');gold.addColorStop(.24,'#fffdf1');gold.addColorStop(.34,'#edbf69');gold.addColorStop(.5,'#fff8da');gold.addColorStop(.62,'#e5ad50');gold.addColorStop(.76,'#fffdf1');gold.addColorStop(1,'#f5ce7c');
    const highlight=ctx.createLinearGradient(g.left,g.top,g.right,g.bottom);
    highlight.addColorStop(0,'rgba(255,255,248,.45)');highlight.addColorStop(.24,'#fffef5');highlight.addColorStop(.4,'rgba(255,255,248,.6)');highlight.addColorStop(.76,'#fffef5');highlight.addColorStop(1,'rgba(255,255,248,.55)');
    for(const stroke of strokes){
      ctx.strokeStyle=gold;ctx.lineWidth=3.8*g.scale;trace(stroke,0,null);
      if(elapsed!==null){ctx.strokeStyle='#fff1bd';ctx.lineWidth=2.4*g.scale;trace(stroke,0,elapsed);}
      ctx.strokeStyle=highlight;ctx.lineWidth=1.3*g.scale;trace(stroke,-.5*g.scale,null);
    }
    if(elapsed!==null)for(const stroke of strokes){let last=null,previous=null;for(const p of stroke){if(p.time<=elapsed){last=p;previous=p;}else{if(previous)last=between(previous,p,elapsed);break;}}
      if(last){const x=g.left+last.x*(g.right-g.left),y=g.top+last.y*(g.bottom-g.top);ctx.fillStyle='#e6b34f';ctx.beginPath();ctx.arc(x,y,5*g.scale,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff9e1';ctx.beginPath();ctx.arc(x,y,3.1*g.scale,0,Math.PI*2);ctx.fill();}}
    ctx.restore();
  }
  return {clamp,geometry,xAt,indexAt,inside,pluck,offset,backdrop,draw,drawLines,createStrings};
})();
var NV=()=>{
  const [config,setConfig]=Yt.useState(null),[touched,setTouched]=Yt.useState(false);
  const surface=Yt.useRef(null),canvas=Yt.useRef(null);
  const world=Yt.useRef({g:null,strings:melodyStrings.createStrings(),pointer:null,keyboard:7,raf:0,draw:null,background:null,strokes:[],notes:[],started:null,duration:0,playback:null,version:0});
  const sound=Yt.useRef({ready:false,pending:null,synth:null,reverb:null,lastNote:-1,lastTime:-1,latest:null,disposed:false});
  const [hasRecording,setHasRecording]=Yt.useState(false),[playing,setPlaying]=Yt.useState(false),[status,setStatus]=Yt.useState('');
  Yt.useEffect(()=>{let live=true;(async()=>{let c={tweaks:[],texts:[],images:[]};try{const r=await fetch('./game.config.json',{cache:'no-store'});if(r.ok)c=await r.json();}catch{}if(live)setConfig(bV(c));})();return()=>{live=false;};},[]);
  const playNote=(index,velocity,gain=1)=>{
    const audio=sound.current;if(!audio.ready||!audio.synth||audio.disposed)return;
    const now=BE();
    try{audio.synth.triggerAttackRelease(qE[index],'8n',Math.max(now,audio.lastTime+.001),Math.min(.86,.35+velocity*.1)*gain);audio.lastNote=index;audio.lastTime=now;}catch{}
  };
  const unlock=()=>{
    const audio=sound.current;if(audio.disposed)return Promise.resolve();
    if(audio.ready){try{return Promise.resolve(ey()).catch(()=>{});}catch{return Promise.resolve();}}
    if(audio.pending)return audio.pending;
    audio.pending=(async()=>{try{await ey();if(audio.disposed)return;
      audio.synth=new Cf(Sf,{envelope:{attack:.05,decay:.2,sustain:.1,release:1},harmonicity:3,modulationIndex:2,oscillator:{type:'sine'},modulation:{type:'square'},volume:-10}).toDestination();
      audio.reverb=new Nf({decay:2.5,wet:.3}).toDestination();audio.synth.connect(audio.reverb);audio.ready=true;
      if(audio.latest&&performance.now()-audio.latest.time<350)playNote(audio.latest.index,audio.latest.velocity);
    }catch{}finally{audio.pending=null;}})();return audio.pending;
  };
  const silence=()=>{const audio=sound.current;audio.latest=null;audio.lastNote=-1;audio.lastTime=-1;try{audio.synth?.dispose();audio.reverb?.dispose();}catch{}audio.synth=null;audio.reverb=null;audio.ready=false;};
  const stop=()=>{const w=world.current;w.version++;w.playback=null;setPlaying(false);silence();wake();};
  const wake=()=>{const w=world.current;if(w.draw&&!w.raf)w.raf=requestAnimationFrame(w.draw);};
  const strike=(index,velocity=2,record=true,gain=1)=>{
    const w=world.current;if(!w.g)return;const now=performance.now();
    melodyStrings.pluck(w.strings[index],now,(4+velocity*2.8)*w.g.scale,config?.TRAIL_LIFE||1500);
    if(record){const stroke=w.strokes.at(-1);if(!stroke)return;const time=now-stroke.started;w.notes.push({index,velocity,time,stroke:w.strokes.length-1});w.duration=Math.max(w.duration,time);setHasRecording(true);}
    sound.current.latest={index,velocity,time:now};playNote(index,velocity,gain);wake();
  };
  function addPoint(pos,newStroke=false){const w=world.current,g=w.g;if(!g)return;if(w.started===null)w.started=performance.now();
    if(newStroke){const stroke=[];stroke.started=performance.now();stroke.duration=0;w.strokes.push(stroke);}const stroke=w.strokes.at(-1);if(!stroke)return;
    const p={x:melodyStrings.clamp((pos.x-g.left)/(g.right-g.left),0,1),y:melodyStrings.clamp((pos.y-g.top)/(g.bottom-g.top),0,1),time:performance.now()-stroke.started};
    const last=stroke.at(-1);if(!last||Math.hypot((p.x-last.x)*(g.right-g.left),(p.y-last.y)*(g.bottom-g.top))>.8*g.scale)stroke.push(p);
    stroke.duration=p.time;w.duration=Math.max(w.duration,p.time);wake();
  }
  const replay=async()=>{const w=world.current;if(w.playback||playing){stop();setStatus('');return;}if(!w.notes.length)return;
    releasePointer();silence();const version=++w.version;setPlaying(true);setStatus('');sound.current.latest=null;
    await unlock();if(sound.current.disposed||version!==w.version)return;
    const notes=w.notes.slice().sort((a,b)=>a.time-b.time||a.stroke-b.stroke);
    w.playback={start:performance.now(),rate:.8,index:0,notes,gain:1/Math.sqrt(w.strokes.length),end:notes.reduce((end,n)=>Math.max(end,n.time),w.duration)+500};
    if(!sound.current.ready)setStatus('Sound unavailable — showing your melody.');wake();
  };
  const reset=()=>{releasePointer();stop();const w=world.current;w.strokes=[];w.notes=[];w.started=null;w.duration=0;w.strings=melodyStrings.createStrings();setHasRecording(false);setTouched(false);setStatus('');wake();};
  Yt.useEffect(()=>{
    if(!config||!surface.current||!canvas.current)return;
    const w=world.current,c=canvas.current,ctx=c.getContext('2d');if(!ctx)return;
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)'),texture=new Image();
    let live=true;
    function resize(){const rect=surface.current.getBoundingClientRect();if(!rect.width||!rect.height)return;
      const dpr=Math.min(window.devicePixelRatio||1,2);w.g=melodyStrings.geometry(rect.width,rect.height);
      c.width=Math.round(rect.width*dpr);c.height=Math.round(rect.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
      const bg=document.createElement('canvas');bg.width=c.width;bg.height=c.height;
      const b=bg.getContext('2d');b.setTransform(dpr,0,0,dpr,0,0);melodyStrings.backdrop(b,w.g,texture.complete&&texture.naturalWidth?texture:null);w.background=bg;
      releasePointer();wake();
    }
    w.draw=()=>{w.raf=0;if(!live||!w.g)return;const g=w.g,now=performance.now();ctx.clearRect(0,0,g.w,g.h);ctx.drawImage(w.background,0,0,g.w,g.h);
      let elapsed=null;if(w.playback){const p=w.playback;elapsed=(now-p.start)*p.rate;while(p.index<p.notes.length&&p.notes[p.index].time<=elapsed){const note=p.notes[p.index++];strike(note.index,note.velocity,false,p.gain);}if(elapsed>=p.end){w.playback=null;setPlaying(false);setStatus('');}}
      melodyStrings.draw(ctx,g,w.strings,now,Boolean(reduced?.matches),config.LINE_WIDTH||4,config.GLOW_INTENSITY||15);
      melodyStrings.drawLines(ctx,g,w.strokes,elapsed);
      const animating=w.pointer||w.playback||(!reduced?.matches&&w.strings.some(s=>now-s.time<s.life&&s.amplitude*Math.exp(-5*(now-s.time)/s.life)>.06));
      if(animating&&!document.hidden&&!w.raf)w.raf=requestAnimationFrame(w.draw);
    };
    texture.onload=()=>{if(live)resize();};texture.onerror=()=>{if(live)wake();};texture.src=config.BG_OVERLAY||'./assets/soundboard-realistic-v1.webp';
    const observer=new ResizeObserver(resize);observer.observe(surface.current);resize();
    const visibility=()=>{if(document.hidden){releasePointer();stop();if(w.raf)cancelAnimationFrame(w.raf);w.raf=0;}else wake();};
    const motion=()=>wake();document.addEventListener('visibilitychange',visibility);reduced?.addEventListener?.('change',motion);
    return()=>{live=false;observer.disconnect();document.removeEventListener('visibilitychange',visibility);reduced?.removeEventListener?.('change',motion);texture.onload=null;texture.onerror=null;if(w.raf)cancelAnimationFrame(w.raf);w.raf=0;w.draw=null;};
  },[config]);
  Yt.useEffect(()=>()=>{const a=sound.current;a.disposed=true;try{a.synth?.dispose();a.reverb?.dispose();}catch{}},[]);
  function point(event){const rect=surface.current.getBoundingClientRect(),g=world.current.g;return {x:(event.clientX-rect.left)*(g?g.w/rect.width:1),y:(event.clientY-rect.top)*(g?g.h/rect.height:1)};}
  function releasePointer(event){const w=world.current,p=w.pointer;if(!p||event&&event.pointerId!==p.id)return;
    const s=w.strings[p.index];const bend=s.hold?.bend||0;s.hold=null;
    if(Math.abs(bend)>.5&&w.g)melodyStrings.pluck(s,performance.now(),Math.abs(bend),config?.TRAIL_LIFE||1500);
    w.pointer=null;try{if(surface.current?.hasPointerCapture?.(p.id))surface.current.releasePointerCapture(p.id);}catch{}wake();
  }
  const down=event=>{
    if(event.isPrimary===false||event.button>0)return;
    const w=world.current;if(w.pointer||!w.g)return;const p=point(event);if(!melodyStrings.inside(w.g,p))return;
    event.preventDefault();if(w.playback||playing)stop();setTouched(true);setStatus('');unlock();addPoint(p,true);
    const index=melodyStrings.indexAt(w.g,p.x);w.pointer={id:event.pointerId,index,x:p.x,y:p.y,time:performance.now()};w.keyboard=index;
    strike(index);w.strings[index].hold={u:(p.y-w.g.top)/(w.g.bottom-w.g.top),bend:0};
    try{surface.current.setPointerCapture(event.pointerId);}catch{}
  };
  function moveSample(event){const w=world.current,p=w.pointer;if(!p||p.id!==event.pointerId||!w.g)return;
    const pos=point(event),g=w.g;if(!melodyStrings.inside(g,pos)){releasePointer(event);return;}addPoint(pos);
    const index=melodyStrings.indexAt(g,pos.x),now=performance.now(),velocity=melodyStrings.clamp(Math.hypot(pos.x-p.x,pos.y-p.y)/Math.max(1,now-p.time),.15,4);
    if(index!==p.index){const dir=Math.sign(index-p.index),previous=w.strings[p.index];
      melodyStrings.pluck(previous,now,Math.max(4*g.scale,Math.abs(previous.hold?.bend||0)),config?.TRAIL_LIFE||1500);previous.hold=null;
      for(let i=p.index+dir;dir>0?i<=index:i>=index;i+=dir)strike(i,velocity);
      p.index=index;w.keyboard=index;
    }
    const s=w.strings[index];s.hold={u:melodyStrings.clamp((pos.y-g.top)/(g.bottom-g.top),0,1),bend:melodyStrings.clamp(pos.x-melodyStrings.xAt(g,index),-g.step*.46,g.step*.46)};
    p.x=pos.x;p.y=pos.y;p.time=now;wake();
  }
  const move=event=>{if(!world.current.pointer)return;event.preventDefault();const samples=event.getCoalescedEvents?.()||[];for(const e of samples)moveSample(e);moveSample(event);};
  const up=event=>{if(world.current.pointer?.id===event.pointerId)moveSample(event);releasePointer(event);};
  const key=event=>{
    const w=world.current;if(!w.g)return;
    if(['ArrowLeft','ArrowRight','Home','End',' ','Enter'].includes(event.key)){event.preventDefault();if(w.playback||playing)stop();setTouched(true);unlock();
      if(event.key==='ArrowLeft')w.keyboard=melodyStrings.clamp(w.keyboard-1,0,14);
      if(event.key==='ArrowRight')w.keyboard=melodyStrings.clamp(w.keyboard+1,0,14);
      if(event.key==='Home')w.keyboard=0;if(event.key==='End')w.keyboard=14;
      addPoint({x:melodyStrings.xAt(w.g,w.keyboard),y:(w.g.top+w.g.bottom)/2},true);strike(w.keyboard,2);
    }
  };
  return (0,Tt.jsxs)('div',{className:'melody-realistic',children:[
    (0,Tt.jsx)('style',{children:`
      @font-face{font-family:Poppins;src:url('./assets/fonts/poppins/Poppins-Regular.woff2') format('woff2');font-display:swap}
      html,body,#root{width:100%;height:100%;margin:0;overflow:hidden;background:#a36a3d}
      *{box-sizing:border-box}.melody-realistic{position:relative;width:100%;height:100%;--ink:#fff1d6;--panel:#33251b;--accent:#e8c98d}
      .melody-surface{position:absolute;inset:0;touch-action:none;user-select:none;outline:none;cursor:crosshair}
      .melody-surface:focus-visible{outline:2px solid #fff4dd;outline-offset:-8px}
      .melody-surface canvas{width:100%;height:100%;display:block}
      .melody-guide{position:absolute;left:calc(30px + env(safe-area-inset-left));right:calc(30px + env(safe-area-inset-right));top:43%;transform:translateY(-50%);margin:0;text-align:center;font:400 18px/1.5 Poppins,system-ui,sans-serif;color:var(--ink);pointer-events:none;transition:opacity .15s}
      .melody-guide.hidden{opacity:0}.melody-guide span{background:rgba(44,24,12,.74);padding:5px 10px;box-decoration-break:clone;-webkit-box-decoration-break:clone;border-radius:4px}
      .melody-controls{position:absolute;z-index:2;left:calc(30px + env(safe-area-inset-left));right:calc(30px + env(safe-area-inset-right));bottom:calc(50px + env(safe-area-inset-bottom));display:grid;grid-template-columns:1.15fr 1fr;gap:12px;align-items:stretch}
      .melody-controls button{min-width:0;min-height:48px;padding:10px 12px;display:flex;align-items:center;justify-content:center;gap:8px;font:400 16px/1.4 Poppins,system-ui,sans-serif;white-space:normal;overflow-wrap:anywhere;border:1px solid rgba(255,241,214,.45);border-radius:12px;background:var(--panel);color:var(--ink);box-shadow:0 3px 8px rgba(32,15,4,.24);cursor:pointer;touch-action:manipulation;transition:background .12s,opacity .12s}
      .melody-controls .primary{background:var(--accent);border-color:var(--accent);color:#34230e}
      .melody-controls button:active:not(:disabled){filter:brightness(.86)}.melody-controls button:focus-visible{outline:3px solid #fff4dd;outline-offset:3px}
      .melody-controls button:disabled{opacity:.5;cursor:not-allowed;box-shadow:none}.melody-controls svg{width:18px;height:18px;flex:none}
      .melody-status{position:absolute;left:30px;right:30px;bottom:115px;text-align:center;font:400 16px/1.4 Poppins,system-ui,sans-serif;color:var(--ink);pointer-events:none}
      @media(max-height:570px),(max-width:360px){.melody-guide{font-size:16px;left:25px;right:25px}.melody-controls{left:25px;right:25px;bottom:42px;gap:8px}.melody-status{bottom:104px}}
      @media(prefers-reduced-motion:reduce){.melody-guide{transition:none}}
    `}),
    (0,Tt.jsx)('div',{ref:surface,className:'melody-surface',tabIndex:0,role:'button','aria-label':'Draw a melody by swiping across the strings. Arrow keys and Space play and record notes. Use Replay to hear your drawing or Reset to clear it.',onPointerDown:down,onPointerMove:move,onPointerUp:up,onPointerCancel:releasePointer,onLostPointerCapture:releasePointer,onBlur:()=>releasePointer(),onKeyDown:key,children:(0,Tt.jsx)('canvas',{ref:canvas,'aria-hidden':'true'})}),
    (0,Tt.jsx)('p',{className:'melody-guide'+(touched?' hidden':''),'aria-hidden':touched,children:(0,Tt.jsx)('span',{children:'Draw a line to make a melody'})}),
    (0,Tt.jsx)('p',{className:'melody-status',role:'status','aria-live':'polite',children:status}),
    (0,Tt.jsxs)('div',{className:'melody-controls','aria-label':'Melody controls',children:[
      (0,Tt.jsxs)('button',{type:'button',className:'primary',disabled:!hasRecording,onClick:replay,'aria-label':playing?'Stop melody playback':'Replay drawn melody',children:[(0,Tt.jsx)('svg',{viewBox:'0 0 24 24','aria-hidden':'true',fill:'currentColor',children:(0,Tt.jsx)('path',{d:playing?'M6 6h12v12H6z':'M8 5v14l11-7z'})}),playing?'Stop':'Replay']}),
      (0,Tt.jsxs)('button',{type:'button',disabled:!hasRecording,onClick:reset,'aria-label':'Reset the canvas and recorded melody',children:[(0,Tt.jsx)('svg',{viewBox:'0 0 24 24','aria-hidden':'true',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round',children:(0,Tt.jsx)('path',{d:'M4 10a8 8 0 1 1 1 8M4 4v6h6'})}),'Reset']})
    ]})
  ]});
};
