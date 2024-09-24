const debug = require("debug");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");

dotenv.config({
  path:
    process.env.NODE_ENV === "development"
      ? ".env.development"
      : ".env.production",
});

const serverDebug = debug("server");
const ioDebug = debug("io");
const socketDebug = debug("socket");

const app = express();
const port = process.env.PORT || 3002;

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Excalidraw collaboration server is up :)");
});

const server = http.createServer(app);
server.listen(port, () => {
  console.log(`listening on port: ${port}`);
  serverDebug(`listening on port: ${port}`);
});

const io = new Server(server, {
  transports: ["websocket", "polling"],
  cors: {
    allowedHeaders: ["Content-Type", "Authorization"],
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  },
  allowEIO3: true,
});

let roomOwners = {}; // 각 방의 방장 저장
let roomUsers = {}; // 각 방의 사용자 리스트 저장

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("join-room", (roomID, userInfo) => {
    console.log(`User ${userInfo.name} is trying to join room: ${roomID}`);

    if (!userInfo || !userInfo.email || !userInfo.name) {
      console.log("Invalid user info detected");
      socket.emit("invalid-user-info", "유효하지 않은 사용자 정보입니다.");
      return;
    }

    if (!roomUsers[roomID]) {
      roomUsers[roomID] = [];
    }

    // 기존에 같은 이메일을 가진 사용자가 있으면 제거
    const existingUserIndex = roomUsers[roomID]?.findIndex(
      (user) => user.email === userInfo.email
    );

    if (existingUserIndex !== -1) {
      console.log(
        `Duplicate email detected for ${userInfo.email}, replacing existing user.`
      );
      roomUsers[roomID].splice(existingUserIndex, 1); // 기존 사용자 제거
    }

    const isOwner = userInfo.isOwner || false;
    socket.join(roomID);

    if (isOwner) {
      roomOwners[roomID] = socket.id; // 방장을 저장
      console.log(`Owner connected for room: ${roomID}`);
      socket.broadcast.to(roomID).emit("owner-connected");
    }

    // 새로운 사용자 추가
    roomUsers[roomID].push({
      id: socket.id,
      email: userInfo.email,
      name: userInfo.name,
      isOwner,
    });

    console.log("roomUsers[roomID]", roomUsers[roomID]);

    // 사용자 목록을 방에 있는 모든 사용자에게 전송
    io.to(roomID).emit("room-user-list", roomUsers[roomID]);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    const roomID = socket.data.roomID;

    if (roomID && roomUsers[roomID]) {
      roomUsers[roomID] = roomUsers[roomID].filter(
        (user) => user.id !== socket.id
      );
      io.to(roomID).emit("room-user-list", roomUsers[roomID]);

      if (roomUsers[roomID].length === 0) {
        delete roomUsers[roomID];
      }
    }
  });

  socket.on("server-broadcast", (roomID, updatedElements, isOwner) => {
    console.log(`방장 브로드캐스트: ${roomID}, isOwner: ${isOwner}`);
    if (isOwner) {
      console.log("client-broadcast 이벤트 전송 중");
      io.to(roomID).emit("client-broadcast", {
        elements: updatedElements,
      });
      console.log("client-broadcast 이벤트 전송됨");
    } else {
      socket.emit("not-authorized", "방장만 그림을 수정할 수 있습니다.");
    }
  });

  // 메시지 전송 핸들러 추가
  socket.on("send-message", (roomID, message, userInfo) => {
    console.log(
      `Message received from ${userInfo.name} in room ${roomID}: ${message}`
    );

    const messageData = {
      message: message,
      user: userInfo.name,
      timestamp: new Date().toISOString(),
    };

    // 해당 방에 있는 모든 클라이언트에게 메시지 전달
    io.to(roomID).emit("receive-message", messageData);
    console.log(`Broadcasted message to room ${roomID}:`, messageData);
  });
});
