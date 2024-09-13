import React, { useState } from "react";
import { useUserInfoStore } from "@/hooks/useUserInfoStore";
import { Room } from "@/types/types";

const AddRoom = ({ fetchMyRooms }: { fetchMyRooms: () => void }) => {
  const [roomName, setRoomName] = useState("");
  const [description, setDescription] = useState("");
  const user = useUserInfoStore((state) => state.user);

  const handleRoomNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomName(e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user || !user.email) {
      alert("User not found. Please log in again.");
      return;
    }

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: roomName,
          description,
          userEmail: user.email,
        }),
      });

      if (!response.ok) {
        console.error("Failed to create room");
      } else {
        console.log("Room created successfully");
        fetchMyRooms();
        setRoomName("");
        setDescription("");
      }
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  return (
    <div className="border rounded-lg p-3 w-4/5 shadow-xl mb-5">
      <h2 className="text-lg font-semibold mb-2">방을 생성해 보세요!</h2>
      <form onSubmit={handleSubmit} className="">
        <div className="mb-3">
          <label htmlFor="roomName" className="block text-sm font-medium mb-1">
            방 제목
          </label>
          <input
            id="roomName"
            type="text"
            value={roomName}
            onChange={handleRoomNameChange}
            required
            className="border rounded px-2 py-1 w-full"
          />
        </div>
        <div className="mb-3">
          <label
            htmlFor="description"
            className="block text-sm font-medium mb-1"
          >
            간단한 설명
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={handleDescriptionChange}
            className="border rounded px-2 py-1 w-full"
          />
        </div>
        <div className="flex justify-center">
          <button
            type="submit"
            className="bg-blue-500 text-white rounded px-4 py-2 w-4/5 justify-center"
          >
            만들기
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRoom;
