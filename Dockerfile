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

RUN useradd -m -s /bin/bash vncuser && \
    echo "vncuser:password" | chpasswd && \
    usermod -aG sudo vncuser && \
    echo "vncuser ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

RUN mkdir -p /home/vncuser/.vnc && \
    echo "password" | vncpasswd -f > /home/vncuser/.vnc/passwd && \
    chmod 600 /home/vncuser/.vnc/passwd && \
    chown -R vncuser:vncuser /home/vncuser

RUN echo '#!/bin/sh\n\
unset SESSION_MANAGER\n\
unset DBUS_SESSION_BUS_ADDRESS\n\
dbus-launch --exit-with-session mate-session &\n\
marco --replace &\n\
mate-panel &\n\
mate-settings-daemon &\n\
xsetroot -solid grey\n\
mate-terminal &\n\
while true; do sleep 1000; done' > /home/vncuser/.vnc/xstartup && \
    chmod +x /home/vncuser/.vnc/xstartup && chown vncuser:vncuser /home/vncuser/.vnc/xstartup

EXPOSE 5901 5902 6080 6081

CMD ["sh", "-c", \
    "rm -f /tmp/.X*-lock /home/vncuser/.Xauthority && \
    touch /home/vncuser/.Xauthority && \
    chown vncuser:vncuser /home/vncuser/.Xauthority && \
    sudo -u vncuser mkdir -p /home/vncuser/.vnc && \
    sudo -u vncuser chown -R vncuser:vncuser /home/vncuser/.vnc && \
    sudo -u vncuser bash -c 'xauth add :1 . $(mcookie)' && \
    sudo -u vncuser bash -c 'xauth add :2 . $(mcookie)' && \
    sudo -u vncuser bash -c 'Xorg :1 -nolisten tcp -auth /home/vncuser/.Xauthority vt7 &' && \
    sudo -u vncuser bash -c 'Xorg :2 -nolisten tcp -auth /home/vncuser/.Xauthority vt8 &' && \
    sleep 2 && \
    sudo -u vncuser bash -c 'DISPLAY=:1 vncserver :1 -geometry 1280x800 -depth 24 -SecurityTypes VncAuth -xstartup /home/vncuser/.vnc/xstartup &' && \
    sudo -u vncuser bash -c 'DISPLAY=:2 vncserver :2 -geometry 1280x800 -depth 24 -SecurityTypes VncAuth -xstartup /home/vncuser/.vnc/xstartup &' && \
    websockify 6080 localhost:5901 & \
    websockify 6081 localhost:5902 & \
    tail -f /dev/null"]
