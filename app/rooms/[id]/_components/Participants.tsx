"use client";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import InviteModal from "./InvitedModal";
import OutModal from "./OutModal";
import useRoomData from "@/hooks/useRoomData";
import { useUserInfoStore } from "@/hooks/useUserInfoStore";
import useCheckOwnership from "@/hooks/useCheckOwnership";
import { useSocketStore } from "@/hooks/useSocketStore";
import MypageIcon from "@/components/MypageIcon";

const Participants = () => {
  const { id: roomId } = useParams();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isOutModalOpen, setIsOutModalOpen] = useState(false);
  const roomData = useRoomData(Number(roomId));
  const currentUser = useUserInfoStore((state) => state.user);
  const isOwner = useCheckOwnership(currentUser?.email, Number(roomId));
  const router = useRouter();
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const { roomSockets, connectSocket, disconnectSocket, getIsOnAir } =
    useSocketStore();
  const socketState = roomSockets[Number(roomId)] || {
    socket: null,
    isConnected: false,
  };
  const { isConnected } = socketState;

  // 소켓 연결 로직 수정
  useEffect(() => {
    if (currentUser && !isConnected && isOwner !== undefined) {
      // isOwner 값이 결정된 후에 소켓 연결
      connectSocket(Number(roomId), isOwner);
    }
    // 컴포넌트 언마운트 시 소켓 해제
    return () => {
      if (isConnected) {
        disconnectSocket(Number(roomId));
      }
    };
  }, [
    currentUser,
    roomId,
    isOwner,
    connectSocket,
    isConnected,
    disconnectSocket,
    pathname,
  ]);

  // isOnAir 상태 구독
  const isOnAir = getIsOnAir(Number(roomId));

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
      <div className="flex gap-4 ml-10 items-center">
        {/* 사용자 정보 */}
        <div className="group relative">
          <MypageIcon clickable={false} />
          <ul className="ml-2 hidden absolute group-hover:block bg-slate-400 text-white text-xs rounded py-1 px-2 top-full z-50">
            <p>{currentUser?.email}</p>
          </ul>
        </div>

        {/* On Air 표시 */}
        <div className="flex items-center ml-4">
          {isOnAir ? (
            <div className="flex items-center">
              <div className="animate-pulse bg-green-500 w-3 h-3 rounded-full mr-2"></div>
              <p className="text-green-500 font-bold">On Air</p>
            </div>
          ) : (
            <div className="flex items-center">
              <div className="bg-gray-400 w-3 h-3 rounded-full mr-2"></div>
              <p className="text-gray-500">Off Air</p>
            </div>
          )}
        </div>
      </div>

      {/* 방 정보 */}
      <div className="flex flex-col items-center">
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
          isOwner={isOwner}
        />
      </div>
    </div>
  );
};

export default Participants;
