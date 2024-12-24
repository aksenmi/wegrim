"use client";

import React from "react";
import Participants from "./_components/Participants";

interface AuthLayoutProps {
  children: React.ReactNode;
  draw: React.ReactNode;
  chat: React.ReactNode;
  modal: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  draw,
  chat,
  modal,
}) => (
  <div className="flex h-screen m-2">
    <div className="flex flex-col w-full">
      <Participants />
      <div className="flex flex-grow">
        <div className="w-2/3">{draw}</div>
        <div className="w-1/3">{chat}</div>
      </div>
    </div>
    {children}
    {modal}
  </div>
);

export default AuthLayout;
