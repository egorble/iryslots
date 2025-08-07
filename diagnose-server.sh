#!/bin/bash

# Діагностика серверних проблем

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔍 ДІАГНОСТИКА СЕРВЕРНИХ ПРОБЛЕМ${NC}"
echo "=================================="

# 1. Перевірка статусу сервісу
echo -e "\n${YELLOW}1. СТАТУС СЕРВІСУ${NC}"
if systemctl is-active --quiet iryslots-server; then
    echo -e "✅ iryslots-server: ${GREEN}АКТИВНИЙ${NC}"
else
    echo -e "❌ iryslots-server: ${RED}НЕАКТИВНИЙ${NC}"
    echo "Спроба запуску..."
    sudo systemctl start iryslots-server
    sleep 3
fi

# 2. Перевірка портів
echo -e "\n${YELLOW}2. МЕРЕЖЕВІ ПОРТИ${NC}"
echo "Порти, що слухають:"
sudo ss -tlnp | grep -E ":(80|443|3001)" | while read line; do
    echo "   $line"
done

# 3. Перевірка процесів Node.js
echo -e "\n${YELLOW}3. NODE.JS ПРОЦЕСИ${NC}"
ps aux | grep -E "node.*server" | grep -v grep | while read line; do
    echo "   $line"
done

# 4. Тест локального підключення
echo -e "\n${YELLOW}4. ТЕСТ ЛОКАЛЬНОГО ПІДКЛЮЧЕННЯ${NC}"

echo "Тест 127.0.0.1:3001..."
if timeout 5s curl -f -s http://127.0.0.1:3001/health > /dev/null 2>&1; then
    echo -e "✅ 127.0.0.1:3001: ${GREEN}ПРАЦЮЄ${NC}"
else
    echo -e "❌ 127.0.0.1:3001: ${RED}НЕ ПРАЦЮЄ${NC}"
fi

echo "Тест localhost:3001..."
if timeout 5s curl -f -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "✅ localhost:3001: ${GREEN}ПРАЦЮЄ${NC}"
else
    echo -e "❌ localhost:3001: ${RED}НЕ ПРАЦЮЄ${NC}"
fi

# 5. Тест через nginx
echo -e "\n${YELLOW}5. ТЕСТ ЧЕРЕЗ NGINX${NC}"
echo "Тест https://iryslots.xyz/api/stats..."
if timeout 10s curl -f -s https://iryslots.xyz/api/stats > /dev/null 2>&1; then
    echo -e "✅ Nginx проксі: ${GREEN}ПРАЦЮЄ${NC}"
else
    echo -e "❌ Nginx проксі: ${RED}НЕ ПРАЦЮЄ${NC}"
    echo "Детальна діагностика nginx:"
    curl -v -m 5 https://iryslots.xyz/api/stats 2>&1 | head -10 | sed 's/^/   /'
fi

# 6. Перевірка файрволу
echo -e "\n${YELLOW}6. ФАЙРВОЛ${NC}"
if command -v ufw &> /dev/null; then
    echo "UFW статус:"
    sudo ufw status | sed 's/^/   /'
else
    echo "UFW не встановлений"
fi

# 7. Перевірка nginx конфігурації
echo -e "\n${YELLOW}7. NGINX КОНФІГУРАЦІЯ${NC}"
echo "Проксі налаштування для API:"
grep -A3 -B1 "location /api" /etc/nginx/sites-available/iryslots | sed 's/^/   /'

# 8. Останні логи
echo -e "\n${YELLOW}8. ОСТАННІ ЛОГИ${NC}"
echo "Останні логи iryslots-server:"
sudo journalctl -u iryslots-server -n 5 --no-pager | sed 's/^/   /'

echo -e "\nОстанні помилки nginx:"
sudo tail -n 3 /var/log/nginx/error.log | sed 's/^/   /'

# 9. Тест з детальним виводом
echo -e "\n${YELLOW}9. ДЕТАЛЬНИЙ ТЕСТ API${NC}"
echo "Тест з детальним виводом:"
curl -v -m 10 http://127.0.0.1:3001/health 2>&1 | head -15 | sed 's/^/   /'

echo -e "\n${YELLOW}🛠️ РЕКОМЕНДАЦІЇ:${NC}"
if ! systemctl is-active --quiet iryslots-server; then
    echo "1. Запустити сервіс: sudo systemctl start iryslots-server"
fi

if ! sudo ss -tlnp | grep -q ":3001"; then
    echo "2. Сервер не слухає на порту 3001 - перевірити конфігурацію"
fi

echo "3. Для ручного запуску: cd /var/www/iryslots && sudo -u www-data node server/server.js"
echo "4. Для перегляду логів: sudo journalctl -u iryslots-server -f"