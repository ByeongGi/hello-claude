# 배포 가이드

## 개요
NestJS 사용자 관리 및 게시글 CRUD 시스템의 배포 가이드 문서입니다.

## 환경 구성

### 필수 소프트웨어
- **Node.js**: v18 이상
- **npm**: v9 이상 또는 **yarn**: v1.22 이상
- **PostgreSQL**: v13 이상
- **Docker**: v20 이상 (Docker 배포 시)
- **Git**: v2.30 이상

### 환경 변수 설정

#### .env 파일 템플릿
```bash
# 애플리케이션 설정
NODE_ENV=production
PORT=3000
API_VERSION=v1

# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=nestjs_user
DB_PASSWORD=secure_password_123
DB_DATABASE=nestjs_crud_prod

# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-minimum-32-characters
JWT_EXPIRE_TIME=15m
JWT_REFRESH_EXPIRE_TIME=7d

# 보안 설정
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=https://your-frontend-domain.com

# 외부 서비스 (선택사항)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourcompany.com

# 모니터링 (선택사항)
LOG_LEVEL=info
ENABLE_SWAGGER=false
```

## 배포 방식

### 1. 전통적 배포 (PM2 사용)

#### 시스템 준비
```bash
# 1. Node.js 설치 (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. PostgreSQL 설치
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# 3. PM2 글로벌 설치
sudo npm install -g pm2

# 4. Nginx 설치 (리버스 프록시용)
sudo apt-get install nginx
```

#### 애플리케이션 배포
```bash
# 1. 프로젝트 클론
git clone https://github.com/your-repo/nestjs-crud-system.git
cd nestjs-crud-system

# 2. 의존성 설치
npm ci --production

# 3. 환경 변수 설정
cp .env.example .env
# .env 파일 편집

# 4. 데이터베이스 마이그레이션
npm run migration:run

# 5. 애플리케이션 빌드
npm run build

# 6. PM2로 시작
pm2 start ecosystem.config.js --env production

# 7. PM2 설정 저장
pm2 save
pm2 startup
```

#### ecosystem.config.js 설정
```javascript
module.exports = {
  apps: [
    {
      name: 'nestjs-crud-api',
      script: 'dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_file: './logs/app.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '500M'
    }
  ]
};
```

#### Nginx 설정
```nginx
# /etc/nginx/sites-available/nestjs-api
server {
    listen 80;
    server_name your-api-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 압축
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### 2. Docker 배포

#### Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# 의존성 설치를 위한 package files 복사
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 소스 코드 복사
COPY . .

# TypeScript 컴파일
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# 보안을 위한 non-root 유저 생성
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# 빌드된 애플리케이션과 의존성 복사
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# 포트 노출
EXPOSE 3000

# 유저 변경
USER nestjs

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# 애플리케이션 시작
CMD ["node", "dist/main.js"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      target: production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - db
      - redis
    networks:
      - app-network
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${DB_DATABASE}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db-init:/docker-entrypoint-initdb.d
    networks:
      - app-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - app-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - api
    networks:
      - app-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

#### Docker 배포 명령어
```bash
# 1. 환경 변수 파일 준비
cp .env.example .env
# .env 파일 편집

# 2. Docker 이미지 빌드 및 실행
docker-compose up -d --build

# 3. 데이터베이스 마이그레이션
docker-compose exec api npm run migration:run

# 4. 로그 확인
docker-compose logs -f api

# 5. 서비스 상태 확인
docker-compose ps
```

### 3. 클라우드 배포 (AWS 예시)

#### AWS ECS 배포
```bash
# 1. ECR 레포지토리 생성
aws ecr create-repository --repository-name nestjs-crud-api

# 2. Docker 이미지 빌드 및 푸시
docker build -t nestjs-crud-api .
docker tag nestjs-crud-api:latest 123456789.dkr.ecr.region.amazonaws.com/nestjs-crud-api:latest
docker push 123456789.dkr.ecr.region.amazonaws.com/nestjs-crud-api:latest

# 3. ECS 서비스 생성 (task-definition.json 필요)
aws ecs create-service --cli-input-json file://ecs-service.json
```

#### Kubernetes 배포
```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nestjs-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nestjs-api
  template:
    metadata:
      labels:
        app: nestjs-api
    spec:
      containers:
      - name: api
        image: your-registry/nestjs-crud-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        envFrom:
        - secretRef:
            name: api-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: nestjs-api-service
spec:
  selector:
    app: nestjs-api
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## 데이터베이스 설정

### PostgreSQL 설정
```bash
# 1. PostgreSQL 접속
sudo -u postgres psql

# 2. 데이터베이스 및 유저 생성
CREATE DATABASE nestjs_crud_prod;
CREATE USER nestjs_user WITH ENCRYPTED PASSWORD 'secure_password_123';
GRANT ALL PRIVILEGES ON DATABASE nestjs_crud_prod TO nestjs_user;

# 3. 연결 권한 설정 (/etc/postgresql/13/main/pg_hba.conf)
# local   all             nestjs_user                             md5
# host    all             nestjs_user     127.0.0.1/32            md5

# 4. PostgreSQL 재시작
sudo systemctl restart postgresql
```

### 마이그레이션 실행
```bash
# 프로덕션 환경에서 마이그레이션
NODE_ENV=production npm run migration:run

# 마이그레이션 상태 확인
NODE_ENV=production npm run migration:show
```

## SSL/TLS 설정

### Let's Encrypt 무료 SSL
```bash
# 1. Certbot 설치
sudo apt-get install certbot python3-certbot-nginx

# 2. SSL 인증서 발급
sudo certbot --nginx -d your-api-domain.com

# 3. 자동 갱신 설정
sudo crontab -e
# 다음 라인 추가:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### Nginx SSL 설정
```nginx
server {
    listen 443 ssl http2;
    server_name your-api-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-api-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-api-domain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # 나머지 location 설정...
}

# HTTP to HTTPS 리다이렉트
server {
    listen 80;
    server_name your-api-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 모니터링 및 로깅

### 로그 설정
```typescript
// logger.config.ts
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

export const loggerConfig = WinstonModule.createLogger({
  transports: [
    new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});
```

### Health Check 엔드포인트
```typescript
// health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
```

### 모니터링 스크립트
```bash
#!/bin/bash
# monitoring.sh

# API 상태 확인
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://your-api-domain.com/health)

if [ $API_STATUS != "200" ]; then
    echo "API is down! Status: $API_STATUS" | mail -s "API Alert" admin@yourcompany.com
fi

# 디스크 사용량 확인
DISK_USAGE=$(df / | grep -vE '^Filesystem|tmpfs|cdrom' | awk '{ print $5 }' | sed 's/%//g')

if [ $DISK_USAGE -gt 80 ]; then
    echo "Disk usage is at ${DISK_USAGE}%" | mail -s "Disk Alert" admin@yourcompany.com
fi

# 메모리 사용량 확인
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.2f"), $3/$2 * 100.0}')

if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo "Memory usage is at ${MEMORY_USAGE}%" | mail -s "Memory Alert" admin@yourcompany.com
fi
```

## 백업 전략

### 데이터베이스 백업
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/postgresql"
DB_NAME="nestjs_crud_prod"
DB_USER="nestjs_user"
DATE=$(date +%Y%m%d_%H%M%S)

# 백업 디렉토리 생성
mkdir -p $BACKUP_DIR

# 데이터베이스 백업
PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# 30일 이상된 백업 파일 삭제
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete

# 압축 백업 (선택사항)
gzip $BACKUP_DIR/backup_$DATE.sql

echo "Backup completed: backup_$DATE.sql.gz"
```

### 자동 백업 설정
```bash
# crontab -e 추가
# 매일 새벽 2시에 백업 실행
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

## 성능 최적화

### PM2 클러스터 모드 최적화
```javascript
// ecosystem.config.js 추가 설정
module.exports = {
  apps: [{
    name: 'nestjs-crud-api',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    node_args: '--max_old_space_size=512',
    env_production: {
      NODE_ENV: 'production',
      UV_THREADPOOL_SIZE: 128
    }
  }]
};
```

### Nginx 캐싱 설정
```nginx
# /etc/nginx/nginx.conf 추가
http {
    # 캐시 존 정의
    proxy_cache_path /var/cache/nginx/api levels=1:2 keys_zone=api_cache:10m inactive=60m use_temp_path=off;

    server {
        location /api/v1/users {
            proxy_pass http://localhost:3000;
            proxy_cache api_cache;
            proxy_cache_valid 200 5m;
            proxy_cache_key "$scheme$request_method$host$request_uri";
            add_header X-Cache-Status $upstream_cache_status;
        }
    }
}
```

## 보안 강화

### 방화벽 설정
```bash
# UFW 방화벽 설정
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 필요한 포트만 열기
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 5432  # PostgreSQL (내부 네트워크만)

# 로그 모니터링
sudo tail -f /var/log/ufw.log
```

### Fail2ban 설정
```bash
# Fail2ban 설치
sudo apt-get install fail2ban

# 설정 파일 생성 (/etc/fail2ban/jail.local)
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 6

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10
```

## 트러블슈팅

### 일반적인 문제 해결

#### 1. 메모리 부족
```bash
# 메모리 사용량 확인
free -h
ps aux --sort=-%mem | head

# 스왑 파일 생성
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### 2. 데이터베이스 연결 문제
```bash
# PostgreSQL 상태 확인
sudo systemctl status postgresql

# 연결 테스트
psql -h localhost -U nestjs_user -d nestjs_crud_prod

# 연결 수 확인
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
```

#### 3. 포트 충돌
```bash
# 포트 사용 확인
sudo netstat -tlnp | grep :3000
sudo lsof -i :3000

# 프로세스 종료
sudo kill -9 [PID]
```

### 로그 분석
```bash
# 애플리케이션 로그 확인
tail -f logs/application.log

# Nginx 로그 확인
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PM2 로그 확인
pm2 logs

# 시스템 로그 확인
sudo journalctl -u nginx -f
sudo journalctl -u postgresql -f
```

## 배포 체크리스트

### 배포 전 확인사항
- [ ] 환경 변수 설정 완료
- [ ] 데이터베이스 마이그레이션 실행
- [ ] SSL 인증서 설정
- [ ] 방화벽 규칙 설정
- [ ] 백업 스크립트 설정
- [ ] 모니터링 스크립트 설정
- [ ] Health Check 엔드포인트 작동 확인

### 배포 후 확인사항
- [ ] API 엔드포인트 응답 확인
- [ ] 데이터베이스 연결 확인
- [ ] 로그 파일 생성 확인
- [ ] 성능 메트릭 모니터링
- [ ] 보안 스캔 실행
- [ ] 백업 파일 생성 확인

## 유지보수 가이드

### 정기 유지보수 작업
- **일일**: 로그 확인, 시스템 리소스 모니터링
- **주간**: 백업 파일 확인, 보안 업데이트 적용
- **월간**: 성능 분석, 용량 계획 검토
- **분기**: 의존성 업데이트, 보안 감사

### 업데이트 절차
1. **개발 환경에서 테스트**
2. **스테이징 환경에서 검증**
3. **백업 수행**
4. **배포 실행**
5. **Health Check 확인**
6. **모니터링 지속**