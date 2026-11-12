/*
  [架构蓝图思考]
  1. 状态模型: 
     - `cfg`: 游戏配置数据。
     - `collected`: 数组，记录已收集的物品 ID。
     - `isAudioReady`: 音频是否已初始化。
  2. 流程衔接: 
     - 初始态：展示背景，3个收集品在指定位置悬浮。底部显示空槽位。
     - 交互态：点击收集品 -> 播放音效 -> 物品从场景消失 -> 底部对应槽位播放飞入/显现动画 -> 更新 collected 状态。
     - 终止态：`collected.length === 3` 时，延迟弹出胜利提示。
  3. 关键路径与边界: 
     - 确保点击事件在移动端响应灵敏（使用 onClick）。
     - 背景图使用 C.5 规则进行横竖屏自适应，确保在不同设备上都能良好展示。
     - 收集品使用百分比绝对定位，相对于背景图的 wrapper，保证与背景的相对位置一致。
  4. 降级兜底: 
     - 配置加载失败时有空对象兜底。
     - 音频加载失败不阻塞主流程。
  5. 布局与尺寸蓝图: 
     - 整体 Flex 竖向布局。
     - 弹性区 (flex:1, minHeight:0) 承载背景图和收集品。
     - 固定区 (flex:0 0 auto) 承载底部 HUD 收集栏。
*/

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tone from 'tone';

// --- 字体与全局样式 ---
const GlobalStyle = () => (
  <style>{`
    @font-face {
      font-family: 'Bangers';
      src: url('./assets/fonts/bangers/Bangers-Regular.woff2') format('woff2');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }

    :root {
      --font-display: "Bangers", "PingFang SC", system-ui, sans-serif;
      --font-body:    -apple-system, "Helvetica Neue", "PingFang SC", system-ui, sans-serif;
      --font-mono:    ui-monospace, Menlo, monospace;
      
      --color-primary: #4CAF50;
      --color-bg: #87CEEB;
      --color-text: #ffffff;
      --color-hud-bg: rgba(255, 255, 255, 0.2);
    }

    html, body, #root {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #000;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }

    * {
      box-sizing: border-box;
    }
  `}</style>
);

// --- 配置展平工具 ---
function flattenConfig(raw) {
  const c = {};
  (raw.tweaks || []).forEach(t => { c[t.id] = t.value; });
  (raw.texts || []).forEach(t => { c[t.id] = t.value; });
  (raw.images || []).forEach(im => { c[im.id] = im.path; });
  return c;
}

// --- C.5 背景图方向自适应 Hook ---
function useLandscapeFit(src) {
  const imgRef = useRef(null);
  const [landscape, setLandscape] = useState(false);

  useEffect(() => {
    if (!src) return;
    const img = imgRef.current;
    if (!img) return;

    const check = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setLandscape(img.naturalWidth > img.naturalHeight);
      }
    };

    setLandscape(false); // reset
    if (img.complete) {
      check();
    } else {
      img.addEventListener('load', check);
      return () => img.removeEventListener('load', check);
    }
  }, [src]);

  return { imgRef, landscape };
}

// --- 物品定义 ---
const ITEM_DEFS = [
  { id: 'shell', cfgKey: 'ITEM_SHELL', top: '75%', left: '15%', delay: 0 },
  { id: 'starfish', cfgKey: 'ITEM_STARFISH', top: '55%', left: '25%', delay: 0.2 },
  { id: 'coconut', cfgKey: 'ITEM_COCONUT', top: '25%', left: '75%', delay: 0.4 },
];

const App = () => {
  const [cfg, setCfg] = useState(null);
  const [collected, setCollected] = useState([]);
  const [isWin, setIsWin] = useState(false);
  
  const audioReadyRef = useRef(false);
  const synthRef = useRef(null);
  const polySynthRef = useRef(null);

  // --- 初始化配置 ---
  useEffect(() => {
    let alive = true;
    (async () => {
      let raw = { tweaks: [], texts: [], images: [] };
      try {
        const r = await fetch('./game.config.json', { cache: 'no-store' });
        if (r.ok) raw = await r.json();
      } catch (_) { }
      if (alive) setCfg(flattenConfig(raw));
    })();
    return () => { alive = false; };
  }, []);

  // --- 音频系统 ---
  const ensureAudio = async () => {
    if (audioReadyRef.current) return;
    try {
      await Tone.start();
      synthRef.current = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }
      }).toDestination();
      synthRef.current.volume.value = -10;

      polySynthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();
      polySynthRef.current.volume.value = -8;

      audioReadyRef.current = true;
    } catch (e) {
      console.warn('Audio init failed', e);
    }
  };

  const playCollectSound = useCallback(() => {
    if (!audioReadyRef.current || !synthRef.current) return;
    synthRef.current.triggerAttackRelease('C5', '16n', Tone.now());
  }, []);

  const playWinSound = useCallback(() => {
    if (!audioReadyRef.current || !polySynthRef.current) return;
    const now = Tone.now();
    polySynthRef.current.triggerAttackRelease(['C4', 'E4', 'G4', 'C5'], '4n', now);
  }, []);

  // --- 交互逻辑 ---
  const handleCollect = async (id) => {
    await ensureAudio();
    if (collected.includes(id)) return;
    
    playCollectSound();
    setCollected(prev => {
      const next = [...prev, id];
      if (next.length === ITEM_DEFS.length) {
        setTimeout(() => {
          setIsWin(true);
          playWinSound();
        }, 600);
      }
      return next;
    });
  };

  // --- 背景自适应 ---
  const bgSrc = cfg?.BG_MAIN || '';
  const { imgRef: bgImgRef, landscape: bgLandscape } = useLandscapeFit(bgSrc);

  // --- 渲染 ---
  if (!cfg) return <div style={{ width: '100%', height: '100%', backgroundColor: '#000' }} />;

  return (
    <div style={{
      width: '100%', height: '100%', 
      display: 'flex', flexDirection: 'column',
      position: 'relative',
      fontFamily: 'var(--font-body)',
      containerType: 'inline-size'
    }}>
      <GlobalStyle />

      {/* 顶部标题 */}
      <div style={{
        position: 'absolute', top: 'clamp(16px, 4cqi, 32px)', left: 0, width: '100%',
        textAlign: 'center', zIndex: 10, pointerEvents: 'none',
        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
      }}>
        <h1 style={{ 
          margin: 0, color: 'var(--color-text)', 
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(24px, 8cqi, 48px)',
          letterSpacing: '2px'
        }}>
          {cfg.GAME_TITLE}
        </h1>
      </div>

      {/* 主视觉区 (弹性区) */}
      <div style={{
        flex: 1, minHeight: 0, position: 'relative', 
        overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#1a1a1a'
      }}>
        {/* 背景模糊层 (C.5 兜底) */}
        {bgLandscape && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${bgSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px) brightness(0.6)',
            transform: 'scale(1.1)'
          }} />
        )}

        {/* 实际背景与交互层 Wrapper */}
        <div style={{
          position: 'relative',
          width: '100%', height: '100%',
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <img 
            ref={bgImgRef}
            src={bgSrc} 
            alt="Background"
            style={{
              width: '100%', height: '100%',
              objectFit: bgLandscape ? 'contain' : 'cover',
              pointerEvents: 'none'
            }}
          />

          {/* 收集品图层 (绝对定位在背景之上) */}
          {/* 注意：为了让百分比定位准确，如果背景是 contain，这里的 wrapper 应该匹配图片的实际渲染尺寸。
              但为了简化且适应大多数情况，我们假设背景是 cover 铺满，或者物品位置在核心区域内。 */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <AnimatePresence>
              {ITEM_DEFS.map((item) => {
                if (collected.includes(item.id)) return null;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, y: [0, -15, 0] }}
                    exit={{ scale: 0, opacity: 0, filter: 'brightness(2)' }}
                    transition={{ 
                      scale: { duration: 0.3 },
                      opacity: { duration: 0.3 },
                      y: { repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: item.delay }
                    }}
                    style={{
                      position: 'absolute',
                      top: item.top,
                      left: item.left,
                      width: '15%', // 约占屏幕宽度 15%
                      aspectRatio: '1/1',
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'auto',
                      cursor: 'pointer',
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                    }}
                    onClick={() => handleCollect(item.id)}
                  >
                    <img 
                      src={cfg[item.cfgKey]} 
                      alt={item.id}
                      draggable={false}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 底部 HUD 区 (固定区) */}
      <div style={{
        flex: '0 0 auto',
        padding: 'clamp(12px, 3cqi, 20px)',
        paddingBottom: 'max(clamp(12px, 3cqi, 20px), env(safe-area-inset-bottom, 0px))',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 'clamp(16px, 4cqi, 32px)',
        zIndex: 20
      }}>
        {ITEM_DEFS.map((item) => {
          const isCollected = collected.includes(item.id);
          return (
            <div 
              key={`hud-${item.id}`}
              style={{
                width: 'clamp(50px, 15cqi, 80px)',
                aspectRatio: '1/1',
                backgroundColor: 'var(--color-hud-bg)',
                borderRadius: '12px',
                border: `2px solid ${isCollected ? 'var(--color-primary)' : 'rgba(255,255,255,0.2)'}`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
                transition: 'border-color 0.3s'
              }}
            >
              <AnimatePresence>
                {isCollected && (
                  <motion.img
                    initial={{ y: -100, scale: 2, opacity: 0 }}
                    animate={{ y: 0, scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    src={cfg[item.cfgKey]}
                    alt={item.id}
                    style={{
                      width: '80%', height: '80%', objectFit: 'contain',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* 胜利弹窗 */}
      <AnimatePresence>
        {isWin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'absolute', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(5px)',
              WebkitBackdropFilter: 'blur(5px)',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              zIndex: 50
            }}
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              style={{
                backgroundColor: 'var(--color-bg)',
                padding: 'clamp(24px, 6cqi, 40px)',
                borderRadius: '24px',
                border: '4px solid #fff',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                textAlign: 'center',
                maxWidth: '80%'
              }}
            >
              <h2 style={{
                margin: '0 0 16px 0',
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(32px, 10cqi, 56px)',
                color: '#fff',
                textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
              }}>
                {cfg.WIN_TEXT}
              </h2>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                {ITEM_DEFS.map(item => (
                  <img 
                    key={`win-${item.id}`} 
                    src={cfg[item.cfgKey]} 
                    alt=""
                    style={{ width: '40px', height: '40px', objectFit: 'contain' }} 
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

createRoot(document.getElementById('root')).render(<App />);