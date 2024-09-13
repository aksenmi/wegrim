//방 데이터

import { useEffect, useState } from "react";

const useRoomData = (roomId: number) => {
  const [roomData, setRoomData] = useState(null);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}`);
        const data = await response.json();
        if (response.ok) {
          setRoomData(data);
        } else {
          console.error("Failed to fetch room data:", data.error);
        }
      } catch (error) {
        console.error("Error fetching room data:", error);
      }
    };

    if (roomId) {
      fetchRoomData();
    }
  }, [roomId]);

  return roomData;
};

export default useRoomData;
