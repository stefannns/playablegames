/**
 * [INPUT]: Vite dev server, an Anthropic API key (ANTHROPIC_API_KEY in .env.local), POSTs from the Playable composer.
 * [OUTPUT]: exports playableGenerateDevPlugin — POST /api/playable/generate streams a generated single-file HTML
 *           playable back as NDJSON ({type:"progress",chars} … {type:"done",html} | {type:"error",message}).
 *           No key → 503 {type:"error",message:"missing-key"} and the client falls back to the demo flow.
 * [POS]: scripts/playable-gen local-demo bridge; dev only (apply: 'serve'), so the key never reaches the bundle or dist.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const ENDPOINT = '/api/playable/generate'
const MODEL = 'claude-opus-5-5'
const MAX_TOKENS = 32000

const SYSTEM_PROMPT = `You build "Playables": small interactive games that live inside a TikTok-style vertical feed card.

Output exactly ONE complete HTML document and nothing else — no markdown fences, no commentary. Start with <!doctype html>.

Hard requirements
- Fully self-contained: inline all CSS and JavaScript. No external URLs of any kind (no CDNs, web fonts, images, audio or APIs). Draw art with CSS, SVG, canvas or emoji.
- Mobile portrait: the page fills 100vw × 100vh (typically 390 × 598 CSS px) with no scrolling, no zoom, user-select: none, touch-action: none on the play area. Keep 16px safe padding; tap targets at least 44px.
- Input via Pointer Events so it works with both touch and mouse.
- Playable within a second of loading: at most one short title line and a single obvious first action. A clear goal, live feedback (score, timer or progress), an ending, and a one-tap restart.
- Short, punchy English UI copy. Bold, colorful, cohesive visuals that read well on a phone; satisfying micro-animations and juicy feedback.
- Robust: never throw on load, no alert/prompt/confirm, no network requests. Web Audio only after the first user gesture, and keep it subtle.
- If the idea needs the camera, microphone or device tilt, ask for it only after a tap, and always offer a touch fallback so the game is playable without permission.
- References like [Tilt trick] or [reference photo] describe mechanics or assets the creator picked; interpret them as gameplay intent (you cannot see attached photos — use a stylized stand-in).`

const EDIT_INSTRUCTIONS = `Apply the requested change to the game below. Keep everything that the request doesn't touch working exactly as before. Return the complete updated HTML document only.`

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

/** Strip anything around the document in case the model wrapped it anyway. */
function extractHtml(text) {
  const fenced = text.match(/```(?:html)?\s*([\s\S]*?)```/i)
  const source = fenced ? fenced[1] : text
  const start = source.search(/<!doctype html|<html/i)
  const end = source.toLowerCase().lastIndexOf('</html>')
  if (start < 0) return null
  return source.slice(start, end > start ? end + '</html>'.length : undefined).trim()
}

export function playableGenerateDevPlugin(apiKey) {
  return {
    name: 'playable-generate-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(ENDPOINT, async (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        // The dev server also listens on the LAN (host: true); only this machine may spend the key.
        const remote = req.socket.remoteAddress ?? ''
        if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote)) { res.statusCode = 403; res.end(); return }
        const send = (event) => res.write(`${JSON.stringify(event)}\n`)
        if (!apiKey) {
          res.statusCode = 503
          res.setHeader('Content-Type', 'application/x-ndjson')
          send({ type: 'error', message: 'missing-key' })
          res.end()
          return
        }
        let request
        try { request = JSON.parse(await readBody(req)) } catch { res.statusCode = 400; res.end(); return }
        const prompt = String(request.prompt ?? '').slice(0, 4000)
        const previousHtml = typeof request.previousHtml === 'string' ? request.previousHtml : ''
        const userContent = previousHtml
          ? `${EDIT_INSTRUCTIONS}\n\nRequested change: ${prompt}\n\nCurrent game:\n${previousHtml}`
          : `Make a playable for this idea: ${prompt}`

        res.statusCode = 200
        res.setHeader('Content-Type', 'application/x-ndjson')
        res.setHeader('Cache-Control', 'no-store')
        const upstreamAbort = new AbortController()
        req.on('close', () => upstreamAbort.abort())
        try {
          const upstream = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            signal: upstreamAbort.signal,
            headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({ model: MODEL, max_tokens: MAX_TOKENS, stream: true, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: userContent }] }),
          })
          if (!upstream.ok || !upstream.body) {
            send({ type: 'error', message: `Claude API ${upstream.status}: ${(await upstream.text()).slice(0, 300)}` })
            res.end()
            return
          }
          // Anthropic streams SSE; forward text deltas as progress and assemble the document.
          const decoder = new TextDecoder()
          let buffer = '', text = '', lastSent = 0
          for await (const chunk of upstream.body) {
            buffer += decoder.decode(chunk, { stream: true })
            let newline
            while ((newline = buffer.indexOf('\n')) >= 0) {
              const line = buffer.slice(0, newline).trim()
              buffer = buffer.slice(newline + 1)
              if (!line.startsWith('data:')) continue
              let event
              try { event = JSON.parse(line.slice(5)) } catch { continue }
              if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') text += event.delta.text
              if (event.type === 'error') throw new Error(event.error?.message ?? 'stream error')
            }
            if (text.length - lastSent > 400) { lastSent = text.length; send({ type: 'progress', chars: text.length }) }
          }
          const html = extractHtml(text)
          send(html ? { type: 'done', html } : { type: 'error', message: 'The model did not return an HTML document.' })
        } catch (error) {
          if (!upstreamAbort.signal.aborted) send({ type: 'error', message: String(error?.message ?? error) })
        }
        res.end()
      })
    },
  }
}
