const debug = require("debug");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");

require("dotenv").config({
  path:
    process.env.NODE_ENV === "development"
      ? ".env.development"
      : ".env.production",
});

const serverDebug = debug("server");
const ioDebug = debug("io");
const socketDebug = debug("socket");

const app = express();
const port =
  process.env.PORT || (process.env.NODE_ENV == "development" ? 3002 : 80); // default port to listen

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Excalidraw collaboration server is up :)");
});

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`listening on port: ${port}`);
  serverDebug(`listening on port: ${port}`);
});

try {
  const io = new Server(server, {
    transports: ["websocket", "polling"],
    cors: {
      allowedHeaders: ["Content-Type", "Authorization"],
      origin: process.env.CORS_ORIGIN || "*",
      credentials: true,
    },
    allowEIO3: true,
  });

  let roomOwners = {}; // 각 방의 방장 상태를 저장

  io.on("connection", (socket) => {
    console.log("New connection:", socket.id);

    socket.on("join-room", async (roomID, userInfo) => {
      console.log(
        `join-room 이벤트 발생: roomID=${roomID}, userInfo=`,
        userInfo
      );
      userInfo = userInfo || {}; // userInfo가 undefined일 경우를 대비

      const isOwner = userInfo.isOwner || false; // 방장 여부 기본값 설정
      socket.join(roomID);
      console.log("isOwner 값 확인:", isOwner);

      // 방장일 경우 상태 저장
      if (userInfo.isOwner) {
        roomOwners[roomID] = true;
        console.log(`Room ${roomID} owner connected.`);
        socket.broadcast.to(roomID).emit("owner-connected");
        console.log("owner-connected", "됐니?");
      }

      // 방장이 접속하지 않았으면 참여자에게 입장 불가 알림을 보냄
      if (!roomOwners[roomID] && !userInfo.isOwner) {
        socket.emit("room-closed", "방장이 아직 접속하지 않았습니다.");
        socket.leave(roomID); // 방을 떠나게 처리
        return;
      }

      // 방에 있는 소켓들의 유저 정보
      const usersInRoom = await io.in(roomID).fetchSockets();

      console.log(usersInRoom);

      // 이메일과 이름을 포함한 유저 목록을 만듦
      const userList = usersInRoom.map((userSocket) => ({
        id: userSocket.id,
        email: userSocket.handshake.query.email, // 소켓 연결 시 전달된 이메일
        name: userSocket.handshake.query.name, // 소켓 연결 시 전달된 이름
      }));

      if (usersInRoom.length === 0) {
        console.log(`No users in room ${roomID}`);
      }

      // 방장도 자신을 참여자 목록에 포함
      if (isOwner) {
        userList.push({
          id: socket.id,
          email: userInfo.email,
          name: userInfo.name,
        });
      }
      console.log("유저리스트", userList);

      // 해당 방에 있는 모든 클라이언트들에게 유저 리스트를 전송
      io.to(roomID).emit("room-user-list", userList);
    });

    socket.on(
      "server-broadcast",
      (roomID, updatedElements, updatedAppState) => {
        socket.broadcast.to(roomID).emit("client-broadcast", {
          elements: updatedElements,
          appState: updatedAppState,
        });
      }
    );

    socket.on("disconnect", async () => {
      const rooms = Array.from(socket.rooms);
      for (const roomID of rooms) {
        if (roomOwners[roomID] && socket.handshake.query.isOwner) {
          delete roomOwners[roomID]; // 방장이 나갔을 때 상태 제거
          console.log(`Room ${roomID} owner disconnected.`);
        }
        const usersInRoom = await io.in(roomID).fetchSockets();
        const userList = usersInRoom.map((userSocket) => ({
          id: userSocket.id,
          email: userSocket.handshake.query.email,
          name: userSocket.handshake.query.name,
        }));
        io.to(roomID).emit("room-user-list", userList);
      }
    });
  });

  // const io = new Server(server, {
  //   transports: ["websocket", "polling"],
  //   cors: {
  //     allowedHeaders: ["Content-Type", "Authorization"],
  //     origin: process.env.CORS_ORIGIN || "*",
  //     credentials: true,
  //   },
  //   allowEIO3: true,
  // });

  // console.log("소켓 서버 초기화 완료!");

  // io.on("connection", (socket) => {
  //   console.log("New socket connection:", socket.id);
  //   ioDebug("connection established!");
  //   io.to(`${socket.id}`).emit("init-room");
  //   console.log("New socket connection:", socket.id);

  //   socket.on("join-room", async (roomID) => {
  //     socketDebug(`${socket.id} has joined ${roomID}`);
  //     await socket.join(roomID);
  //     const sockets = await io.in(roomID).fetchSockets();
  //     if (sockets.length <= 1) {
  //       io.to(`${socket.id}`).emit("first-in-room");
  //     } else {
  //       socketDebug(`${socket.id} new-user emitted to room ${roomID}`);
  //       socket.broadcast.to(roomID).emit("new-user", socket.id);
  //     }

  //     io.in(roomID).emit(
  //       "room-user-change",
  //       sockets.map((socket) => socket.id)
  //     );
  //   });

  //   socket.on("server-broadcast", (roomID, encryptedData, iv) => {
  //     socketDebug(`${socket.id} sends update to ${roomID}`);
  //     socket.broadcast.to(roomID).emit("client-broadcast", encryptedData, iv);
  //   });

  //   socket.on("server-volatile-broadcast", (roomID, encryptedData, iv) => {
  //     socketDebug(`${socket.id} sends volatile update to ${roomID}`);
  //     socket.volatile.broadcast
  //       .to(roomID)
  //       .emit("client-broadcast", encryptedData, iv);
  //   });

  //   socket.on("user-follow", async (payload) => {
  //     const roomID = `follow@${payload.userToFollow.socketId}`;

  //     switch (payload.action) {
  //       case "FOLLOW": {
  //         await socket.join(roomID);
  //         const sockets = await io.in(roomID).fetchSockets();
  //         const followedBy = sockets.map((socket) => socket.id);

  //         io.to(payload.userToFollow.socketId).emit(
  //           "user-follow-room-change",
  //           followedBy
  //         );
  //         break;
  //       }
  //       case "UNFOLLOW": {
  //         await socket.leave(roomID);
  //         const sockets = await io.in(roomID).fetchSockets();
  //         const followedBy = sockets.map((socket) => socket.id);

  //         io.to(payload.userToFollow.socketId).emit(
  //           "user-follow-room-change",
  //           followedBy
  //         );
  //         break;
  //       }
  //     }
  //   });

  //   socket.on("disconnecting", async () => {
  //     socketDebug(`${socket.id} has disconnected`);
  //     for (const roomID of Array.from(socket.rooms)) {
  //       const otherClients = (await io.in(roomID).fetchSockets()).filter(
  //         (_socket) => _socket.id !== socket.id
  //       );

  //       const isFollowRoom = roomID.startsWith("follow@");

  //       if (!isFollowRoom && otherClients.length > 0) {
  //         socket.broadcast.to(roomID).emit(
  //           "room-user-change",
  //           otherClients.map((socket) => socket.id)
  //         );
  //       }

  //       if (isFollowRoom && otherClients.length === 0) {
  //         const socketId = roomID.replace("follow@", "");
  //         io.to(socketId).emit("broadcast-unfollow");
  //       }
  //     }
  //   });

  //   socket.on("disconnect", () => {
  //     socket.removeAllListeners();
  //     socket.disconnect();
  //   });
  // });
} catch (error) {
  console.error(error);
}
