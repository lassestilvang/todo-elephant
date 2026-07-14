import { Server as Server as Server as Server } from 'ws';
import { Server as NextApiServer } from 'next/server';
import { TaskModel } from '@/models/task.model';

let wss: WebSocket.Server;
let changeListeners: Map<string, Set<WebSocket>> = new Map();

export function initializeWebSocketServer(server: any) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      if (message.type === 'task') {
        broadcastTaskChange(change.type, change.fullDocument);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });
  }