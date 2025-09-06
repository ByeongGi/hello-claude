# Docker 개발 환경 가이드

Docker Compose를 사용한 로컬 개발 환경 설정 및 사용법입니다.

## 🐳 서비스 구성

- **PostgreSQL**: 메인 데이터베이스 (포트: 5432)
- **Redis**: 캐싱 서버 (포트: 6379) 
- **pgAdmin**: DB 관리 도구 (포트: 5050)

## 🚀 빠른 시작

### 1. Docker 설치 확인
```bash
docker --version
docker-compose --version
```

### 2. 개발 환경 시작
```bash
# Docker 서비스 시작 + NestJS 애플리케이션 실행
npm run dev:docker

# 또는 단계별 실행
npm run docker:up        # Docker 서비스만 시작
npm run start:dev        # NestJS 애플리케이션 실행
```

### 3. 서비스 접속
- **애플리케이션**: http://localhost:3000
- **API 문서**: http://localhost:3000/api
- **pgAdmin**: http://localhost:5050 (admin@admin.com / admin)

## 📋 주요 명령어

### Docker 관리
```bash
# 서비스 시작 (백그라운드)
npm run docker:up

# 서비스 중지
npm run docker:down

# 서비스 재시작
npm run docker:restart

# 로그 확인 (실시간)
npm run docker:logs

# 완전 정리 (볼륨 포함)
npm run docker:clean
```

### 테스트
```bash
# Docker 환경에서 E2E 테스트
npm run test:docker

# 일반 테스트
npm run test
npm run test:watch
npm run test:cov
```

## 🗄️ 데이터베이스 설정

### PostgreSQL 접속 정보
- **Host**: localhost
- **Port**: 5432
- **Database**: nestjs_user_management
- **Username**: postgres
- **Password**: password

### pgAdmin 설정
1. http://localhost:5050 접속
2. admin@admin.com / admin 로그인
3. 서버 추가:
   - Name: NestJS Local
   - Host: postgres (Docker 내부 네트워크)
   - Port: 5432
   - Username: postgres
   - Password: password

### 직접 DB 접속 (psql)
```bash
# Docker 컨테이너 내부 접속
docker exec -it nestjs-postgres psql -U postgres -d nestjs_user_management

# 테이블 확인
\dt

# 쿼리 실행
SELECT * FROM users;
```

## 🔧 환경 설정

### .env 파일
```bash
# Docker 환경용 설정을 .env로 복사
cp .env.docker .env

# 또는 수동으로 .env 수정
vim .env
```

### 환경별 설정 파일
- `.env`: 로컬 개발용 (기본)
- `.env.docker`: Docker 환경용
- `.env.example`: 템플릿

## 🧪 테스트 환경

### 테스트 DB 분리
- **개발 DB**: nestjs_user_management
- **테스트 DB**: nestjs_user_management_test

### Jest 설정
```bash
# 단위 테스트
npm run test

# E2E 테스트 (Docker DB 사용)
npm run test:e2e

# 커버리지 테스트
npm run test:cov
```

## 📊 모니터링

### Docker 상태 확인
```bash
# 실행 중인 컨테이너 확인
docker ps

# 특정 서비스 로그
docker-compose logs postgres
docker-compose logs redis

# 리소스 사용량
docker stats
```

### 데이터베이스 모니터링
```bash
# DB 연결 상태 확인
docker exec nestjs-postgres pg_isready -U postgres

# Redis 연결 확인
docker exec nestjs-redis redis-cli ping
```

## 🐛 트러블슈팅

### 포트 충돌
```bash
# 포트 사용 중인 프로세스 확인
lsof -i :5432
lsof -i :6379
lsof -i :5050

# 프로세스 종료
kill -9 [PID]
```

### 데이터 초기화
```bash
# 모든 데이터 삭제 후 재시작
npm run docker:clean
npm run docker:up
```

### 권한 문제
```bash
# Docker 권한 확인
sudo usermod -aG docker $USER

# 재로그인 필요
```

### 컨테이너 상태 확인
```bash
# 헬스체크 상태
docker-compose ps

# 상세 로그
docker-compose logs --tail=50 postgres
```

## 🔄 데이터 백업/복원

### 백업
```bash
# 데이터베이스 덤프
docker exec nestjs-postgres pg_dump -U postgres nestjs_user_management > backup.sql

# 전체 볼륨 백업
docker run --rm -v existing-project_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .
```

### 복원
```bash
# 데이터베이스 복원
docker exec -i nestjs-postgres psql -U postgres nestjs_user_management < backup.sql
```

## 🚀 프로덕션 배포 준비

### 환경 변수 보안
```bash
# .env 파일을 .gitignore에 추가
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
```

### Docker 이미지 최적화
```bash
# NestJS 애플리케이션 Dockerfile 생성 (향후)
# docker build -t nestjs-app .
# docker-compose -f docker-compose.prod.yml up -d
```

## 📚 참고 자료

- [NestJS Docker 가이드](https://docs.nestjs.com/recipes/sql-typeorm#docker)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Docker Compose 문서](https://docs.docker.com/compose/)
- [pgAdmin 설정 가이드](https://www.pgadmin.org/docs/pgadmin4/latest/container_deployment.html)

---

## 💡 개발 팁

### 빠른 개발 워크플로우
```bash
# 1. Docker 환경 시작
npm run dev:docker

# 2. 코드 변경 후 테스트
npm run test

# 3. API 테스트
npm run test:e2e

# 4. 작업 완료 후 정리
npm run docker:down
```

### VS Code 확장
- PostgreSQL (cweijan.vscode-postgresql-client2)
- Docker (ms-azuretools.vscode-docker)
- Thunder Client (rangav.vscode-thunder-client)

### 유용한 알리아스
```bash
# ~/.bashrc 또는 ~/.zshrc에 추가
alias dcu="npm run docker:up"
alias dcd="npm run docker:down"
alias dcl="npm run docker:logs"
alias dcr="npm run docker:restart"
```