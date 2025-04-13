#!/bin/bash

echo "Installing cmatrix package..."
apt-get update && apt-get install -y cmatrix > /dev/null 2>&1

echo "Creating test script..."
cat << 'EOF' > /home/user1/Desktop/matrix_demo.sh
#!/bin/bash
# Simple GUI demo script
echo "Starting cmatrix - Press 'q' to exit"
cmatrix -C blue
EOF

chmod +x /home/user1/Desktop/matrix_demo.sh

echo "Installation complete! Find 'Matrix Demo' on your Desktop" > /home/user1/Desktop/README.txt
