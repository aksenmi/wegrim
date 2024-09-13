// 방 생성하기
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma/client";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userEmail, name, description } = body;

  if (!userEmail || !name) {
    return NextResponse.json(
      { error: "User email and room name are required" },
      { status: 400 }
    );
  }

  try {
    // 이메일로 유저 정보를 조회하여 ID를 얻음
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newRoom = await prisma.room.create({
      data: {
        user_id: user.id, // 유저의 ID를 사용하여 방 생성
        name,
        description,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      message: "Room created successfully",
      room: newRoom,
    });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json({ error: "Error creating room" }, { status: 500 });
  }
}
