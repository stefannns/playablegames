function Np({cfg:e}){
  const h=z.default.createElement;
  const canvas=(0,z.useRef)(null),plants=(0,z.useRef)([]),grass=(0,z.useRef)([]),grassCache=(0,z.useRef)({canvas:null,seen:new Set()}),bugs=(0,z.useRef)([]),drag=(0,z.useRef)(null),images=(0,z.useRef)({}),audio=(0,z.useRef)(null),raf=(0,z.useRef)(0),lastFrame=(0,z.useRef)(0),lastSpawn=(0,z.useRef)(0);
  const [stats,setStats]=(0,z.useState)({plants:0,grass:false,bugs:0}),[hasGrowth,setHasGrowth]=(0,z.useState)(false),[selected,setSelected]=(0,z.useState)("grass");
  const serial=(0,z.useRef)(0),reduced=(0,z.useRef)(false),keyboard=(0,z.useRef)({x:.5,y:.6,visible:false}),voices=(0,z.useRef)(0);
  const [menuOpen,setMenuOpen]=(0,z.useState)(false),picker=(0,z.useRef)(null),pickerButton=(0,z.useRef)(null),optionButtons=(0,z.useRef)({}),menuStart=(0,z.useRef)(null);
  const sound=(0,z.useRef)({active:new Set(),buffers:new Map(),variant:0,epoch:0,disposed:false,music:null,musicBuffer:null});
  const intro=(0,z.useRef)({active:true,elapsed:0,scene:null});
  const growth=Fe(Number(e.GRAVITY)||1.2,.1,2),wander=Fe(Number(e.CREATURE_FORCE)||.05,.01,.2);
  const choices=[{id:"grass",label:"Grass"},{id:"daisy",label:"Daisies"},{id:"tulip",label:"Tulips"},{id:"sunflower",label:"Sunflowers"}];
  (0,z.useEffect)(()=>{const sources={ladybug:e.IMG_CREATURE,bee:e.IMG_FOOD,flower:e.IMG_BLOCK};let live=true;for(const [key,src] of Object.entries(sources)){const image=new Image;image.onload=()=>{if(live)images.current[key]=image};image.onerror=()=>{if(live)images.current[key]=null};image.src=src||""}return()=>{live=false}},[e.IMG_CREATURE,e.IMG_FOOD,e.IMG_BLOCK]);
  (0,z.useEffect)(()=>{const media=window.matchMedia?.("(prefers-reduced-motion: reduce)");const update=()=>{if(reduced.current&&!media?.matches)for(const plant of [...grass.current,...plants.current])plant.born=Math.min(plant.born,performance.now()-plant.duration/growth);reduced.current=!!media?.matches};update();media?.addEventListener?.("change",update);return()=>media?.removeEventListener?.("change",update)},[growth]);
  const stopSound=(0,z.useCallback)((keepMusic=false)=>{const state=sound.current;state.epoch++;for(const voice of state.active){voice.source.onended=null;try{voice.source.stop();voice.source.disconnect();voice.gain.disconnect()}catch{}}state.active.clear();voices.current=0;if(!keepMusic&&state.music){const music=state.music;state.music=null;try{music.source.stop();music.source.disconnect();music.gain.disconnect()}catch{}}},[]);
  const startMusic=(0,z.useCallback)(ctx=>{const state=sound.current;if(state.music||state.disposed||document.hidden||ctx.state!=="running")return;
    if(!state.musicBuffer){const rate=22050,duration=16,buffer=ctx.createBuffer(1,rate*duration,rate),data=buffer.getChannelData(0);
      const chords=[[48,55,59],[45,52,60],[41,48,57],[43,50,59]],melody=[72,76,79,76,69,72,76,72,69,72,77,72,71,74,79,74],hz=note=>440*2**((note-69)/12);
      for(let i=0;i<data.length;i++){const t=i/rate,section=Math.floor(t/4),age=t%4,beat=Math.floor(t),noteAge=t%1;
        const chordEnvelope=Math.sin(Math.PI*age/4)**.7;let value=0;
        for(const note of chords[section]){const phase=2*Math.PI*hz(note)*t;value+=(Math.sin(phase)+.12*Math.sin(phase*2))*chordEnvelope*.12;}
        const phase=2*Math.PI*hz(melody[beat])*noteAge,attack=Math.min(1,noteAge/.035);
        value+=(Math.sin(phase)+.15*Math.sin(phase*2))*attack*Math.exp(-noteAge*4.5)*.15;
        data[i]=value*Math.min(1,t/.18,(duration-t)/.18);
      }state.musicBuffer=buffer;
    }
    const source=ctx.createBufferSource(),gain=ctx.createGain(),at=ctx.currentTime;source.buffer=state.musicBuffer;source.loop=true;source.loopStart=0;source.loopEnd=16;
    gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(.16,at+.9);source.connect(gain).connect(ctx.destination);state.music={source,gain};source.start(at);
  },[]);
  const tone=(0,z.useCallback)((kind,type)=>{try{const state=sound.current,AudioCtor=window.AudioContext||window.webkitAudioContext;if(!AudioCtor||state.disposed||document.hidden)return;const ctx=audio.current||(audio.current=new AudioCtor),epoch=state.epoch,requested=performance.now();
    const play=()=>{try{if(audio.current!==ctx||ctx.state!=="running"||state.disposed||state.epoch!==epoch||document.hidden||performance.now()-requested>300||voices.current>=4)return;
      if(kind!=="clear"&&kind!=="select")startMusic(ctx);
      const variation=state.variant++%3,key=kind+":"+(type||"")+":"+variation;let buffer=state.buffers.get(key);
      if(!buffer){const flower=["daisy","tulip","sunflower"].includes(kind),duration=kind==="grass"?.28:kind==="clear"?.4:kind==="select"?.1:.18,rate=ctx.sampleRate;
        buffer=ctx.createBuffer(1,Math.ceil(rate*duration),rate);const data=buffer.getChannelData(0);let seed=5708+variation*7919,low=0,high=0,phase=0;
        const frequency=({daisy:240,tulip:210,sunflower:180})[kind]||520;
        for(let i=0;i<data.length;i++){const t=i/rate;seed=(1664525*seed+1013904223)>>>0;const noise=seed/2147483648-1;
          low+=(noise-low)*(1-Math.exp(-2*Math.PI*(kind==="grass"?350:650)/rate));high+=(noise-high)*(1-Math.exp(-2*Math.PI*(kind==="grass"?1800:3600)/rate));
          phase+=2*Math.PI*(flower?55+(frequency-55)*Math.exp(-t*36):frequency)*(1+(variation-1)*.055)/rate;
          const envelope=Math.min(1,t/(kind==="grass"?.025:flower?.003:.008),(duration-t)/(kind==="grass"?.07:.035));
          const value=kind==="grass"?(high-low)*.65*Math.sin(Math.PI*t/duration)**1.2+Math.sin(phase*.28)*.05*Math.exp(-t*28):
            kind==="clear"?(high-low)*.65*Math.sin(Math.PI*t/duration)*Math.exp(-t*3):
            kind==="select"?(high-low)*.2*Math.exp(-t*45):
            Math.sin(phase)*.3*Math.exp(-t*28)+low*.18*Math.exp(-t*65);
          data[i]=value*envelope;
        }state.buffers.set(key,buffer);
      }
      const source=ctx.createBufferSource(),gain=ctx.createGain(),at=ctx.currentTime,duration=buffer.duration;source.buffer=buffer;source.loop=false;gain.gain.setValueAtTime(kind==="grass"?.45:.7,at);source.connect(gain).connect(ctx.destination);
      const voice={source,gain};state.active.add(voice);voices.current=state.active.size;
      source.onended=()=>{state.active.delete(voice);voices.current=state.active.size;try{source.disconnect();gain.disconnect()}catch{}};source.start(at);source.stop(at+duration+.01);
    }catch{}};
    if(ctx.state==="suspended")Promise.resolve(ctx.resume()).then(play).catch(()=>{});else play();
  }catch{}},[startMusic]);
  const isFlower=type=>type==="daisy"||type==="tulip"||type==="sunflower";
  const syncStats=(0,z.useCallback)(()=>setStats({plants:plants.current.length,grass:grass.current.length>0,bugs:bugs.current.length}),[]);
  const randomFor=seed=>()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296};
  // Each brush sample has a fixed radial silhouette, not an upright plant or painted disk.
  const makePlant=(x,y,type,previewSeed)=>{const id=previewSeed===undefined?++serial.current:-previewSeed,seed=previewSeed===undefined?(((Math.random()*4294967296)>>>0)^id)||1:previewSeed,rand=randomFor(seed),range=(a,b)=>a+rand()*(b-a),radius=range(type==="grass"?23:5.2,type==="grass"?39:9.5);
    const plant={id,seed,x,y,type,radius,phase:range(0,Math.PI*2),duration:range(type==="grass"?200:320,type==="grass"?420:600),born:performance.now(),tint:Math.floor(range(0,3)),petals:Math.floor(range(5,8))};
    if(type==="grass"){
      const count=Math.floor(range(44,63));plant.blades=Array.from({length:count},(_,i)=>({angle:i/count*Math.PI*2+range(-.075,.075),root:range(0,.33),length:range(.88,1.2),halfWidth:range(.045,.15),bend:range(-.15,.15),delay:range(0,.18),tint:Math.floor(range(0,4))}));
      plant.core=Array.from({length:24},(_,i)=>({angle:i/24*Math.PI*2,radius:range(.76,.84)}));
    }
    return plant;
  };
  const plantScale=()=>Math.min(1.4,Math.max(.6,Math.min(window.innerWidth/390,window.innerHeight/598)));
  const addGrass=(x,y,w,hgt)=>{const scale=plantScale();x=Fe(x,0,1);y=Fe(y,0,1);if(grass.current.some(old=>Math.hypot((old.x-x)*w,(old.y-y)*hgt)<9*scale))return false;
    if(grass.current.length>=1400){grass.current.splice(0,200);grassCache.current.canvas=null;grassCache.current.seen.clear()}
    grass.current.push(makePlant(x,y,"grass"));return true;
  };
  const addFlower=(x,y,type,w,hgt,natural=false)=>{const scale=plantScale(),plant=makePlant(x,y,type),inset=(plant.radius+2)*scale;x=Fe(x,inset/w,1-inset/w);y=Fe(y,inset/hgt,1-inset/hgt);plant.x=x;plant.y=y;
    if(natural&&(plants.current.length>=500||plants.current.some(p=>isFlower(p.type)&&Math.hypot((p.x-x)*w,(p.y-y)*hgt)<40*scale)))return false;plant.natural=natural;
    for(let i=plants.current.length-1;i>=0;i--)if(isFlower(plants.current[i].type)&&Math.hypot((plants.current[i].x-x)*w,(plants.current[i].y-y)*hgt)<(plants.current[i].radius+plant.radius+3)*scale)plants.current.splice(i,1);
    if(plants.current.length>=500)plants.current.splice(0,1);plants.current.push(plant);return true;
  };
  const addPlant=(0,z.useCallback)((nx,ny,type=selected,scatter=false)=>{const rect=canvas.current?.getBoundingClientRect();if(!rect||rect.width<=0||rect.height<=0||!Number.isFinite(nx)||!Number.isFinite(ny)||nx<0||nx>1||ny<0||ny>1||!choices.some(choice=>choice.id===type))return false;
    const w=rect.width,hgt=rect.height,scale=plantScale(),inset=type==="grass"?0:12,x=Fe(nx,inset*scale/w,1-inset*scale/w),y=Fe(ny,inset*scale/hgt,1-inset*scale/hgt);let changed=false;
    if(type==="grass"){
      changed=addGrass(x,y,w,hgt);
      if(changed){const tuft=grass.current.at(-1),rand=randomFor(tuft.seed^0x57b1);if(rand()<.2){const angle=rand()*Math.PI*2,radius=Math.sqrt(rand())*tuft.radius*.45*scale,type=["daisy","tulip","sunflower"][Math.floor(rand()*3)];addFlower(x+Math.cos(angle)*radius/w,y+Math.sin(angle)*radius/hgt,type,w,hgt,true)}}
    }else{
      if(isFlower(type)){const angle=scatter?Math.random()*Math.PI*2:0,radius=scatter?(8+Math.sqrt(Math.random())*16)*scale:0;addFlower(x+Math.cos(angle)*radius/w,y+Math.sin(angle)*radius/hgt,type,w,hgt)}else{if(plants.current.length>=500)plants.current.splice(0,1);plants.current.push(makePlant(x,y,type))}changed=true;
    }
    if(changed){intro.current.active=false;setHasGrowth(true)}return changed;
  },[selected]);
  const releasePointer=()=>{const active=drag.current;drag.current=null;if(active&&canvas.current?.hasPointerCapture?.(active.id))try{canvas.current.releasePointerCapture(active.id)}catch{}};
  const pointerDown=event=>{if(menuOpen){event.preventDefault();setMenuOpen(false);return}if(event.isPrimary===false||event.button>0||drag.current)return;const el=canvas.current;if(!el)return;const rect=el.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width,y=(event.clientY-rect.top)/rect.height;if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>1||y<0||y>1||rect.width<=0||rect.height<=0)return;event.preventDefault();try{el.setPointerCapture(event.pointerId)}catch{}drag.current={id:event.pointerId,type:selected,anchor:{x,y},carry:0,lastTone:performance.now()};keyboard.current={x,y,visible:false};if(addPlant(x,y,selected)){syncStats();tone(selected)}};
  const pointerMove=event=>{const active=drag.current,rect=canvas.current?.getBoundingClientRect();if(!active||active.id!==event.pointerId||event.isPrimary===false||!rect||rect.width<=0||rect.height<=0)return;event.preventDefault();const native=event.nativeEvent||event,coalesced=native.getCoalescedEvents?.()||[],points=[...coalesced.slice(-64),event];let changed=false;
    for(const point of points){const x=(point.clientX-rect.left)/rect.width,y=(point.clientY-rect.top)/rect.height;if(!Number.isFinite(x)||!Number.isFinite(y))continue;if(x<0||x>1||y<0||y>1){active.anchor=null;active.carry=0;continue}
      if(!active.anchor){changed=addPlant(x,y,active.type,true)||changed;active.anchor={x,y};continue}const dx=(x-active.anchor.x)*rect.width,dy=(y-active.anchor.y)*rect.height,distance=Math.hypot(dx,dy),spacing=(active.type==="grass"?10:28)*plantScale();if(distance<.001)continue;
      let steps=0,lastSample=0;for(let d=(active.spacing||spacing)-active.carry;d<=distance&&steps<128;d+=active.spacing||spacing,steps++){const t=d/distance;changed=addPlant(active.anchor.x+(x-active.anchor.x)*t,active.anchor.y+(y-active.anchor.y)*t,active.type,true)||changed;lastSample=d;if(isFlower(active.type))active.spacing=be(20,40)*plantScale()}active.carry=steps>=128?0:steps?distance-lastSample:active.carry+distance;active.anchor={x,y};keyboard.current={x,y,visible:false};
    }
    if(changed){syncStats();if(performance.now()-active.lastTone>=260){tone(active.type);active.lastTone=performance.now()}}
  };
  const pointerUp=event=>{if(drag.current?.id===event.pointerId){pointerMove(event);releasePointer()}};
  const pointerCancel=event=>{if(drag.current?.id===event.pointerId)releasePointer()};
  const keyDown=event=>{if(menuOpen){if(event.key==="Escape"){event.preventDefault();setMenuOpen(false);pickerButton.current?.focus()}return}if(event.ctrlKey||event.metaKey||event.altKey)return;const rect=canvas.current?.getBoundingClientRect();if(!rect||rect.width<=0||rect.height<=0)return;const cursor=keyboard.current;
    if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key)){event.preventDefault();cursor.visible=true;cursor.x=Fe(cursor.x+(event.key==="ArrowRight"?1:event.key==="ArrowLeft"?-1:0)*12/rect.width,.05,.95);cursor.y=Fe(cursor.y+(event.key==="ArrowDown"?1:event.key==="ArrowUp"?-1:0)*12/rect.height,.05,.95)}
    else if(event.key==="Enter"||event.key===" "){event.preventDefault();if(event.repeat)return;cursor.visible=true;if(addPlant(cursor.x,cursor.y)){syncStats();tone(selected)}}
    else if(event.key==="Escape"){cursor.visible=false;releasePointer()}
  };
  const spawnBug=(0,z.useCallback)((type,targets)=>{if(!targets.length||bugs.current.length>=14)return;const target=targets[Math.floor(Math.random()*targets.length)];bugs.current.push({type,x:Fe(target.x+be(-.06,.06),.04,.96),y:Fe(target.y+be(-.06,.06),.04,.96),target,born:performance.now(),phase:be(0,Math.PI*2),heading:be(0,Math.PI*2),nextTarget:performance.now()+be(1400,2800)})},[]);
  const clear=()=>{releasePointer();stopSound(true);setMenuOpen(false);plants.current=[];grass.current=[];grassCache.current.canvas=null;grassCache.current.seen.clear();bugs.current=[];keyboard.current.visible=false;lastSpawn.current=performance.now();intro.current.active=true;intro.current.elapsed=0;setHasGrowth(false);syncStats();tone("clear")};
  const closePicker=()=>{setMenuOpen(false);pickerButton.current?.focus()};
  const selectType=type=>{if(choices.some(choice=>choice.id===type)){setSelected(type);closePicker();tone("select",type)}};
  const openPicker=index=>{releasePointer();menuStart.current=index;setMenuOpen(true)};
  const pickerKeys=event=>{if(event.key==="ArrowDown"||event.key==="ArrowUp"){event.preventDefault();openPicker(event.key==="ArrowDown"?0:choices.length-1)}else if(event.key==="Escape"&&menuOpen){event.preventDefault();closePicker()}};
  const optionKeys=(event,index)=>{let next;if(event.key==="ArrowDown")next=(index+1)%choices.length;else if(event.key==="ArrowUp")next=(index+choices.length-1)%choices.length;else if(event.key==="Home")next=0;else if(event.key==="End")next=choices.length-1;else if(event.key==="Escape"){event.preventDefault();closePicker();return}else if(event.key==="Enter"||event.key===" "){event.preventDefault();selectType(choices[index].id);return}if(next!==undefined){event.preventDefault();optionButtons.current[choices[next].id]?.focus()}};
  (0,z.useEffect)(()=>{if(menuOpen){const index=menuStart.current??choices.findIndex(choice=>choice.id===selected);menuStart.current=null;optionButtons.current[choices[index]?.id]?.focus()}},[menuOpen]);
  (0,z.useEffect)(()=>{let live=true;sound.current.disposed=false;
    const ageOf=(plant,now)=>reduced.current?1:Fe((now-plant.born)*growth/plant.duration,0,1);
    const drawGrass=(ctx,plant,now,scale,w,hgt)=>{const age=ageOf(plant,now);if(age<=0)return;const ease=1-Math.pow(1-age,3),radius=plant.radius*scale;
      ctx.save();ctx.translate(plant.x*w,plant.y*hgt);
      // A small root fill goes UNDER the blades; no opaque layer can cover their interior texture.
      const points=plant.core.map(p=>({x:Math.cos(p.angle)*p.radius*radius*.30*ease,y:Math.sin(p.angle)*p.radius*radius*.30*ease})),last=points.at(-1);ctx.fillStyle="#91c346";ctx.beginPath();ctx.moveTo((last.x+points[0].x)/2,(last.y+points[0].y)/2);for(let i=0;i<points.length;i++){const p=points[i],next=points[(i+1)%points.length];ctx.quadraticCurveTo(p.x,p.y,(p.x+next.x)/2,(p.y+next.y)/2)}ctx.closePath();ctx.fill();
      // Soften only the inner blade tones, preserving geometry and crisp, varied outer tips.
      const palette=["#8dbc43","#97c74a","#9dcc4d","#89b941"],center=[149,196,71],blend=(color,amount)=>"#"+center.map((target,i)=>Math.round(parseInt(color.slice(1+i*2,3+i*2),16)*(1-amount)+target*amount).toString(16).padStart(2,"0")).join(""),tones=palette.map(color=>{const gradient=ctx.createRadialGradient(0,0,0,0,0,radius*ease);gradient.addColorStop(0,blend(color,.45));gradient.addColorStop(.18,blend(color,.45));gradient.addColorStop(.5,blend(color,.2));gradient.addColorStop(.8,color);gradient.addColorStop(1,color);return gradient});
      for(const blade of plant.blades){const progress=Fe((age-blade.delay)/(1-blade.delay),0,1),g=1-Math.pow(1-progress,3),angle=blade.angle,co=Math.cos(angle),si=Math.sin(angle),root=blade.root*radius*g,length=blade.length*radius*g,width=blade.halfWidth*radius*g,bend=blade.bend*radius*g;
        if(length<.1)continue;ctx.fillStyle=tones[blade.tint];ctx.beginPath();ctx.moveTo(co*root-si*width,si*root+co*width);ctx.lineTo(co*length-si*bend,si*length+co*bend);ctx.lineTo(co*root+si*width,si*root-co*width);ctx.closePath();ctx.fill()}
      ctx.restore();
    };
    const drawPlant=(ctx,plant,now,scale,w,hgt)=>{const age=ageOf(plant,now);if(age<=0)return;const radius=plant.radius*scale*(1-Math.pow(1-age,3));ctx.save();ctx.translate(plant.x*w,plant.y*hgt);ctx.rotate(plant.phase);
      if(plant.type==="daisy"&&images.current.flower?.complete&&images.current.flower.naturalWidth){ctx.drawImage(images.current.flower,-radius,-radius,radius*2,radius*2)}
      else{
        ctx.fillStyle=plant.type==="sunflower"?"#ffd75a":plant.type==="tulip"?["#e824a7","#ee524f","#b541d4"][plant.tint]:["#54bbee","#f45867","#fff7df"][plant.tint];
        const petals=plant.type==="sunflower"?5:plant.type==="tulip"?4:5;
        for(let i=0;i<petals;i++){const a=i/petals*Math.PI*2;ctx.beginPath();ctx.ellipse(Math.cos(a)*radius*.5,Math.sin(a)*radius*.5,radius*.54,radius*.35,a,0,Math.PI*2);ctx.fill()}
        ctx.fillStyle=plant.type==="sunflower"?"#e9a83d":"#ffe17a";ctx.beginPath();ctx.arc(0,0,radius*.26,0,Math.PI*2);ctx.fill();
      }ctx.restore();
    };
    const drawBug=(ctx,bug,now,scale,w,hgt)=>{const size=(bug.type==="ladybug"?16:bug.type==="bee"?20:19)*scale,image=images.current[bug.type],flutter=reduced.current?1:.55+Math.abs(Math.sin(now/140+bug.phase))*.45;ctx.save();ctx.translate(bug.x*w,bug.y*hgt);ctx.rotate(bug.heading);
      if(image?.complete&&image.naturalWidth)ctx.drawImage(image,-size/2,-size/2,size,size);
      else if(bug.type==="butterfly"){
        for(const side of [-1,1]){ctx.fillStyle=bug.phase<Math.PI?"#c826bb":"#45b9ed";ctx.beginPath();ctx.ellipse(side*size*.23*flutter,-size*.1,size*.27*flutter,size*.4,side*.35,0,Math.PI*2);ctx.fill();ctx.fillStyle=bug.phase<Math.PI?"#e255d4":"#98dbf5";ctx.beginPath();ctx.ellipse(side*size*.18*flutter,size*.22,size*.2*flutter,size*.23,-side*.3,0,Math.PI*2);ctx.fill()}
        ctx.strokeStyle="#48463b";ctx.lineWidth=1.5*scale;ctx.beginPath();ctx.moveTo(0,-size*.4);ctx.lineTo(0,size*.35);ctx.stroke();
      }else{
        ctx.fillStyle=bug.type==="bee"?"#ffd65c":"#ec574b";ctx.beginPath();ctx.ellipse(0,0,size*.28,size*.42,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#424533";ctx.lineWidth=1.2*scale;ctx.beginPath();if(bug.type==="bee"){ctx.moveTo(-size*.25,0);ctx.lineTo(size*.25,0);ctx.moveTo(-size*.23,size*.2);ctx.lineTo(size*.23,size*.2)}else{ctx.moveTo(0,-size*.4);ctx.lineTo(0,size*.4)}ctx.stroke();ctx.fillStyle="#424533";ctx.beginPath();ctx.arc(0,-size*.35,size*.16,0,Math.PI*2);ctx.fill();
      }ctx.restore();
    };
    // A deterministic decorative meadow, never added to the player's garden or visitor count.
    const drawIntro=(ctx,now,dt,scale,w,hgt)=>{
      const state=intro.current;if(!state.active)return;
      if(!state.scene){
        // Overlapping samples follow a single curved swipe, not isolated radial patches.
        // Preview seeds and timing stay entirely separate from the live garden/input.
        const curves=[[[.28,.56],[.25,.44],[.64,.60],[.60,.46]],[[.60,.46],[.55,.35],[.31,.48],[.37,.36]]];
        const path=Array.from({length:129},(_,i)=>{const progress=i/128*2,segment=Math.min(1,Math.floor(progress)),t=progress-segment,q=1-t,p=curves[segment];return[0,1].map(axis=>q*q*q*p[0][axis]+3*q*q*t*p[1][axis]+3*q*t*t*p[2][axis]+t*t*t*p[3][axis])});
        path[0][2]=0;for(let i=1;i<path.length;i++)path[i][2]=path[i-1][2]+Math.hypot((path[i][0]-path[i-1][0])*390,(path[i][1]-path[i-1][1])*598);
        const tufts=Array.from({length:44},(_,i)=>{const distance=i/43*path.at(-1)[2],index=Math.max(1,path.findIndex(p=>p[2]>=distance)),a=path[index-1],b=path[index],t=(distance-a[2])/(b[2]-a[2]);return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]});
        const flowers=[[.32,.51,"daisy"],[.52,.51,"tulip"],[.55,.44,"sunflower"],[.40,.40,"daisy"]];
        state.scene=[...tufts.map(([x,y],i)=>({...makePlant(x,y,"grass",5101+i),radius:29,delay:i*45,duration:440})),...flowers.map(([x,y,type],i)=>({...makePlant(x,y,type,5201+i),radius:10,delay:900+i*350,duration:760}))];
      }
      if(!reduced.current)state.elapsed+=dt;
      const cycle=reduced.current?2400:state.elapsed%8000,fade=reduced.current?1:Math.min(1,cycle/220,(8000-cycle)/900);
      ctx.save();ctx.globalAlpha=fade;
      for(const plant of state.scene){plant.born=now-cycle+plant.delay;(plant.type==="grass"?drawGrass:drawPlant)(ctx,plant,now,scale,w,hgt)}
      if(cycle>1700){
        const t=cycle/1000;
        for(const [i,type]of["bee","butterfly","ladybug"].entries()){
          const angle=t*(i===2?.35:.7)+i*2.1,rx=i===2?.10:.19,ry=i===2?.07:.135;
          drawBug(ctx,{type,x:.45+Math.cos(angle)*rx,y:.49+Math.sin(angle)*ry,phase:i*1.8,heading:Math.atan2(Math.cos(angle)*ry,-Math.sin(angle)*rx)+Math.PI/2},now,scale*1.15,w,hgt);
        }
      }
      ctx.restore();
    };
    const frame=now=>{raf.current=0;if(!live||!canvas.current||document.hidden)return;const el=canvas.current,rect=el.getBoundingClientRect(),w=rect.width,hgt=rect.height,dpr=Math.min(2,window.devicePixelRatio||1),width=Math.round(w*dpr),height=Math.round(hgt*dpr);if(w<=0||hgt<=0){raf.current=requestAnimationFrame(frame);return}
      if(el.width!==width||el.height!==height){el.width=width;el.height=height}const ctx=el.getContext("2d");if(!ctx){raf.current=requestAnimationFrame(frame);return}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,hgt);const dt=Math.min(50,Math.max(0,now-(lastFrame.current||now))),scale=plantScale();lastFrame.current=now;
      drawIntro(ctx,now,dt,scale,w,hgt);
      // Cache complete blade-based tufts in one layer, preserving their visible interior detail.
      const cache=grassCache.current;if(!cache.canvas||cache.canvas.width!==width||cache.canvas.height!==height||cache.scale!==scale){cache.canvas=document.createElement("canvas");cache.canvas.width=width;cache.canvas.height=height;cache.scale=scale;cache.seen.clear()}
      const ground=cache.canvas.getContext("2d");ground.setTransform(dpr,0,0,dpr,0,0);for(const plant of grass.current)if(ageOf(plant,now)>=1&&!cache.seen.has(plant.id)){drawGrass(ground,plant,now,scale,w,hgt);cache.seen.add(plant.id)}ctx.drawImage(cache.canvas,0,0,w,hgt);for(const plant of grass.current)if(!cache.seen.has(plant.id))drawGrass(ctx,plant,now,scale,w,hgt);
      for(const plant of plants.current)drawPlant(ctx,plant,now,scale,w,hgt);
      const targets=[...plants.current,...grass.current].filter(p=>ageOf(p,now)>.7),desired=Math.min(10,targets.length?Math.floor(grass.current.length/16+plants.current.length/4)+1:0);
      if(bugs.current.length<desired&&now-lastSpawn.current>750){spawnBug(["butterfly","ladybug","bee"][bugs.current.length%3],targets);lastSpawn.current=now;syncStats()}
      for(const bug of bugs.current){if(targets.length&&(!targets.includes(bug.target)||now>bug.nextTarget)){bug.target=targets[Math.floor(Math.random()*targets.length)];bug.nextTarget=now+be(1400,3000)}
        const target=bug.target||bug,dx=(target.x-bug.x)*w,dy=(target.y-bug.y)*hgt,distance=Math.hypot(dx,dy),speed=(bug.type==="ladybug"?5:13)+wander*110;
        if(!reduced.current&&distance>.5){const travel=Math.min(distance,speed*dt/1000);bug.x+=dx/distance*travel/w;bug.y+=dy/distance*travel/hgt;bug.heading=Math.atan2(dy,dx)+Math.PI/2}drawBug(ctx,bug,now,scale,w,hgt);
      }
      if(keyboard.current.visible){ctx.save();ctx.strokeStyle="#424533";ctx.lineWidth=1.5;ctx.setLineDash([3,4]);ctx.beginPath();ctx.arc(keyboard.current.x*w,keyboard.current.y*hgt,9*scale,0,Math.PI*2);ctx.stroke();ctx.restore()}
      raf.current=requestAnimationFrame(frame);
    };
    const visibility=()=>{lastFrame.current=0;if(document.hidden){cancelAnimationFrame(raf.current);raf.current=0}else if(live&&!raf.current)raf.current=requestAnimationFrame(frame)};
    intro.current.visibility=visibility;if(!document.hidden)raf.current=requestAnimationFrame(frame);return()=>{live=false;if(intro.current.visibility===visibility)intro.current.visibility=null;cancelAnimationFrame(raf.current);releasePointer();stopSound();sound.current.disposed=true;sound.current.buffers.clear();sound.current.musicBuffer=null;if(audio.current){Promise.resolve(audio.current.close()).catch(()=>{});audio.current=null}};
  },[growth,wander,spawnBug,syncStats,stopSound]);
  (0,z.useEffect)(()=>{sound.current.disposed=false;const hide=()=>{intro.current.visibility?.();if(document.hidden){releasePointer();stopSound()}},leave=()=>{releasePointer();stopSound()};document.addEventListener("visibilitychange",hide);window.addEventListener("pagehide",leave);window.addEventListener("blur",leave);return()=>{document.removeEventListener("visibilitychange",hide);window.removeEventListener("pagehide",leave);window.removeEventListener("blur",leave)}},[stopSound]);
  return h(z.default.Fragment,null,h("style",null,`
@font-face{font-family:DynaPuff;src:url('./assets/fonts/dynapuff/DynaPuff-SemiBold.woff2') format('woff2');font-display:swap}
html,body,#root{width:100%;height:100%;margin:0;overflow:hidden;background:#d6d6d3}
*{box-sizing:border-box}
.sandbox{--u:min(.2564102564vw,.1672240803vh);--field:#d6d6d3;--ink:#343a31;--control:#595e54;position:relative;width:100%;height:100%;padding:0;border:0;overflow:hidden;background:var(--field);background-size:cover;background-position:center;font-family:DynaPuff,system-ui,sans-serif;color:var(--ink);user-select:none}
.plant-controls{position:absolute;z-index:2;top:calc(30 * var(--u) + env(safe-area-inset-top,0px));left:calc(30 * var(--u) + env(safe-area-inset-left,0px));right:calc(30 * var(--u) + env(safe-area-inset-right,0px));display:grid;grid-template-columns:minmax(0,152px) minmax(0,96px);justify-content:space-between;align-items:start;gap:12px;pointer-events:none}
.sandbox button{min-width:0;min-height:44px;padding:8px 12px;border:0;border-radius:24px;font:600 15px/1.3 DynaPuff,system-ui,sans-serif;background:var(--control);color:#fff;touch-action:manipulation;cursor:pointer;overflow-wrap:anywhere;white-space:normal;pointer-events:auto;-webkit-tap-highlight-color:transparent}
.plant-picker{position:relative;min-width:0;pointer-events:auto}.plant-select{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;text-align:left}.plant-select span{min-width:0}.plant-select svg{width:12px;height:12px;flex:none;transition:transform .12s}.plant-select[aria-expanded=true] svg{transform:rotate(180deg)}
.plant-menu{position:absolute;z-index:3;top:calc(100% + 8px);left:0;width:max(164px,100%);max-width:calc(100vw - 60 * var(--u) - env(safe-area-inset-left,0px) - env(safe-area-inset-right,0px));margin:0;padding:4px;background:#f4f5f1;border-radius:14px;box-shadow:0 3px 12px #343a3126}
.sandbox .plant-option{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:44px;border-radius:10px;background:transparent;color:var(--ink);text-align:left}.plant-option[aria-checked=true]{background:#dce9cb}.plant-option[aria-checked=true]::after{content:"";width:7px;height:7px;border-radius:50%;background:var(--ink);flex:none;margin-left:8px}.sandbox button:active{filter:brightness(.88)}.sandbox button:focus-visible{outline:3px solid var(--ink);outline-offset:3px}.sandbox .plant-option:focus-visible{outline-offset:-3px}
.garden-stage{position:absolute;inset:0;z-index:0;border:0;border-radius:0;overflow:visible}
.garden-stage canvas{width:100%;height:100%;display:block;border:0;touch-action:none;cursor:crosshair}
.garden-stage canvas:focus-visible{outline:3px solid var(--ink);outline-offset:-3px}
.sandbox-guide{grid-column:1/-1;margin:0;text-align:center;line-height:1.4;font-size:calc(18 * var(--u));overflow-wrap:anywhere;pointer-events:none}
.sandbox-status{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
@media(max-width:340px){.plant-controls{gap:8px}.sandbox button{padding-left:9px;padding-right:9px}}
@media(prefers-reduced-motion:reduce){.plant-select svg{transition:none}}
`),h("main",{className:"sandbox",onPointerDownCapture:event=>{if(menuOpen&&!picker.current?.contains(event.target))setMenuOpen(false)},style:{backgroundImage:e.BG_MAIN?'url("'+e.BG_MAIN+'")':undefined}},
    h("section",{className:"plant-controls","aria-label":"Meadow tools"},h("div",{className:"plant-picker",ref:picker,onBlur:event=>{if(!event.currentTarget.contains(event.relatedTarget))setMenuOpen(false)}},h("button",{type:"button",className:"plant-select",ref:pickerButton,"aria-label":"Choose plant type: "+choices.find(choice=>choice.id===selected).label,"aria-haspopup":"menu","aria-expanded":menuOpen,"aria-controls":"plant-menu",onClick:()=>menuOpen?closePicker():openPicker(choices.findIndex(choice=>choice.id===selected)),onKeyDown:pickerKeys},h("span",null,choices.find(choice=>choice.id===selected).label),h("svg",{viewBox:"0 0 12 12","aria-hidden":"true"},h("path",{d:"m2 4 4 4 4-4",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"}))),menuOpen?h("div",{id:"plant-menu",className:"plant-menu",role:"menu","aria-label":"Plant type"},choices.map((choice,index)=>h("button",{key:choice.id,type:"button",className:"plant-option",role:"menuitemradio","aria-checked":selected===choice.id,tabIndex:-1,ref:node=>{optionButtons.current[choice.id]=node},onClick:()=>selectType(choice.id),onKeyDown:event=>optionKeys(event,index)},choice.label))):null),h("button",{type:"button",onClick:clear},e.BTN_CLEAR||"Reset"),h("p",{className:"sandbox-guide",style:{visibility:hasGrowth||menuOpen?"hidden":"visible"}},"Tap or drag to place plants.")),
    h("div",{className:"garden-stage"},h("canvas",{ref:canvas,onPointerDown:pointerDown,onPointerMove:pointerMove,onPointerUp:pointerUp,onPointerCancel:pointerCancel,onLostPointerCapture:pointerCancel,onKeyDown:keyDown,onBlur:()=>{keyboard.current.visible=false},tabIndex:0,role:"button","aria-label":"Tap or drag to place "+selected,"aria-description":"Use arrow keys to move the planting cursor, then Enter or Space to place the selected plant."})),
    h("div",{className:"sandbox-status",role:"status","aria-live":"polite","aria-atomic":"true"},stats.plants+" flowers, "+(stats.grass?"grass planted":"no grass")+", "+stats.bugs+" visitors")
  ));
}
