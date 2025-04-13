const PACKAGE_LIBRARY = {
  development: [
    'build-essential',
    'gcc',
    'g++',
    'make',
    'cmake',
    'git',
    'curl',
    'wget',
    'ssh',
    'rsync',
    'python3',
    'python3-pip',
    'python3-dev',
    'ruby',
    'default-jre',
    'ruby-dev'
  ],
  editors: [
    'vim',
    'nano',
    'emacs'
  ],
  system: [
    'htop',
    'tmux',
    'screen',
    'tree',
    'ncdu',
    'jq',
    'net-tools',
    'iputils-ping',
    'dnsutils',
    'unzip',
    'zip',
    'tar',
    'gzip',
    'openssl',
    'ca-certificates'
  ],
  databases: [
    'sqlite3',
    'postgresql-client',
    'default-mysql-client',
    'redis-tools'
  ],
  networking: [
    'netcat',
    'tcpdump',
    'iperf'
  ],
  gui_tools: [
    'vlc', 'gimp', 'inkscape',
    'libreoffice', 'evince'
  ],
};

module.exports = PACKAGE_LIBRARY;