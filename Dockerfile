FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive \
    TZ=Etc/UTC \
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en \
    LC_ALL=en_US.UTF-8

RUN apt-get update --fix-missing && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
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
    libgtk-3-0 \
    xserver-xorg-core \
    xserver-xorg-video-all \
    xserver-xorg-input-all \
    xserver-xorg-video-dummy \
    x11-xkb-utils \
    xkb-data \
    xinit \
    x11-xserver-utils \
    xserver-xephyr && \
    locale-gen en_US.UTF-8 && \
    apt-get remove -y blueman bluez bluez-cups bluez-obexd update-manager update-notifier update-notifier-common && \
    apt-get clean && rm -rf /var/lib/apt/lists/* /var/cache/apt/*

RUN useradd -m -s /bin/bash user && \
    echo "user:password" | chpasswd && \
    usermod -aG sudo user && \
    echo "user ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

RUN mkdir -p /home/user/.vnc && \
    echo "password" | vncpasswd -f > /home/user/.vnc/passwd && \
    chmod 600 /home/user/.vnc/passwd && \
    chown -R user:user /home/user

RUN echo '#!/bin/sh\n\
unset SESSION_MANAGER\n\
unset DBUS_SESSION_BUS_ADDRESS\n\
dbus-launch --exit-with-session mate-session &\n\
marco --replace &\n\
mate-panel &\n\
mate-settings-daemon &\n\
xsetroot -solid grey\n\
mate-terminal &\n\
while true; do sleep 1000; done' > /home/user/.vnc/xstartup && \
    chmod +x /home/user/.vnc/xstartup && chown user:user /home/user/.vnc/xstartup

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

EXPOSE 5901 5902 6080 6081


USER user

WORKDIR /home/user/CodeFiles

CMD ["sh", "-c", \
    "rm -f /tmp/.X*-lock /home/user/.Xauthority && \
    touch /home/user/.Xauthority && \
    chown user:user /home/user/.Xauthority && \
    sudo -u user mkdir -p /home/user/.vnc && \
    sudo -u user chown -R user:user /home/user/.vnc && \
    sudo -u user bash -c 'xauth add :1 . $(mcookie)' && \
    sudo -u user bash -c 'xauth add :2 . $(mcookie)' && \
    sudo -u user bash -c 'Xorg :1 -nolisten tcp -auth /home/user/.Xauthority vt7 &' && \
    sudo -u user bash -c 'Xorg :2 -nolisten tcp -auth /home/user/.Xauthority vt8 &' && \
    sleep 2 && \
    sudo -u user bash -c 'DISPLAY=:1 vncserver :1 -geometry 1280x800 -depth 24 -SecurityTypes VncAuth -xstartup /home/user/.vnc/xstartup &' && \
    sudo -u user bash -c 'DISPLAY=:2 vncserver :2 -geometry 1280x800 -depth 24 -SecurityTypes VncAuth -xstartup /home/user/.vnc/xstartup &' && \
    websockify 6080 localhost:5901 & \
    websockify 6081 localhost:5902 & \
    tail -f /dev/null"]
