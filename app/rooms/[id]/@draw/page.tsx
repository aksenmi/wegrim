"use client";

import React, { useCallback, useContext, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useUserInfoStore } from "@/hooks/useUserInfoStore";
import useCheckOwnership from "@/hooks/useCheckOwnership";
import { Excalidraw } from "@excalidraw/excalidraw";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import useRoomData from "@/hooks/useRoomData";
import { useSocketStore } from "@/hooks/useSocketStore";
import { SocketContext } from "@/hooks/SocketContext";

export default function Draw() {
  const { id: roomId } = useParams();
  const currentUser = useUserInfoStore((state) => state.user);
  const isOwner = useCheckOwnership(currentUser?.email, Number(roomId));
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState(null);
  const [hasChanged, setHasChanged] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [viewModeEnabled, setViewModeEnabled] = useState(true);

  const roomData = useRoomData(Number(roomId));
  const users = roomData?.userInfos;

  const { socket, isConnected } = useContext(SocketContext); // Context API로 소켓 정보 가져오기

  useEffect(() => {
    // 상태 업데이트는 반드시 useEffect 내부에서 처리
    if (users && users.length > 0) {
      const newCollaborators = new Map();

      users.forEach((user) => {
        newCollaborators.set(user.id, {
          username: user.name,
          avatarUrl: user.avatar_url,
          email: user.email,
        });
      });
    }
  }, [users]);

  useEffect(() => {
    if (isOwner) {
      setViewModeEnabled(false);
    } else {
      setViewModeEnabled(true);
    }
  }, [isOwner]);

  // 소켓으로부터 받은 업데이트를 Excalidraw에 반영 (elements와 appState 함께 업데이트)
  const handleReceiveUpdate = useCallback(
    (updatedElements, updatedAppState) => {
      if (excalidrawAPI) {
        // API가 null이 아닐 때만 실행
        excalidrawAPI.updateScene({
          elements: updatedElements,
          appState: updatedAppState,
        });
      }
    },
    [excalidrawAPI]
  );

  // // 소켓 설정 및 데이터 수신 핸들러 연결
  // const socket = useSocket(roomId, currentUser, handleReceiveUpdate);

  // 소켓 이벤트 리스너 설정 (데이터 수신 시 업데이트 반영)
  useEffect(() => {
    if (isConnected && socket) {
      console.log("Socket is connected, setting up listeners...");
      socket.on("client-broadcast", (updatedData) => {
        handleReceiveUpdate(updatedData.elements, updatedData.appState);
      });
    }

    return () => {
      if (socket) {
        socket.off("client-broadcast");
      }
    };
  }, [socket, isConnected, handleReceiveUpdate]);

  const loadRoomStateFromServer = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/rooms/${roomId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch room state");
      }
      const data = await response.json();
      const collaborators = Array.isArray(data.appState?.collaborators)
        ? data.appState.collaborators
        : [];

      setInitialData({
        ...data,
        appState: {
          ...data.appState,
          collaborators,
        },
      });
    } catch (error) {
      console.error("Error fetching room state:", error);
      setInitialData({ elements: [], appState: {} });
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    loadRoomStateFromServer();
  }, [roomId, loadRoomStateFromServer]);

  // 그림이 변경될 때 소켓을 통해 서버로 브로드캐스트
  const handleChange = useCallback(
    (newElements, newAppState) => {
      setInitialData((prevData) => {
        const isElementsChanged =
          JSON.stringify(prevData.elements) !== JSON.stringify(newElements);
        const isAppStateChanged =
          JSON.stringify(prevData.appState) !== JSON.stringify(newAppState);

        if (!isElementsChanged && !isAppStateChanged) {
          return prevData;
        }

        setHasChanged(true);

        // 변경된 데이터를 소켓 서버로 브로드캐스트
        if (socket) {
          socket.emit("server-broadcast", roomId, {
            elements: newElements,
            appState: newAppState,
          });
        }

        return {
          ...prevData,
          elements: newElements,
          appState: newAppState,
        };
      });
    },
    [roomId, socket]
  );

  const saveRoomStateToServer = useCallback(async () => {
    if (hasChanged && initialData) {
      const dataToSave = {
        ...initialData,
        elements: initialData.elements,
        appState: {
          ...initialData.appState,
          viewModeEnabled: undefined,
        },
      };

      try {
        const response = await fetch(`/api/rooms/${roomId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSave),
        });

        if (!response.ok) {
          throw new Error("Failed to update room state");
        }

        console.log("Room state updated successfully");
        setHasChanged(false);
      } catch (error) {
        console.error("Error updating room state:", error);
      }
    }
  }, [roomId, initialData, hasChanged]);

  useEffect(() => {
    const interval = setInterval(() => {
      saveRoomStateToServer();
    }, 10000);

    return () => clearInterval(interval);
  }, [saveRoomStateToServer]);

  const handleSaveClick = () => {
    saveRoomStateToServer();
    setShowSavedMessage(true);

    setTimeout(() => {
      setShowSavedMessage(false);
    }, 2000);
  };

  if (loading || !initialData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="w-full h-screen">
        <Excalidraw
          onChange={handleChange}
          initialData={initialData}
          langCode="ko-KR"
          viewModeEnabled={viewModeEnabled}
          excalidrawAPI={(api: ExcalidrawImperativeAPI) =>
            setExcalidrawAPI(api)
          }
        />
        <button
          onClick={handleSaveClick}
          className="fixed bottom-4 left-4 bg-blue-500 text-white px-4 py-2 rounded z-50"
        >
          칠판 저장하기
        </button>
        {showSavedMessage && (
          <div className="absolute bottom-16 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-md transition-opacity duration-500 ease-in-out opacity-90">
            저장되었습니다.
          </div>
        )}
      </div>
    </div>
  );
}
