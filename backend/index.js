const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const morgan = require('morgan');

const app = express();
const PORT = 5000;

app.use(morgan("dev"));
app.use(cors());
app.use(express.json()); 

const rooms = {}; 

app.post('/api/new-instance', (req, res) => {
  const containerName = `ubuntu-vnc-instance-${Date.now()}`;
  createNewInstance(res, containerName);
});

// join an existing room
app.post('/api/join', (req, res) => {
  const { roomId } = req.body;

  if (!roomId || !rooms[roomId]) {
    return res.status(404).send('Room not found');
  }

  const vncPort = rooms[roomId].vncPort; 
  return res.status(200).json({ containerName: rooms[roomId].containerName, vncPort });
});

function createNewInstance(res, containerName) {
  const runCommand = `docker run -d -p 5901:5901 -p 6080:6080 --name ${containerName} ubuntu-vnc-image`;
  
  exec(runCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting container: ${error.message}`);
      return res.status(500).send(`Error starting container: ${error.message}`);
    }

    const roomId = containerName.split('-')[3]; 
    rooms[roomId] = { containerName, vncPort: '6080' }; 
    console.log(`Container started: ${stdout}`);
    return res.status(200).json({ roomId, vncPort: '6080' });
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
