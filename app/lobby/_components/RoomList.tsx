"use client";
import { SocketContext } from "@/hooks/SocketContext";
import { useUserInfoStore } from "@/hooks/useUserInfoStore";
import { Room } from "@/types/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";

const RoomList = ({
  myRooms,
  invitedRooms,
  setMyRooms,
  setInvitedRooms,
  loading,
}: {
  myRooms: Room[];
  setMyRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  invitedRooms: Room[];
  setInvitedRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  loading: boolean;
}) => {
  const user = useUserInfoStore((state) => state.user);
  const router = useRouter();
  const [error, setError] = useState("");
  const { socket, connectSocket } = useContext(SocketContext);
  const { id } = useParams(); // 현재 방 ID 가져오기

  // 소켓 연결 및 방장 상태 체크
  useEffect(() => {
    if (id) {
      // 현재 방에 소켓 연결 시도
      connectSocket({ roomId: id });

      if (socket) {
        socket.on("room-closed", (message) => {
          setError(message);
          router.push("/rooms"); // 방장이 접속하지 않으면 방 리스트로 리디렉션
        });
      }
    }

    return () => {
      if (socket) {
        socket.off("room-closed");
      }
    };
  }, [socket, id, connectSocket, router]);

  if (error) {
    return <div>{error}</div>;
  }

  const handleDeleteMYRoom = async (roomId: number) => {
    if (!user || !user.email) return;

    try {
      const response = await fetch(
        `/api/rooms/my?roomId=${roomId}&userEmail=${encodeURIComponent(
          user.email
        )}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        // 방 삭제 성공 시 목록에서 해당 방 제거
        setMyRooms((prevRooms) =>
          prevRooms.filter((room) => room.id !== roomId)
        );
      } else {
        console.error("Failed to delete room");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  };

  const handleOutInvitedRoom = async (roomId: number) => {
    if (!user || !user.email) return;

    try {
      const response = await fetch(
        `/api/rooms/invited?roomId=${roomId}&userEmail=${encodeURIComponent(
          user.email
        )}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        // 초대받은 방 삭제 성공 시 목록에서 해당 방 제거
        setInvitedRooms((prevRooms) =>
          prevRooms.filter((room) => room.id !== roomId)
        );
      } else {
        console.error("Failed to delete invited room");
      }
    } catch (error) {
      console.error("Error deleting invited room:", error);
    }
  };

  const handleConfirmInvitation = async (roomId: number) => {
    if (!user || !user.email) return;

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail: user.email,
          confirmInvitation: true, // 초대 수락 플래그
        }),
      });

      if (response.ok) {
        // 초대 확인 성공 시 목록에서 해당 방 상태 업데이트
        setInvitedRooms((prevRooms) =>
          prevRooms.map((room) =>
            room.id === roomId ? { ...room, confirmed: true } : room
          )
        );
      } else {
        console.error("Failed to confirm invitation");
      }
    } catch (error) {
      console.error("Error confirming invitation:", error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col p-3 items-center w-full ">
      <h2 className="text-lg font-semibold mb-4">내가 생성한 방</h2>
      <div className="gap-4 mb-8 w-4/5">
        {myRooms.length === 0 ? (
          <div className="text-center">내가 생성한 방이 없습니다!</div>
        ) : (
          myRooms.map((room) => (
            <Link key={room.id} href={`/rooms/${room.id}`}>
              <div className="bg-white border border-slate-200 rounded-md shadow-md p-4 mb-3 ">
                <h3 className="font-medium text-xl mb-2">{room.name}</h3>
                <p className="text-sm">{room.description}</p>
                <div className="flex">
                  <button
                    onClick={() => handleDeleteMYRoom(room.id)}
                    className="text-red-600 hover:text-red-800 ml-auto "
                  >
                    삭제
                  </button>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <h2 className="text-lg font-semibold mb-4">내가 초대받은 방</h2>
      <div className="gap-4 w-4/5">
        {invitedRooms.length === 0 ? (
          <div className="text-center">초대받은 방이 없습니다!</div>
        ) : (
          invitedRooms.map((room) => (
            <div key={room.id}>
              {room.isOwnerConnected ? (
                <Link href={`/rooms/${room.id}`}>
                  <div
                    className={`bg-white border-4 mb-3 rounded-md shadow-xl p-4 w-4/5${
                      room.confirmed ? "border-blue-500" : "border-gray-300"
                    }`}
                  >
                    <h3 className="font-medium text-xl mb-2">{room.name}</h3>
                    <p className="text-sm">{room.description}</p>

                    {!room.confirmed && (
                      <div className="flex">
                        <button
                          onClick={() => handleConfirmInvitation(room.id)}
                          className="text-blue-600 hover:text-blue-800 ml-auto"
                        >
                          초대 수락하기
                        </button>
                      </div>
                    )}
                    {room.confirmed && (
                      <div className="flex">
                        <button
                          onClick={() => handleOutInvitedRoom(room.id)}
                          className="text-red-600 hover:text-red-800 ml-auto"
                        >
                          나가기
                        </button>
                      </div>
                    )}
                  </div>
                </Link>
              ) : (
                <div className="bg-gray-200 border border-slate-200 rounded-md shadow-md p-4 mb-3 cursor-not-allowed opacity-60">
                  <h3 className="font-medium text-xl mb-2 text-gray-500">
                    {room.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    방장이 접속하지 않았습니다.
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RoomList;
