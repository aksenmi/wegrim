import prisma from "@/lib/prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userEmail = searchParams.get("userEmail");
  const roomId = searchParams.get("roomId");

  if (!userEmail || !roomId) {
    return NextResponse.json(
      { error: "User email and room ID are required" },
      { status: 400 }
    );
  }

  try {
    // 유저 찾기
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 방장이 맞는지 확인
    const isOwner = await prisma.room.findFirst({
      where: { id: Number(roomId), user_id: user.id },
    });

    // 초대받은 방인지 확인
    const isInvited = await prisma.userRoom.findFirst({
      where: { room_id: Number(roomId), user_id: user.id },
    });

    if (isOwner || isInvited) {
      return NextResponse.json({ hasAccess: true });
    } else {
      return NextResponse.json({ hasAccess: false }, { status: 403 });
    }
  } catch (error) {
    console.error("Error checking room access:", error);
    return NextResponse.json(
      { error: "Error checking room access" },
      { status: 500 }
    );
  }
}
