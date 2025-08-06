#!/bin/bash

# Головний скрипт для повного деплою сайту iryslots.xyz
# Email: egor4042007@gmail.com

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    IRYS SLOTS DEPLOYMENT                     ║"
echo "║                      iryslots.xyz                           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

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
   error "Цей скрипт повинен запускатися з правами root (sudo ./install.sh)"
fi

# Перевірка наявності файлів
if [ ! -f "deploy-server.sh" ]; then
    error "Файл deploy-server.sh не знайдено!"
fi

log "🚀 Початок повного деплою..."

# Крок 1: Основний деплой
log "📦 Крок 1: Основне налаштування сервера та nginx..."
chmod +x deploy-server.sh
./deploy-server.sh

# Крок 2: Налаштування PM2 (якщо є Node.js сервер)
if [ -f "setup-pm2.sh" ]; then
    log "⚙️  Крок 2: Налаштування PM2..."
    chmod +x setup-pm2.sh
    ./setup-pm2.sh
fi

# Крок 3: Налаштування безпеки
if [ -f "security-setup.sh" ]; then
    log "🔒 Крок 3: Налаштування безпеки..."
    chmod +x security-setup.sh
    ./security-setup.sh
fi

# Крок 4: Фінальні перевірки
log "🔍 Крок 4: Фінальні перевірки..."

# Перевірка nginx
if systemctl is-active --quiet nginx; then
    log "✅ Nginx працює"
else
    error "❌ Nginx не працює"
fi

# Перевірка SSL
if curl -f -s https://iryslots.xyz > /dev/null 2>&1; then
    log "✅ SSL сертифікат працює"
else
    warning "⚠️  SSL сертифікат може ще не працювати (перевірте DNS)"
fi

# Показ статусу
log "📊 Статус сервісів:"
systemctl status nginx --no-pager -l | head -5

if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}PM2 процеси:${NC}"
    pm2 status
fi

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    ДЕПЛОЙ ЗАВЕРШЕНО!                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${GREEN}🎉 Ваш сайт успішно розгорнуто!${NC}"
echo -e "${GREEN}🌐 URL: https://iryslots.xyz${NC}"
echo -e "${GREEN}📧 SSL для: egor4042007@gmail.com${NC}"
echo ""
echo -e "${YELLOW}📝 Наступні кроки:${NC}"
echo "1. Перевірте, що DNS записи налаштовані правильно"
echo "2. Скопіюйте файли вашого проекту в /var/www/iryslots"
echo "3. Налаштуйте змінні середовища (.env файли)"
echo "4. Перезапустіть сервіси: systemctl restart nginx && pm2 restart all"
echo ""
echo -e "${YELLOW}🛠️  Корисні команди:${NC}"
echo "- Перегляд логів nginx: tail -f /var/log/nginx/error.log"
echo "- Статус PM2: pm2 status"
echo "- Перезапуск всього: systemctl restart nginx && pm2 restart all"
echo "- Перевірка SSL: curl -I https://iryslots.xyz"
echo ""
echo -e "${GREEN}✨ Готово до використання!${NC}"