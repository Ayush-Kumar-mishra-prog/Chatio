import express from "express";
import cors from "cors";
import g_authRouter from "./routes/g_authRouter.js";
import http from "http";
import dotenv from "dotenv";
import connectDB from "./configs/db.js";
import messageRouter from "./routes/messageRoutes.js";
import callRouter from "./routes/callRoutes.js";
import statusRouter from "./routes/statusRoutes.js";
import { Server } from "socket.io";
const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: { origin: "*" },
});

export const userSocketMap = {};

const asId = (value) => value?.toString?.() ?? "";

io.on("connection", (socket) => {
  const userId = asId(socket.handshake.query.userId);
  console.log("user connected", userId, "socket ID:", socket.id);
  if (userId) {
    socket.join(userId);
    userSocketMap[userId] = socket.id;
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("call:invite", ({ receiverIds = [], ...payload }) => {
    console.log("call:invite from", userId, "to", receiverIds);
    receiverIds.forEach((receiverId) => {
      const id = asId(receiverId);
      console.log("Emitting call:incoming to room", id);
      io.to(id).emit("call:incoming", { ...payload, from: userId });
    });
  });

  socket.on("call:end", ({ receiverIds = [], ...payload }) => {
    console.log("call:end from", userId, "to", receiverIds);
    receiverIds.forEach((receiverId) => {
      const id = asId(receiverId);
      io.to(id).emit("call:end", { ...payload, from: userId });
    });
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

dotenv.config();
app.use(express.json({ limit: "35mb" }));

await connectDB();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.use("/api/status", (req, res) => {
  res.send("Server is running");
});

app.use("/auth", g_authRouter);
app.use("/api/message", messageRouter);
app.use("/api/calls", callRouter);
app.use("/api/statuses", statusRouter);

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 8000;
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default server;
