const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const morgan = require("morgan");
const { PrismaClient } = require("@prisma/client");
const path = require("path");
const fs = require("fs");


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
  const { userScript } = req.body; 
  try {
    const port = await getNextAvailablePort();
    const containerName = `ubuntu-vnc-instance-${Date.now()}`;

    const scriptFilePath = `/tmp/user-script-${Date.now()}.sh`;
    const fs = require("fs");
    fs.writeFileSync(scriptFilePath, userScript);

    const runCommand = userScript.trim() ? `
  docker run -d -p ${port}:6080 --name ${containerName} \
  --mount type=bind,source=${scriptFilePath},target=/tmp/user-script.sh \
  ubuntu-vnc-image bash -c '
  chmod +x /tmp/user-script.sh &&
  /tmp/user-script.sh &&
  dbus-daemon --session --fork &&
  vncserver :1 -geometry 1280x800 -depth 24 &&
  websockify 6080 localhost:5901 &&
  bash /home/user/start-vscode.sh &&
  tail -f /dev/null'` : `docker run -d -p ${port}:6080 --name ${containerName} ubuntu-vnc-image`;
    
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


// download a file/folder from the container
app.get("/api/download/:roomId", async (req, res) => {
  const { roomId } = req.params;

  try {
    const containerName = `ubuntu-vnc-instance-${roomId}`;
    const containerPath = "/home/user/CodeFiles";
    const subdir = `${Date.now()}${Math.floor(Math.random() * 100)}`;
    const localPath = path.join(__dirname, "downloads", roomId, subdir);

    if (!fs.existsSync(localPath)) {
      fs.mkdirSync(localPath, { recursive: true });
    }

    const copyCommand = `docker cp ${containerName}:${containerPath} ${localPath}`;
    exec(copyCommand, (error) => {
      if (error) {
        console.error("Error copying files:", error);
        return res.status(500).json({ error: "Failed to copy files from container" });
      }

      const zipFilePath = `${localPath}.zip`;
      exec(`cd ${localPath} && zip -r ${zipFilePath} CodeFiles`, (zipError) => {
        if (zipError) {
          console.error("Error zipping files:", zipError);
          return res.status(500).json({ error: "Failed to zip files" });
        }

        res.download(zipFilePath, `${roomId}.zip`, (downloadError) => {
          if (downloadError) {
            console.error("Error sending file:", downloadError);
          }

          fs.rmSync(localPath, { recursive: true, force: true });
          fs.rmSync(zipFilePath, { force: true });

          const roomDirPath = path.join(__dirname, "downloads", roomId);
          if (fs.existsSync(roomDirPath) && fs.readdirSync(roomDirPath).length === 0) {
            fs.rm(roomDirPath, { recursive: true }, (err)=>{
              if(err){
                console.log("ERR: ", error)
                throw new Error(err)
              }
            });
          }
        });
      });
    });
  } catch (error) {
    console.error("Error handling download request:", error);
    res.status(500).send("Internal server error");
  }
});




process.on("SIGINT", async () => {
  console.log("Server is shutting down. Cleaning up Docker containers...");

  const { stdout, stderr } = await execPromise("docker ps -a --filter 'name=ubuntu-vnc-instance' -q");
  const containerIds = stdout.split("\n").filter(Boolean);

  if (containerIds.length > 0) {
    const stopCommand = `docker stop ${containerIds.join(" ")}`;
    const removeCommand = `docker rm ${containerIds.join(" ")}`;

    await execPromise(stopCommand);
    await execPromise(removeCommand);
    console.log("Cleaned up Docker containers.");
  }

  await prisma.$disconnect();

  process.exit(0);
});

function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`exec error: ${error}`);
      }
      resolve({ stdout, stderr });
    });
  });
}


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});