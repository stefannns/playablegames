/**
 * Real prompt → HTML playable generation for local demos. Talks to the dev-only /api/playable/generate
 * bridge (scripts/playable-gen), which streams Claude's output; the finished document gets the feed adapter
 * inlined and plays from a blob URL. Without the bridge (no key, built site) a job runs the old timed demo.
 */
import { useEffect, useRef, useState } from "react";
import type { PlayableGame } from "./playable_generating_view";

const ENDPOINT = "/api/playable/generate";
/** Typical document size; progress tracks streamed characters against it and holds below 100 until done. */
const EXPECTED_CHARS = 18000;
const LIVE_PROGRESS_CAP = 95;
/** Demo pacing: +1% every 50ms (~5s). */
const DEMO_STEP_MS = 50;

/** A generated playable keeps its source so follow-up prompts can edit it. */
export type GeneratedPlayable = PlayableGame & { html?: string };

export type GenerationJob = {
  prompt: string;
  /** Edit this game instead of starting fresh (live only when it carries its HTML). */
  previous?: GeneratedPlayable;
  /** What the timed demo resolves to when live generation isn't available or isn't wanted. */
  demo?: PlayableGame;
  live: boolean;
};

export type GenerationState = { progress: number; game?: GeneratedPlayable; error?: string; retry: () => void };

/** Composer nodes → the prompt text sent to the model, with chips spelled out as bracketed hints. */
export function describePrompt(nodes: Node[]): string {
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? "").replace(/[​￼--]/g, "");
    if (!(node instanceof HTMLElement)) return "";
    if (node.classList.contains("playable-token-space")) return " ";
    if (node.dataset.promptToken) {
      const label = node.textContent?.replace(/\s+/g, " ").trim();
      switch (node.dataset.kind) {
        case "addon": return ` [${label} trick] `;
        case "meme": return " [meme sticker] ";
        case "count": return ` [${label} reply options] `;
        default: return " [reference photo] ";
      }
    }
    return Array.from(node.childNodes).map(walk).join("");
  };
  return nodes.map(walk).join("").replace(/\s+/g, " ").trim();
}

let adapterSource: Promise<string> | null = null;
/** The feed adapter (storage shim, autoplay, palette), inlined so a blob document needs no fetches. */
function loadAdapter() {
  adapterSource ??= fetch("/resource/playable-feed/pocket-host.js").then(r => (r.ok ? r.text() : "")).catch(() => "");
  return adapterSource;
}

async function toPlayable(html: string, prompt: string): Promise<GeneratedPlayable> {
  const adapter = (await loadAdapter()).replace(/<\/script/gi, "<\\/script");
  const tag = adapter ? `<script data-seed-random="off">${adapter}</script>` : "";
  const head = html.match(/<head[^>]*>/i);
  const withAdapter = head ? html.replace(head[0], head[0] + tag) : tag + html;
  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1].trim() || prompt.slice(0, 40) || "My playable";
  const src = URL.createObjectURL(new Blob([withAdapter], { type: "text/html" }));
  return { src, title, html };
}

/** Runs one generation job for the lifetime of the component that owns it. */
export function useGeneratedPlayable(job: GenerationJob): GenerationState {
  const jobRef = useRef(job);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<Omit<GenerationState, "retry">>({ progress: 0 });

  useEffect(() => {
    const { prompt, previous, demo, live } = jobRef.current;
    let cancelled = false;
    let demoTimer = 0;
    const abort = new AbortController();
    setState({ progress: 0 });

    const runDemo = () => {
      demoTimer = window.setInterval(() => setState(current => {
        const progress = Math.min(100, current.progress + 1);
        if (progress >= 100) window.clearInterval(demoTimer);
        return { progress, game: progress >= 100 ? demo : undefined };
      }), DEMO_STEP_MS);
    };
    const editing = Boolean(previous);
    if (!live || (editing && !previous?.html)) { runDemo(); return () => window.clearInterval(demoTimer); }

    (async () => {
      let response: Response;
      try {
        response = await fetch(ENDPOINT, {
          method: "POST", signal: abort.signal, headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt, previousHtml: previous?.html }),
        });
      } catch {
        if (!cancelled) runDemo();
        return;
      }
      // No bridge here (published site → 404, no key → 503): keep the demo experience.
      if (!response.ok || !response.body) { if (!cancelled) runDemo(); return; }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;
          buffer += decoder.decode(value, { stream: true });
          let newline: number;
          while ((newline = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, newline);
            buffer = buffer.slice(newline + 1);
            if (!line.trim()) continue;
            const event = JSON.parse(line) as { type: string; chars?: number; html?: string; message?: string };
            if (event.type === "progress" && event.chars) {
              setState({ progress: Math.min(LIVE_PROGRESS_CAP, Math.round(event.chars / EXPECTED_CHARS * LIVE_PROGRESS_CAP)) });
            } else if (event.type === "done" && event.html) {
              const game = await toPlayable(event.html, prompt);
              if (!cancelled) setState({ progress: 100, game });
            } else if (event.type === "error") {
              if (!cancelled) setState(current => ({ progress: current.progress, error: event.message ?? "Generation failed" }));
            }
          }
        }
      } catch (error) {
        if (!cancelled) setState(current => ({ progress: current.progress, error: String(error) }));
      }
    })();
    return () => { cancelled = true; abort.abort(); window.clearInterval(demoTimer); };
  }, [attempt]);

  return { ...state, retry: () => setAttempt(value => value + 1) };
}
