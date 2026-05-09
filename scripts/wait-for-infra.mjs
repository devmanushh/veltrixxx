import net from "node:net";

const targets = [
  { name: "Postgres", host: "127.0.0.1", port: 5432 },
  { name: "Redis", host: "127.0.0.1", port: 6379 },
];

const timeoutMs = 30_000;
const retryMs = 500;

const waitForPort = ({ name, host, port }) =>
  new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const tryConnect = () => {
      const socket = net.createConnection({ host, port });

      socket.once("connect", () => {
        socket.destroy();
        console.log(`${name} is ready on ${host}:${port}`);
        resolve();
      });

      socket.once("error", () => {
        socket.destroy();

        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`${name} did not become ready on ${host}:${port}`));
          return;
        }

        setTimeout(tryConnect, retryMs);
      });
    };

    tryConnect();
  });

await Promise.all(targets.map(waitForPort));
