//초대 받은 방 목록 및 나가기
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

    // 내가 초대받은 방
    const invitedRooms = await prisma.userRoom.findMany({
      where: { user_id: user.id },
      include: {
        room: true,
      },
      orderBy: { room: { id: "desc" } }, // 방 ID 기준 내림차순 정렬
    });

    return NextResponse.json(
      invitedRooms.map((userRoom) => ({
        ...userRoom.room,
        confirmed: userRoom.confirmed,
      }))
    );
  } catch (error) {
    console.error("Error fetching invited rooms:", error);
    return NextResponse.json(
      { error: "Error fetching invited rooms" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  console.log("DELETE request received");
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

    // user_room 테이블에서 해당 유저와 방에 해당하는 레코드 찾기
    const userRoom = await prisma.userRoom.findFirst({
      where: {
        room_id: roomId,
        user_id: user.id,
      },
    });

    if (!userRoom) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // user_room 테이블에서 해당 레코드 삭제 (즉, 초대받은 방 삭제)
    await prisma.userRoom.delete({
      where: {
        user_id_room_id: {
          user_id: user.id,
          room_id: roomId,
        },
      },
    });

    return NextResponse.json({ message: "Invitation deleted successfully" });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return NextResponse.json(
      { error: "Error deleting invitation" },
      { status: 500 }
    );
  }
}
