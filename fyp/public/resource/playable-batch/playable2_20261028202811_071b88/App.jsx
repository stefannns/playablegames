import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';


// This bridge belongs to the game; it does not reproduce host UI or gradients.
const feedSession = (() => {
  const embedded = window.parent !== window && new URLSearchParams(location.search).get('feedReview') === '1';
  let active = !embedded;
  const listeners = new Set();
  const update = () => {
    document.documentElement.dataset.feedPreview = String(!active);
    for (const callback of listeners) callback(active && !document.hidden);
  };
  window.addEventListener('message', event => {
    if (!embedded || event.source !== parent || event.origin !== location.origin || event.data?.type !== 'playable-active') return;
    active = event.data.active === true;
    update();
  });
  document.addEventListener('visibilitychange', update);
  update();
  return {get active() { return active && !document.hidden; }, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }};
})();
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

function useFeedActive() {
  const [active, setActive] = React.useState(feedSession.active);
  React.useEffect(() => feedSession.subscribe(setActive), []);
  return active;
}

function BatchPolish() {
  const active = useFeedActive();
  return <>
    <style>{POLISH_CSS}</style>
    {!active && [80,81,84].includes(GAME_NUMBER) && <div className={'preview-example example-' + GAME_NUMBER} aria-hidden="true">
      {GAME_NUMBER === 80 && <svg viewBox="0 0 320 220"><defs><radialGradient id="soft-example" cx=".35" cy=".2" r=".9"><stop stopColor="#ffe4bd"/><stop offset="1" stopColor="#f3ad97"/></radialGradient></defs><path className="example-blob" d="M78 61C112 16 184 23 192 66C206 88 248 75 249 113C251 162 200 176 165 166C117 195 69 166 80 124C40 101 47 78 78 61Z" fill="url(#soft-example)" stroke="#d99485" strokeWidth="2"/><g className="example-eyes"><ellipse cx="136" cy="91" rx="11" ry="14" fill="white"/><ellipse cx="168" cy="91" rx="11" ry="14" fill="white"/><circle cx="139" cy="94" r="5" fill="#443c39"/><circle cx="171" cy="94" r="5" fill="#443c39"/></g></svg>}
      {GAME_NUMBER === 81 && <svg viewBox="0 0 320 220"><path className="example-noodle" d="M65 145C44 109 84 61 115 88S139 171 187 151S250 80 263 126" fill="none" stroke="#e4d3ed" strokeWidth="29" strokeLinecap="round"/><path className="example-noodle" d="M65 145C44 109 84 61 115 88S139 171 187 151S250 80 263 126" fill="none" stroke="#3e3b42" strokeWidth="13" strokeLinecap="round"/><circle cx="129" cy="103" r="6" fill="white"/><circle cx="144" cy="111" r="6" fill="white"/><circle cx="130" cy="104" r="2.4"/><circle cx="145" cy="112" r="2.4"/><path d="M115 151q-5 17-15 11M186 160q5 18 15 9" fill="none" stroke="#3e3b42" strokeWidth="3" strokeLinecap="round"/></svg>}
      {GAME_NUMBER === 84 && <div className="example-poem">a little line becomes a thought<br/>the words wander across the paper<br/><em>softly</em> a small world opens<br/>every mark is a moment<br/>and every moment can begin again</div>}
    </div>}
  </>;
}

const BASE_CSS = `
button { touch-action: manipulation; }
button:focus-visible { outline: 3px solid #3c8ddd; outline-offset: 3px; }
@keyframes batchBreathe { 0%,100% { opacity:.72; } 50% { opacity:1; } }
.preview-example { position:fixed; z-index:2; pointer-events:none; width:min(80%,340px); left:50%; top:35%; transform:translateX(-50%); }
.preview-example svg { width:100%; height:auto; overflow:visible; }
.example-blob { transform-origin:50% 60%; animation:exampleSquish 3.8s ease-in-out infinite; }
.example-noodle { transform-origin:50% 70%; animation:exampleWiggle 3.6s ease-in-out infinite; }
.example-poem { padding:20px; color:#44444c; font:15px/1.8 ui-monospace,monospace; clip-path:ellipse(49% 47% at 50% 50%); animation:exampleInk 5s ease-in-out infinite; }
.example-poem em { color:#ad7397; font-style:normal; }
@keyframes exampleSquish { 0%,100% {transform:scale(1,1) rotate(-3deg)} 40% {transform:scale(1.06,.94) rotate(2deg)} 70% {transform:scale(.96,1.04) rotate(-1deg)} }
@keyframes exampleWiggle { 0%,100% { transform:rotate(-3deg) translateY(0); } 50% { transform:rotate(3deg) translateY(-5px); } }
@keyframes exampleInk { 0%,100% {opacity:.25;clip-path:ellipse(23% 35% at 32% 50%)} 45%,70% {opacity:.9;clip-path:ellipse(49% 47% at 50% 50%)} }
@media (prefers-reduced-motion:reduce) { *,*::before,*::after { animation:none!important; transition:none!important; } }
`;

const GAME_NUMBER=81;
const POLISH_CSS=BASE_CSS+".brand{display:none}.topbar{height:74px;padding:30px 30px 0!important;display:flex;align-items:flex-start;justify-content:space-between}.count{position:absolute;left:50%;transform:translateX(-50%);font-size:28px;line-height:44px}.count small{display:none}.actions{margin-left:auto;gap:10px}.actionButton,.closeButton{min-height:44px;min-width:44px;border-radius:22px;font-size:14px}.resetButton{width:44px;height:44px}.guide{top:24%;padding:9px 16px;max-width:calc(100% - 60px);transform:translate(-50%,-50%);font-size:18px;line-height:1.3;color:#51424f;background:#fffefaee;white-space:normal;animation:batchBreathe 2.6s ease-in-out infinite}.guide.hidden{animation:none;opacity:0;transform:translate(-50%,-50%)}.bookOverlay{padding:80px 30px 50px;align-items:flex-start}.bookPanel{border-radius:22px;padding:20px;max-height:100%}.eyebrow{display:none}.entry{grid-template-columns:90px 1fr;gap:10px}.entry small{display:none}.thumb{width:90px}.entryWords span{font-size:13px;color:#6c5967}.entryWords strong{font-size:17px}.emptyBook p{font-size:15px}[data-feed-preview=true] .topbar{visibility:hidden} .actions{display:contents}.bookButton{position:absolute;left:30px;top:30px}.resetButton{position:absolute;right:30px;top:30px}";

const FALLBACK_CFG = {
  MAX_CREATURES: 36,
  GROUND_RATIO: 0.86,
  WOBBLE_SPEED: 0.0018,
  GAME_TITLE: 'Doodle Zoo',
  DRAW_HINT: 'Draw a creature',
  ZOO_BOOK: 'Zoo Book',
  BOOK_TITLE: 'Zoo Book',
  EMPTY_BOOK: 'Your first little friend is waiting to be drawn.',
  CREATURE_SUFFIX: 'friends',
};

function flattenConfig(data) {
  const next = { ...FALLBACK_CFG };
  (data?.tweaks || []).forEach((item) => { next[item.id] = item.value; });
  (data?.texts || []).forEach((item) => { next[item.id] = item.value; });
  return next;
}

const PALETTE = [
  { fill: '#f7b5b7', light: '#ffe2d9', name: 'Peachy' },
  { fill: '#a9d9ca', light: '#ddf3df', name: 'Minty' },
  { fill: '#f5d27e', light: '#fff0bc', name: 'Sunny' },
  { fill: '#bfc4ec', light: '#e8e8ff', name: 'Dilly' },
  { fill: '#d7b3dc', light: '#f0dcf1', name: 'Berry' },
];
const NAMES = ['Pip', 'Momo', 'Biscuit', 'Noodle', 'Puddle', 'Mimi', 'Sprout', 'Wiggle', 'Dot', 'Pebble'];
const PERSONALITIES = ['a curious explorer', 'a sleepy dreamer', 'a tiny optimist', 'a bouncy thinker', 'a gentle goofball', 'a sunny pal'];

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function makePath(points) {
  if (!points.length) return '';
  return points.map((point, index) => `${index ? 'L' : 'M'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
}

function useSound() {
  const audio = useRef({ ctx: null, gain: null, loading: {}, buffers: {}, sources: new Set() });
  const files = {
    scribble: './assets/sfx_scribble.mp3', // soft paper-tap cue for the first valid drawing gesture
    arrival: './assets/sfx_arrival.mp3', // cheerful toy-marimba cue when a new friend appears
    button: './assets/sfx_button.mp3', // light selection confirmation for Zoo Book and reset
  };

  const unlock = useCallback(() => {
    const state = audio.current;
    if (!state.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      state.ctx = new Ctx();
      state.gain = state.ctx.createGain();
      state.gain.gain.value = 0.16;
      state.gain.connect(state.ctx.destination);
    }
    if (state.ctx.state === 'suspended') state.ctx.resume().catch(() => {});
    Object.keys(files).forEach((key) => {
      if (state.buffers[key] || state.loading[key]) return;
      state.loading[key] = fetch(files[key])
        .then((response) => response.arrayBuffer())
        .then((array) => state.ctx.decodeAudioData(array))
        .then((buffer) => { state.buffers[key] = buffer; return buffer; })
        .catch(() => null);
    });
  }, []);

  const play = useCallback((key) => {
    unlock();
    const state = audio.current;
    const start = (buffer) => {
      if (!buffer || !state.ctx || state.ctx.state !== 'running' || !state.gain) return;
      try {
        const source = state.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(state.gain);
        state.sources.add(source);
        source.onended = () => state.sources.delete(source);
        source.start(0);
      } catch (_) { /* Audio is optional; drawing remains playable. */ }
    };
    if (state.buffers[key]) start(state.buffers[key]);
    else if (state.loading[key]) state.loading[key].then(start);
  }, [unlock]);

  useEffect(() => () => {
    const state = audio.current;
    state.sources.forEach((source) => { try { source.stop(); } catch (_) {} });
    state.sources.clear();
    if (state.ctx) state.ctx.close().catch(() => {});
  }, []);

  return { unlock, play };
}

function CreatureThumb({ creature }) {
  const points = creature.points.map((point) => ({
    x: 11 + (point.x / Math.max(1, creature.width)) * 98,
    y: 15 + (point.y / Math.max(1, creature.height)) * 49,
  }));
  const path = makePath(points);
  const first = points[Math.floor(points.length * 0.42)] || { x: 60, y: 39 };
  const eyeY = first.y - 3;
  const bodyY = Math.max(28, first.y + 7);
  return (
    <svg className="thumb" viewBox="0 0 120 80" aria-hidden="true">
      <path d={path} fill="none" stroke={creature.color.light} strokeWidth={creature.strokeWidth + 9} strokeLinecap="round" strokeLinejoin="round" />
      <path d={path} fill="none" stroke="#4b4646" strokeWidth={creature.strokeWidth} strokeLinecap="round" strokeLinejoin="round" opacity=".92" />
      <circle cx={first.x - 7} cy={eyeY} r="2.5" fill="#4b4646" />
      <circle cx={first.x + 7} cy={eyeY} r="2.5" fill="#4b4646" />
      <path d={`M ${first.x - 3} ${eyeY + 7} Q ${first.x} ${eyeY + 10} ${first.x + 3} ${eyeY + 7}`} fill="none" stroke="#4b4646" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx={first.x - 12} cy={eyeY + 5} r="2.8" fill={creature.color.fill} opacity=".75" />
      <circle cx={first.x + 12} cy={eyeY + 5} r="2.8" fill={creature.color.fill} opacity=".75" />
      <path d={`M ${first.x - 12} ${bodyY + 8} q -5 8 -9 3 M ${first.x + 12} ${bodyY + 8} q 5 8 9 3`} fill="none" stroke="#4b4646" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function Book({ creatures, cfg, onClose }) {
  return (
    <div className="bookOverlay" role="dialog" aria-modal="true" aria-label={cfg.BOOK_TITLE}>
      <section className="bookPanel">
        <div className="bookTop">
          <div>
            <div className="eyebrow">Doodle Zoo</div>
            <h2>{cfg.BOOK_TITLE}</h2>
          </div>
          <button className="closeButton" type="button" onClick={onClose} aria-label="Close Zoo Book">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        {creatures.length === 0 ? (
          <div className="emptyBook"><div className="emptyDoodle">✦</div><p>{cfg.EMPTY_BOOK}</p></div>
        ) : (
          <div className="entries">
            {creatures.map((creature) => (
              <article className="entry" key={creature.id}>
                <CreatureThumb creature={creature} />
                <div className="entryWords"><strong>{creature.name}</strong><span>{creature.personality}</span></div>
                <small>#{String(creature.index).padStart(2, '0')}</small>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function App() {
  const [cfg, setCfg] = useState(FALLBACK_CFG);
  const [creatures, setCreatures] = useState([]);
  const [bookOpen, setBookOpen] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const creaturesRef = useRef([]);
  const drawingRef = useRef({ active: false, points: [], last: null, distance: 0 });
  const frameRef = useRef(0);
  const resizeObserverRef = useRef(null);
  const { unlock, play } = useSound();

  useEffect(() => {
    let alive = true;
    fetch('./game.config.json')
      .then((response) => response.json())
      .then((data) => { if (alive) setCfg(flattenConfig(data)); })
      .catch(() => { /* fallback config keeps the sandbox available */ });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    creaturesRef.current = creatures;
  }, [creatures]);

  const drawScene = useCallback((now = performance.now()) => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = rect.width;
    const height = rect.height;
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const paper = ctx.createLinearGradient(0, 0, 0, height);
    paper.addColorStop(0, '#fffdfa');
    paper.addColorStop(0.73, '#fbfaf5');
    paper.addColorStop(1, '#f2eee7');
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, width, height);

    // A subtle, low-contrast paper grain made of deterministic dots.
    ctx.save();
    ctx.globalAlpha = 0.055;
    ctx.fillStyle = '#938d83';
    for (let y = 8; y < height; y += 13) {
      for (let x = (y % 26); x < width; x += 29) ctx.fillRect(x, y, 1, 1);
    }
    ctx.restore();

    const groundY = height * Number(cfg.GROUND_RATIO || 0.86);
    ctx.save();
    ctx.filter = 'blur(18px)';
    ctx.fillStyle = 'rgba(159, 185, 167, .18)';
    ctx.beginPath();
    ctx.ellipse(width * .5, groundY + 24, width * .7, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(232, 190, 171, .13)';
    ctx.beginPath();
    ctx.ellipse(width * .16, groundY + 17, width * .28, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(103, 124, 103, .26)';ctx.setLineDash([3,7]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY + 3);
    ctx.bezierCurveTo(width * .22, groundY - 4, width * .42, groundY + 9, width * .63, groundY + 1);
    ctx.bezierCurveTo(width * .79, groundY - 5, width * .9, groundY + 7, width, groundY + 2);
    ctx.stroke();
    ctx.restore();

    creaturesRef.current.forEach((creature) => {
      const wobble = Math.sin((reducedMotionQuery.matches ? 0 : now) * Number(cfg.WOBBLE_SPEED || 0.0018) + creature.phase) * 2.5;
      const bob = Math.sin((reducedMotionQuery.matches ? 0 : now) * 0.0023 + creature.phase * 1.7) * 3.2;
      const tilt = Math.sin((reducedMotionQuery.matches ? 0 : now) * 0.0014 + creature.phase) * 0.035;
      const x = creature.x + Math.sin((reducedMotionQuery.matches ? 0 : now) * 0.00032 + creature.phase) * creature.drift;
      const y = creature.y + bob;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(tilt);
      ctx.translate(-creature.centerX, -creature.centerY);
      const points = creature.points.map((point, i) => ({ x: point.x, y: point.y + wobble * (i / Math.max(1, creature.points.length - 1)) }));
      const path = makePath(points);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = creature.color.light;
      ctx.lineWidth = creature.strokeWidth + 10;
      ctx.globalAlpha = .93;
      ctx.stroke(new Path2D(path));
      ctx.strokeStyle = '#4b4646';
      ctx.lineWidth = creature.strokeWidth;
      ctx.globalAlpha = .96;
      ctx.stroke(new Path2D(path));

      const face = points[Math.floor(points.length * 0.43)] || { x: creature.centerX, y: creature.centerY };
      const blink = Math.sin((reducedMotionQuery.matches ? 0 : now) * 0.0013 + creature.phase * 4) > 0.965;
      const eyeY = face.y - creature.faceScale * .17;
      ctx.strokeStyle = '#4b4646';
      ctx.fillStyle = '#4b4646';
      ctx.lineWidth = Math.max(2, creature.faceScale * .045);
      if (blink) {
        ctx.beginPath(); ctx.moveTo(face.x - creature.faceScale * .22, eyeY); ctx.lineTo(face.x - creature.faceScale * .08, eyeY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(face.x + creature.faceScale * .08, eyeY); ctx.lineTo(face.x + creature.faceScale * .22, eyeY); ctx.stroke();
      } else {
        ctx.fillStyle = '#fffaf2';
        ctx.beginPath(); ctx.arc(face.x - creature.faceScale * .15, eyeY, creature.faceScale * .14, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(face.x + creature.faceScale * .15, eyeY, creature.faceScale * .14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#4b4646';
        ctx.beginPath(); ctx.arc(face.x - creature.faceScale * .15, eyeY, creature.faceScale * .062, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(face.x + creature.faceScale * .15, eyeY, creature.faceScale * .062, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = creature.color.fill;
      ctx.globalAlpha = .78;
      ctx.beginPath(); ctx.arc(face.x - creature.faceScale * .3, eyeY + creature.faceScale * .13, creature.faceScale * .11, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(face.x + creature.faceScale * .3, eyeY + creature.faceScale * .13, creature.faceScale * .11, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#4b4646';
      ctx.lineWidth = Math.max(1.8, creature.faceScale * .045);
      ctx.beginPath();
      ctx.arc(face.x, eyeY + creature.faceScale * .16, creature.faceScale * .13, 0.15, Math.PI - 0.15);
      ctx.stroke();

      const footY = Math.max(...points.map((point) => point.y)) + creature.strokeWidth * .36;
      ctx.lineWidth = Math.max(2.5, creature.strokeWidth * .16);
      ctx.beginPath();
      ctx.moveTo(face.x - creature.faceScale * .23, footY - 1);
      ctx.quadraticCurveTo(face.x - creature.faceScale * .34, footY + 12, face.x - creature.faceScale * .43, footY + 8);
      ctx.moveTo(face.x + creature.faceScale * .23, footY - 1);
      ctx.quadraticCurveTo(face.x + creature.faceScale * .34, footY + 12, face.x + creature.faceScale * .43, footY + 8);
      ctx.stroke();
      if (creature.winged) {
        ctx.fillStyle = creature.color.light;
        ctx.globalAlpha = .9;
        ctx.beginPath(); ctx.ellipse(face.x - creature.width * .33, creature.centerY + 2, 11, 19, -.55, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(face.x + creature.width * .33, creature.centerY + 2, 11, 19, .55, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    });

    const draft = drawingRef.current;
    if (draft.active && draft.points.length > 1) {
      const path = makePath(draft.points);
      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(247, 181, 183, .6)'; ctx.lineWidth = 18; ctx.stroke(new Path2D(path));
      ctx.strokeStyle = '#514b4a'; ctx.lineWidth = 8; ctx.globalAlpha = .88; ctx.stroke(new Path2D(path));
      ctx.restore();
    }
  }, [cfg]);

  useEffect(() => {
    const loop = (now) => { drawScene(now); frameRef.current = requestAnimationFrame(loop); };
    frameRef.current = requestAnimationFrame(loop);
    const observer = new ResizeObserver(() => drawScene());
    if (stageRef.current) observer.observe(stageRef.current);
    resizeObserverRef.current = observer;
    return () => {
      cancelAnimationFrame(frameRef.current);
      observer.disconnect();
      resizeObserverRef.current = null;
    };
  }, [drawScene]);

  const pointFromEvent = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const startDrawing = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (bookOpen) return;
    unlock();
    const point = pointFromEvent(event);
    if (point.y < 86) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drawingRef.current = { active: true, points: [point], last: point, distance: 0 };
    if (!hasDrawn) setHasDrawn(true);
    play('scribble');
  };

  const continueDrawing = (event) => {
    const draft = drawingRef.current;
    if (!draft.active) return;
    const point = pointFromEvent(event);
    const step = distance(point, draft.last);
    if (step >= 2) {
      draft.points.push(point);
      draft.distance += step;
      draft.last = point;
    }
  };

  const finishDrawing = (event) => {
    const draft = drawingRef.current;
    if (!draft.active) return;
    const end = pointFromEvent(event);
    if (distance(end, draft.last) > 2) { draft.points.push(end); draft.distance += distance(end, draft.last); }
    draft.active = false;
    const points = draft.points.slice();
    const length = draft.distance;
    if (points.length < 4 || length < 22) { drawingRef.current = { active: false, points: [], last: null, distance: 0 }; return; }

    const minX = Math.min(...points.map((p) => p.x));
    const maxX = Math.max(...points.map((p) => p.x));
    const minY = Math.min(...points.map((p) => p.y));
    const maxY = Math.max(...points.map((p) => p.y));
    const rawW = Math.max(12, maxX - minX);
    const rawH = Math.max(10, maxY - minY);
    const centerX = (minX + maxX) / 2;
    const groundY = canvasRef.current.clientHeight * Number(cfg.GROUND_RATIO || .86);
    const width = clamp(rawW + 30, 54, 190);
    const height = clamp(rawH + 30, 48, 120);
    const scale = Math.min(width / Math.max(rawW, 1), height / Math.max(rawH, 1));
    const normalized = points.map((p) => ({ x: (p.x - centerX) * scale + width / 2, y: (p.y - (minY + maxY) / 2) * scale + height / 2 }));
    const color = PALETTE[creaturesRef.current.length % PALETTE.length];
    const creature = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      index: creaturesRef.current.length + 1,
      points: normalized,
      color,
      width,
      height,
      strokeWidth: clamp(Math.min(rawW, rawH) * .24 + 7, 9, 25),
      faceScale: clamp(Math.min(width, Math.max(48, height)) * .42, 21, 40),
      centerX: width / 2,
      centerY: height / 2,
      x: clamp(centerX, width / 2 + 6, canvasRef.current.clientWidth - width / 2 - 6),
      y: groundY - height * .55,
      phase: Math.random() * Math.PI * 2,
      drift: 2 + Math.random() * 5,
      winged: rawH > rawW * .55 || points.length > 22,
      name: `${NAMES[(creaturesRef.current.length + Math.floor(length)) % NAMES.length]}`,
      personality: PERSONALITIES[(creaturesRef.current.length + points.length) % PERSONALITIES.length],
    };
    const next = [...creaturesRef.current, creature].slice(-Number(cfg.MAX_CREATURES || 36));
    next.forEach((item, index) => { item.index = index + 1; });
    creaturesRef.current = next;
    setCreatures(next);
    play('arrival');
    drawingRef.current = { active: false, points: [], last: null, distance: 0 };
  };

  const resetZoo = () => {
    unlock();
    play('button');
    creaturesRef.current = [];
    setCreatures([]);
    setHasDrawn(false);
    setBookOpen(false);
    drawingRef.current = { active: false, points: [], last: null, distance: 0 };
    console.info('[Doodle Zoo] zoo reset');
  };

  const openBook = () => {
    unlock();
    play('button');
    setBookOpen(true);
  };

  return (
    <main className="app" ref={stageRef}>
      <style>{`
@font-face {
  font-family: 'DynaPuff';
  src: url('./assets/fonts/dynapuff/DynaPuff-SemiBold.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

:root {
  --font-display: "DynaPuff", "PingFang SC", system-ui, sans-serif;
  --font-body:    "DynaPuff", "PingFang SC", system-ui, sans-serif;
  --font-mono:   ui-monospace, Menlo, monospace;
}

* { box-sizing: border-box; }
.app { width: 100%; height: 100%; min-height: 0; overflow: clip; position: relative; color: #4b4646; background: #fbfaf5; font-family: var(--font-body); }
.canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; cursor: crosshair; }
.topbar { position: absolute; z-index: 3; top: 0; left: 0; right: 0; height: 78px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 13px 18px 0; pointer-events: none; }
.brand { pointer-events: none; font-family: var(--font-display); font-size: clamp(19px, 5vw, 25px); letter-spacing: -.8px; color: #4b4646; text-shadow: 1px 2px 0 #fff; }
.brandDot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #f5b6ac; margin: 0 4px 1px 1px; box-shadow: 5px -2px 0 #b6dcca; }
.count { justify-self: center; min-width: 48px; text-align: center; font-family: var(--font-display); font-size: 25px; color: #4b4646; line-height: 1; }
.count small { display: block; margin-top: 4px; font-family: var(--font-body); font-size: 9px; font-weight: 400; letter-spacing: 1.2px; text-transform: uppercase; color: #9c938b; }
.actions { justify-self: end; display: flex; gap: 8px; align-items: center; pointer-events: auto; }
.actionButton, .closeButton { border: 1.5px solid rgba(75,70,70,.24); background: rgba(255,255,252,.78); color: #4b4646; font-family: var(--font-display); cursor: pointer; box-shadow: 0 2px 0 rgba(75,70,70,.08); transition: transform .16s ease, background .16s ease, box-shadow .16s ease; }
.actionButton:hover, .closeButton:hover { background: #fff; transform: translateY(-1px); box-shadow: 0 4px 0 rgba(75,70,70,.1); }
.actionButton:active, .closeButton:active { transform: translateY(1px); box-shadow: none; }
.bookButton { padding: 9px 13px 8px; border-radius: 13px; font-size: 13px; }
.resetButton { width: 37px; height: 37px; border-radius: 50%; display: grid; place-items: center; padding: 8px; }
.resetButton svg, .closeButton svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.guide { position: absolute; z-index: 2; top: 89px; left: 50%; transform: translateX(-50%); max-width: calc(100% - 38px); padding: 8px 14px; border-radius: 999px; color: #918882; background: rgba(255,255,252,.73); font-size: clamp(12px, 3.2vw, 15px); white-space: nowrap; pointer-events: none; transition: opacity .25s ease, transform .25s ease; }
.guide.hidden { opacity: 0; transform: translate(-50%, -8px); }
.bookOverlay { position: absolute; z-index: 8; inset: 0; padding: 80px 15px 20px; background: rgba(244,241,234,.52); display: flex; align-items: flex-start; justify-content: center; }
.bookPanel { width: min(560px, 100%); max-height: calc(100% - 20px); overflow: hidden; border: 1.5px solid rgba(75,70,70,.2); border-radius: 25px; background: #fffdf9; box-shadow: 0 16px 40px rgba(83,72,64,.15); padding: 20px 15px 16px; display: flex; flex-direction: column; min-height: 0; }
.bookTop { display: flex; align-items: flex-start; justify-content: space-between; padding: 0 4px 13px 8px; flex: 0 0 auto; }
.eyebrow { color: #a49a92; font-size: 10px; letter-spacing: 1.6px; text-transform: uppercase; margin-bottom: 2px; }
h2 { margin: 0; font-family: var(--font-display); font-size: 24px; font-weight: 400; }
.closeButton { flex: 0 0 auto; border-radius: 50%; width: 36px; height: 36px; display: grid; place-items: center; padding: 7px; }
.entries { overflow: auto; min-height: 0; padding: 1px 3px 4px; display: grid; gap: 9px; }
.entry { min-height: 77px; display: grid; grid-template-columns: 112px 1fr auto; align-items: center; gap: 11px; padding: 7px 9px; border-radius: 17px; background: #faf6ef; border: 1px solid rgba(75,70,70,.09); }
.thumb { width: 112px; height: 64px; display: block; overflow: hidden; }
.entryWords { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.entryWords strong { font-family: var(--font-display); font-size: 17px; font-weight: 400; }
.entryWords span { color: #958b84; font-size: 11px; line-height: 1.3; }
.entry small { align-self: start; color: #b4aaa1; font-family: var(--font-mono); font-size: 10px; }
.emptyBook { min-height: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #938982; padding: 20px; }
.emptyDoodle { color: #f1b8a8; font-size: 42px; transform: rotate(12deg); margin-bottom: 8px; }
.emptyBook p { max-width: 270px; margin: 0; font-size: 13px; line-height: 1.5; }
@media (max-width: 420px) { .topbar { padding-left: 13px; padding-right: 13px; } .brand { font-size: 18px; } .bookButton { padding-left: 10px; padding-right: 10px; } .entry { grid-template-columns: 94px 1fr auto; gap: 7px; } .thumb { width: 94px; } }
      `}</style>
      <canvas
        className="canvas"
        ref={canvasRef}
        onPointerDown={startDrawing}
        onPointerMove={continueDrawing}
        onPointerUp={finishDrawing}
        onPointerCancel={finishDrawing}
        aria-label="Drawing canvas"
      />
      <header className="topbar">
        <div className="brand"><span className="brandDot" />{cfg.GAME_TITLE}</div>
        <div className="count" aria-live="polite">{creatures.length}<small>{cfg.CREATURE_SUFFIX}</small></div>
        <div className="actions">
          <button className="actionButton bookButton" type="button" onClick={openBook}>{cfg.ZOO_BOOK}</button>
          <button className="actionButton resetButton" type="button" onClick={resetZoo} aria-label="Reset zoo">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 10a7.5 7.5 0 1 1 2.1 7.6" /><path d="M4.5 4.8V10h5.2" /></svg>
          </button>
        </div>
      </header>
      <div className={`guide ${hasDrawn ? 'hidden' : ''}`}>{cfg.DRAW_HINT}</div>
      {bookOpen && <Book creatures={creatures} cfg={cfg} onClose={() => { play('button'); setBookOpen(false); }} />}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<><App/><BatchPolish/></>);
