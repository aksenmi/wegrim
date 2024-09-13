import { createContext } from "react";
import { Socket } from "socket.io-client";

// 이래서 주스탄트가 개편하노
// 소켓 Context 인터페이스 정의
interface ISocketContext {
  getRoomSocket: (roomId: number) => { socket?: Socket; isConnected: boolean };
  connectSocket: (
    roomId: number,
    userInfo: { email: string; name: string; isOwner: boolean }
  ) => void;
  disconnectSocket: (roomId: number) => void;
}

export const SocketContext = createContext<ISocketContext>({
  getRoomSocket: () => ({ socket: undefined, isConnected: false }),
  connectSocket: () => {}, // 빈 함수
  disconnectSocket: () => {}, // 빈 함수
});
