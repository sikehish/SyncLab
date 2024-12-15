const Redis =  require("ioredis");

const redis = new Redis();
const BASE_PORT = 5900;
const END_PORT = 5999;

async function initializePorts() {
  for (let port = BASE_PORT; port <= END_PORT; port++) {
    await redis.sadd("availablePorts", port); 
  }
}

async function getNextAvailablePort() {
  const port = await redis.spop("availablePorts"); 
  if (!port) throw new Error("No available ports");
  return parseInt(port, 10); 
}

async function releasePort(port) {
  if (port < BASE_PORT || port > END_PORT)   throw new Error("Invalid port");
  await redis.sadd("availablePorts", port); 
}

module.exports= { initializePorts, getNextAvailablePort, releasePort, redis };
