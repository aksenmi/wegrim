"use client";

import SignOut from "@/components/SignOut";
import useAuthStore from "@/hooks/useAuthStore";
import { useUserInfoStore } from "@/hooks/useUserInfoStore";

const mypage = () => {
  const user = useUserInfoStore((state) => state.user);
  console.log(user);
  const provider = useAuthStore((state) => state.provider);
  console.log(provider);
  return (
    <div className="flex justify-center h-screen items-center ">
      <div className="flex flex-col shadow-xl rounded-xl  bg-slate-200  h-[500px] w-[400px] items-center  overflow-y-auto ">
        <div className=" flex items-center justify-end w-full mr-10 mt-5 mb-5 gap-2 ">
          <SignOut />
        </div>

        <div className="grid grid-cols-2 gap-4 w-full px-10">
          <p>소셜 로그인</p>
          <div>
            {provider === "google" && (
              <img
                src="/google.svg"
                alt="google icon"
                className="inline-block w-4 h-4 mr-1"
              />
            )}
            <span>{provider || "알 수 없음"}</span>
          </div>

          <p>회원 아이디</p>
          <span>{user?.email}</span>
          <p>이름</p>
          <span>{user?.name}</span>
        </div>
      </div>
    </div>
  );
};

export default mypage;
