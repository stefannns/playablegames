/** Isolated approved build: native app, no CDN upload, simulator or root service worker. */
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  base:'/playablebatch1/tiktok/', publicDir:false,
  plugins:[react(),{name:'portfolio-safe-entry',transformIndexHtml:{order:'pre',handler(html){
    return html.replace('src="/src/main.tsx"','src="/src/portfolio_fyp_main.tsx"').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,script=>{
      if(script.includes('/__ws'))return '';
      if(script.includes('__desagent-embed-bootstrap'))return '<script>const reviewUrl=new URL(location.href);reviewUrl.searchParams.set("review","batch");history.replaceState(history.state,"",reviewUrl);if(window.parent!==window){const h=document.documentElement;h.dataset.desagentEmbed="true";h.dataset.desagentFullscreen="true";h.style.setProperty("--safe-area-top","0px");h.style.setProperty("--safe-area-bottom","0px");h.style.setProperty("--desagent-host-chrome","hidden");}</script>';
      return script;
    })
      .replace('href="/favicon.svg"','href="/playablebatch1/tiktok/favicon.svg"')
      .replace('href="/apple-touch-icon.png"','href="/playablebatch1/tiktok/apple-touch-icon.png"');
  }}}],
  build:{outDir:'../2026-10-13-tiktok-batch-view/native-build',sourcemap:false,emptyOutDir:true},
});
