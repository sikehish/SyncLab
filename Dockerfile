FROM ubuntu:20.04

ENV DISPLAY=:1 \
    DEBIAN_FRONTEND=noninteractive \
    TZ=Etc/UTC \
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en \
    LC_ALL=en_US.UTF-8

    RUN apt-get update --fix-missing && apt-get install -y \
    mate-desktop-environment \
    ubuntu-mate-core \
    mate-terminal \
    dbus-x11 \
    tigervnc-standalone-server \
    tigervnc-common \
    websockify \
    curl \
    wget \
    gnupg2 \
    software-properties-common \
    apt-transport-https \
    locales \
    sudo \
    firefox \
    vim \
    gedit \
    pcmanfm \
    gvfs \
    git \  
    xauth \
    xterm \
    libxshmfence1 \
    libxrandr2 \
    libxinerama1 \
    libxcursor1 \
    libxi6 \
    libgl1-mesa-glx \
    libgl1-mesa-dri \
    libasound2 \
    libnss3 \
    libatk-bridge2.0-0 \
    libgtk-3-0 && \
    locale-gen en_US.UTF-8 && \
    apt-get remove -y blueman bluez bluez-cups bluez-obexd update-manager update-notifier update-notifier-common && \
    apt-get clean && rm -rf /var/lib/apt/lists/* /var/cache/apt/*


WORKDIR /home/user/Code

RUN useradd -m -s /bin/bash user && \
    echo "user:password" | chpasswd && \
    usermod -aG sudo user && \
    mkdir -p /home/user/.vnc && \
    echo "password" | vncpasswd -f > /home/user/.vnc/passwd && \
    chmod 600 /home/user/.vnc/passwd && \
    chown -R user:user /home/user

RUN echo '#!/bin/sh\n' \
    'unset SESSION_MANAGER\n' \
    'unset DBUS_SESSION_BUS_ADDRESS\n' \
    'exec mate-session &' > /home/user/.vnc/xstartup && \
    chmod +x /home/user/.vnc/xstartup && \
    chown user:user /home/user/.vnc/xstartup

RUN apt-get update && apt-get install -y wget && \
    wget -q https://packages.microsoft.com/keys/microsoft.asc -O- | apt-key add - && \
    add-apt-repository "deb [arch=amd64] https://packages.microsoft.com/repos/vscode stable main" && \
    apt-get update && apt-get install -y code && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/user/CodeFiles && chown -R user:user /home/user/CodeFiles

RUN echo '#!/bin/sh\n' \
    'code /home/user/CodeFiles --disable-gpu --no-sandbox > /home/user/vscode.log 2>&1\n' > /home/user/start-vscode.sh && \
    chmod +x /home/user/start-vscode.sh && \
    chown user:user /home/user/start-vscode.sh

RUN mkdir -p /var/run/dbus

RUN mkdir -p /home/user/Desktop && \
    echo '[Desktop Entry]\n\
    Version=1.0\n\
    Name=Firefox\n\
    Comment=Access the Internet\n\
    Exec=firefox\n\
    Icon=firefox\n\
    Terminal=false\n\
    Type=Application\n\
    Categories=Network;WebBrowser;\n\
    StartupNotify=true\n' > /home/user/Desktop/firefox.desktop && \
    chmod +x /home/user/Desktop/firefox.desktop && \
    echo '[Desktop Entry]\n\
    Version=1.0\n\
    Name=Terminal\n\
    Comment=Use the terminal\n\
    Exec=mate-terminal\n\
    Icon=utilities-terminal\n\
    Terminal=false\n\
    Type=Application\n\
    Categories=System;TerminalEmulator;\n\
    StartupNotify=true\n' > /home/user/Desktop/terminal.desktop && \
    chmod +x /home/user/Desktop/terminal.desktop && \
    echo '[Desktop Entry]\n\
    Version=1.0\n\
    Name=Visual Studio Code\n\
    Comment=Code Editor\n\
    Exec=code --no-sandbox\n\
    Icon=vscode\n\
    Terminal=false\n\
    Type=Application\n\
    Categories=Development;IDE;\n\
    StartupNotify=true\n' > /home/user/Desktop/vscode.desktop && \
    chmod +x /home/user/Desktop/vscode.desktop && \
    chown -R user:user /home/user/Desktop

RUN echo "alias code='code --no-sandbox'" >> /home/user/.bashrc

RUN echo "manual" | tee /etc/init/bluetooth.override && \
    echo "manual" | tee /etc/init/update-manager.override

EXPOSE 5901 6080

USER user

WORKDIR /home/user/CodeFiles

CMD ["sh", "-c", "dbus-daemon --session --fork && vncserver :1 -geometry 1280x800 -depth 24 && websockify 6080 localhost:5901 && bash /home/user/start-vscode.sh && tail -f /dev/null"]
