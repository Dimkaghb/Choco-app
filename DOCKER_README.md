# Docker Setup для Choco App

Этот документ содержит инструкции по запуску приложения Choco в Docker контейнерах.

## Структура Docker файлов

- `Dockerfile` - Docker образ для фронтенда (Next.js)
- `backend/dockerfile` - Docker образ для бекенда (FastAPI)
- `docker-compose.yml` - Оркестрация всех сервисов
- `backend/init-mongo.js` - Скрипт инициализации MongoDB

## Предварительные требования

- Docker Desktop установлен и запущен
- Docker Compose v2.0+

## Быстрый старт

### 1. Клонирование и подготовка

```bash
# Перейдите в директорию проекта
cd Choco-app
```

### 2. Запуск всех сервисов

```bash
# Сборка и запуск всех контейнеров
docker-compose up --build

# Или в фоновом режиме
docker-compose up --build -d
```

### 3. Доступ к приложению

- **Фронтенд**: http://localhost:9002
- **Бекенд API**: http://localhost:8000
- **API документация**: http://localhost:8000/docs
- **MongoDB**: localhost:27017

## Управление контейнерами

### Остановка сервисов

```bash
# Остановка всех контейнеров
docker-compose down

# Остановка с удалением volumes
docker-compose down -v
```

### Просмотр логов

```bash
# Логи всех сервисов
docker-compose logs

# Логи конкретного сервиса
docker-compose logs frontend
docker-compose logs backend
docker-compose logs mongodb

# Следить за логами в реальном времени
docker-compose logs -f
```

### Перезапуск сервисов

```bash
# Перезапуск всех сервисов
docker-compose restart

# Перезапуск конкретного сервиса
docker-compose restart backend
```

## Конфигурация

### Переменные окружения

Основные переменные окружения настроены в `docker-compose.yml`:

**Backend:**
- `MONGODB_URL` - URL подключения к MongoDB
- `DATABASE_NAME` - Имя базы данных
- `HOST` - Хост сервера (0.0.0.0)
- `PORT` - Порт сервера (8000)

**Frontend:**
- `NODE_ENV` - Режим работы (production)
- `NEXT_PUBLIC_API_URL` - URL бекенда
- `PORT` - Порт фронтенда (9002)

**MongoDB:**
- `MONGO_INITDB_ROOT_USERNAME` - Администратор БД
- `MONGO_INITDB_ROOT_PASSWORD` - Пароль администратора

### Volumes

- `mongodb_data` - Данные MongoDB
- `./backend/data` - Файлы данных бекенда
- `./backend/reports` - Сгенерированные отчеты

## Разработка

### Сборка отдельных образов

```bash
# Сборка фронтенда
docker build -t choco-frontend .

# Сборка бекенда
docker build -t choco-backend ./backend
```

### Запуск в режиме разработки

Для разработки рекомендуется запускать сервисы локально:

```bash
# Только MongoDB в Docker
docker-compose up mongodb -d

# Бекенд локально
cd backend
pip install -r requirements.txt
python -m uvicorn src.main:app --reload --port 8000

# Фронтенд локально
npm install
npm run dev
```

## Troubleshooting

### Проблемы с портами

Если порты заняты, измените их в `docker-compose.yml`:

```yaml
ports:
  - "9003:9002"  # Изменить внешний порт
```

### Проблемы с MongoDB

```bash
# Очистка данных MongoDB
docker-compose down -v
docker volume rm choco-app_mongodb_data
```

### Проблемы со сборкой

```bash
# Очистка Docker кеша
docker system prune -a

# Пересборка без кеша
docker-compose build --no-cache
```

### Проверка состояния сервисов

```bash
# Статус контейнеров
docker-compose ps

# Health check
curl http://localhost:8000/health
curl http://localhost:9002
```

## Производственное развертывание

Для production рекомендуется:

1. Использовать внешнюю MongoDB (MongoDB Atlas)
2. Настроить SSL/TLS сертификаты
3. Использовать reverse proxy (nginx)
4. Настроить мониторинг и логирование
5. Использовать Docker Swarm или Kubernetes

### Пример production конфигурации

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    environment:
      - MONGODB_URL=${MONGODB_ATLAS_URL}
      - NODE_ENV=production
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

```bash
# Запуск в production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```