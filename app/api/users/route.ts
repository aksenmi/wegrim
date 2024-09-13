import { useUserInfoStore } from "@/hooks/useUserInfoStore";
import prisma from "@/lib/prisma/client";
import { User } from "@/types/user";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body: User = await req.json();
  const { name, email, avatar_url } = body;
  console.log(body);

  if (!name || !email) {
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 }
    );
  }

  try {
    // DB에 유저 정보가 존재하는지 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // 기존 유저 정보와 비교하여 변경사항이 있을 경우 업데이트
      const updatedData: any = {};
      if (existingUser.name !== name) {
        updatedData.name = name || "Unknown";
      }
      if (existingUser.avatar_url !== avatar_url) {
        updatedData.avatar_url = avatar_url || "";
      }

      // 업데이트할 데이터가 있을 경우
      if (Object.keys(updatedData).length > 0) {
        await prisma.user.update({
          where: { email },
          data: updatedData,
        });

        return NextResponse.json({ message: "User updated successfully" });
      } else {
        return NextResponse.json({ message: "No changes detected" });
      }
    } else {
      // 유저가 없다면 새롭게 생성
      await prisma.user.create({
        data: {
          email,
          name: name || "Unknown",
          avatar_url: avatar_url || "",
        },
      });
      return NextResponse.json({ message: "User created successfully" });
    }
  } catch (error) {
    console.error("Error handling user:", error);
    return NextResponse.json({ error: "Error handling user" }, { status: 500 });
  }
}
