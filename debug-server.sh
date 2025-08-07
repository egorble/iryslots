#!/bin/bash

# Скрипт для діагностики проблем з сервером

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="/var/www/iryslots"

echo -e "${YELLOW}🔧 ДІАГНОСТИКА СЕРВЕРА${NC}"
echo "=========================="

# 1. Перевірка файлів
echo -e "\n${YELLOW}1. ФАЙЛИ ТА ЗАЛЕЖНОСТІ${NC}"
echo "------------------------"

if [ -f "$PROJECT_DIR/server/server.js" ]; then
    echo -e "✅ server.js: ${GREEN}ПРИСУТНІЙ${NC}"
else
    echo -e "❌ server.js: ${RED}ВІДСУТНІЙ${NC}"
fi

if [ -f "$PROJECT_DIR/server/.env" ]; then
    echo -e "✅ .env: ${GREEN}ПРИСУТНІЙ${NC}"
    echo "Основні налаштування:"
    grep -E "^(PORT|NODE_ENV|FRONTEND_URL|CONTRACT_ADDRESS)" $PROJECT_DIR/server/.env | sed 's/^/   /'
else
    echo -e "❌ .env: ${RED}ВІДСУТНІЙ${NC}"
fi

if [ -f "$PROJECT_DIR/package.json" ]; then
    echo -e "✅ package.json: ${GREEN}ПРИСУТНІЙ${NC}"
else
    echo -e "❌ package.json: ${RED}ВІДСУТНІЙ${NC}"
fi

# 2. Перевірка node_modules
echo -e "\n${YELLOW}2. ЗАЛЕЖНОСТІ${NC}"
echo "------------------------"
if [ -d "$PROJECT_DIR/node_modules" ]; then
    echo -e "✅ node_modules: ${GREEN}ПРИСУТНІЙ${NC}"
    echo "Основні пакети:"
    ls $PROJECT_DIR/node_modules | grep -E "^(express|ethers|cors|helmet)" | sed 's/^/   /' || echo "   Пакети не знайдені"
else
    echo -e "❌ node_modules: ${RED}ВІДСУТНІЙ${NC}"
fi

# 3. Перевірка портів
echo -e "\n${YELLOW}3. МЕРЕЖА${NC}"
echo "------------------------"
if netstat -tuln | grep -q ":3001 "; then
    echo -e "✅ Порт 3001: ${GREEN}ЗАЙНЯТИЙ${NC}"
    echo "Процес на порту:"
    sudo lsof -i :3001 | sed 's/^/   /'
else
    echo -e "❌ Порт 3001: ${RED}ВІЛЬНИЙ${NC}"
fi

# 4. Тест запуску
echo -e "\n${YELLOW}4. ТЕСТ ЗАПУСКУ${NC}"
echo "------------------------"
echo "Спроба запуску сервера (5 секунд)..."

cd $PROJECT_DIR
timeout 5s sudo -u www-data node server/server.js 2>&1 | head -10 | sed 's/^/   /'
echo ""

# 5. Systemd статус
echo -e "\n${YELLOW}5. SYSTEMD СЕРВІС${NC}"
echo "------------------------"
if systemctl is-active --quiet iryslots-server; then
    echo -e "✅ Сервіс: ${GREEN}АКТИВНИЙ${NC}"
else
    echo -e "❌ Сервіс: ${RED}НЕАКТИВНИЙ${NC}"
fi

echo "Останні логи сервісу:"
sudo journalctl -u iryslots-server -n 5 --no-pager | sed 's/^/   /'

# 6. Тест API
echo -e "\n${YELLOW}6. ТЕСТ API${NC}"
echo "------------------------"
echo "Тест локального підключення:"
if curl -f -s --connect-timeout 5 http://127.0.0.1:3001/health > /dev/null 2>&1; then
    echo -e "✅ Локальний API: ${GREEN}ПРАЦЮЄ${NC}"
    curl -s http://127.0.0.1:3001/health | head -5 | sed 's/^/   /'
else
    echo -e "❌ Локальний API: ${RED}НЕ ПРАЦЮЄ${NC}"
fi

echo -e "\n${YELLOW}🛠️ РЕКОМЕНДАЦІЇ:${NC}"
echo "=========================="

if [ ! -d "$PROJECT_DIR/node_modules" ]; then
    echo "1. Встановити залежності: cd $PROJECT_DIR && npm install"
fi

if ! systemctl is-active --quiet iryslots-server; then
    echo "2. Запустити сервіс: sudo systemctl start iryslots-server"
fi

if ! netstat -tuln | grep -q ":3001 "; then
    echo "3. Перевірити конфігурацію та перезапустити сервер"
fi

echo "4. Для детального дебагу: cd $PROJECT_DIR && sudo -u www-data node server/server.js"