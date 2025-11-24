"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import type { Socket } from "socket.io-client";

export type ChatMessage = {
  id: string;
  from?: string;
  text: string;
  ts: number;
  system?: boolean;
  self?: boolean;
};

type RoomChatState = { messages: ChatMessage[] };

type RoomChatAction =
  | { type: "PUSH"; payload: ChatMessage }
  | { type: "RESET" };

function reducer(state: RoomChatState, action: RoomChatAction): RoomChatState {
  switch (action.type) {
    case "PUSH":
      // Prevent duplicate messages
      const exists = state.messages.find(m => m.id === action.payload.id);
      if (exists) {
        console.log("[RoomChat] Duplicate message ignored:", action.payload.id);
        return state;
      }
      return { ...state, messages: [...state.messages, action.payload] };
    case "RESET":
      return { messages: [] };
    default:
      return state;
  }
}

export function useRoomChat({
  socket,
  roomId,
  selfUserId,
  selfUsername,
}: {
  socket: Socket | null;
  roomId: string | null;
  selfUserId: string;
  selfUsername?: string;
}) {
  const [state, dispatch] = useReducer(reducer, { messages: [] });

  const roomRef = useRef(roomId);
  const selfUserIdRef = useRef(selfUserId);
  const selfUsernameRef = useRef(selfUsername);
  const sockIdRef = useRef<string | null>(null);
  const hasJoinedRoom = useRef<string | null>(null);

  roomRef.current = roomId;
  selfUserIdRef.current = selfUserId;
  selfUsernameRef.current = selfUsername;

  // Log after messages change
  useEffect(() => {
    if (state.messages.length === 0) {
      console.log("[RoomChat] messages cleared; length=0");
    } else {
      const last = state.messages[state.messages.length - 1];
      console.log("[RoomChat] message appended; length=", state.messages.length, "last=", last);
    }
  }, [state.messages]);

  // Reset on room change
  useEffect(() => {
    console.log("[RoomChat] room changed → reset messages; roomId=", roomId);
    dispatch({ type: "RESET" });
    hasJoinedRoom.current = null;
  }, [roomId]);

  // Join room when roomId is available
  useEffect(() => {
    if (!socket || !roomId || hasJoinedRoom.current === roomId) return;
    
    console.log("[RoomChat] Joining room via socket:", roomId);
    socket.emit("room:join", { roomId });
    hasJoinedRoom.current = roomId;
  }, [socket, roomId]);

  // Attach/detach socket listeners
  useEffect(() => {
    if (!socket) {
      console.log("[RoomChat] no socket; listeners not attached");
      return;
    }

    sockIdRef.current = (socket as Socket).id ?? null;
    console.log("[RoomChat] attaching listeners; socketId=", sockIdRef.current, "roomId=", roomRef.current, "selfUserId=", selfUserIdRef.current, "selfUsername=", selfUsernameRef.current);

    const onIncoming = (payload: { from?: string; text: string; ts?: number; roomId?: string }) => {
      // Guard wrong room if provided
      if (payload.roomId && roomRef.current && payload.roomId !== roomRef.current) {
        console.log("[RoomChat] recv ignored (wrong room)", "expected=", roomRef.current, "got=", payload.roomId);
        return;
      }
      if (!roomRef.current) {
        console.log("[RoomChat] recv dropped (roomRef is null); payload=", payload);
        return;
      }

      const ts = payload.ts || Date.now();
      const isSelf =
        payload.from === selfUserIdRef.current ||
        payload.from === selfUsernameRef.current;

      console.log("[RoomChat] recv chat:message; socketId=", sockIdRef.current, "roomId=", roomRef.current, "from=", payload.from, "text=", payload.text, "ts=", ts, "isSelf=", isSelf);

      dispatch({
        type: "PUSH",
        payload: {
          id: `${payload.from}_${ts}_${Math.random().toString(36).slice(2)}`,
          from: payload.from,
          text: payload.text,
          ts,
          self: isSelf,
        },
      });
    };

    const onSystem = (payload: { text?: string; roomId?: string }) => {
      const text = payload?.text || "";
      if (payload.roomId && roomRef.current && payload.roomId !== roomRef.current) {
        console.log("[RoomChat] system ignored (wrong room)", "expected=", roomRef.current, "got=", payload.roomId);
        return;
      }

      console.log("[RoomChat] recv chat:system; socketId=", sockIdRef.current, "roomId=", roomRef.current, "text=", text);

      dispatch({
        type: "PUSH",
        payload: {
          id: `sys_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          text,
          ts: Date.now(),
          system: true,
        },
      });
    };

    socket.on("chat:message", onIncoming);
    socket.on("chat:system", onSystem);

    return () => {
      console.log("[RoomChat] detaching listeners; socketId=", sockIdRef.current, "roomId=", roomRef.current);
      socket.off("chat:message", onIncoming);
      socket.off("chat:system", onSystem);
    };
  }, [socket]);

  // Send a text message
  const send = useCallback(
    (text: string) => {
      if (!socket) {
        console.log("[RoomChat] send aborted: no socket", { text, roomId: roomRef.current, selfUserId: selfUserIdRef.current });
        return false;
      }
      if (!roomRef.current) {
        console.log("[RoomChat] send aborted: no roomId", { text, selfUserId: selfUserIdRef.current });
        return false;
      }

      const trimmed = text.trim();
      if (!trimmed) {
        console.log("[RoomChat] send ignored: blank text");
        return false;
      }

      console.log("[RoomChat] send chat:send; socketId=", (socket as Socket)?.id, "roomId=", roomRef.current, "from=", selfUserIdRef.current, "selfUsername=", selfUsernameRef.current, "text=", trimmed);

      // emit to server (don't add optimistic message - server will echo it back)
      socket.emit("chat:send", { roomId: roomRef.current, text: trimmed });
      return true;
    },
    [socket]
  );

  const reset = useCallback(() => {
    console.log("[RoomChat] manual reset()");
    dispatch({ type: "RESET" });
    hasJoinedRoom.current = null;
  }, []);

  return {
    messages: state.messages,
    send,
    reset,
  };
}