const { exec } = require("child_process");
const path = require("path");

const imageName = "ubuntu-vnc-image"; 
const dockerfilePath = path.resolve(__dirname, ".."); 
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
