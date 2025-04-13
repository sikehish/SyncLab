const express = require("express");
const cors = require("cors");
const { exec, execSync } = require("child_process");
const morgan = require("morgan");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const PACKAGE_LIBRARY = require("./utils/packageLibrary")
const multer = require("multer");
const dotenv=require("dotenv").config()
const path = require("path");
const { initializePorts, getNextAvailablePorts, redis, releasePorts } = require("./utils/portManagement");
const { default: Redis } = require("ioredis");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });


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
  const { userScript, clerkId, snapshotName, osType = 'ubuntu', selectedPackages = [] } = req.body;
  
  try {
    const ports = await getNextAvailablePorts(); 
    const containerName = `${osType}-vnc-instance-${Date.now()}`;
    const validOSTypes = ['ubuntu', 'debian', 'kali'];
    
    if (!validOSTypes.includes(osType.toLowerCase())) {
      return res.status(400).json({ error: "Invalid OS type. Must be ubuntu, debian, or kali" });
    }

    const invalidPackages = selectedPackages.filter(pkg => 
      !Object.values(PACKAGE_LIBRARY).flat().includes(pkg)
    );
    if (invalidPackages.length > 0) {
      return res.status(400).json({ 
        error: "Invalid packages selected",
        invalidPackages
      });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let snapshot = null;
    if (snapshotName) {
      snapshot = await prisma.snapshot.findUnique({
        where: { snapshotName: snapshotName, userId: user.id },
      });
      if (!snapshot) {
        return res.status(404).json({ error: "Snapshot not found" });
      }
    }

    const baseImage = snapshot ? snapshotName : `${osType}-vnc-image`;

    const runCommand = `docker run -d \
      -p ${ports[0]}:6080 \
      -p ${ports[1]}:6081 \
      --name ${containerName} \
      --shm-size=1g \
      ${baseImage}`;

    exec(runCommand, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Error starting container: ${error.message}`);
        await releasePorts(ports);
        return;
      }

      const roomId = containerName.split("-")[3];
      const room = await prisma.room.create({
        data: {
          roomId,
          containerName,
          websockifyPorts: ports,
          osType: osType.toLowerCase(),
          creator: { connect: { id: user.id } },
          participants: { connect: { id: user.id } },
        },
        include: {
          creator: true,
          participants: true
        }
      });

      console.log(`Container started: ${containerName}`);

      if (userScript?.trim()) {
        await executeUserScriptInBackground(containerName, userScript);
      }

    installPackagesInBackground(containerName, selectedPackages, roomId);

    });

    const roomId = containerName.split("-")[3];
    return res.status(202).json({ 
      roomId,
      websockifyPort: ports[0],
      creatorId: user.id,
      osType: osType.toLowerCase(),
      installedPackages: selectedPackages,
      message: "Container is being created. Package installation will continue in background."
    });

  } catch (error) {
    console.error("Error creating new instance:", error);
    return res.status(500).json({ 
      error: "Failed to create new instance",
      details: error.message 
    });
  }
});

async function installPackagesInBackground(containerName, packages, roomId) {
  try {
    console.log(`Starting background package installation for ${containerName}`);
    
    const updateCmd = `docker exec ${containerName} bash -c "sudo apt-get update -y"`;
    await execAsync(updateCmd);
        const installCmd = `docker exec ${containerName} bash -c \
      "sudo apt-get install -y ${packages.join(' ')}"`;
    
      if (packages?.length > 0)await execAsync(installCmd, { timeout: 300000 }); // 5 minute timeout

    console.log(`Package installation completed for ${containerName}`);
  } catch (error) {
    console.error(`Background package installation failed for ${containerName}:`, error);
  }
}

async function executeUserScriptInBackground(containerName, script) {
  try {
    const encodedScript = Buffer.from(script).toString('base64');
    const cmd = `echo ${encodedScript} | base64 -d | docker exec -i ${containerName} bash`;
    await execAsync(cmd);
    console.log(`User script executed successfully in ${containerName}`);
  } catch (error) {
    console.error(`User script execution failed in ${containerName}:`, error);
  }
}

function execAsync(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

app.get("/api/available-packages", (req, res) => {
  res.status(200).json(PACKAGE_LIBRARY);
});


app.post("/api/join", async (req, res) => {
  const { roomId, clerkId } = req.body;

  try {
    const room = await prisma.room.findUnique({
      where: { roomId },
      include: {
        creator: true,
        participants: true
      }
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isParticipant = room.participants.some(p => p.id === user.id);

    if (isParticipant) {
      return res.status(409).json({ 
        error: "User already in meeting",
        containerName: room.containerName,
        websockifyPort: room.websockifyPorts[0]
      });
    }

    const updatedRoom = await prisma.room.update({
      where: { roomId },
      data: {
        participants: {
          connect: { id: user.id }
        }
      },
      include: {
        creator: true,
        participants: true
      }
    });

    return res.status(200).json({ 
      containerName: updatedRoom.containerName, 
      websockifyPort: updatedRoom.websockifyPorts[0],
      osType: updatedRoom.osType,
      creator: {
        id: updatedRoom.creator.id,
        name: updatedRoom.creator.name
      }
    });
  } catch (error) {
    console.error("Error joining room:", error);
    return res.status(500).json({ error: "Failed to join room" });
  }
});

app.post("/api/leave-room/:roomId", async (req, res) => {
  const { roomId } = req.params;
  const { clerkId } = req.body;

  try {
    const room = await prisma.room.findUnique({
      where: { roomId },
      include: {
        participants: true
      }
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) return res.status(404).json({ error: "User not found" });
  
    const isParticipant = room.participants.some(p => p.id === user.id);
    if (!isParticipant) return res.status(400).json({ error: "User is not in this room" });
    
    await prisma.room.update({
      where: { roomId },
      data: {
        participants: {
          disconnect: { id: user.id }
        }
      }
    });
    const updatedRoom = await prisma.room.findUnique({
      where: { roomId },
      include: {
        participants: true
      }
    });

    if (updatedRoom.participants.length === 0) {
      const { containerName } = updatedRoom;
      exec(`docker rm -f ${containerName}`, async (error) => {
        if (error) {
          console.error(`Error removing container ${containerName}:`, error);
          return res.status(500).json({ error: "Failed to remove container" });
        }
        await releasePorts(updatedRoom.websockifyPorts);
        await prisma.room.delete({
          where: { roomId }
        });

        console.log(`Container ${containerName} and room ${roomId} deleted`);
        return res.status(200).json({ message: "Room deleted" });
      });
    } else {
      return res.status(200).json({ message: "User removed from room" });
    }
  } catch (error) {
    console.error("Error in leave-room endpoint:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/switch-workspace", async (req, res) => {
  const { roomId, workspaceId } = req.body;

  if (workspaceId < 1 || workspaceId > 2) {
    return res.status(400).json({ error: "Invalid workspace ID. Must be between 1 and 2." });
  }

  try {
    const room = await prisma.room.findUnique({
      where: { roomId },
    });

    if (!room) {
      return res.status(404).send("Room not found");
    }

    return res.status(200).json({ 
      containerName: room.containerName, 
      websockifyPort: room.websockifyPorts[workspaceId - 1] 
    });
  } catch (error) {
    console.error("Error switching workspace:", error);
    return res.status(500).send("Failed to switch workspace");
  }
});


//get all snapshots(to be displayed while creating the room)
app.get("/api/snapshots/:clerkId", async (req, res) => {
  const { clerkId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const snapshots = await prisma.snapshot.findMany({
      where: { userId: user.id },
    });

    return res.status(200).json(snapshots);
  } catch (error) {
    console.error("Error fetching snapshots:", error);
    return res.status(500).json({ error: "Failed to fetch snapshots" });
  }
});

//Take a snapshot
app.post("/api/snapshot/:roomId/:clerkId", async (req, res) => {
  const { roomId, clerkId } = req.params;

  try {
    const room = await prisma.room.findUnique({
      where: { roomId },
      include: {
        creator: true,
        participants: true
      }
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isCreator = room.creator.clerkId === clerkId;
    const isParticipant = room.participants.some(p => p.clerkId === clerkId);

    if (!isCreator && !isParticipant) {
      return res.status(403).json({ error: "Unauthorized to take snapshot" });
    }

    const { containerName } = room;
    const snapshotName = `snapshot-${user.id}-${Date.now()}`;

    const command = `docker commit ${containerName} ${snapshotName}`;

    exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.error("Error creating snapshot:", stderr);
        return res.status(500).json({ error: "Failed to create snapshot" });
      }

      const snapshot = await prisma.snapshot.create({
        data: {
          snapshotName,
          containerName,
          userId: user.id,
        },
      });

      console.log(`Snapshot created: ${stdout}`);
      return res.status(200).json({ 
        message: "Snapshot created successfully", 
        snapshot,
        roomId: room.roomId
      });
    });
  } catch (error) {
    console.error("Error taking snapshot:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


// download a file/folder from the container
app.get("/api/download/:roomId/:workspaceId", async (req, res) => {
  const { roomId, workspaceId } = req.params;

  try {

    const room = await prisma.room.findUnique({
      where: { roomId }
    });
    
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const containerName = room.containerName;


    const containerPath = `/home/user${workspaceId}/CodeFiles`;
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

app.post("/api/upload/:roomId/:workspaceId", upload.any(), async (req, res) => {
  const { roomId, workspaceId } = req.params;
  const containerBasePath =`/home/user${workspaceId}/CodeFiles`;
  const relativePaths = req.body["relativePaths"]; 
  try {

    const room = await prisma.room.findUnique({
      where: { roomId }
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const containerName = room.containerName;

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

const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Store both incremental stroke data, full canvas state, and chat messages
const rooms = {};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  
  // Whiteboard functionality
  socket.on("joinRoom", (roomId) => {
    console.log(`User ${socket.id} joined room: ${roomId}`);
    socket.join(roomId);
    
    // Send the current canvas state to the new user
    if (rooms[roomId] && rooms[roomId].canvasState) {
      socket.emit("loadCanvas", rooms[roomId].canvasState);
      console.log(`Sent existing canvas to user ${socket.id} in room ${roomId}`);
    } else {
      // Initialize the room if it doesn't exist
      rooms[roomId] = { 
        canvasState: null,
        chatMessages: [] 
      };
      console.log(`Created new room: ${roomId}`);
    }
  });
  
  // Handle individual draw strokes - more efficient for real-time collaboration
  socket.on("drawing", ({ roomId, startX, startY, endX, endY, color, width, erase }) => {
    console.log(`Received drawing from ${socket.id} in room ${roomId}`);
    // Broadcast the stroke to everyone in the room (including sender for confirmation)
    io.to(roomId).emit("receiveDraw", { startX, startY, endX, endY, color, width, erase });
  });
  
  // Handle full canvas updates after drawing stops
  socket.on("finalizeDrawing", ({ roomId, data }) => {
    console.log(`Finalizing drawing in room ${roomId}`);
    // Store the full canvas state
    if (!rooms[roomId]) {
      rooms[roomId] = { 
        canvasState: null,
        chatMessages: [] 
      };
    }
    rooms[roomId].canvasState = data;
  });
  
  // Handle canvas clearing
  socket.on("clearCanvas", ({ roomId }) => {
    console.log(`Clearing canvas in room ${roomId}`);
    if (rooms[roomId]) {
      rooms[roomId].canvasState = null;
    }
    // Broadcast to all users in the room including sender
    io.to(roomId).emit("clearCanvas");
  });
  
  // Chat functionality
  socket.on("joinChatRoom", ({ roomId, username }) => {
    console.log(`User ${username} (${socket.id}) joined chat in room: ${roomId}`);
    socket.join(roomId);
    
    // Initialize room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = { 
        canvasState: null,
        chatMessages: [] 
      };
    }
    
    // Send previous chat messages to the new user
    if (rooms[roomId].chatMessages && rooms[roomId].chatMessages.length > 0) {
      socket.emit("loadChatHistory", rooms[roomId].chatMessages);
      console.log(`Sent chat history to user ${username} in room ${roomId}`);
    }
    
    // Announce new user joined (optional)
    const joinMessage = {
      sender: "System",
      text: `${username} has joined the chat`,
      timestamp: new Date()
    };
    
    io.to(roomId).emit("receiveMessage", joinMessage);
    
    // Store system message in history (optional)
    if (rooms[roomId].chatMessages) {
      rooms[roomId].chatMessages.push(joinMessage);
    }
  });
  
  // Handle new chat messages
  socket.on("sendMessage", ({ roomId, sender, text, timestamp }) => {
    console.log(`New message in room ${roomId} from ${sender}: ${text}`);
    
    const messageData = {
      sender,
      text,
      timestamp
    };
    
    // Store message in room history
    if (!rooms[roomId]) {
      rooms[roomId] = { 
        canvasState: null,
        chatMessages: [] 
      };
    }
    
    if (!rooms[roomId].chatMessages) {
      rooms[roomId].chatMessages = [];
    }
    
    rooms[roomId].chatMessages.push(messageData);
    
    // If chat history gets too long, trim it (optional)
    if (rooms[roomId].chatMessages.length > 100) {
      rooms[roomId].chatMessages = rooms[roomId].chatMessages.slice(-100);
    }
    
    // Broadcast to everyone in the room except sender
    socket.to(roomId).emit("receiveMessage", messageData);
  });
  
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    // Room cleanup could be implemented here if needed
  });
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
    const { stdout, stderr } = await execPromise("docker ps -a --filter 'name=*-vnc-instance-*' --format '{{.ID}}'");
    
    const containerIds = stdout.split("\n").filter(Boolean);

    if (containerIds.length > 0) {
      console.log(`Found ${containerIds.length} containers to remove`);
      const removeCommand = `docker rm -f ${containerIds.join(" ")}`;
      await execPromise(removeCommand);
      console.log(`Successfully removed ${containerIds.length} containers`);
    } else {
      console.log("No containers to clean up");
    }

    console.log("Cleaning up database records...");
    await prisma.room.deleteMany();
    console.log("All room records deleted");

  } catch (error) {
    console.error("Error during shutdown cleanup:", error);
  } finally {
    await prisma.$disconnect();
    await redis.quit();
    console.log("Database connections closed");
    process.exit(0);
  }
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


server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

/* CHATBOT API(s) */

app.get("/api/chat", async (req, res) => {
  try {
    const prompt = req.query.prompt;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      if (chunk.text()) {
        res.write(`data: ${chunk.text()}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Error generating response:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});