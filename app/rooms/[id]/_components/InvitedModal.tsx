import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: number; // roomId를 상위 컴포넌트에서 prop으로 전달받음
}

interface FormValues {
  email: string;
}

const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  roomId,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const sendInvite = async (email: string, roomId: number) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, roomId }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message); // 성공 메시지 표시
      } else {
        alert(`Error: ${result.error}`); // 오류 메시지 표시
      }
    } catch (error) {
      alert("Failed to send invite. Please try again.");
    }
  };

  // 폼 제출 핸들러
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    await sendInvite(data.email, roomId); // API 호출
    onClose(); // 전송 후 모달 닫기
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded">
        <h2 className="text-xl mb-2">초대하기</h2>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <input
            type="email"
            placeholder="이메일을 입력하세요"
            {...register("email", {
              required: "이메일을 입력하세요.",
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                message: "유효한 이메일 주소를 입력하세요.",
              },
            })}
            className={`border p-2 w-full mb-2 ${
              errors.email ? "border-red-500" : ""
            }`}
          />

          {errors.email && (
            <p className="text-red-500 text-xs">{errors.email.message}</p>
          )}
          <div className="flex justify-end mt-5">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
            >
              전송
            </button>
            <button
              type="button"
              className="bg-gray-500 text-white px-4 py-2 rounded"
              onClick={onClose}
            >
              닫기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteModal;
