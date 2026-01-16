import express from "express";
import cors from "cors";
import http from "http";
import { SocketService } from "./services/socket.service";
import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";
import { loadScripts } from "./utils/redis/scripts";
import { registerConnectionHandlers } from "./socket/connection";

const app = express();
const httpServer = http.createServer(app);

const PORT = process.env.PORT;

export async function initBE() {
  app.use(express.json());
  app.use(
    cors({
      origin: ["http://localhost:3000", "https://nawanapam.com"],
    })
  );

  const io = new Server(httpServer, { cors: { origin: "*" } });

  async function start() {
    await loadScripts();

    registerConnectionHandlers(io);

    httpServer.listen(PORT, () =>
      console.log("signaling server running on", PORT)
    );
  }

  start().catch((e) => {
    console.error("Failed to start signaling server:", e);
    process.exit(1);
  });
}
