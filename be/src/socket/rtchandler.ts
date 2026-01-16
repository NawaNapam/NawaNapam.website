import type { Server, Socket } from "socket.io";

type RoomState = {
  members: Set<string>; // socket.id set
  users: Set<string>; // userId set
  offererUserId?: string; // chosen once both join
};
const rooms = new Map<string, RoomState>();

function getRoom(roomId: string): RoomState {
  let r = rooms.get(roomId);
  if (!r) {
    r = { members: new Set(), users: new Set() };
    rooms.set(roomId, r);
  }
  return r;
}

export function registerRtcHandlers(io: Server, socket: Socket) {
  // client tells server they have joined the matched room (after match:found)

  socket.on("room:join", ({ roomId }: { roomId: string }) => {
    if (!roomId) {
      console.warn("[RTC] room:join with no roomId");
      return;
    }

    const userId = socket.data.userId as string | undefined;
    console.log(
      `[RTC] User ${userId} (socket ${socket.id}) joining room ${roomId}`
    );

    socket.join(roomId);

    const state = getRoom(roomId);
    state.members.add(socket.id);
    if (userId) state.users.add(userId);

    console.log(`[RTC] Room ${roomId} now has ${state.members.size} members`);

    // Emit rtc:ready when BOTH users have joined
    if (state.members.size === 2 && !state.offererUserId) {
      const users = Array.from(state.users).filter(Boolean).sort();
      state.offererUserId = users[0];

      console.log(
        `[RTC] Room ${roomId} ready! Offerer: ${state.offererUserId}`
      );

      // ADD A SMALL DELAY to ensure both clients are ready
      setTimeout(() => {
        io.to(roomId).emit("rtc:ready", {
          roomId,
          offerer: state.offererUserId,
        });
        console.log(`[RTC] Emitted rtc:ready to room ${roomId}`);
      }, 500); // 500ms delay
    }
  });

  // relay offer/answer/candidate to the rest of the room
  socket.on(
    "rtc:offer",
    (payload: { roomId: string; sdp: RTCSessionDescriptionInit }) => {
      if (!payload?.roomId || !payload?.sdp) {
        console.warn("[RTC] rtc:offer missing roomId or sdp");
        return;
      }
      console.log(
        `[RTC] Relaying offer from ${socket.id} to room ${payload.roomId}`
      );
      socket.to(payload.roomId).emit("rtc:offer", payload);
    }
  );

  socket.on(
    "rtc:answer",
    (payload: { roomId: string; sdp: RTCSessionDescriptionInit }) => {
      if (!payload?.roomId || !payload?.sdp) {
        console.warn("[RTC] rtc:answer missing roomId or sdp");
        return;
      }
      console.log(
        `[RTC] Relaying answer from ${socket.id} to room ${payload.roomId}`
      );
      socket.to(payload.roomId).emit("rtc:answer", payload);
    }
  );

  socket.on(
    "rtc:candidate",
    (payload: { roomId: string; candidate: RTCIceCandidateInit }) => {
      if (!payload?.roomId || !payload?.candidate) {
        console.warn("[RTC] rtc:candidate missing roomId or candidate");
        return;
      }
      // Don't log every candidate to reduce noise
      socket.to(payload.roomId).emit("rtc:candidate", payload);
    }
  );

  socket.on("rtc:leave", ({ roomId }: { roomId: string }) => {
    if (!roomId) return;
    console.log(`[RTC] User ${socket.data.userId} leaving room ${roomId}`);
    socket.leave(roomId);
    socket.to(roomId).emit("rtc:peer-left");

    // Clean up room state
    const state = rooms.get(roomId);
    if (state) {
      state.members.delete(socket.id);
      if (socket.data.userId) state.users.delete(socket.data.userId);

      if (state.members.size === 0) {
        console.log(`[RTC] Room ${roomId} is empty, deleting`);
        rooms.delete(roomId);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`[RTC] Socket ${socket.id} disconnecting`);

    // prune from all rooms
    rooms.forEach((state, roomId) => {
      if (state.members.has(socket.id)) {
        console.log(`[RTC] Removing ${socket.id} from room ${roomId}`);
        state.members.delete(socket.id);
        if (socket.data.userId) state.users.delete(socket.data.userId);

        if (state.members.size === 0) {
          console.log(`[RTC] Room ${roomId} is empty, deleting`);
          rooms.delete(roomId);
        } else {
          socket.to(roomId).emit("rtc:peer-left");
        }
      }
    });
  });
}
