const express = require("express");
const cors = require("cors");
const { exec, execSync } = require("child_process");
const morgan = require("morgan");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const multer = require("multer");
const dotenv=require("dotenv").config()
const path = require("path");
const { initializePorts, getNextAvailablePort, redis } = require("./utils/portManagement");
const { default: Redis } = require("ioredis");

const upload = multer({ dest: "uploads/" });
initializePorts(); //initializes a pool of available ports

const app = express();
const prisma = new PrismaClient();
const PORT = 5000;

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

app.post("/api/register", async (req, res) => {
  const { clerkId, email, name } = req.body;

  try {
    let user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      user = await prisma.user.create({
        data: { clerkId, email, name },
      });
    }else {
      return res.status(200).json({message: "User is already registered!"})
    }

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post("/api/new-instance", async (req, res) => {
  const { userScript, clerkId, snapshotName } = req.body; 
  try {
    const port = await getNextAvailablePort();
    const containerName = `ubuntu-vnc-instance-${Date.now()}`;

    let user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let snapshot = null;
    if (snapshotName) {
      snapshot = await prisma.snapshot.findUnique({
        where: { name: snapshotName, userId: user.id },
      });

      if (!snapshot) {
        return res.status(404).json({ error: "Snapshot not found" });
      }
    }

    let scriptFilePath = "";

    if (userScript.trim()) {
      scriptFilePath = `/tmp/user-script-${Date.now()}.sh`;
      fs.writeFileSync(scriptFilePath, userScript);
    }


    const baseImage = snapshot ? snapshot.imageName : "ubuntu-vnc-image";

    const runCommand = userScript.trim() ? `
  docker run -d -p ${port}:6080 --name ${containerName} \
  --mount type=bind,source=${scriptFilePath},target=/tmp/user-script.sh \
  ${baseImage} bash -c '
  chmod +x /tmp/user-script.sh &&
  /tmp/user-script.sh &&
  dbus-daemon --session --fork &&
  vncserver :1 -geometry 1280x800 -depth 24 &&
  websockify 6080 localhost:5901 &&
  bash /home/user/start-vscode.sh &&
  tail -f /dev/null'` : `docker run -d -p ${port}:6080 --name ${containerName} ${baseImage}`;
    
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
          userId: user.id
        },
      });

      console.log(`Container started: ${stdout}`);
      return res.status(200).json({ roomId: room.roomId, websockifyPort: room.websockifyPort,  userId: user.id });
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

app.post("/api/upload/:roomId", upload.any(), async (req, res) => {
  const { roomId } = req.params;
  const containerName = `ubuntu-vnc-instance-${roomId}`;
  const containerBasePath = "/home/user/CodeFiles";
  const relativePaths = req.body["relativePaths"]; 
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    for (const [index, file] of req.files.entries()) {
      const localFilePath = path.resolve(file.path);
      const relativePath = relativePaths[index];
      const containerFilePath = path.posix.join(containerBasePath, relativePath);
      const containerDirPath = path.posix.dirname(containerFilePath);

      console.log("Local File Path:", localFilePath);
      console.log("Container File Path:", containerFilePath);
      console.log("Container Dir Path:", containerDirPath);

      exec(`docker exec ${containerName} mkdir -p "${containerDirPath}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }

        console.log(`stdout: ${stdout}`);

        const copyCommand = `docker cp "${localFilePath}" "${containerName}:${containerFilePath}"`;
        exec(copyCommand, (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
          }

          console.log(`stdout: ${stdout}`);
          fs.unlink(localFilePath, (err) => {
            if (err) {
              console.error(`Error deleting file ${localFilePath}:`, err);
            } else {
              console.log(`File ${localFilePath} deleted successfully`);
            }
          });
        });
      });
    }

    res.status(200).json({ message: "Files and directories uploaded and deleted successfully" });
  } catch (error) {
    console.error("Error handling upload request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


const APP_ID = process.env.APP_ID ;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;
// token generation server
app.post("/api/generate-token", (req, res) => {
  const { channelName } = req.body;

  if (!channelName) {
    return res.status(400).json({ error: "Channel name is required" });
  }

  const role = RtcRole.PUBLISHER;
  const expireTime = Math.floor(Date.now() / 1000) + 3600; 
  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    0,
    role,
    expireTime
  );

  return res.json({ token });
});


app.get("/api/getUsername/:uid", async (req, res) => {
  const uid = req.params.uid;

  try {
    // Fetch username from Redis using the uid
    const username = await redis.get(uid);

    if (username) {
      res.json({ username });
    } else {
      res.status(404).json({ error: "Username not found" });
    }
  } catch (error) {
    console.error("Error fetching from Redis:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/setUsername/:uid/:username", async (req, res) => {
  const { uid, username } = req.params;

  try {
    await redis.set(uid, username);
    res.json({ message: "Username set successfully" });
  } catch (error) {
    console.error("Error saving to Redis:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

process.on("SIGINT", async () => {
  console.log("Server is shutting down. Cleaning up Docker containers...");

  try {
    const { stdout, stderr } = await execPromise("docker ps --filter 'name=ubuntu-vnc-instance' -q")

    const containerIds = stdout.split("\n").filter(Boolean)

    if (containerIds.length > 0) {
      const removeCommand = `docker rm -f ${containerIds.join(" ")}`;
      await execPromise(removeCommand);
      console.log("Cleaned up Docker containers.")
    }

    console.log("Server shutdown complete.")
  } catch (error) {
    console.error("Error during shutdown:", error)
  }finally{
    await prisma.room.deleteMany();
    console.log("Rooms data deleted")
    await prisma.$disconnect();
    await redis.quit();
  }

  process.exit(0);
});

async function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`exec error: ${error}`);
        return;
      }
      if (stderr) {
        reject(`stderr: ${stderr}`);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});