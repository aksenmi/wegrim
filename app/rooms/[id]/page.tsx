"use client";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import io from "socket.io-client";

const RoomPage = () => {
  const { id } = useParams(); // URL 파라미터에서 room ID를 가져옴

  useEffect(() => {
    const socketServerUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3002";

    // 소켓 서버에 연결
    const socket = io(socketServerUrl);
    console.log(socketServerUrl);

    // 연결 확인 로그
    socket.on("connect", () => {
      console.log("Connected to socket server:", socket.id);
    });

    // 방에 참가
    socket.emit("join-room", id);

    // 서버에서 초기화된 방에 대한 메시지를 받음
    socket.on("init-room", () => {
      console.log("Room initialized");
    });

    // 방에 새로운 사용자가 들어왔을 때
    socket.on("new-user", (socketId) => {
      console.log(`New user joined: ${socketId}`);
    });

    // 방의 사용자 목록이 변경되었을 때
    socket.on("room-user-change", (users) => {
      console.log("Room users updated:", users);
    });

    // 컴포넌트가 언마운트될 때 소켓 연결 해제
    return () => {
      socket.disconnect();
    };
  }, [id]);

  return <div></div>;
};

export default RoomPage;
