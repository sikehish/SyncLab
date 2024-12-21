const { exec } = require("child_process");

const imageName = "ubuntu-vnc-image"; 
const dockerfilePath="/home/sikehish/CodeFiles/SyncLab/"
console.log("Building Docker image...");
exec(`docker build -t ${imageName} ${dockerfilePath}`, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error during build: ${error.message}`);
        return;
    }
    if (stderr) console.error(`Error output: ${stderr}`);
    
    console.log(`Build output:\n${stdout}`);
    console.log(`Docker image '${imageName}' built successfully.`);
});
