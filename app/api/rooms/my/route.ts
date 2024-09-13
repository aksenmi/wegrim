//내가 생성한 방 목록 및 삭제
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get("userEmail");

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const rooms = await prisma.room.findMany({
      where: { user_id: user.id },
      orderBy: { id: "desc" }, // 방 ID 기준 내림차순 정렬
    });
    console.log("방장인 방 목록:", rooms);

    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { error: "Error fetching rooms" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = parseInt(searchParams.get("roomId") || "0", 10);
    const userEmail = searchParams.get("userEmail");

    if (!roomId || !userEmail) {
      return NextResponse.json(
        { error: "Room ID and user email are required" },
        { status: 400 }
      );
    }

    // 유저를 이메일로 검색
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 방이 유저가 생성한 방인지 확인
    const room = await prisma.room.findFirst({
      where: { id: roomId, user_id: user.id },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found or you are not the owner" },
        { status: 404 }
      );
    }

    // 방 삭제
    await prisma.room.delete({
      where: { id: roomId },
    });

    return NextResponse.json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Error deleting room:", error);
    return NextResponse.json({ error: "Error deleting room" }, { status: 500 });
  }
}
