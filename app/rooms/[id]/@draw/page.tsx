"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useUserInfoStore } from "@/hooks/useUserInfoStore";
import useCheckOwnership from "@/hooks/useCheckOwnership";
import { Excalidraw } from "@excalidraw/excalidraw";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import useRoomData from "@/hooks/useRoomData";
import { useSocketStore } from "@/hooks/useSocketStore";
import _ from "lodash";

export default function Draw() {
  const { id: roomId } = useParams();
  const currentUser = useUserInfoStore((state) => state.user);
  const isOwner = useCheckOwnership(currentUser?.email, Number(roomId));
  const [loading, setLoading] = useState(true);
  const [elements, setElements] = useState<any[]>([]);
  const [initialData, setInitialData] = useState<{ elements: any[] } | null>(
    null
  );
  const [hasChanged, setHasChanged] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const [viewModeEnabled, setViewModeEnabled] = useState(true);
  const [pendingElements, setPendingElements] = useState<any[] | null>(null); // 임시로 저장할 pending elements

  const roomData = useRoomData(Number(roomId));
  const { connectSocket, broadcastDrawing, onClientBroadcast, roomSockets } =
    useSocketStore();
  const socketState = roomSockets[Number(roomId)] || {
    socket: null,
    isConnected: false,
  };
  const { socket, isConnected } = socketState;
  const lastBroadcastRef = useRef<number>(Date.now());

  // 방장 여부에 따라 편집 모드 설정
  useEffect(() => {
    setViewModeEnabled(!isOwner);
  }, [isOwner]);

  // 소켓으로부터 받은 업데이트를 Excalidraw에 반영
  const handleReceiveUpdate = useCallback(
    (updatedElements) => {
      setElements(updatedElements);

      if (excalidrawAPI) {
        console.log("Updating Excalidraw scene with received elements");
        excalidrawAPI.updateScene({
          elements: updatedElements,
          appState: {}, // 필요 시 appState 추가
        });
      } else {
        console.log(
          "Excalidraw API not ready. Saving elements to apply later."
        );
        setPendingElements(updatedElements); // API 준비 전까지 임시 저장
      }
    },
    [excalidrawAPI]
  );

  // Excalidraw API가 설정되면 pending elements 적용
  useEffect(() => {
    if (excalidrawAPI && pendingElements) {
      console.log("Applying pending elements to Excalidraw");
      excalidrawAPI.updateScene({
        elements: pendingElements,
        appState: {}, // 필요 시 추가
      });
      setPendingElements(null); // 적용 후 초기화
    }
  }, [excalidrawAPI, pendingElements]);

  // 스토어의 소켓 이벤트 리스너 설정
  useEffect(() => {
    if (isConnected && socket) {
      console.log("Zustand 소켓 이벤트 리스너 등록 중");

      onClientBroadcast(Number(roomId), handleReceiveUpdate);

      return () => {
        console.log("컴포넌트 언마운트 시 소켓 리스너 해제");
      };
    }
  }, [socket, isConnected, roomId, onClientBroadcast, handleReceiveUpdate]);

  // 그림 변경시 handleChange
  const handleChange = useCallback(
    _.debounce(() => {
      if (excalidrawAPI) {
        const newElements = excalidrawAPI.getSceneElements() || [];
        const elementsChanged =
          JSON.stringify(newElements) !== JSON.stringify(elements);

        if (elementsChanged) {
          setHasChanged(true);
          setElements(newElements);

          if (isOwner && isConnected) {
            const now = Date.now();
            if (now - lastBroadcastRef.current >= 1000) {
              broadcastDrawing(Number(roomId), newElements, isOwner);
              console.log("broadcastDrawing 송신", isOwner);
              lastBroadcastRef.current = now;
            }
          }
        }
      }
    }, 300),
    [isOwner, roomId, broadcastDrawing, isConnected, elements, excalidrawAPI]
  );

  // 방 상태를 서버로부터 처음 한 번만 로드
  useEffect(() => {
    const loadRoomStateFromServer = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/rooms/${roomId}`);
        if (!response.ok)
          throw new Error(`Failed to fetch room state: ${response.statusText}`);
        const data = await response.json();
        const loadedElements = data.elements || [];
        setInitialData({ elements: loadedElements });
        setElements(loadedElements);
      } catch (error) {
        console.error("Error fetching room state:", error);
        setInitialData({ elements: [] });
        setElements([]);
      } finally {
        setLoading(false);
        console.log("Room state 로드 완료");
      }
    };

    if (roomId && !initialData) {
      loadRoomStateFromServer();
    }
  }, [roomId, initialData]);

  // 방 상태를 서버에 저장
  const saveRoomStateToServer = useCallback(async () => {
    if (hasChanged && isOwner) {
      console.log(`방 상태 저장 중: ${roomId}`);
      try {
        const payload = { elements };
        const response = await fetch(`/api/rooms/${roomId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok)
          throw new Error(
            `Failed to update room state: ${response.statusText}`
          );
        setHasChanged(false);
        setShowSavedMessage(true);
        setTimeout(() => setShowSavedMessage(false), 2000);
      } catch (error) {
        console.error("Error updating room state:", error);
      }
    }
  }, [roomId, hasChanged, elements, isOwner]);

  useEffect(() => {
    if (isOwner) {
      const interval = setInterval(() => {
        saveRoomStateToServer();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [saveRoomStateToServer, isOwner]);

  if (loading || !initialData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <Excalidraw
        onChange={handleChange}
        initialData={initialData}
        langCode="ko-KR"
        viewModeEnabled={viewModeEnabled}
        excalidrawAPI={(api: ExcalidrawImperativeAPI) => setExcalidrawAPI(api)}
      />
      {isOwner && (
        <button onClick={saveRoomStateToServer}>칠판 저장하기</button>
      )}
      {showSavedMessage && <div>저장되었습니다.</div>}
    </div>
  );
}
