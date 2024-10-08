FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Etc/UTC

ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

RUN apt-get update && apt-get install -y \
    mate-desktop-environment \
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
    xauth \
    xterm \
    && locale-gen en_US.UTF-8 \
    && apt-get clean

RUN useradd -m -s /bin/bash newuser && \
    echo "user:password" | chpasswd && \
    usermod -aG sudo newuser && \
    mkdir -p /home/newuser/.vnc && \
    echo "password" | vncpasswd -f > /home/newuser/.vnc/passwd && \
    chmod 600 /home/newuser/.vnc/passwd && \
    chown -R newuser:newuser /home/newuser

RUN echo '#!/bin/sh\n' \
    'unset SESSION_MANAGER\n' \
    'unset DBUS_SESSION_BUS_ADDRESS\n' \
    'exec mate-session &\n' > /home/newuser/.vnc/xstartup && \
    chmod +x /home/newuser/.vnc/xstartup && \
    chown newuser:newuser /home/newuser/.vnc/xstartup  # Ensure ownership is correct

RUN mkdir -p /var/run/dbus

RUN mkdir -p /home/newuser/Desktop && \
    echo '[Desktop Entry]\n\
    Version=1.0\n\
    Name=Firefox\n\
    Comment=Access the Internet\n\
    Exec=firefox\n\
    Icon=firefox\n\
    Terminal=false\n\
    Type=Application\n\
    Categories=Network;WebBrowser;\n\
    StartupNotify=true\n' > /home/newuser/Desktop/firefox.desktop && \
    chmod +x /home/newuser/Desktop/firefox.desktop && \
    echo '[Desktop Entry]\n\
    Version=1.0\n\
    Name=Terminal\n\
    Comment=Use the terminal\n\
    Exec=mate-terminal\n\
    Icon=utilities-terminal\n\
    Terminal=false\n\
    Type=Application\n\
    Categories=System;TerminalEmulator;\n\
    StartupNotify=true\n' > /home/newuser/Desktop/terminal.desktop && \
    chmod +x /home/newuser/Desktop/terminal.desktop && \
    chown -R newuser:newuser /home/newuser/Desktop

USER newuser
EXPOSE 5901 6080
CMD ["sh", "-c", "dbus-daemon --session --fork && vncserver :1 -geometry 1280x800 -depth 24 && websockify 6080 localhost:5901 && tail -f /dev/null"] 