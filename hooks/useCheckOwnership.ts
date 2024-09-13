//방장여부확인
import { useState, useEffect } from "react";

const useCheckOwnership = (userEmail: string | undefined, roomId: number) => {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const checkOwnership = async () => {
      if (userEmail) {
        try {
          const checkOwnerResponse = await fetch(
            `/api/rooms/my?userEmail=${encodeURIComponent(userEmail)}`
          );

          if (checkOwnerResponse.ok) {
            const ownedRooms = await checkOwnerResponse.json();
            const userIsOwner = ownedRooms.some(
              (room: any) => room.id === roomId
            );
            setIsOwner(userIsOwner); // 방장 여부 상태 업데이트
          }
        } catch (error) {
          console.error("방장 여부 확인 중 오류 발생:", error);
        }
      }
    };

    checkOwnership();
  }, [userEmail, roomId]);

  return isOwner;
};

export default useCheckOwnership;
