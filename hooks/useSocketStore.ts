import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { MessageData } from "@/types/types";
import { useUserInfoStore } from "./useUserInfoStore";

interface SocketState {
  roomSockets: {
    [roomId: number]: { socket: Socket | null; isConnected: boolean };
  };
  isOnAirStates: { [roomId: number]: boolean };
  heartbeatIntervals: { [roomId: number]: NodeJS.Timeout };
  connectSocket: (roomId: number, isOwner: boolean) => void;
  disconnectSocket: (roomId: number) => void;
  setIsOnAir: (roomId: number, isOnAir: boolean) => void;
  getIsOnAir: (roomId: number) => boolean;
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
  sendMessage: (
    roomId: number,
    message: string,
    userInfo: {
      email?: string;
      name?: string;
      isOwner?: boolean;
      timestamp: string;
    }
  ) => void;

  startHeartbeat: (roomId: number) => void;
  stopHeartbeat: (roomId: number) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  roomSockets: {},
  isOnAirStates: {},
  heartbeatIntervals: {},

  // 헬스 체크 중지
  stopHeartbeat: (roomId) => {
    const { heartbeatIntervals } = get();
    if (heartbeatIntervals[roomId]) {
      clearInterval(heartbeatIntervals[roomId]);
      delete heartbeatIntervals[roomId];
    }
  },

  connectSocket: (roomId, isOwner) => {
    const { roomSockets, disconnectSocket, startHeartbeat } = get();
    const currentUser = useUserInfoStore.getState().user;

    if (!currentUser) {
      console.error("사용자 정보가 없습니다.");
      return;
    }

    if (roomSockets[roomId]?.socket) {
      console.log(`방 ${roomId}에 대한 기존 소켓을 해제합니다.`);
      disconnectSocket(roomId);
    }

    console.log(`방 ${roomId}에 대한 소켓을 연결합니다. 사용자:`, currentUser);

    try {
      const newSocket = io("http://localhost:3002", {
        query: {
          email: currentUser.email,
          name: currentUser.name,
          isOwner: isOwner,
        },
      });

      newSocket.on("connect", () => {
        console.log(
          `방 ${roomId}에 대한 소켓이 연결되었습니다. 소켓 ID: ${newSocket.id}`
        );
        set((state) => ({
          roomSockets: {
            ...state.roomSockets,
            [roomId]: { socket: newSocket, isConnected: true },
          },
        }));
        newSocket.emit("join-room", roomId, {
          email: currentUser.email,
          name: currentUser.name,
          isOwner: isOwner,
        });

        // 방장인 경우 헬스 체크 시작
        if (isOwner) {
          startHeartbeat(roomId);
        }

        // room-status-changed 이벤트 리스너 등록
        newSocket.on("room-status-changed", (status) => {
          console.log(`방 ${roomId}의 상태 변경:`, status);
          get().setIsOnAir(roomId, status.isOnAir);
        });

        // 필요한 다른 이벤트 리스너를 여기에서 등록
      });

      newSocket.on("disconnect", () => {
        console.log(`방 ${roomId}에 대한 소켓이 해제되었습니다.`);
        set((state) => {
          const newRoomSockets = { ...state.roomSockets };
          delete newRoomSockets[roomId];
          const newIsOnAirStates = { ...state.isOnAirStates };
          delete newIsOnAirStates[roomId];
          return {
            roomSockets: newRoomSockets,
            isOnAirStates: newIsOnAirStates,
          };
        });

        // 방장인 경우 헬스 체크 중지
        if (isOwner && typeof stopHeartbeat === "function") {
          stopHeartbeat(roomId);
        }
      });
    } catch (error) {
      console.error(`방 ${roomId}에 대한 소켓 연결에 실패했습니다.`, error);
    }
  },

  disconnectSocket: (roomId) => {
    const { roomSockets, stopHeartbeat } = get();
    const socket = roomSockets[roomId]?.socket;

    if (socket) {
      console.log(`방 ${roomId}에 대한 소켓을 해제합니다.`);
      socket.removeAllListeners();
      socket.disconnect();

      set((state) => {
        const newRoomSockets = { ...state.roomSockets };
        delete newRoomSockets[roomId];
        const newIsOnAirStates = { ...state.isOnAirStates };
        delete newIsOnAirStates[roomId];
        return {
          roomSockets: newRoomSockets,
          isOnAirStates: newIsOnAirStates,
        };
      });

      // 헬스 체크 중지
      stopHeartbeat(roomId);
    } else {
      console.log(`방 ${roomId}에 대한 소켓이 없습니다.`);
    }
  },

  setIsOnAir: (roomId, isOnAir) => {
    set((state) => ({
      isOnAirStates: {
        ...state.isOnAirStates,
        [roomId]: isOnAir,
      },
    }));
  },

  getIsOnAir: (roomId) => {
    return get().isOnAirStates[roomId] || false;
  },

  broadcastDrawing: (roomId, updatedElements, isOwner) => {
    const { roomSockets } = get();
    const socket = roomSockets[roomId]?.socket;

    if (socket) {
      console.log(
        `방 ${roomId}에 그림을 브로드캐스트합니다. ${
          isOwner ? "방장" : "참가자"
        }`
      );
      socket.emit("server-broadcast", roomId, updatedElements, isOwner);
    } else {
      console.error(
        `방 ${roomId}에 대한 소켓이 없어 그림을 브로드캐스트할 수 없습니다.`
      );
    }
  },

  onRoomUserList: (roomId, callback) => {
    const { roomSockets } = get();
    const socket = roomSockets[roomId]?.socket;
    if (socket) {
      console.log("room-user-list 이벤트 리스너를 등록합니다...");
      socket.on("room-user-list", (users: any[]) => {
        console.log(`방 ${roomId}의 사용자 목록을 받았습니다:`, users);
        callback(users);
      });
    } else {
      console.error(
        `방 ${roomId}에 대한 소켓이 없어 사용자 목록을 받을 수 없습니다.`
      );
    }
  },

  onClientBroadcast: (roomId, callback) => {
    const { roomSockets } = get();
    const socket = roomSockets[roomId]?.socket;

    if (socket) {
      socket.on("client-broadcast", (updatedData) => {
        console.log(
          `방 ${roomId}에서 클라이언트 브로드캐스트를 받았습니다.`,
          updatedData
        );
        callback(updatedData.elements);
      });
    } else {
      console.error(
        `방 ${roomId}에 대한 소켓이 없어 클라이언트 브로드캐스트를 받을 수 없습니다.`
      );
    }
  },

  sendMessage: (roomId, message, userInfo) => {
    const { roomSockets } = get();
    const socket = roomSockets[roomId]?.socket;
    const currentUser = useUserInfoStore.getState().user;
    if (socket && currentUser) {
      console.log(`방 ${roomId}에 메시지를 보냅니다.`);
      socket.emit("send-message", roomId, message, {
        email: currentUser.email,
        name: currentUser.name,
      });
    } else {
      console.error(
        `방 ${roomId}에 대한 소켓이 없어 메시지를 보낼 수 없습니다.`
      );
    }
  },

  // 헬스 체크 시작
  startHeartbeat: (roomId) => {
    const { roomSockets, heartbeatIntervals } = get();
    const socket = roomSockets[roomId]?.socket;

    if (socket) {
      // 기존 타이머가 있으면 취소
      if (heartbeatIntervals[roomId]) {
        clearInterval(heartbeatIntervals[roomId]);
      }

      // 5초마다 헬스 체크 전송
      const interval = setInterval(() => {
        console.log(`방 ${roomId}에 헬스 체크를 보냅니다.`);
        socket.emit("owner-heartbeat", roomId);
      }, 5000);

      // 타이머 저장
      heartbeatIntervals[roomId] = interval;
    }
  },
}));
