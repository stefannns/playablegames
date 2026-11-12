import { motion, useReducedMotion } from "framer-motion";
import { useRef, useState, useEffect, type UIEvent } from "react";
import { TUXButton } from "@byted-tiktok/tux-web";
import { TUXIconChevronDownSmallFill } from "@byted-tiktok/tux-icons";
import { readAppFrameInsetPx } from "../../utils/viewport_insets";

const templates = [
  ["/resource/playable/templates/template-01.gif"],
  ["/resource/playable/templates/template-02.gif"],
  ["/resource/playable/templates/template-03.gif"],
  ["/resource/playable/templates/template-04.gif"],
  ["/resource/playable/templates/template-05.gif"],
  ["/resource/playable/templates/template-06.gif"],
  ["/resource/playable/templates/template-07.gif"],
];

const photos = [
  "/resource/playable/album/d07bb.png", "/resource/playable/album/bf1e8.png",
  "/resource/playable/album/77f56.png", "/resource/playable/album/57115.png",
  "/resource/playable/album/258e9.png", "/resource/playable/album/4166d.png",
  "/resource/playable/album/25168.png", "/resource/playable/album/8c8bf.png",
  "/resource/playable/album/6e3e6.png", "/resource/playable/album/c2e5e.png",
  "/resource/playable/album/58614.png", "/resource/playable/album/4b3d0.png",
  "/resource/playable/album/888a7.png",
];

/** Resource docks share the Tricks dock's keyboard replacement and safe-area rules. */
export function PlayableMediaPanel({ kind, bottomInset, onClose, onAddImages, onRemoveImage, insertedImages, maxPicks, onOpenTemplate }: {
  kind: "templates" | "images";
  bottomInset: string;
  onClose: () => void;
  onAddImages: (sources: string[]) => void;
  onRemoveImage: (source: string) => void;
  /** Images already in the prompt, so reopening the dock shows them as selected. */
  insertedImages: () => string[];
  /** Single-pick mode (character photo swap): every tap applies immediately and the rest dim once full. */
  maxPicks?: number;
  /** Opens the result preview with this template's art in the card. */
  onOpenTemplate?: (src: string, origin: DOMRect) => void;
}) {
  const reduced = useReducedMotion();
  // `inserted` are already in the prompt; `selected` are staged for the full-height Add button.
  const [inserted, setInserted] = useState<string[]>(insertedImages);
  const [selected, setSelected] = useState<string[]>([]);
  const picked = [...inserted, ...selected];
  const full = maxPicks !== undefined && picked.length >= maxPicks;
  const [uploads, setUploads] = useState<string[]>([]);
  const uploadedUrls = useRef<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const [maxHeight, setMaxHeight] = useState(0);
  const [collapsedHeight, setCollapsedHeight] = useState(320);
  const [presentedHeight, setPresentedHeight] = useState(320);
  const [album, setAlbum] = useState("recents");
  const drag = useRef<{ y: number; height: number; scale: number; moved: boolean } | null>(null);
  useEffect(() => {
    const parent = panelRef.current?.parentElement;
    if (!parent) return;
    const resize = () => {
      setCollapsedHeight(320 + readAppFrameInsetPx("bottom"));
      const parentRect = parent.getBoundingClientRect();
      const title = parent.querySelector<HTMLElement>(".playable-title-bar");
      const scale = parentRect.height / parent.clientHeight || 1;
      const available = title ? (parentRect.bottom - title.getBoundingClientRect().bottom) / scale
        : parent.clientHeight - parseFloat(getComputedStyle(parent).paddingTop) - 44;
      setMaxHeight(Math.max(0, available));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    const title = parent.querySelector<HTMLElement>(".playable-title-bar");
    if (title) observer.observe(title);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const element = panelRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setPresentedHeight(element.offsetHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, [kind]);
  useEffect(() => { setExpanded(false); setDragHeight(null); }, [kind]);
  // Collapsing the dock commits staged picks (the composer then owns their object URLs),
  // so their selected state carries into the short dock.
  useEffect(() => {
    if (expanded || selected.length === 0) return;
    uploadedUrls.current = uploadedUrls.current.filter(url => !selected.includes(url));
    onAddImages(selected);
    setInserted(current => [...current, ...selected]);
    setSelected([]);
    // Only a collapse should commit; `selected` changes alone must not, so it stays out of the deps.
  }, [expanded]);
  // Follow the actual sheet height, including the spring settling after release.
  const expansionProgress = Math.max(0, Math.min(1,
    (presentedHeight - collapsedHeight) / Math.max(1, maxHeight - collapsedHeight)));
  // Multi-pick only: the Add bar shows as soon as the dock is pulled open, enabled once something is staged.
  const showAdd = kind === "images" && maxPicks === undefined && expanded && dragHeight === null;
  const showAlbumHeader = kind === "images" && expansionProgress > 0;
  useEffect(() => () => uploadedUrls.current.forEach(url => URL.revokeObjectURL(url)), []);
  const label = kind === "templates" ? "Templates" : "Images";
  // Scrolled grids fade into the grabber instead of being cut by a hard edge; the fade grows
  // with the first 20px of scroll so it never pops in (see CSS --grid-fade).
  const markScrolled = (event: UIEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty("--grid-fade", `${Math.min(20, event.currentTarget.scrollTop)}px`);
  };
  return (
    <motion.section key={kind} ref={panelRef} data-electron-smooth-corner className={`playable-tricks-panel playable-media-panel ${kind === "images" ? "playable-image-panel" : ""}`} aria-label={label} data-softkb-keep-open
      style={{ paddingBottom: 0, maxHeight: maxHeight > 0 ? maxHeight : undefined }} initial={{ y: reduced ? 0 : "100%" }}
      animate={{ y: 0, height: dragHeight ?? (expanded ? maxHeight : `calc(320px + ${bottomInset})`) }}
      transition={dragHeight !== null || reduced ? { duration: 0 } : { type: "spring", stiffness: 438.65, damping: 41.89 }}
      onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); onClose(); } }}>
      <button className="playable-tricks-grabber" aria-label={`Resize ${label} panel`}
        aria-expanded={expanded}
        onPointerDown={event => {
          if (event.button !== 0 || !panelRef.current) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          const rect = panelRef.current.getBoundingClientRect();
          drag.current = { y: event.clientY, height: panelRef.current.offsetHeight, scale: rect.height / panelRef.current.offsetHeight, moved: false };
        }}
        onPointerMove={event => {
          const start = drag.current;
          if (!start) return;
          const dy = (start.y - event.clientY) / start.scale;
          if (Math.abs(dy) < 3 && !start.moved) return;
          start.moved = true;
          setDragHeight(Math.max(collapsedHeight, Math.min(maxHeight, start.height + dy)));
        }}
        onPointerUp={event => {
          const start = drag.current;
          if (!start) return;
          if (start.moved) setExpanded(start.y - event.clientY > 0);
          drag.current = null;
          setDragHeight(null);
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => { drag.current = null; setDragHeight(null); }}
        onClick={event => { if (event.detail === 0) setExpanded(value => !value); }}
        onKeyDown={event => { if (["ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); setExpanded(event.key === "ArrowUp"); } }}><span /></button>
      {kind === "images" && <div className="playable-album-filter" style={{ height: 48 * expansionProgress }} aria-hidden={!showAlbumHeader}>
        <div className="playable-album-filter-pill" style={{ opacity: expansionProgress, pointerEvents: showAlbumHeader ? "auto" : "none" }}>
          <select aria-label="Album filter" tabIndex={showAlbumHeader ? 0 : -1} value={album} onChange={event => setAlbum(event.target.value)}>
            <option value="recents">Recents</option>
            {uploads.length > 0 && <option value="imported">Imported</option>}
          </select>
          <TUXIconChevronDownSmallFill size={16} />
        </div>
      </div>}
      {kind === "templates" ? (
        <div className="playable-template-grid" onScroll={markScrolled} style={{ paddingBottom: `calc(20px + ${bottomInset})` }}>
          {templates.map((layers, index) => <button type="button" className="playable-template-card" data-electron-smooth-corner key={layers[0]}
            aria-label={`Open playable template ${index + 1}`} onClick={event => onOpenTemplate?.(layers[layers.length - 1], event.currentTarget.getBoundingClientRect())}>
            {layers.map(src => <img src={src} alt="" key={src} draggable={false} />)}
          </button>)}
        </div>
      ) : (
        <div className="playable-album-grid" onScroll={markScrolled} style={showAdd ? { paddingBottom: `calc(68px + ${bottomInset})` } : undefined}>
          <button className="playable-album-camera" data-electron-smooth-corner aria-label="Take or upload a photo" onClick={() => fileInput.current?.click()}>
            <img src="/resource/playable/album/287de.svg" alt="" />
          </button>
          <input ref={fileInput} hidden type="file" accept="image/*" capture="environment" onChange={event => {
            const file = event.target.files?.[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            uploadedUrls.current.push(url);
            setUploads(current => [url, ...current]);
            event.target.value = "";
          }} />
          {[...uploads, ...(album === "recents" ? photos : [])].map((src, index) => <button key={src} className="playable-album-photo" data-electron-smooth-corner
            aria-label={`Photo ${index + 1}`} aria-pressed={picked.includes(src)}
            aria-disabled={full && !picked.includes(src)} data-dimmed={full && !picked.includes(src)} onClick={() => {
              if (full && !picked.includes(src)) return;
              if (inserted.includes(src)) {
                onRemoveImage(src);
                setInserted(current => current.filter(item => item !== src));
                return;
              }
              if (!showAdd) {
                // Insert immediately but keep the dock open for more picks.
                uploadedUrls.current = uploadedUrls.current.filter(url => url !== src);
                onAddImages([src]);
                setInserted(current => [...current, src]);
                return;
              }
              setSelected(current => current.includes(src) ? current.filter(item => item !== src) : [...current, src]);
            }}>
            <img className="playable-album-thumbnail" src={src} alt="" draggable={false} />
            {picked.includes(src) ? <span className="playable-album-order">{picked.indexOf(src) + 1}</span>
              : <img className="playable-album-checkbox" src="/resource/playable/album/3f1fd.svg" alt="" />}
          </button>)}
        </div>
      )}
      {showAdd && <div className="playable-album-add" style={{ bottom: `calc(${bottomInset} + 8px)` }}>
        {/* Counts everything selected (already inserted + staged), matching the numbered badges. */}
        <TUXButton text={picked.length ? `Add (${picked.length})` : "Add"} themePreset="primary" sizePreset="large" smoothRadius
          disabled={picked.length === 0} onClick={() => {
          // Collapsing commits the staged picks (see the expanded effect above).
          setExpanded(false);
        }} />
      </div>}
    </motion.section>
  );
}
