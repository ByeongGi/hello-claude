-- 데이터베이스 초기화 스크립트
-- Docker 컨테이너 시작시 자동 실행됨

-- 테스트용 데이터베이스 생성
CREATE DATABASE nestjs_user_management_test;

-- 개발용 확장 설치 (필요시)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 데이터베이스 연결 확인
SELECT 'Database initialized successfully' as status;