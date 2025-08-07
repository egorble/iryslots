#!/bin/bash

# Скрипт для збірки та оновлення фронтенду
# Домен: iryslots.xyz

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="/var/www/iryslots"

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

log "🔄 Оновлення фронтенду..."

cd $PROJECT_DIR

# Оновлення коду з GitHub
log "Оновлення коду з GitHub..."
git pull origin main || git pull origin master || warning "Не вдалося оновити з git"

# Встановлення залежностей
log "Встановлення/оновлення залежностей..."
npm install

# Збірка проекту
log "Збірка фронтенду..."
npm run build

# Копіювання збудованих файлів
if [ -d "dist" ]; then
    log "Копіювання збудованих файлів..."
    
    # Створення backup старої версії
    if [ -f "index.html" ]; then
        mkdir -p backup
        cp index.html backup/index.html.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
    fi
    
    # Копіювання нових файлів
    cp -r dist/* ./
    
    log "✅ Фронтенд оновлено успішно"
else
    error "Директорія dist не знайдена після збірки"
fi

# Налаштування прав доступу
log "Налаштування прав доступу..."
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

# Перезавантаження nginx (для очищення кешу)
log "Перезавантаження nginx..."
systemctl reload nginx

# Перевірка сайту
log "Перевірка сайту..."
if curl -f -s https://iryslots.xyz > /dev/null; then
    log "✅ Сайт працює: https://iryslots.xyz"
else
    warning "⚠️ Сайт може бути тимчасово недоступний"
fi

echo -e "${GREEN}🎉 Фронтенд успішно оновлено!${NC}"
echo -e "${GREEN}🌐 Перевірте: https://iryslots.xyz${NC}"