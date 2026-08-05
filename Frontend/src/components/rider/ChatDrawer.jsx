import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import BottomSheet from "../ui/BottomSheet";
import { formatTime } from "../../lib/format";

/**
 * ChatDrawer — in-app messaging UI between rider and driver during a ride.
 *
 * Presentational: message state, sending, typing, and read receipts are owned by
 * the useRideChat hook and passed in. Bubbles are split by `myRole`; read
 * receipts show under the last outbound message; a typing indicator animates
 * when the counterpart is composing.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string} props.title - counterpart name (e.g. "Chat with Ali")
 * @param {'rider'|'driver'} props.myRole
 * @param {Array} props.messages
 * @param {boolean} props.typing - counterpart is typing
 * @param {(text:string) => void} props.onSend
 * @param {(isTyping:boolean) => void} props.onTyping
 */
export default function ChatDrawer({ open, onClose, title, myRole, messages, typing, onSend, onTyping }) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);

  // Auto-scroll to the newest message / typing indicator.
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing, open]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
    onTyping(false);
  };

  // Index of the last message I sent — read receipt renders under it.
  const lastMineIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].senderRole === myRole) return i;
    }
    return -1;
  })();

  return (
    <BottomSheet open={open} onClose={onClose} title={title || "Chat"}>
      <div className="flex h-[60vh] flex-col sm:h-full">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto pb-2">
          {messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-muted">
              No messages yet. Say hello 👋
            </p>
          ) : (
            messages.map((m, idx) => {
              const mine = m.senderRole === myRole;
              return (
                <div key={m._id || idx} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                      mine
                        ? "rounded-br-sm bg-charcoal text-paper"
                        : "rounded-bl-sm bg-cream text-charcoal"
                    }`}
                  >
                    {m.text}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 px-1 text-[10px] text-slate-faint">
                    <span>{formatTime(m.createdAt)}</span>
                    {mine && idx === lastMineIdx && (
                      <span className="font-medium">{m.readAt ? "· Read" : "· Sent"}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {typing && (
            <div className="flex items-center gap-1 pl-1">
              <span className="flex gap-1 rounded-2xl rounded-bl-sm bg-cream px-3 py-2.5">
                <Dot /> <Dot delay="0.15s" /> <Dot delay="0.3s" />
              </span>
            </div>
          )}
        </div>

        {/* Composer */}
        <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-line pt-3">
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              onTyping(e.target.value.length > 0);
            }}
            placeholder="Type a message…"
            className="sw-input flex-1"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Send"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber text-charcoal transition hover:bg-amber-600 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </BottomSheet>
  );
}

/** A single bouncing dot for the typing indicator. */
function Dot({ delay = "0s" }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-slate-muted"
      style={{ animation: "sw-bounce 1s infinite", animationDelay: delay }}
    />
  );
}
