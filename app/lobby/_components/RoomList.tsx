"use client";
import { useUserInfoStore } from "@/hooks/useUserInfoStore";
import { Room } from "@/types/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSocketStore } from "@/hooks/useSocketStore";

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
  const { id: roomId } = useParams();

  const { connectSocket, disconnectSocket, roomSockets } = useSocketStore();
  const socket = roomSockets[Number(roomId)]?.socket;

  useEffect(() => {
    if (roomId && user) {
      connectSocket(Number(roomId), user);

      if (socket) {
        socket.on("room-closed", (message) => {
          setError(message);
          router.push("/rooms");
        });
      }
    }

    return () => {
      if (roomId) {
        disconnectSocket(Number(roomId));
      }
    };
  }, [roomId, user, connectSocket, disconnectSocket, socket, router]);

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
        setMyRooms((prevRooms) =>
          prevRooms.filter((room) => room.id !== roomId)
        );
      } else {
        console.error("방 삭제 실패");
      }
    } catch (error) {
      console.error("방 삭제 중 오류:", error);
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
        setInvitedRooms((prevRooms) =>
          prevRooms.filter((room) => room.id !== roomId)
        );
      } else {
        console.error("초대받은 방 나가기 실패");
      }
    } catch (error) {
      console.error("초대받은 방 나가기 중 오류:", error);
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
          confirmInvitation: true,
        }),
      });

      if (response.ok) {
        setInvitedRooms((prevRooms) =>
          prevRooms.map((room) =>
            room.id === roomId ? { ...room, confirmed: true } : room
          )
        );
      } else {
        console.error("초대 수락 실패");
      }
    } catch (error) {
      console.error("초대 수락 중 오류:", error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col p-3 items-center w-full">
      <h2 className="text-lg font-semibold mb-4">생성한 방</h2>
      <div className="gap-4 mb-8 w-full">
        {myRooms.length === 0 ? (
          <div className="text-center"> 생성한 방이 없습니다!</div>
        ) : (
          myRooms.map((room) => (
            <Link key={room.id} href={`/rooms/${room.id}`}>
              <div className="bg-white border border-slate-200 rounded-md shadow-md p-4 mb-3 w-4/5 mx-auto">
                <h3 className="font-medium text-xl mb-2">{room.name}</h3>
                <p className="text-sm">{room.description}</p>
                <div className="flex">
                  <button
                    onClick={() => handleDeleteMYRoom(room.id)}
                    className="text-red-600 hover:text-red-800 ml-auto"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <h2 className="text-lg font-semibold mb-4">초대받은 방</h2>
      <div className="gap-4 w-full">
        {invitedRooms.length === 0 ? (
          <div className="text-center">초대받은 방이 없습니다!</div>
        ) : (
          invitedRooms.map((room) => (
            <div key={room.id}>
              <Link href={`/rooms/${room.id}`}>
                <div
                  className={`bg-white border-4 mb-3 rounded-md shadow-xl p-4 w-4/5 mx-auto ${
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
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RoomList;
