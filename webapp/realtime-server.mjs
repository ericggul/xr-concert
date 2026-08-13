import { readFileSync } from "node:fs";
import { createServer } from "node:https";
import { join } from "node:path";
import { createConcertRealtimeServer } from "./realtime/create-realtime-server.mjs";

try {
  process.loadEnvFile(".env");
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const host = process.env.REALTIME_HOST || "0.0.0.0";
const port = Number.parseInt(process.env.REALTIME_PORT || "10001", 10);
const certDir = join(process.cwd(), "certificates");
const allowedOrigins = (process.env.REALTIME_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const server = createServer(
  {
    key: readFileSync(join(certDir, "server.key")),
    cert: readFileSync(join(certDir, "server.pem")),
    ca: readFileSync(join(certDir, "rootCA.pem")),
  },
  (request, response) => {
    if (request.url === "/health") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: true, secure: true, service: "nrf-xr-realtime" }));
      return;
    }
    if (request.url === "/cert") {
      response.writeHead(200, { "content-type": "application/x-x509-ca-cert" });
      response.end(readFileSync(join(certDir, "rootCA.pem")));
      return;
    }
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found\n");
  },
);

createConcertRealtimeServer(server, {
  allowedOrigins,
  allowAnyOrigin: process.env.NODE_ENV !== "production",
});

server.listen(port, host, () => {
  console.log(`> NRF XR realtime ready on https://${host}:${port}`);
});
