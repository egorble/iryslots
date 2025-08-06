# 🚀 Деплой сайту iryslots.xyz

Цей набір скриптів автоматично налаштовує ваш сервер для хостингу сайту з доменом `iryslots.xyz`.

## 📋 Що включено

- **nginx** - веб-сервер з оптимізованою конфігурацією
- **SSL сертифікат** - безкоштовний від Let's Encrypt
- **PM2** - менеджер процесів для Node.js
- **Безпека** - fail2ban, файрвол, моніторинг
- **Backup** - автоматичне резервне копіювання
- **Логування** - ротація логів та моніторинг

## 🛠️ Передумови

1. **Ubuntu/Debian сервер** з root доступом
2. **Домен iryslots.xyz** з налаштованими DNS записами:
   ```
   A запис: iryslots.xyz     -> IP_ВАШОГО_СЕРВЕРА
   A запис: www.iryslots.xyz -> IP_ВАШОГО_СЕРВЕРА
   ```
3. **Відкриті порти**: 80, 443, 22

## 🚀 Швидкий старт

### 1. Завантажте скрипти на сервер
```bash
# Завантажте всі файли в одну папку на сервері
scp *.sh user@your-server:/home/user/deployment/
```

### 2. Запустіть головний скрипт
```bash
sudo chmod +x install.sh
sudo ./install.sh
```

### 3. Скопіюйте файли проекту
```bash
# Скопіюйте ваш проект в /var/www/iryslots
sudo cp -r /path/to/your/project/* /var/www/iryslots/
sudo chown -R www-data:www-data /var/www/iryslots
```

## 📁 Структура файлів

```
deployment/
├── install.sh              # Головний скрипт
├── deploy-server.sh         # Налаштування nginx + SSL
├── setup-pm2.sh            # Налаштування PM2
├── security-setup.sh       # Безпека та моніторинг
└── DEPLOYMENT_README.md    # Ця інструкція
```

## ⚙️ Детальне налаштування

### Nginx конфігурація
- Автоматичний редірект HTTP → HTTPS
- Gzip стиснення
- Кешування статичних файлів
- Проксі для API (/api/) на порт 3001
- Проксі для Netlify Functions (/.netlify/functions/) на порт 8888

### PM2 процеси
- `iryslots-server` - ваш Node.js сервер (порт 3001)
- `netlify-dev` - Netlify Dev сервер (порт 8888)

### Автоматичні задачі
- **Моніторинг** - кожні 5 хвилин перевіряє сервіси
- **Backup** - щоденно о 2:00 ранку
- **SSL оновлення** - автоматично через certbot

## 🔧 Управління після деплою

### Основні команди
```bash
# Статус всіх сервісів
sudo systemctl status nginx
pm2 status

# Перезапуск
sudo systemctl restart nginx
pm2 restart all

# Логи
tail -f /var/log/nginx/error.log
pm2 logs

# Моніторинг PM2
pm2 monit
```

### Оновлення коду
```bash
# 1. Завантажте нові файли
sudo cp -r /new/code/* /var/www/iryslots/

# 2. Встановіть залежності (якщо потрібно)
cd /var/www/iryslots
sudo npm install

# 3. Зберіть проект (якщо потрібно)
sudo npm run build

# 4. Перезапустіть сервіси
pm2 restart all
sudo systemctl reload nginx
```

## 🔍 Перевірка роботи

### Тести після деплою
```bash
# Перевірка доступності сайту
curl -I https://iryslots.xyz

# Перевірка SSL
openssl s_client -connect iryslots.xyz:443 -servername iryslots.xyz

# Перевірка nginx конфігурації
sudo nginx -t

# Перевірка DNS
nslookup iryslots.xyz
```

## 🚨 Вирішення проблем

### Сайт не відкривається
1. Перевірте DNS: `nslookup iryslots.xyz`
2. Перевірте nginx: `sudo systemctl status nginx`
3. Перевірте логи: `tail -f /var/log/nginx/error.log`

### SSL не працює
1. Перевірте сертифікат: `sudo certbot certificates`
2. Оновіть сертифікат: `sudo certbot renew`
3. Перевірте nginx конфігурацію: `sudo nginx -t`

### API не працює
1. Перевірте PM2: `pm2 status`
2. Перевірте логи: `pm2 logs`
3. Перезапустіть: `pm2 restart all`

## 📞 Підтримка

- **Email**: egor4042007@gmail.com
- **Домен**: iryslots.xyz
- **Логи**: `/var/log/nginx/` та `pm2 logs`

## 🔐 Безпека

Скрипт автоматично налаштовує:
- fail2ban для захисту від атак
- UFW файрвол
- Безпечні заголовки nginx
- Автоматичний моніторинг
- Регулярні backup'и

---

**Примітка**: Переконайтеся, що DNS записи налаштовані до запуску скриптів, інакше SSL сертифікат не зможе бути отриманий.