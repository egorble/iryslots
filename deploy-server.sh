#!/bin/bash

# Скрипт для деплою сайту на сервер з nginx та SSL
# Домен: iryslots.xyz
# Email: egor4042007@gmail.com

set -e

# Кольори для виводу
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Конфігурація
DOMAIN="iryslots.xyz"
EMAIL="egor4042007@gmail.com"
PROJECT_DIR="/var/www/iryslots"
NGINX_CONFIG="/etc/nginx/sites-available/iryslots"
NGINX_ENABLED="/etc/nginx/sites-enabled/iryslots"

echo -e "${GREEN}🚀 Початок деплою сайту для домену ${DOMAIN}${NC}"

# Функція для логування
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Перевірка прав root
if [[ $EUID -ne 0 ]]; then
   error "Цей скрипт повинен запускатися з правами root (sudo)"
fi

log "Оновлення системи..."
apt update && apt upgrade -y

log "Вирішення конфліктів Node.js та npm..."
# Видалення конфліктуючих пакетів
apt remove -y nodejs npm 2>/dev/null || true
apt autoremove -y

log "Встановлення необхідних пакетів (без Node.js)..."
apt install -y nginx certbot python3-certbot-nginx git curl

log "Встановлення Node.js через NodeSource..."
# Встановлення Node.js 20.x LTS через офіційний репозиторій NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Перевірка версії Node.js
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
log "Версія Node.js: $NODE_VERSION"
log "Версія npm: $NPM_VERSION"

# Оновлення npm до останньої версії
log "Оновлення npm..."
npm install -g npm@latest

# Створення директорії проекту
log "Створення директорії проекту..."
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Якщо це новий деплой, клонуємо репозиторій
if [ ! -f "package.json" ]; then
    warning "package.json не знайдено. Переконайтеся, що файли проекту знаходяться в $PROJECT_DIR"
    log "Копіювання файлів проекту..."
    # Тут ви можете додати команди для копіювання файлів
    # cp -r /path/to/your/project/* $PROJECT_DIR/
fi

# Встановлення залежностей та збірка фронтенду
if [ -f "package.json" ]; then
    log "Встановлення npm залежностей..."
    npm install
    
    log "Збірка фронтенду для продакшену..."
    npm run build
    
    # Копіювання збудованих файлів в root директорію для nginx
    if [ -d "dist" ]; then
        log "Копіювання збудованих файлів..."
        cp -r dist/* ./
        log "✅ Фронтенд збудовано та скопійовано"
    else
        warning "Директорія dist не знайдена після збірки"
    fi
fi

# Налаштування прав доступу
log "Налаштування прав доступу..."
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

# Створення конфігурації nginx
log "Створення конфігурації nginx..."
cat > $NGINX_CONFIG << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Редірект на HTTPS (буде додано після отримання SSL)
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name $DOMAIN www.$DOMAIN;
    
    root $PROJECT_DIR;
    index index.html index.htm;
    
    # SSL конфігурація (буде додана certbot)
    
    # Gzip стиснення
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
    
    # Безпека заголовків
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Основна локація для статичних файлів
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # Кешування статичних ресурсів
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API проксі (якщо потрібно)
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Netlify Functions проксі
    location /.netlify/functions/ {
        proxy_pass http://localhost:8888;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Заборона доступу до системних файлів
    location ~ /\. {
        deny all;
    }
    
    location ~ ^/(\.env|\.git|node_modules|package\.json|package-lock\.json)$ {
        deny all;
    }
}
EOF

# Активація конфігурації nginx
log "Активація конфігурації nginx..."
ln -sf $NGINX_CONFIG $NGINX_ENABLED

# Перевірка конфігурації nginx
log "Перевірка конфігурації nginx..."
nginx -t || error "Помилка в конфігурації nginx"

# Перезапуск nginx
log "Перезапуск nginx..."
systemctl restart nginx
systemctl enable nginx

# Отримання SSL сертифіката
log "Отримання SSL сертифіката від Let's Encrypt..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive --redirect

# Налаштування автоматичного оновлення сертифіката
log "Налаштування автоматичного оновлення SSL сертифіката..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# Створення systemd сервісу для Node.js додатку (якщо потрібно)
if [ -f "$PROJECT_DIR/server/server.js" ]; then
    log "Створення systemd сервісу для Node.js сервера..."
    cat > /etc/systemd/system/iryslots-server.service << EOF
[Unit]
Description=Irys Slots Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$PROJECT_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server/server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable iryslots-server
    systemctl start iryslots-server
    log "Node.js сервер запущено як systemd сервіс"
fi

# Налаштування файрволу
log "Налаштування файрволу..."
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow ssh
ufw --force enable

# Перевірка статусу сервісів
log "Перевірка статусу сервісів..."
systemctl status nginx --no-pager -l
if systemctl is-active --quiet iryslots-server; then
    systemctl status iryslots-server --no-pager -l
fi

# Тестування SSL
log "Тестування SSL сертифіката..."
curl -I https://$DOMAIN || warning "Не вдалося підключитися до https://$DOMAIN"

echo -e "${GREEN}✅ Деплой завершено успішно!${NC}"
echo -e "${GREEN}🌐 Ваш сайт доступний за адресою: https://$DOMAIN${NC}"
echo -e "${YELLOW}📝 Не забудьте:${NC}"
echo -e "   - Перевірити DNS записи для домену $DOMAIN"
echo -e "   - Налаштувати змінні середовища в .env файлах"
echo -e "   - Перевірити роботу всіх API endpoints"
echo -e "   - Налаштувати моніторинг та логування"

log "Показ логів nginx для перевірки:"
tail -n 20 /var/log/nginx/access.log