const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const morgan = require("morgan");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
const PORT = 5000;
const BASE_PORT = 5900;
const MAX_PORT = 5999;

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

async function getNextAvailablePort() {
  const rooms = await prisma.room.findMany();
  const assignedPorts = new Set(rooms.map((room) => room.websockifyPort));

  for (let port = BASE_PORT; port <= MAX_PORT; port++) {
    if (!assignedPorts.has(port)) {
      return port;
    }
  }

  throw new Error("No available ports");
}

app.post("/api/new-instance", async (req, res) => {
  try {
    const port = await getNextAvailablePort();
    const containerName = `ubuntu-vnc-instance-${Date.now()}`;

    const runCommand = `docker run -d -p ${port}:6080 --name ${containerName} ubuntu-vnc-image`;
    exec(runCommand, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Error starting container: ${error.message}`);
        return res.status(500).send(`Error starting container: ${error.message}`);
      }

      const roomId = containerName.split("-")[3];

      const room = await prisma.room.create({
        data: {
          roomId,
          containerName,
          websockifyPort: port,
        },
      });

      console.log(`Container started: ${stdout}`);
      console.log(`PORT: ${port}`);
      return res.status(200).json({ roomId: room.roomId, websockifyPort: room.websockifyPort });
    });
  } catch (error) {
    console.error("Error creating new instance:", error);
    return res.status(500).send("Failed to create new instance");
  }
});

app.post("/api/join", async (req, res) => {
  const { roomId } = req.body;

  try {
    const room = await prisma.room.findUnique({
      where: { roomId },
    });

    if (!room) {
      return res.status(404).send("Room not found");
    }

    return res.status(200).json({ containerName: room.containerName, websockifyPort: room.websockifyPort });
  } catch (error) {
    console.error("Error joining room:", error);
    return res.status(500).send("Failed to join room");
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
