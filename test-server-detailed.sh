#!/bin/bash

# Детальне тестування сервера

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="/var/www/iryslots"

echo -e "${YELLOW}🔍 ДЕТАЛЬНА ДІАГНОСТИКА СЕРВЕРА${NC}"
echo "=================================="

# 1. Зупинити systemd сервіс для чистого тесту
echo -e "\n${YELLOW}1. ЗУПИНКА SYSTEMD СЕРВІСУ${NC}"
sudo systemctl stop iryslots-server
sleep 2

# 2. Перевірити, чи порт вільний
echo -e "\n${YELLOW}2. ПЕРЕВІРКА ПОРТУ${NC}"
if netstat -tuln | grep -q ":3001 "; then
    echo -e "❌ Порт 3001 все ще зайнятий:"
    sudo lsof -i :3001
    echo "Вбиваємо процеси на порту 3001..."
    sudo pkill -f "node.*server.js"
    sleep 2
else
    echo -e "✅ Порт 3001 вільний"
fi

# 3. Перевірити залежності
echo -e "\n${YELLOW}3. ПЕРЕВІРКА ЗАЛЕЖНОСТЕЙ${NC}"
cd $PROJECT_DIR

if [ ! -d "node_modules" ]; then
    echo -e "❌ node_modules відсутній, встановлюємо..."
    npm install
fi

# Перевірити ключові пакети
echo "Перевірка ключових пакетів:"
for pkg in express ethers cors helmet winston; do
    if [ -d "node_modules/$pkg" ]; then
        echo -e "   ✅ $pkg"
    else
        echo -e "   ❌ $pkg відсутній"
    fi
done

# 4. Перевірити файли конфігурації
echo -e "\n${YELLOW}4. КОНФІГУРАЦІЯ${NC}"
if [ -f "server/.env" ]; then
    echo -e "✅ server/.env присутній"
    echo "Ключові налаштування:"
    grep -E "^(PORT|NODE_ENV|CONTRACT_ADDRESS|IRYS_RPC_URL)" server/.env | sed 's/^/   /'
else
    echo -e "❌ server/.env відсутній"
fi

# 5. Перевірити ABI файл
echo -e "\n${YELLOW}5. BLOCKCHAIN ФАЙЛИ${NC}"
if [ -f "artifacts/SlotMachineBank.abi.json" ]; then
    echo -e "✅ ABI файл присутній"
    echo "Розмір ABI файлу: $(wc -c < artifacts/SlotMachineBank.abi.json) байт"
else
    echo -e "❌ ABI файл відсутній"
fi

# 6. Тест запуску з детальним виводом
echo -e "\n${YELLOW}6. ТЕСТ ЗАПУСКУ СЕРВЕРА${NC}"
echo "Запускаємо сервер з детальним виводом (10 секунд)..."
echo "=================================="

cd $PROJECT_DIR
timeout 10s sudo -u www-data NODE_ENV=production DEBUG=* node server/server.js &
SERVER_PID=$!

sleep 3

# 7. Тест підключення під час роботи
echo -e "\n${YELLOW}7. ТЕСТ ПІДКЛЮЧЕННЯ${NC}"
echo "Тестуємо підключення до сервера..."

# Простий TCP тест
if timeout 5s bash -c "</dev/tcp/127.0.0.1/3001"; then
    echo -e "✅ TCP підключення: ${GREEN}УСПІШНЕ${NC}"
else
    echo -e "❌ TCP підключення: ${RED}НЕВДАЛЕ${NC}"
fi

# HTTP тест
echo "HTTP тест:"
curl -v -m 5 http://127.0.0.1:3001/health 2>&1 | head -20

# 8. Завершити тестовий сервер
echo -e "\n${YELLOW}8. ЗАВЕРШЕННЯ ТЕСТУ${NC}"
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "Зупиняємо тестовий сервер..."
    kill $SERVER_PID
    wait $SERVER_PID 2>/dev/null
fi

# 9. Аналіз логів
echo -e "\n${YELLOW}9. АНАЛІЗ ПОМИЛОК${NC}"
if [ -f "$PROJECT_DIR/logs/error.log" ]; then
    echo "Останні помилки з логу:"
    tail -10 $PROJECT_DIR/logs/error.log | sed 's/^/   /'
else
    echo "Лог файл помилок не знайдено"
fi

# 10. Рекомендації
echo -e "\n${YELLOW}10. РЕКОМЕНДАЦІЇ${NC}"
echo "=================================="

if [ ! -f "artifacts/SlotMachineBank.abi.json" ]; then
    echo "1. Скомпілювати смарт-контракт: node compile.cjs"
fi

if [ ! -d "node_modules/express" ]; then
    echo "2. Встановити залежності: npm install"
fi

echo "3. Для ручного запуску: cd $PROJECT_DIR && sudo -u www-data node server/server.js"
echo "4. Для перезапуску сервісу: sudo systemctl restart iryslots-server"
echo "5. Для перегляду логів: sudo journalctl -u iryslots-server -f"