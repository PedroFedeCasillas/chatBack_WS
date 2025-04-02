import { Server as socketServer } from "socket.io";

export let io = null;

export function initSocketServer(server) {
  io = new socketServer(server, {
    cors: {
      origin: "*",
    },
  });
}
