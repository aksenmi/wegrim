import AuthUI from "@/components/AuthUl";
import Title from "@/components/Title";
import React from "react";
import "../globals.css";

const page = async () => {
  return (
    <div className="flex justify-center bg-slate-200 h-screen items-center">
      <div className="flex flex-col shadow-xl rounded-xl  bg-white w-1/3 h-[500px] items-center">
        <div className="flex flex-col flex-grow items-center justify-center">
          <Title />
          <h2 className="mt-20 ">
            동시접속이 가능한 원격 칠판을 이용해보세요!
          </h2>
        </div>

        <AuthUI />
      </div>
    </div>
  );
};

export default page;
