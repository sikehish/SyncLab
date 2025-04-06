#!/bin/bash

echo "Installing cmatrix package..."
sudo apt-get update
sudo apt-get install -y cmatrix > /dev/null 2>&1
echo "Creating test script..."
cat << 'EOF' > matrix_demo.sh
#!/bin/bash
# Simple GUI demo script
echo "Starting cmatrix - Press 'q' to exit"
cmatrix -C blue
EOF
chmod +x matrix_demo.sh
echo "[Desktop Entry]
Name=Matrix Demo
Exec=matrix_demo.sh
Icon=utilities-terminal
Type=Application
Terminal=true" > matrix_demo.desktop
chmod +x matrix_demo.desktop
echo "Installation complete! Find 'Matrix Demo' on your Desktop" > README.txt