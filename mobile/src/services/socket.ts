import { io, Socket } from "socket.io-client";
import { API_BASE } from "../config";

let socket: Socket | null = null;

export function getSocket() {
    if (!socket) {
        socket = io(API_BASE, {
            transports: ["websocket"],
            autoConnect: false,
        });
    }
    return socket;
}

export function connectSocket() {
    const s = getSocket();
    if (!s.connected) s.connect();
    return s;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}