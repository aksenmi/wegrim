"use client";
import { useParams } from "next/navigation";
import { useSocketStore } from "@/hooks/useSocketStore";
import { useUserInfoStore } from "@/hooks/useUserInfoStore";
import useCheckOwnership from "@/hooks/useCheckOwnership";
import { useEffect, useState, useRef, useCallback } from "react";
import { MessageData, MessageDataWithDate } from "@/types/types";
import dayjs from "dayjs"; // 시간 형식을 위해 dayjs를 사용할 수 있습니다.

export default function Chat() {
  const { id: roomId } = useParams(); // roomId를 추출
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<MessageDataWithDate[]>([]);
  const currentUser = useUserInfoStore((state) => state.user);
  const isOwner = useCheckOwnership(currentUser?.email, Number(roomId));

  const { roomSockets, sendMessage } = useSocketStore();
  const socketState = roomSockets[Number(roomId)] || {
    socket: null,
    isConnected: false,
  };
  const { isConnected, socket } = socketState; // 소켓과 연결 상태를 가져옴
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 메시지 전송 함수
  const handleSendMessage = () => {
    if (message.trim() && currentUser) {
      const timestamp = new Date().toISOString();
      sendMessage(Number(roomId), message, {
        email: currentUser?.email,
        name: currentUser?.name,
        isOwner: isOwner,
        timestamp, // 메시지 전송 시 타임스탬프 추가
      });
      setMessage("");
    }
  };

  // 메시지 수신 및 UI 업데이트
  const handleReceivedMessage = useCallback(
    (messageData: MessageDataWithDate) => {
      setChatMessages((prev) => [...prev, messageData]);
    },
    []
  );

  useEffect(() => {
    if (isConnected && socket) {
      socket.off("receive-message", handleReceivedMessage);
      socket.on("receive-message", handleReceivedMessage);

      return () => {
        socket.off("receive-message", handleReceivedMessage);
      };
    }
  }, [isConnected, socket, handleReceivedMessage]);

  // 메시지 전송 시 스크롤을 맨 아래로 이동
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  // 시간 중복을 제거하는 함수
  const shouldDisplayTimestamp = (current: string, previous?: string) => {
    if (!previous) return true;
    const currentTime = dayjs(current).format("YYYY-MM-DD HH:mm");
    const previousTime = dayjs(previous).format("YYYY-MM-DD HH:mm");
    return currentTime !== previousTime;
  };

  return (
    <div className="flex flex-col h-screen rounded-md border-4 border-blue-300 p-4">
      <div className="flex-grow overflow-y-auto mb-4">
        {chatMessages.map((msg, index) => {
          const showTimestamp =
            index === 0 ||
            shouldDisplayTimestamp(
              msg.timestamp,
              chatMessages[index - 1]?.timestamp
            );
          return (
            <div
              key={index}
              className={`mb-2 flex ${
                msg.user === currentUser?.name ? "justify-end" : "justify-start"
              }`}
            >
              <div className="flex flex-col">
                <div
                  className={`p-2 rounded-lg ${
                    msg.user === currentUser?.name
                      ? "bg-blue-300 text-white"
                      : "bg-gray-200 text-black"
                  }`}
                >
                  <strong>{msg.user}:</strong> {msg.message}
                </div>
                {showTimestamp && (
                  <em className="text-gray-500 text-sm mt-1 text-center">
                    {dayjs(msg.timestamp).format("YYYY-MM-DD HH:mm")}
                  </em>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyUp={handleKeyUp}
          placeholder="메시지를 입력하세요..."
          className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-300"
        />
        <button
          type="button"
          onClick={handleSendMessage}
          className="ml-2 px-4 py-2 bg-slate-300 text-white rounded-md hover:bg-blue-300"
        >
          보내기
        </button>
      </div>
    </div>
  );
}
