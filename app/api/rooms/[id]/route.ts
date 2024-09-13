import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { email, roomId } = await req.json();

    if (!email || !roomId) {
      return NextResponse.json(
        { error: "Email and Room ID are required" },
        { status: 400 }
      );
    }

    const numericRoomId = parseInt(roomId, 10); // roomId를 정수로 변환

    if (isNaN(numericRoomId)) {
      return NextResponse.json({ error: "Invalid Room ID" }, { status: 400 });
    }

    // 1. 이메일로 사용자를 찾기
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      console.error("User not found for email:", email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. UserRoom에 사용자가 이미 초대되었는지 확인 (복합 키 검색)
    const existingInvitation = await prisma.userRoom.findFirst({
      where: {
        user_id: user.id,
        room_id: numericRoomId, // 정수형 roomId 사용
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "해당 유저는 이미 참여중입니다." },
        { status: 409 }
      );
    }

    // 3. UserRoom에 사용자 추가 (초대)
    await prisma.userRoom.create({
      data: {
        user_id: user.id,
        room_id: numericRoomId,
        confirmed: false,
      },
    });

    return NextResponse.json({ message: "초대 요청을 보냈습니다." });
  } catch (error) {
    return NextResponse.json({ error: "Error inviting user" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl;
    const roomId = parseInt(pathname.split("/").pop() || "0", 10); // 동적 경로에서 roomId 추출
    const { userEmail, appState, elements } = await req.json();

    if (!roomId) {
      return NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 }
      );
    }

    // 초대 상태 업데이트 로직
    if (userEmail) {
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

      // user_room 테이블에서 confirmed 상태를 true로 업데이트
      await prisma.userRoom.update({
        where: {
          user_id_room_id: {
            user_id: user.id,
            room_id: roomId,
          },
        },
        data: {
          confirmed: true,
        },
      });

      return NextResponse.json({
        message: "Invitation confirmed successfully",
      });
    }

    if (appState !== undefined || elements !== undefined) {
      const updatedRoom = await prisma.room.update({
        where: { id: roomId },
        data: {
          appState: appState || undefined, // appState 업데이트
          elements: elements || undefined, // elements 업데이트
        },
      });

      return NextResponse.json(updatedRoom);
    }

    // 요청 데이터가 유효하지 않은 경우
    return NextResponse.json(
      { error: "Invalid request data" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Error processing request" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl;
    const roomId = parseInt(pathname.split("/").pop() || "0", 10); // 동적 경로에서 roomId 추출

    if (!roomId) {
      return NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 }
      );
    }

    // 방 정보 조회
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        user_id: true,
        name: true,
        description: true,
        appState: true,
        elements: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // 방 생성자 정보 가져오기
    const roomCreator = await prisma.user.findUnique({
      where: { id: room.user_id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar_url: true,
      },
    });

    if (!roomCreator) {
      return NextResponse.json(
        { error: "Room creator not found" },
        { status: 404 }
      );
    }

    // 해당 roomId의 유저 목록 및 총 유저 수 가져오기
    const usersInRoom = await prisma.userRoom.findMany({
      where: { room_id: roomId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
          },
        },
      },
    });

    // 참여자 목록에서 중복 제거: 방 생성자가 이미 참여자 목록에 있는지 확인
    const userIds = new Set(usersInRoom.map((userRoom) => userRoom.user.id));
    const allUsers = usersInRoom.map((userRoom) => userRoom.user);

    if (!userIds.has(roomCreator.id)) {
      allUsers.push(roomCreator); // 방 생성자가 목록에 없다면 추가
    }

    const userCount = allUsers.length;
    const userInfos = allUsers;

    // 방 정보와 유저 정보를 모두 포함하여 응답 반환
    return NextResponse.json({
      roomId: room.id,
      roomName: room.name,
      roomDescription: room.description,
      appState: room.appState,
      elements: room.elements,
      createdAt: room.created_at,
      updatedAt: room.updated_at,
      userCount, // 유저 수 추가
      userInfos, // 유저 정보 추가
    });
  } catch (error) {
    console.error("Error fetching room state:", error);
    return NextResponse.json(
      { error: "Error fetching room state" },
      { status: 500 }
    );
  }
}
