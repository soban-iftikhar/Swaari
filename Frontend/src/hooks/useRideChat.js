import { useCallback, useEffect, useRef, useState } from "react";
import api from "../lib/api";
import { EVENTS } from "../lib/socketEvents";
import { useSocket, useSocketEvent } from "../context/SocketContext";

/**
 * useRideChat — messaging state for an active ride.
 *
 * Loads history over REST, streams new messages over the socket, tracks the
 * counterpart's typing indicator and read receipts, and exposes send/markRead.
 * Unread count is derived from incoming messages while the drawer is closed.
 *
 * @param {string} rideId
 * @param {'rider'|'driver'} myRole - the current user's role (to split bubbles)
 * @param {boolean} isOpen - whether the chat UI is visible (drives read receipts)
 * @returns {object} chat state + actions
 */
export default function useRideChat(rideId, myRole, isOpen) {
  const { emit, connected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const typingTimeout = useRef(null);

  // Load history when the ride changes (clearing happens in the async body so we
  // don't setState synchronously in the effect body).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!rideId) {
        if (!cancelled) {
          setMessages([]);
          setUnread(0);
        }
        return;
      }
      try {
        const res = await api.get(`/api/rides/${rideId}/messages`);
        if (!cancelled) setMessages(res.data?.messages || []);
      } catch {
        /* chat may not be available yet (pre-accept) */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rideId]);

  // Incoming messages.
  useSocketEvent(EVENTS.CHAT_MESSAGE, (payload) => {
    if (!payload?.message || String(payload.rideId) !== String(rideId)) return;
    setMessages((prev) => {
      // Avoid dupes (our own echo, or re-delivery).
      if (prev.some((m) => m._id === payload.message._id)) return prev;
      return [...prev, payload.message];
    });
    // Count as unread only when it's from the counterpart and the drawer is closed.
    if (payload.message.senderRole !== myRole && !isOpen) {
      setUnread((n) => n + 1);
    }
  });

  // Counterpart read our messages → flip local read receipts.
  useSocketEvent(EVENTS.CHAT_READ, (payload) => {
    if (String(payload?.rideId) !== String(rideId)) return;
    setMessages((prev) =>
      prev.map((m) => (m.senderRole === myRole && !m.readAt ? { ...m, readAt: payload.readAt } : m)),
    );
  });

  // Counterpart typing indicator.
  useSocketEvent(EVENTS.CHAT_TYPING, (payload) => {
    if (String(payload?.rideId) !== String(rideId) || payload.role === myRole) return;
    setTyping(!!payload.typing);
  });

  // Opening the drawer is a read event: tell the server (external sync) and clear
  // the local badge. The setState is intentional here — it's coupled to the emit
  // on the isOpen→true transition, not derived render state.
  useEffect(() => {
    if (isOpen && rideId) {
      emit(EVENTS.CHAT_READ, { rideId });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnread(0);
    }
  }, [isOpen, rideId, emit]);

  /** Send a message over the socket; the echo populates local state. */
  const send = useCallback(
    (text) => {
      const trimmed = (text || "").trim();
      if (!trimmed || !rideId) return;
      emit(EVENTS.CHAT_MESSAGE, { rideId, text: trimmed }, (ack) => {
        // If the server rejects (e.g. ride ended), surface nothing here; the
        // caller keeps the input. Successful sends arrive via CHAT_MESSAGE echo.
        if (ack && ack.ok === false) {
          // no-op: handled by toast upstream if needed
        }
      });
    },
    [rideId, emit],
  );

  /** Emit a typing indicator (auto-clears after a short idle). */
  const setMyTyping = useCallback(
    (isTyping) => {
      if (!rideId || !connected) return;
      emit(EVENTS.CHAT_TYPING, { rideId, typing: isTyping });
      if (isTyping) {
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => emit(EVENTS.CHAT_TYPING, { rideId, typing: false }), 3000);
      }
    },
    [rideId, connected, emit],
  );

  return { messages, typing, unread, send, setMyTyping };
}
