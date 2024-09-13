"use client";
import React, { useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { SocketContext } from "./SocketContext";

interface SocketProviderProps {
  children: ReactNode;
}

interface RoomSocketState {
  socket: Socket | null;
  isConnected: boolean;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [roomSockets, setRoomSockets] = useState<{
    [roomId: number]: RoomSocketState;
  }>({});

  // 특정 roomId에 대한 소켓 상태 가져오기
  const getRoomSocket = (roomId: number) => {
    return roomSockets[roomId] || { socket: null, isConnected: false };
  };

  // 소켓 연결 함수
  const connectSocket = (
    roomId: number,
    userInfo: { email: string; name: string; isOwner: boolean }
  ) => {
    if (!roomSockets[roomId]?.socket) {
      const newSocket = io("http://localhost:3002", {
        query: {
          email: userInfo.email,
          name: userInfo.name,
          isOwner: userInfo.isOwner,
        },
      });

      newSocket.on("connect", () => {
        setRoomSockets((prevState) => ({
          ...prevState,
          [roomId]: { socket: newSocket, isConnected: true },
        }));
      });

      newSocket.on("disconnect", () => {
        setRoomSockets((prevState) => ({
          ...prevState,
          [roomId]: { socket: null, isConnected: false },
        }));
      });

      newSocket.emit("join-room", roomId, userInfo);
    }
  };

  // 소켓 연결 해제 함수
  const disconnectSocket = (roomId: number) => {
    if (roomSockets[roomId]?.socket) {
      roomSockets[roomId].socket?.disconnect();
      setRoomSockets((prevState) => ({
        ...prevState,
        [roomId]: { socket: null, isConnected: false },
      }));
    }
  };

  return (
    <SocketContext.Provider
      value={{ getRoomSocket, connectSocket, disconnectSocket }}
    >
      {children}
    </SocketContext.Provider>
  );
};
