// client/src/services/socket.js
import { io } from 'socket.io-client';

let socket = null;

export function connectSocket() {
  if (socket && socket.connected) return socket;
  const base = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
  socket = io(base, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    path: '/socket.io',
  });
  socket.on('connect_error', (e) => console.warn('[WS] connect_error:', e?.message || e));
  return socket;
}

export function getSocket() { return socket; }

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}