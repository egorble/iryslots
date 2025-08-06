#!/bin/bash

# Додаткові налаштування безпеки для сервера
# Домен: iryslots.xyz

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

DOMAIN="iryslots.xyz"

log "🔒 Налаштування додаткової безпеки сервера..."

# Встановлення fail2ban
log "Встановлення fail2ban..."
apt install -y fail2ban

# Конфігурація fail2ban для nginx
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true

[nginx-noscript]
enabled = true

[nginx-badbots]
enabled = true

[nginx-noproxy]
enabled = true

[nginx-limit-req]
enabled = true
port = http,https
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

systemctl enable fail2ban
systemctl restart fail2ban

# Налаштування логротate для nginx
log "Налаштування ротації логів..."
cat > /etc/logrotate.d/nginx << EOF
/var/log/nginx/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data adm
    sharedscripts
    prerotate
        if [ -d /etc/logrotate.d/httpd-prerotate ]; then \
            run-parts /etc/logrotate.d/httpd-prerotate; \
        fi \
    endprerotate
    postrotate
        invoke-rc.d nginx rotate >/dev/null 2>&1
    endscript
}
EOF

# Створення скрипта для моніторингу
log "Створення скрипта моніторингу..."
cat > /usr/local/bin/monitor-iryslots.sh << 'EOF'
#!/bin/bash

DOMAIN="iryslots.xyz"
EMAIL="egor4042007@gmail.com"
LOG_FILE="/var/log/iryslots-monitor.log"

check_service() {
    local service=$1
    if ! systemctl is-active --quiet $service; then
        echo "$(date): $service is down, attempting restart..." >> $LOG_FILE
        systemctl restart $service
        if systemctl is-active --quiet $service; then
            echo "$(date): $service restarted successfully" >> $LOG_FILE
        else
            echo "$(date): Failed to restart $service" >> $LOG_FILE
            # Тут можна додати відправку email або Telegram повідомлення
        fi
    fi
}

check_website() {
    if ! curl -f -s https://$DOMAIN > /dev/null; then
        echo "$(date): Website $DOMAIN is not responding" >> $LOG_FILE
        # Перевірка nginx
        check_service nginx
    fi
}

# Перевірка сервісів
check_service nginx
check_website

# Перевірка PM2 процесів
if command -v pm2 &> /dev/null; then
    if ! pm2 list | grep -q "online"; then
        echo "$(date): PM2 processes are down, attempting restart..." >> $LOG_FILE
        pm2 restart all
    fi
fi

# Очищення старих логів (старше 30 днів)
find /var/log -name "*.log" -type f -mtime +30 -delete 2>/dev/null || true
EOF

chmod +x /usr/local/bin/monitor-iryslots.sh

# Додавання до crontab
log "Додавання моніторингу до crontab..."
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/monitor-iryslots.sh") | crontab -

# Створення backup скрипта
log "Створення скрипта для backup..."
cat > /usr/local/bin/backup-iryslots.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/var/backups/iryslots"
PROJECT_DIR="/var/www/iryslots"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup файлів проекту
tar -czf $BACKUP_DIR/iryslots_files_$DATE.tar.gz -C /var/www iryslots

# Backup nginx конфігурації
cp /etc/nginx/sites-available/iryslots $BACKUP_DIR/nginx_config_$DATE

# Видалення старих backup'ів (старше 7 днів)
find $BACKUP_DIR -name "*.tar.gz" -type f -mtime +7 -delete
find $BACKUP_DIR -name "nginx_config_*" -type f -mtime +7 -delete

echo "$(date): Backup completed successfully" >> /var/log/iryslots-backup.log
EOF

chmod +x /usr/local/bin/backup-iryslots.sh

# Додавання backup до crontab (щоденно о 2:00)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-iryslots.sh") | crontab -

# Налаштування SSH безпеки (якщо потрібно)
log "Перевірка SSH конфігурації..."
if grep -q "PermitRootLogin yes" /etc/ssh/sshd_config; then
    warning "Рекомендується відключити root login через SSH"
    echo "Для відключення виконайте:"
    echo "sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config"
    echo "systemctl restart ssh"
fi

# Показ інформації про DNS
log "📋 Інформація про DNS налаштування:"
echo -e "${YELLOW}Додайте наступні DNS записи у вашого провайдера домену:${NC}"
echo "A запис:     $DOMAIN        -> IP_АДРЕСА_СЕРВЕРА"
echo "A запис:     www.$DOMAIN    -> IP_АДРЕСА_СЕРВЕРА"
echo ""
echo "Для перевірки DNS використовуйте:"
echo "nslookup $DOMAIN"
echo "dig $DOMAIN"

log "✅ Налаштування безпеки завершено!"
echo -e "${GREEN}Створені сервіси:${NC}"
echo "- fail2ban для захисту від атак"
echo "- Моніторинг сервісів кожні 5 хвилин"
echo "- Щоденний backup о 2:00"
echo "- Ротація логів"