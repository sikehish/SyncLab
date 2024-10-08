const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const morgan = require('morgan');

const app = express();
const PORT = 5000;

app.use(morgan("dev"))

app.use(cors());

app.post('/api/new-instance', (req, res) => {
    const containerName = `ubuntu-vnc-instance-${Date.now()}`;
    const checkAndStopCommand = `docker ps -q --filter "publish=5901"`;

    exec(checkAndStopCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error checking containers: ${error.message}`);
            return res.status(500).send(`Error checking containers: ${error.message}`);
        }
        if (stdout.trim()) {
            const stopCommand = `docker stop ${stdout.trim()}`;
            exec(stopCommand, (stopError, stopStdout, stopStderr) => {
                if (stopError) {
                    console.error(`Error stopping container: ${stopError.message}`);
                    return res.status(500).send(`Error stopping container: ${stopError.message}`);
                }
                console.log(`Stopped container: ${stopStdout}`);
                createNewInstance(res, containerName);
            });
        } else  createNewInstance(res, containerName);
        
    });
});

function createNewInstance(res, containerName) {
    const runCommand = `docker run -d -p 5901:5901 -p 6080:6080 --name ${containerName} ubuntu-vnc-image`;
    exec(runCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error starting container: ${error.message}`);
            return res.status(500).send(`Error starting container: ${error.message}`);
        }
        console.log(`Container started: ${stdout}`);
        return res.status(200).json({ containerName, vncPort: '6080' });
    });
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
