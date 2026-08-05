import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { connectSocket, disconnectSocket } from "../lib/socket";
import { useAuth } from "./AuthContext";

/**
 * SocketContext — owns the app's single authenticated Socket.io connection.
 *
 * The socket connects automatically whenever the user is authenticated and
 * tears down on logout. Consumers use `useSocket()` for the raw socket +
 * `connected` flag, or the `useSocketEvent(event, handler)` hook to subscribe
 * to an event with automatic cleanup.
 */
const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  // Socket is held in state so the context value updates when it connects/clears
  // (reading a ref during render would hand consumers a stale value). The ref
  // mirrors it only so `emit` can stay referentially stable.
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  // This effect synchronizes React with the external socket lifecycle: it opens
  // the connection on auth and tears it down on logout. Storing the socket handle
  // in state is intrinsic to that sync (not derived render state), so the
  // setState-in-effect calls below are intentional.
  useEffect(() => {
    if (!isAuthenticated || !token) {
      disconnectSocket();
      socketRef.current = null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSocket(null);
      setConnected(false);
      return;
    }

    const nextSocket = connectSocket(token);
    socketRef.current = nextSocket;
    setSocket(nextSocket);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    nextSocket.on("connect", onConnect);
    nextSocket.on("disconnect", onDisconnect);
    if (nextSocket.connected) setConnected(true);

    return () => {
      nextSocket.off("connect", onConnect);
      nextSocket.off("disconnect", onDisconnect);
    };
  }, [isAuthenticated, token]);

  /** Emit an event on the shared socket (no-op if not connected). */
  const emit = useCallback((event, payload, ack) => {
    socketRef.current?.emit(event, payload, ack);
  }, []);

  const value = useMemo(() => ({ socket, connected, emit }), [socket, connected, emit]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

/** Access the socket, connection status, and emit helper. */
export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within a SocketProvider");
  return ctx;
}

/**
 * Subscribe to a socket event for the lifetime of the calling component.
 * The handler is kept in a ref so re-renders don't detach/reattach the listener.
 *
 * @param {string} event
 * @param {(payload:any) => void} handler
 */
export function useSocketEvent(event, handler) {
  const { socket } = useSocket();
  const handlerRef = useRef(handler);
  // Latest-ref pattern: keep the newest handler without re-subscribing the
  // socket listener on every render. Writing the ref during render is intentional.
  // eslint-disable-next-line react-hooks/refs
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket || !event) return;
    const listener = (payload) => handlerRef.current?.(payload);
    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [socket, event]);
}

export default SocketContext;
