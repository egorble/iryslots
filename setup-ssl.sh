#!/bin/bash

# Скрипт для налаштування SSL після того, як DNS вже працює
# Домен: iryslots.xyz

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DOMAIN="iryslots.xyz"
EMAIL="egor4042007@gmail.com"

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Перевірка прав root
if [[ $EUID -ne 0 ]]; then
   error "Цей скрипт повинен запускатися з правами root (sudo)"
fi

log "🔍 Перевірка DNS записів..."

# Функція для перевірки DNS
check_dns() {
    local domain=$1
    log "Перевірка DNS для $domain..."
    
    if nslookup $domain > /dev/null 2>&1; then
        local ip=$(nslookup $domain | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -1)
        log "✅ DNS для $domain працює: $ip"
        return 0
    else
        warning "❌ DNS для $domain не працює"
        return 1
    fi
}

# Перевірка основного домену
if ! check_dns $DOMAIN; then
    error "DNS для $DOMAIN не налаштований. Налаштуйте A запис і спробуйте знову через 5-10 хвилин."
fi

# Перевірка www піддомену
if ! check_dns "www.$DOMAIN"; then
    warning "DNS для www.$DOMAIN не налаштований, але продовжуємо..."
    DOMAIN_LIST="-d $DOMAIN"
else
    DOMAIN_LIST="-d $DOMAIN -d www.$DOMAIN"
fi

# Перевірка nginx конфігурації
log "Перевірка nginx..."
if ! systemctl is-active --quiet nginx; then
    log "Запуск nginx..."
    systemctl start nginx
fi

nginx -t || error "Помилка в конфігурації nginx"

# Тимчасова конфігурація nginx для HTTP (без SSL)
log "Створення тимчасової HTTP конфігурації..."
cat > /etc/nginx/sites-available/iryslots-temp << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    root /var/www/iryslots;
    index index.html index.htm;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Для Let's Encrypt перевірки
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
}
EOF

# Активація тимчасової конфігурації
ln -sf /etc/nginx/sites-available/iryslots-temp /etc/nginx/sites-enabled/iryslots
systemctl reload nginx

log "🔒 Отримання SSL сертифіката..."

# Спроба отримання SSL сертифіката
if certbot --nginx $DOMAIN_LIST --email $EMAIL --agree-tos --non-interactive --redirect; then
    log "✅ SSL сертифікат успішно отримано!"
    
    # Налаштування автоматичного оновлення
    log "Налаштування автоматичного оновлення SSL..."
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    # Перевірка сертифіката
    log "Перевірка SSL сертифіката..."
    if curl -I https://$DOMAIN > /dev/null 2>&1; then
        log "✅ SSL працює правильно!"
    else
        warning "⚠️ SSL сертифікат отримано, але сайт може бути ще недоступний"
    fi
    
else
    error "❌ Не вдалося отримати SSL сертифікат. Перевірте:"
    echo "1. DNS записи налаштовані правильно"
    echo "2. Домен доступний з інтернету"
    echo "3. Порт 80 відкритий"
    echo ""
    echo "Для діагностики запустіть:"
    echo "sudo certbot --nginx $DOMAIN_LIST --email $EMAIL --agree-tos --non-interactive --redirect -v"
fi

log "📊 Статус nginx:"
systemctl status nginx --no-pager -l | head -10

echo -e "${GREEN}🎉 Налаштування SSL завершено!${NC}"
echo -e "${GREEN}🌐 Перевірте ваш сайт: https://$DOMAIN${NC}"