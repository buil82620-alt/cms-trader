# CMS Docker Deployment

## Build và chạy CMS với Docker

### 1. Build Docker image

```bash
cd cms
docker build -f Dockerfile -t trader-cms:latest ..
```

Hoặc từ root directory:

```bash
docker build -f cms/Dockerfile -t trader-cms:latest .
```

### 2. Chạy với Docker

```bash
docker run -d \
  --name trader-cms \
  -p 4322:4322 \
  -e DATABASE_URL="postgresql://user:password@host:5432/dbname" \
  -e PUBLIC_SOCKET_URL="http://localhost:3001" \
  trader-cms:latest
```

### 3. Chạy với Docker Compose

```bash
cd cms
docker-compose up -d
```

Đảm bảo đã tạo network trước:

```bash
docker network create trader-network
```

Hoặc sửa `docker-compose.yml` để tự tạo network:

```yaml
networks:
  trader-network:
    driver: bridge
```

### 4. Environment Variables

Tạo file `.env` hoặc set các biến môi trường:

- `DATABASE_URL`: PostgreSQL connection string
- `PUBLIC_SOCKET_URL`: Socket server URL (optional, default: http://localhost:3001)
- `NODE_ENV`: production (set automatically in Dockerfile)

### 5. Kiểm tra logs

```bash
docker logs trader-cms
```

### 6. Stop và remove container

```bash
docker stop trader-cms
docker rm trader-cms
```

## Development với Docker

Để chạy dev mode trong Docker:

```bash
docker run -it --rm \
  -p 4322:4322 \
  -v $(pwd):/app/cms \
  -e DATABASE_URL="..." \
  -w /app/cms \
  node:20-alpine \
  sh -c "yarn install && yarn dev"
```

## Troubleshooting

### Lỗi "Cannot find module '@prisma/client'"

Đảm bảo Prisma Client đã được generate:

```bash
npx prisma generate
```

### Lỗi "DATABASE_URL is required"

Set environment variable `DATABASE_URL` khi chạy container.

### Port đã được sử dụng

Thay đổi port mapping:

```bash
docker run -p 4323:4322 ...
```

