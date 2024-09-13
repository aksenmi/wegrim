"use client";
import { useParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import InviteModal from "./InvitedModal";
import OutModal from "./OutModal";
import useRoomData from "@/hooks/useRoomData";
import { useUserInfoStore } from "@/hooks/useUserInfoStore";
import { SocketContext } from "@/hooks/SocketContext";
import useCheckOwnership from "@/hooks/useCheckOwnership";

const Participants = () => {
  const { id: roomId } = useParams(); // roomId로 변수 변경
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isOutModalOpen, setIsOutModalOpen] = useState(false);
  const roomData = useRoomData(Number(roomId));
  const currentUser = useUserInfoStore((state) => state.user);
  const [collaborators, setCollaborators] = useState(new Map());
  const isOwner = useCheckOwnership(currentUser?.email, Number(roomId));
  const { getRoomSocket, connectSocket, disconnectSocket } =
    useContext(SocketContext);

  const { socket, isConnected } = getRoomSocket(Number(roomId));

  const handleToggleConnection = () => {
    if (isConnected) {
      disconnectSocket(Number(roomId));
    } else {
      connectSocket(Number(roomId), {
        email: currentUser?.email,
        name: currentUser?.name,
        isOwner: isOwner,
      });
    }
  };

  // 방장이 소켓을 연결했을 때 이벤트 수신
  useEffect(() => {
    if (socket) {
      socket.on("owner-connected", () => {
        connectSocket(Number(roomId), {
          email: currentUser?.email,
          name: currentUser?.name,
          isOwner: false, // 참여자는 isOwner가 false
        });
      });
    }

    return () => {
      if (socket) {
        socket.off("owner-connected");
      }
    };
  }, [socket, currentUser, roomId, connectSocket]);

  // 소켓을 통해 실시간으로 접속자 리스트를 업데이트
  useEffect(() => {
    if (socket) {
      socket.on("room-user-list", (userList) => {
        const newCollaborators = new Map(
          userList.map((user) => [user.id, user])
        );
        setCollaborators(newCollaborators);
      });
    }

    return () => {
      if (socket) {
        socket.off("room-user-list");
      }
    };
  }, [socket]);

  useEffect(() => {
    console.log("Updated collaborators:", collaborators);
    console.log("isOwner", isOwner);
  }, [collaborators, isOwner]);

  // 방장이 소켓을 연결할 때 새로 들어온 참여자들도 자동으로 소켓 연결
  useEffect(() => {
    if (socket) {
      socket.on("new-participant", (newUser) => {
        setCollaborators((prevCollaborators) => {
          const updatedCollaborators = new Map(prevCollaborators);
          updatedCollaborators.set(newUser.id, newUser);
          return updatedCollaborators;
        });
      });
    }

    return () => {
      if (socket) {
        socket.off("new-participant");
      }
    };
  }, [socket]);

  const handleOpenInviteClick = () => {
    setIsInviteModalOpen(true);
  };

  const handleOpenOutClick = () => {
    setIsOutModalOpen(true);
  };

  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false);
  };

  const handleCloseOutModal = () => {
    setIsOutModalOpen(false);
  };

  if (!roomData) return <p>Loading...</p>;

  return (
    <div className="text-center border-solid border-4 border-blue-400 rounded-full flex p-2 justify-between">
      <div className="flex gap-4 ml-10">
        <div className="group relative ">
          <div className="text-4xl mt-1">
            <img className="w-7" src="/user-fill.svg" alt="my-info" />
            <p className="text-xs mt-1">Iam</p>
          </div>

          <ul className="ml-2 hidden absolute group-hover:block bg-slate-400 text-white text-xs rounded py-1 px-2 top-full z-50">
            <p>{currentUser?.email}</p>
          </ul>
        </div>
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

          <ul className="ml-2 hidden absolute group-hover:block bg-slate-400 text-white text-xs rounded py-1 px-2 z-50 left-full top-0 ">
            {Array.from(collaborators.values()).map((user, index) => (
              <li key={index}>
                <div className="flex justify-center">
                  <img
                    src={user.avatarUrl}
                    alt={`${user.username}'s avatar`}
                    className="w-4 h-4 rounded-full mr-1"
                  />
                  {user.username}{" "}
                </div>
                ({user.email})
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="">
        <h1 className="text-xl">{roomData.roomName}</h1>
        <p>{roomData.roomDescription}</p>
      </div>
      <div className="flex gap-4 mr-9">
        <div onClick={handleOpenInviteClick} className="cursor-pointer">
          <img className="w-7 mt-1 " src="/user-add-fill.svg" alt="invite" />
          <p className="text-xs mt-1">초대</p>
        </div>

        <InviteModal
          isOpen={isInviteModalOpen}
          onClose={handleCloseInviteModal}
          roomId={roomId} // roomId로 변경
        />
        <div className="group relative ">
          <div className="text-4xl">
            <img className="w-8" src="/team-fill.svg" alt="participant" />
            <p className="text-xs mt-1">참여자({roomData.userCount})</p>
          </div>

          <ul className="ml-2 hidden absolute group-hover:block bg-slate-400 text-white text-xs rounded py-1 px-2 right-full top-0 ">
            {roomData.userInfos?.map((user) => (
              <li key={user.id}>
                {user.name} ({user.email})
              </li>
            ))}
          </ul>
        </div>

        <div className="cursor-pointer ml-2" onClick={handleOpenOutClick}>
          {" "}
          <img className="w-7 mt-1 " src="/exit-box.svg" alt="exit" />
          <p className="text-xs mt-1">나가기</p>
        </div>
        <OutModal
          isOpen={isOutModalOpen}
          onClose={handleCloseOutModal}
          roomId={roomId} // roomId로 변경
          roomData={roomData}
        />
      </div>
    </div>
  );
};

export default Participants;
