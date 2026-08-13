import { spawn, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";

const root = process.cwd();
const certificateDirectory = join(root, "certificates");
const webPort = Number.parseInt(process.env.WEB_PORT || "10000", 10);
const realtimePort = Number.parseInt(process.env.REALTIME_PORT || "10001", 10);

function validatePort(port, name) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`${name} has invalid port ${port}`);
}

function assertPortAvailable(port, name) {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", (error) => reject(new Error(error.code === "EADDRINUSE" ? `${name} port ${port} is already in use` : error.message)));
    probe.listen({ host: "0.0.0.0", port, exclusive: true }, () => probe.close(resolve));
  });
}

validatePort(webPort, "Web app");
validatePort(realtimePort, "Realtime relay");
if (webPort === realtimePort) throw new Error("WEB_PORT and REALTIME_PORT must differ");
await Promise.all([assertPortAvailable(webPort, "Web app"), assertPortAvailable(realtimePort, "Realtime relay")]);

const certificateResult = spawnSync("bash", ["scripts/generate-certs.sh"], { cwd: root, stdio: "inherit" });
if (certificateResult.status !== 0) process.exit(certificateResult.status ?? 1);

const hostname = readFileSync(join(certificateDirectory, ".hostname"), "utf8").trim();
const environment = {
  ...process.env,
  WEB_PORT: String(webPort),
  REALTIME_PORT: String(realtimePort),
  NEXT_PUBLIC_DEV_HOSTNAME: hostname,
  NEXT_PUBLIC_WEB_PORT: String(webPort),
  NEXT_PUBLIC_REALTIME_PORT: String(realtimePort),
};

const web = spawn("pnpm", ["exec", "next", "dev", "--hostname", "0.0.0.0", "--port", String(webPort), "--experimental-https", "--experimental-https-key", join(certificateDirectory, "server.key"), "--experimental-https-cert", join(certificateDirectory, "server.pem"), "--experimental-https-ca", join(certificateDirectory, "rootCA.pem")], { cwd: root, env: environment, stdio: "inherit" });
const realtime = spawn("node", ["realtime-server.mjs"], { cwd: root, env: environment, stdio: "inherit" });
const children = [web, realtime];
let stopping = false;

console.log(`\n> Web app: https://${hostname}:${webPort}`);
console.log(`> Realtime: https://${hostname}:${realtimePort}`);
console.log(`> Mobile certificate: https://${hostname}:${realtimePort}/cert\n`);

function stopAll(signal) {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (!child.killed) child.kill(signal);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopAll(signal);
    process.exit(0);
  });
}

for (const child of children) {
  child.on("exit", (code, signal) => {
    if (stopping) return;
    stopAll(signal || "SIGTERM");
    process.exit(code ?? 0);
  });
}
