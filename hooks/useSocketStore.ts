import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { MessageData, MessageDataWithDate } from "@/types/types";

interface UserInfo {
  email: string;
  name: string;
  isOwner: boolean;
}

interface SocketState {
  roomSockets: {
    [roomId: number]: { socket: Socket | null; isConnected: boolean };
  };
  connectSocket: (roomId: number, userInfo: UserInfo) => void;
  disconnectSocket: (roomId: number) => void;
  broadcastDrawing: (
    roomId: number,
    updatedElements: any[],
    isOwner: boolean
  ) => void;
  onRoomUserList: (roomId: number, callback: (users: any[]) => void) => void;
  onClientBroadcast: (
    roomId: number,
    callback: (updatedElements: any[]) => void
  ) => void;
  sendMessage: (roomId: number, message: string, userInfo: UserInfo) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  roomSockets: {},

  connectSocket: (roomId, userInfo) => {
    const { roomSockets, disconnectSocket } = get();

    // 기존 소켓이 존재하면 해제하고 정리
    if (roomSockets[roomId]?.socket) {
      console.log(
        `Existing socket found for room ${roomId}, disconnecting it.`
      );
      disconnectSocket(roomId);
    }

    console.log(
      `Attempting to connect socket for room: ${roomId} with user:`,
      userInfo
    );

    try {
      const newSocket = io("http://localhost:3002", {
        query: {
          email: userInfo.email,
          name: userInfo.name,
          isOwner: userInfo.isOwner,
        },
      });

      newSocket.on("connect", () => {
        console.log(
          `Socket connected for room: ${roomId}, Socket ID: ${newSocket.id}`
        );
        set((state) => ({
          roomSockets: {
            ...state.roomSockets,
            [roomId]: { socket: newSocket, isConnected: true },
          },
        }));
        newSocket.emit("join-room", roomId, userInfo);
      });

      newSocket.off("receive-message");
      newSocket.on("receive-message", (messageData) => {
        console.log("받은메시지", messageData);
        set((state) => ({
          roomSockets: {
            ...state.roomSockets,
            [roomId]: { ...state.roomSockets[roomId], messageData },
          },
        }));
      });

      newSocket.on("disconnect", () => {
        console.log(`Socket disconnected for room: ${roomId}`);
        set((state) => ({
          roomSockets: {
            ...state.roomSockets,
            [roomId]: { socket: null, isConnected: false },
          },
        }));
      });
    } catch (error) {
      console.error(`Failed to connect socket for room: ${roomId}`, error);
    }
  },

  disconnectSocket: (roomId) => {
    const { roomSockets } = get();
    const socket = roomSockets[roomId]?.socket;

    if (socket) {
      console.log(`Disconnecting socket for room: ${roomId}`);
      socket.removeAllListeners();
      socket.disconnect();

      set({
        roomSockets: {
          ...roomSockets,
          [roomId]: { socket: null, isConnected: false },
        },
      });
    } else {
      console.log(`No socket found for room: ${roomId}`);
    }
  },

  broadcastDrawing: (roomId, updatedElements, isOwner) => {
    const { roomSockets } = get();
    const socket = roomSockets[roomId]?.socket;

    if (socket) {
      console.log(
        `Broadcasting drawing to room ${roomId} by ${
          isOwner ? "Owner" : "Participant"
        }`
      );
      socket.emit("server-broadcast", roomId, updatedElements, isOwner);
    } else {
      console.error(
        `Cannot broadcast drawing. No socket found for room: ${roomId}`
      );
    }
  },

  onRoomUserList: (roomId, callback) => {
    const { roomSockets } = get();
    const socket = roomSockets[roomId]?.socket;
    if (socket) {
      console.log("리스트쪽 소켓잇니?", socket);
      socket.on("room-user-list", (users: any[]) => {
        console.log(`Received user list for room: ${roomId}`, users);
        callback(users);
      });
    } else {
      console.error(
        `No socket found for room: ${roomId} to listen for user list.`
      );
    }
  },

  onClientBroadcast: (roomId, callback) => {
    const { roomSockets } = get();
    const socket = roomSockets[roomId]?.socket;

    if (socket) {
      socket.on("client-broadcast", (updatedData) => {
        console.log(
          `Received client broadcast for room: ${roomId}`,
          updatedData
        );
        callback(updatedData.elements);
      });
    } else {
      console.error(
        `No socket found for room: ${roomId} to listen for client-broadcast.`
      );
    }
  },

  sendMessage: (roomId, message, userInfo) => {
    const { roomSockets } = get();
    const socket = roomSockets[roomId]?.socket;
    if (socket) {
      console.log(`Sending message to room: ${roomId}`);
      socket.emit("send-message", roomId, message, userInfo);
    } else {
      console.error(`No socket found for room: ${roomId} to send message.`);
    }
  },
}));
