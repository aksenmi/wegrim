"use client";

import React, { useState } from "react";

import Participants from "./_components/Participants";
import { useSearchParams } from "next/navigation";

export default function AuthLayout({
  children,
  draw,
  chat,
  modal,
}: {
  children: React.ReactNode;
  draw: React.ReactNode;
  chat: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <div className="flex h-screen m-2">
      <div className="flex flex-col w-full ">
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
}
