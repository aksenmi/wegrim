"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import InviteModal from "./InvitedModal";
import OutModal from "./OutModal"; // 나가기 모달 컴포넌트
import useRoomData from "@/hooks/useRoomData"; // 방 데이터 가져오는 커스텀 훅
import { useUserInfoStore } from "@/hooks/useUserInfoStore"; // 사용자 정보 관리 훅
import useCheckOwnership from "@/hooks/useCheckOwnership"; // 방장 여부 확인 훅
import { useSocketStore } from "@/hooks/useSocketStore"; // 소켓 상태 관리 훅
import { User } from "@prisma/client";

const Participants = () => {
  const { id: roomId } = useParams(); // roomId를 추출
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false); // 초대 모달 상태
  const [isOutModalOpen, setIsOutModalOpen] = useState(false); // 나가기 모달 상태
  const roomData = useRoomData(Number(roomId)); // 방 데이터를 가져옴
  const currentUser = useUserInfoStore((state) => state.user); // 현재 사용자 정보 가져오기
  const isOwner = useCheckOwnership(currentUser?.email, Number(roomId)); // 방장 여부 확인
  const [collaborators, setCollaborators] = useState<Map<string, User>>(
    new Map()
  ); // 접속자 목록 관리
  const [manualDisconnect, setManualDisconnect] = useState(false);
  const [error, setError] = useState<string | null>(null); // 에러 상태
  const router = useRouter();

  // 소켓 상태 및 연결 함수들
  const { roomSockets, connectSocket, disconnectSocket, onRoomUserList } =
    useSocketStore();

  const socketState = roomSockets[Number(roomId)] || {
    socket: null,
    isConnected: false,
  };
  const { isConnected, socket } = socketState;

  // 소켓 연결 상태 복원 없이 바로 소켓 연결
  useEffect(() => {
    if (currentUser && !isConnected && !manualDisconnect) {
      connectSocket(Number(roomId), {
        email: currentUser?.email,
        name: currentUser?.name,
        isOwner,
      });
    }
  }, [
    currentUser,
    roomId,
    isOwner,
    connectSocket,
    isConnected,
    manualDisconnect,
  ]);

  // room-user-list 이벤트 수신 및 상태 업데이트 함수
  const handleUserListUpdate = useCallback((users: User[]) => {
    const collaboratorsMap = new Map<string, User>();
    users.forEach((user) => {
      // 이메일을 기준으로 중복된 이메일을 덮어쓰기 (하나만 보여줌)
      if (!collaboratorsMap.has(user.email)) {
        collaboratorsMap.set(user.email, user);
      }
    });
    setCollaborators(collaboratorsMap);
  }, []);

  // 소켓 연결 시 room-user-list 이벤트 리스너 등록
  useEffect(() => {
    if (isConnected) {
      onRoomUserList(Number(roomId), handleUserListUpdate);

      return () => {
        if (socket) {
          socket.off("room-user-list", handleUserListUpdate);
        }
      };
    }
  }, [isConnected, roomId, onRoomUserList, socket, handleUserListUpdate]);

  // 소켓 연결 상태 토글 함수
  const handleToggleConnection = () => {
    if (isConnected) {
      disconnectSocket(Number(roomId));
      setCollaborators(new Map()); // 소켓 해제 시 협업자 목록 초기화
      setManualDisconnect(true);
    } else {
      connectSocket(Number(roomId), {
        email: currentUser?.email,
        name: currentUser?.name,
        isOwner,
      });
      setManualDisconnect(false);
    }
  };

  // 소켓 해제 시 알림 이벤트 처리
  useEffect(() => {
    if (isConnected && socket) {
      socket.on("room-disconnected", (message) => {
        setCollaborators(new Map()); // 협업자 목록 초기화
        alert(message); // "소켓이 해제되었습니다" 문구 표시
      });

      return () => {
        if (socket) {
          socket.off("room-disconnected");
        }
      };
    }
  }, [isConnected, socket]);

  // 방장이 나갔을 때 처리
  useEffect(() => {
    if (isConnected && socket) {
      socket.on("room-closed", (message) => {
        setError(message);
        setCollaborators(new Map()); // 접속자 목록 초기화
        alert("방장이 나갔습니다. 방이 닫힙니다.");
        disconnectSocket(Number(roomId)); // 소켓 연결 해제
        router.push("/rooms"); // 방 리스트로 리디렉션
      });

      return () => {
        socket.off("room-closed");
      };
    }
  }, [isConnected, socket, roomId, router, disconnectSocket]);

  // roomData가 아직 null일 때 로딩 상태 처리
  if (!roomData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading room data...</p>
      </div>
    );
  }

  return (
    <div className="text-center border-solid border-4 border-blue-400 rounded-full flex p-2 justify-between">
      <div className="flex gap-4 ml-10">
        {/* 사용자 정보 */}
        <div className="group relative">
          <div className="text-4xl mt-1">
            <img className="w-7" src="/user-fill.svg" alt="my-info" />
            <p className="text-xs mt-1">Iam</p>
          </div>

          <ul className="ml-2 hidden absolute group-hover:block bg-slate-400 text-white text-xs rounded py-1 px-2 top-full z-50">
            <p>{currentUser?.email}</p>
          </ul>
        </div>

        {/* 소켓 연결 버튼 */}
        <div className="group relative flex">
          {isOwner && (
            <button onClick={handleToggleConnection}>
              {isConnected ? "소켓 해제" : "소켓 연결"}
            </button>
          )}
          {isConnected && (
            <div className="text-4xl mt-1">
              <img
                className="w-7"
                src="/account-circle-fill.svg"
                alt="my-info"
              />
              <p className="text-xs mt-1">접속자({collaborators.size})</p>
            </div>
          )}

          <ul className="ml-2 hidden absolute group-hover:block bg-slate-400 text-white text-xs rounded py-1 px-2 z-50 left-full top-0">
            {Array.from(collaborators.values()).map((user) => (
              <li key={user.email}>
                <div className="flex justify-center">
                  {user.username} ({user.email})
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 방 정보 */}
      <div className="">
        <h1 className="text-xl">{roomData.roomName}</h1>
        <p>{roomData.roomDescription}</p>
      </div>

      {/* 초대 및 나가기 버튼 */}
      <div className="flex gap-4 mr-9">
        <div
          onClick={() => setIsInviteModalOpen(true)}
          className="cursor-pointer"
        >
          <img className="w-7 mt-1" src="/user-add-fill.svg" alt="invite" />
          <p className="text-xs mt-1">초대</p>
        </div>

        <InviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          roomId={roomId}
        />

        <div
          className="cursor-pointer ml-2"
          onClick={() => setIsOutModalOpen(true)}
        >
          <img className="w-7 mt-1" src="/exit-box.svg" alt="exit" />
          <p className="text-xs mt-1">나가기</p>
        </div>

        <OutModal
          isOpen={isOutModalOpen}
          onClose={() => setIsOutModalOpen(false)}
          roomId={roomId}
          roomData={roomData}
        />
      </div>
    </div>
  );
};

export default Participants;
