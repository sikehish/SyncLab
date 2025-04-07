const PACKAGE_LIBRARY = {
  development: [
    'build-essential', 'gcc', 'g++', 'make', 'cmake',
    'git', 'curl', 'wget', 'ssh', 'rsync',
    'python3', 'python3-pip', 'python3-dev',
    'ruby', 'ruby-dev',
    'php', 'php-cli'
  ],
  editors: [
    'vim', 'nano', 'emacs', 'neovim'
  ],
  system: [
    'htop', 'tmux', 'screen', 'zsh', 'fish',
    'tree', 'ncdu', 'jq',
    'net-tools', 'iputils-ping', 'dnsutils',
    'unzip', 'zip', 'tar', 'gzip',
    'openssl', 'ca-certificates'
  ],
  gui_tools: [
    'firefox',
    'chromium', 
    'vlc', 'gimp', 'inkscape',
    'libreoffice', 'evince'
  ],
  containers: [
    'podman', 'buildah'
  ],
  databases: [
    'sqlite3', 'postgresql-client',
    'default-mysql-client',
    'redis-tools'
  ],
  networking: [
    'netcat', 'tcpdump',
    'nmap', 'iperf'
  ]
};

module.exports = PACKAGE_LIBRARY;