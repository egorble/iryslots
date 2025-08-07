#!/bin/bash

# Комплексна перевірка готовності деплою
# Домен: iryslots.xyz

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="iryslots.xyz"
PROJECT_DIR="/var/www/iryslots"

echo -e "${BLUE}🔍 КОМПЛЕКСНА ПЕРЕВІРКА ГОТОВНОСТІ СИСТЕМИ${NC}"
echo "=================================================="

# Функції для перевірки
check_status() {
    local service=$1
    local description=$2
    
    if systemctl is-active --quiet $service; then
        echo -e "✅ $description: ${GREEN}ПРАЦЮЄ${NC}"
        return 0
    else
        echo -e "❌ $description: ${RED}НЕ ПРАЦЮЄ${NC}"
        return 1
    fi
}

check_port() {
    local port=$1
    local description=$2
    
    if netstat -tuln | grep -q ":$port "; then
        local process=$(sudo lsof -i :$port 2>/dev/null | tail -n 1 | awk '{print $1}')
        echo -e "✅ Порт $port ($description): ${GREEN}ВІДКРИТИЙ${NC} ($process)"
        return 0
    else
        echo -e "❌ Порт $port ($description): ${RED}ЗАКРИТИЙ${NC}"
        return 1
    fi
}

check_url() {
    local url=$1
    local description=$2
    
    if curl -f -s --connect-timeout 10 "$url" > /dev/null 2>&1; then
        echo -e "✅ $description: ${GREEN}ДОСТУПНИЙ${NC}"
        return 0
    else
        echo -e "❌ $description: ${RED}НЕДОСТУПНИЙ${NC}"
        return 1
    fi
}

# 1. Перевірка системних сервісів
echo -e "\n${YELLOW}1. СИСТЕМНІ СЕРВІСИ${NC}"
echo "------------------------"
check_status nginx "Nginx веб-сервер"
check_status iryslots-server "Node.js сервер"

# 2. Перевірка портів
echo -e "\n${YELLOW}2. МЕРЕЖЕВІ ПОРТИ${NC}"
echo "------------------------"
check_port 80 "HTTP"
check_port 443 "HTTPS"
check_port 3001 "Node.js API"

# 3. Перевірка DNS
echo -e "\n${YELLOW}3. DNS НАЛАШТУВАННЯ${NC}"
echo "------------------------"
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "невідомий")
RESOLVED_IP=$(nslookup $DOMAIN 2>/dev/null | grep "Address" | tail -1 | awk '{print $2}' 2>/dev/null || echo "невідомий")

echo "IP сервера: $SERVER_IP"
echo "DNS резолв: $RESOLVED_IP"

if [ "$SERVER_IP" = "$RESOLVED_IP" ]; then
    echo -e "✅ DNS: ${GREEN}НАЛАШТОВАНИЙ ПРАВИЛЬНО${NC}"
else
    echo -e "❌ DNS: ${RED}НЕПРАВИЛЬНО НАЛАШТОВАНИЙ${NC}"
fi

# 4. Перевірка веб-доступності
echo -e "\n${YELLOW}4. ВЕБ-ДОСТУПНІСТЬ${NC}"
echo "------------------------"
check_url "http://$DOMAIN" "HTTP сайт"
check_url "https://$DOMAIN" "HTTPS сайт"
check_url "https://$DOMAIN/api/stats" "API endpoint"

# 5. Перевірка SSL сертифіката
echo -e "\n${YELLOW}5. SSL СЕРТИФІКАТ${NC}"
echo "------------------------"
if openssl s_client -servername $DOMAIN -connect $DOMAIN:443 </dev/null 2>/dev/null | openssl x509 -noout -dates 2>/dev/null; then
    echo -e "✅ SSL сертифікат: ${GREEN}АКТИВНИЙ${NC}"
    echo "Термін дії:"
    openssl s_client -servername $DOMAIN -connect $DOMAIN:443 </dev/null 2>/dev/null | openssl x509 -noout -dates 2>/dev/null | sed 's/^/   /'
else
    echo -e "❌ SSL сертифікат: ${RED}ПРОБЛЕМА${NC}"
fi

# 6. Перевірка файлів проекту
echo -e "\n${YELLOW}6. ФАЙЛИ ПРОЕКТУ${NC}"
echo "------------------------"
if [ -f "$PROJECT_DIR/index.html" ]; then
    echo -e "✅ Фронтенд: ${GREEN}ЗБУДОВАНИЙ${NC}"
else
    echo -e "❌ Фронтенд: ${RED}НЕ ЗБУДОВАНИЙ${NC}"
fi

if [ -f "$PROJECT_DIR/server/server.js" ]; then
    echo -e "✅ Серверний код: ${GREEN}ПРИСУТНІЙ${NC}"
else
    echo -e "❌ Серверний код: ${RED}ВІДСУТНІЙ${NC}"
fi

if [ -f "$PROJECT_DIR/.env" ]; then
    echo -e "✅ Конфігурація (.env): ${GREEN}ПРИСУТНЯ${NC}"
else
    echo -e "❌ Конфігурація (.env): ${RED}ВІДСУТНЯ${NC}"
fi

# 7. Перевірка логів
echo -e "\n${YELLOW}7. ЛОГИ СИСТЕМИ${NC}"
echo "------------------------"
echo "Останні помилки nginx:"
sudo tail -n 3 /var/log/nginx/error.log 2>/dev/null | sed 's/^/   /' || echo "   Логи недоступні"

echo "Статус Node.js сервера:"
sudo journalctl -u iryslots-server -n 3 --no-pager 2>/dev/null | sed 's/^/   /' || echo "   Логи недоступні"

# 8. Перевірка ресурсів
echo -e "\n${YELLOW}8. СИСТЕМНІ РЕСУРСИ${NC}"
echo "------------------------"
echo "Використання диску:"
df -h / | tail -1 | awk '{print "   Використано: " $3 " з " $2 " (" $5 ")"}'

echo "Використання пам'яті:"
free -h | grep Mem | awk '{print "   Використано: " $3 " з " $2}'

echo "Завантаження системи:"
uptime | awk '{print "   " $0}'

# 9. Тестування API
echo -e "\n${YELLOW}9. ТЕСТУВАННЯ API${NC}"
echo "------------------------"
if curl -f -s "https://$DOMAIN/health" > /dev/null 2>&1; then
    echo -e "✅ Health check: ${GREEN}ПРАЦЮЄ${NC}"
    echo "Відповідь сервера:"
    curl -s "https://$DOMAIN/health" | jq . 2>/dev/null | head -10 | sed 's/^/   /' || echo "   JSON недоступний"
else
    echo -e "❌ Health check: ${RED}НЕ ПРАЦЮЄ${NC}"
fi

# 10. Підсумок
echo -e "\n${BLUE}📊 ПІДСУМОК${NC}"
echo "=================================================="

# Підрахунок успішних перевірок
TOTAL_CHECKS=0
PASSED_CHECKS=0

# Перевірка основних компонентів
if systemctl is-active --quiet nginx; then ((PASSED_CHECKS++)); fi; ((TOTAL_CHECKS++))
if systemctl is-active --quiet iryslots-server; then ((PASSED_CHECKS++)); fi; ((TOTAL_CHECKS++))
if curl -f -s "https://$DOMAIN" > /dev/null 2>&1; then ((PASSED_CHECKS++)); fi; ((TOTAL_CHECKS++))
if curl -f -s "https://$DOMAIN/health" > /dev/null 2>&1; then ((PASSED_CHECKS++)); fi; ((TOTAL_CHECKS++))

PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

if [ $PERCENTAGE -ge 75 ]; then
    echo -e "🎉 Система готова до роботи: ${GREEN}$PASSED_CHECKS/$TOTAL_CHECKS перевірок пройдено ($PERCENTAGE%)${NC}"
    echo -e "${GREEN}✅ Ваш сайт доступний: https://$DOMAIN${NC}"
elif [ $PERCENTAGE -ge 50 ]; then
    echo -e "⚠️  Система частково готова: ${YELLOW}$PASSED_CHECKS/$TOTAL_CHECKS перевірок пройдено ($PERCENTAGE%)${NC}"
    echo -e "${YELLOW}Потрібні додаткові налаштування${NC}"
else
    echo -e "❌ Система не готова: ${RED}$PASSED_CHECKS/$TOTAL_CHECKS перевірок пройдено ($PERCENTAGE%)${NC}"
    echo -e "${RED}Потрібне серйозне втручання${NC}"
fi

echo -e "\n${YELLOW}🛠️  КОРИСНІ КОМАНДИ:${NC}"
echo "Перезапуск nginx: sudo systemctl restart nginx"
echo "Перезапуск сервера: sudo systemctl restart iryslots-server"
echo "Перегляд логів: sudo journalctl -u iryslots-server -f"
echo "Збірка фронтенду: sudo ./build-frontend.sh"
echo "Перевірка портів: sudo netstat -tulpn | grep -E ':(80|443|3001)'"