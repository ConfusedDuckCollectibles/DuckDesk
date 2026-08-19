import http from "node:http";
import cors from "cors";
import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { normalizeShowEvent, type ShowEvent } from "@duck-desk/shared";

const port = Number(process.env.PORT ?? 8741);
const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: "256kb" }));

app.get("/health", (_request, response) => {
  response.json({
    ok: true,
    service: "duck-desk",
    clients: clients.size,
    timestamp: Date.now()
  });
});

app.post("/events", (request, response) => {
  try {
    const event = normalizeShowEvent(request.body);
    console.log(`[event] ${event.type}`);
    broadcast(event);
    response.status(202).json({ ok: true, event });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid event.";
    response.status(400).json({ ok: false, error: message });
  }
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });
const clients = new Set<WebSocket>();

wss.on("connection", (socket) => {
  clients.add(socket);
  console.log(`[ws] overlay connected (${clients.size} total)`);

  socket.send(
    JSON.stringify({
      type: "connected",
      timestamp: Date.now()
    })
  );

  socket.on("close", () => {
    clients.delete(socket);
    console.log(`[ws] overlay disconnected (${clients.size} total)`);
  });
});

function broadcast(event: ShowEvent): void {
  const payload = JSON.stringify(event);

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

server.listen(port, "127.0.0.1", () => {
  console.log(`[server] Duck Desk listening on http://localhost:${port}`);
  console.log(`[server] WebSocket ready at ws://localhost:${port}/ws`);
});
