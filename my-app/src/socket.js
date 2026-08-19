// src/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/api/auth', '').replace('/api', '')
  : (import.meta.env?.VITE_API_URL?.replace('/api/auth', '').replace('/api', '') || 'http://localhost:3000');

export const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: true
});