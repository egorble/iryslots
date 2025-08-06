#!/bin/bash

# Скрипт для налаштування PM2 для управління Node.js процесами
# Домен: iryslots.xyz

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="/var/www/iryslots"
DOMAIN="iryslots.xyz"

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

log "Встановлення PM2 глобально..."
npm install -g pm2

# Створення PM2 конфігурації
log "Створення PM2 конфігурації..."
cat > $PROJECT_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'iryslots-server',
      script: './server/server.js',
      cwd: '$PROJECT_DIR',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/pm2/iryslots-server-error.log',
      out_file: '/var/log/pm2/iryslots-server-out.log',
      log_file: '/var/log/pm2/iryslots-server.log',
      time: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G'
    },
    {
      name: 'netlify-dev',
      script: 'npx',
      args: 'netlify dev --port 8888',
      cwd: '$PROJECT_DIR',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/pm2/netlify-dev-error.log',
      out_file: '/var/log/pm2/netlify-dev-out.log',
      log_file: '/var/log/pm2/netlify-dev.log',
      time: true,
      watch: false
    }
  ]
};
EOF

# Створення директорії для логів
mkdir -p /var/log/pm2
chown -R www-data:www-data /var/log/pm2

# Запуск додатків через PM2
log "Запуск додатків через PM2..."
cd $PROJECT_DIR

# Зупинка існуючих процесів (якщо є)
pm2 delete all 2>/dev/null || true

# Запуск нових процесів
pm2 start ecosystem.config.js

# Збереження PM2 конфігурації
pm2 save

# Налаштування автозапуску PM2
log "Налаштування автозапуску PM2..."
pm2 startup systemd -u www-data --hp /var/www

log "PM2 налаштовано успішно!"
log "Команди для управління:"
echo "  pm2 status          - статус процесів"
echo "  pm2 logs            - перегляд логів"
echo "  pm2 restart all     - перезапуск всіх процесів"
echo "  pm2 stop all        - зупинка всіх процесів"
echo "  pm2 monit           - моніторинг в реальному часі"