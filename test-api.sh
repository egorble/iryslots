#!/bin/bash

# Тест API підключення

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔧 ТЕСТ API ПІДКЛЮЧЕННЯ${NC}"
echo "=========================="

# 1. Перевірка сервера
echo -e "\n${YELLOW}1. СТАТУС СЕРВЕРА${NC}"
if systemctl is-active --quiet iryslots-server; then
    echo -e "✅ Сервіс: ${GREEN}АКТИВНИЙ${NC}"
else
    echo -e "❌ Сервіс: ${RED}НЕАКТИВНИЙ${NC}"
    echo "Запускаємо сервіс..."
    sudo systemctl start iryslots-server
    sleep 3
fi

# 2. Перевірка порту
echo -e "\n${YELLOW}2. ПЕРЕВІРКА ПОРТУ${NC}"
if sudo ss -tlnp | grep -q ":3001"; then
    echo -e "✅ Порт 3001: ${GREEN}СЛУХАЄ${NC}"
    sudo ss -tlnp | grep ":3001"
else
    echo -e "❌ Порт 3001: ${RED}НЕ СЛУХАЄ${NC}"
fi

# 3. Тест прямого підключення
echo -e "\n${YELLOW}3. ПРЯМЕ ПІДКЛЮЧЕННЯ${NC}"
echo "Тест 127.0.0.1:3001..."
if timeout 5s curl -f -s http://127.0.0.1:3001/health > /dev/null; then
    echo -e "✅ Локальне підключення: ${GREEN}ПРАЦЮЄ${NC}"
    echo "Відповідь:"
    curl -s http://127.0.0.1:3001/health | head -5 | sed 's/^/   /'
else
    echo -e "❌ Локальне підключення: ${RED}НЕ ПРАЦЮЄ${NC}"
    echo "Детальна діагностика:"
    curl -v -m 5 http://127.0.0.1:3001/health 2>&1 | head -10 | sed 's/^/   /'
fi

# 4. Тест через nginx
echo -e "\n${YELLOW}4. ТЕСТ ЧЕРЕЗ NGINX${NC}"
echo "Тест https://iryslots.xyz/api/stats..."
if timeout 10s curl -f -s https://iryslots.xyz/api/stats > /dev/null; then
    echo -e "✅ Nginx проксі: ${GREEN}ПРАЦЮЄ${NC}"
    echo "Відповідь:"
    curl -s https://iryslots.xyz/api/stats | head -5 | sed 's/^/   /'
else
    echo -e "❌ Nginx проксі: ${RED}НЕ ПРАЦЮЄ${NC}"
    echo "Детальна діагностика:"
    curl -v -m 10 https://iryslots.xyz/api/stats 2>&1 | head -15 | sed 's/^/   /'
fi

# 5. Перевірка nginx конфігурації
echo -e "\n${YELLOW}5. NGINX КОНФІГУРАЦІЯ${NC}"
echo "Перевірка проксі налаштувань..."
if grep -q "proxy_pass.*127.0.0.1:3001" /etc/nginx/sites-available/iryslots; then
    echo -e "✅ Проксі налаштування: ${GREEN}ПРАВИЛЬНІ${NC}"
else
    echo -e "❌ Проксі налаштування: ${RED}НЕПРАВИЛЬНІ${NC}"
    echo "Поточні налаштування:"
    grep -A2 -B2 "proxy_pass" /etc/nginx/sites-available/iryslots | sed 's/^/   /'
fi

# 6. Логи
echo -e "\n${YELLOW}6. ЛОГИ${NC}"
echo "Останні логи сервера:"
sudo journalctl -u iryslots-server -n 5 --no-pager | sed 's/^/   /'

echo "Останні помилки nginx:"
sudo tail -n 3 /var/log/nginx/error.log | sed 's/^/   /'

echo -e "\n${YELLOW}🛠️ ШВИДКЕ ВИПРАВЛЕННЯ:${NC}"
echo "sudo systemctl restart iryslots-server"
echo "sudo systemctl reload nginx"
echo "curl -v http://127.0.0.1:3001/health"