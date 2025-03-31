const Redis = require("ioredis");
const net = require("net");
const redis = new Redis();
const BASE_PORT = 5900;
const END_PORT = 5999;
const NUM_PORTS = 2; 

async function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(false); // Port is in use
    });

    server.once("listening", () => {
      server.close(() => resolve(true)); // Port is free
    });

    server.listen(port);
  });
}

async function initializePorts(BASE_PORT=5900, END_PORT=5999) {
  for (let port = BASE_PORT; port <= END_PORT; port++) {
    if (await isPortFree(port)) {
      await redis.sadd("availablePorts", port);
      console.log(`Added port ${port} to availablePorts`);
    } else {
      console.log(`Port ${port} is in use, skipping...`);
    }
  }
}



async function getNextAvailablePorts() {
  const ports = [];
  for (let i = 0; i < NUM_PORTS; i++) {
    const port = await redis.spop("availablePorts");
    if (!port) throw new Error("No available ports");
    ports.push(parseInt(port));
  }
  console.log("PORTS: ",ports)
  return ports;
}

async function releasePorts(ports) {
  if (!Array.isArray(ports) || ports.length !== NUM_PORTS) {
    throw new Error("Invalid ports array");
  }
  for (const port of ports) {
    if (port < BASE_PORT || port > END_PORT) {
      throw new Error(`Invalid port: ${port}`);
    }
    await redis.sadd("availablePorts", port);
  }
}

module.exports = { initializePorts, getNextAvailablePorts, releasePorts, redis };
