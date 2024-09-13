import React, { useState, useEffect } from "react";
import { useUserInfoStore } from "@/hooks/useUserInfoStore";
import { useRouter } from "next/navigation";
import useCheckOwnership from "@/hooks/useCheckOwnership";

interface OutModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: number;
  roomData: {};
}

const OutModal: React.FC<OutModalProps> = ({
  isOpen,
  onClose,
  roomId,
  roomData,
}) => {
  const currentUser = useUserInfoStore((state) => state.user);
  const router = useRouter();

  const isOwner = useCheckOwnership(currentUser?.email, roomId);

  const handleOutConfirm = async () => {
    // 방장 여부 상태를 이미 확인했으므로 바로 사용
    try {
      if (!currentUser?.email) {
        console.error("사용자 정보가 없습니다.");
        return;
      }

      if (isOwner) {
        // 방장일 경우, 방 삭제 API 호출
        const response = await fetch(
          `/api/rooms/my?roomId=${roomId}&userEmail=${encodeURIComponent(
            currentUser.email
          )}`,
          { method: "DELETE" }
        );

        if (response.ok) {
          console.log("방이 성공적으로 삭제되었습니다.");
          onClose();
          router.push("/lobby");
        } else {
          console.error("방 삭제 실패:", await response.text());
        }
      } else {
        // 일반 사용자인 경우, 나가기 API 호출
        const response = await fetch(
          `/api/rooms/invited?roomId=${roomId}&userEmail=${encodeURIComponent(
            currentUser.email
          )}`,
          { method: "DELETE" }
        );

        if (response.ok) {
          onClose();
          router.push("/lobby");
        } else {
          console.error("방에서 나가기 실패:", await response.text());
        }
      }
    } catch (error) {
      console.error("방 나가기 처리 중 오류 발생:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded">
        <h2 className="text-xl mb-2">방에서 나가기</h2>

        {isOwner ? (
          <p className="text-sm mb-2 ">방장이 나간다면 방은 삭제됩니다.</p>
        ) : (
          <p className="text-sm mb-2">방에서 나가시겠습니까?</p>
        )}

        <div className="flex justify-end mt-5">
          <button
            onClick={handleOutConfirm}
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            나가기
          </button>
          <button
            type="button"
            className="bg-gray-500 text-white px-4 py-2 rounded"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default OutModal;
