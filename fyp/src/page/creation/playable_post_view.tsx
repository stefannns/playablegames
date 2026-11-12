/**
 * Post confirmation (Figma 16267:245797), pushed from the result preview's Next button.
 * Appears in place with the caption focused and the keyboard up; tapping the page dismisses the keyboard
 * (the caption blurs), tapping the caption brings it back. Send / Post are visual placeholders for now.
 */
import { TUXNavBar, getColorCSSVar } from "@byted-tiktok/tux-web";
import { TUXIconArrowUpCircleFill } from "@byted-tiktok/tux-icons";
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { AppNavBarBackButton } from "../../components/sys/app_nav_bar_back_button";
import { useSoftKeyboard, useSoftKeyboardInputFocus } from "../../components/sys/soft_keyboard";
import "./playable_post.css";

export function PlayablePostView({ cover, topInset, bottomInset, onBack }: {
  /** The playable's cover: same art as the preview card (image or idle game). */
  cover: ReactNode;
  topInset: string;
  bottomInset: string;
  onBack: () => void;
}) {
  const { close } = useSoftKeyboard();
  const captionRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  // Blur on dismiss so the next tap on the caption focuses it again and re-opens the keyboard.
  const [keyboardOptions] = useState(() => ({
    allowPageInteraction: true, appearance: "dark", returnKey: "done", autoCapitalize: "sentences",
    onDismiss: () => captionRef.current?.blur(),
  } as const));
  const onCaptionFocus = useSoftKeyboardInputFocus(keyboardOptions);
  useLayoutEffect(() => { captionRef.current?.focus({ preventScroll: true }); }, []);

  return (
    <section className="playable-post" aria-label="New Playable" style={{ paddingTop: topInset, paddingBottom: bottomInset }}>
      <img className="playable-post-glow" src="/resource/playable/post/bg.svg" alt="" aria-hidden="true" />
      <div className="playable-post-nav">
        <TUXNavBar heightPreset={44} backgroundColor="transparent" showSeparator={false} title="New Playable" titleAlign="center"
        leading={<AppNavBarBackButton iconColor={getColorCSSVar("UIText1")} onBack={() => { close(); onBack(); }} />} />
      </div>
      <div className="playable-post-cover" data-electron-smooth-corner>
        {cover}
      </div>
      <div className="playable-post-form" data-softkb-keep-open>
        <input ref={captionRef} className="playable-post-caption" data-electron-smooth-corner value={caption}
          placeholder="Add caption" aria-label="Add caption" onFocus={onCaptionFocus} onChange={event => setCaption(event.target.value)} />
        <div className="playable-post-actions">
          <button type="button" className="playable-post-send" data-electron-smooth-corner>
            <span className="playable-post-avatars" aria-hidden="true">
              <img className="playable-post-avatar-behind" src="/resource/playable/post/send-avatar-behind.png" alt="" />
              <img className="playable-post-avatar" src="/resource/playable/post/send-avatar.png" alt="" />
            </span>
            Send
          </button>
          <button type="button" className="playable-post-publish" data-electron-smooth-corner>
            <TUXIconArrowUpCircleFill size={20} />Post
          </button>
        </div>
      </div>
    </section>
  );
}
