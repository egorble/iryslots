#!/bin/bash

# Скрипт для перевірки DNS налаштувань
# Домен: iryslots.xyz

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="iryslots.xyz"

echo -e "${BLUE}🔍 Перевірка DNS для домену $DOMAIN${NC}"
echo ""

# Отримання IP адреси сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || curl -s icanhazip.com)
echo -e "${BLUE}IP адреса вашого сервера: ${GREEN}$SERVER_IP${NC}"
echo ""

# Функція для перевірки DNS
check_dns_record() {
    local domain=$1
    local record_type=$2
    
    echo -e "${YELLOW}Перевірка $record_type запису для $domain:${NC}"
    
    # Перевірка через nslookup
    if command -v nslookup &> /dev/null; then
        echo "  nslookup результат:"
        nslookup $domain | grep -E "(Address|Name)" | head -4 | sed 's/^/    /'
    fi
    
    # Перевірка через dig
    if command -v dig &> /dev/null; then
        echo "  dig результат:"
        dig +short $domain | sed 's/^/    /'
    fi
    
    # Перевірка через різні DNS сервери
    echo "  Перевірка через Google DNS (8.8.8.8):"
    nslookup $domain 8.8.8.8 2>/dev/null | grep "Address" | tail -1 | sed 's/^/    /'
    
    echo "  Перевірка через Cloudflare DNS (1.1.1.1):"
    nslookup $domain 1.1.1.1 2>/dev/null | grep "Address" | tail -1 | sed 's/^/    /'
    
    echo ""
}

# Перевірка основного домену
check_dns_record "$DOMAIN" "A"

# Перевірка www піддомену
check_dns_record "www.$DOMAIN" "A"

# Перевірка доступності через HTTP
echo -e "${YELLOW}Перевірка HTTP доступності:${NC}"
if curl -I -s --connect-timeout 10 http://$DOMAIN > /dev/null 2>&1; then
    echo -e "  ✅ http://$DOMAIN ${GREEN}доступний${NC}"
else
    echo -e "  ❌ http://$DOMAIN ${RED}недоступний${NC}"
fi

if curl -I -s --connect-timeout 10 http://www.$DOMAIN > /dev/null 2>&1; then
    echo -e "  ✅ http://www.$DOMAIN ${GREEN}доступний${NC}"
else
    echo -e "  ❌ http://www.$DOMAIN ${RED}недоступний${NC}"
fi

# Перевірка HTTPS (якщо SSL вже налаштований)
echo -e "${YELLOW}Перевірка HTTPS доступності:${NC}"
if curl -I -s --connect-timeout 10 https://$DOMAIN > /dev/null 2>&1; then
    echo -e "  ✅ https://$DOMAIN ${GREEN}доступний${NC}"
    
    # Перевірка сертифіката
    echo -e "${YELLOW}Інформація про SSL сертифікат:${NC}"
    echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null | sed 's/^/    /'
else
    echo -e "  ❌ https://$DOMAIN ${RED}недоступний${NC}"
fi

echo ""
echo -e "${BLUE}📋 Рекомендації:${NC}"

# Перевірка чи IP співпадає
RESOLVED_IP=$(nslookup $DOMAIN 2>/dev/null | grep "Address" | tail -1 | awk '{print $2}')
if [ "$RESOLVED_IP" = "$SERVER_IP" ]; then
    echo -e "  ✅ DNS налаштований правильно"
    echo -e "  ${GREEN}Можете запустити: sudo ./setup-ssl.sh${NC}"
else
    echo -e "  ❌ DNS налаштований неправильно"
    echo -e "  ${RED}Поточний IP в DNS: $RESOLVED_IP${NC}"
    echo -e "  ${RED}IP вашого сервера: $SERVER_IP${NC}"
    echo ""
    echo -e "  ${YELLOW}Налаштуйте наступні DNS записи:${NC}"
    echo -e "    A запис: $DOMAIN -> $SERVER_IP"
    echo -e "    A запис: www.$DOMAIN -> $SERVER_IP"
    echo ""
    echo -e "  ${YELLOW}Після налаштування зачекайте 5-10 хвилин і запустіть цей скрипт знову${NC}"
fi

echo ""
echo -e "${BLUE}🛠️ Корисні команди:${NC}"
echo "  Перевірка DNS: nslookup $DOMAIN"
echo "  Перевірка HTTP: curl -I http://$DOMAIN"
echo "  Перевірка HTTPS: curl -I https://$DOMAIN"
echo "  Налаштування SSL: sudo ./setup-ssl.sh"