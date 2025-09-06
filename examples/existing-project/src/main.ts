import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS 설정
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://your-production-domain.com']
        : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('NestJS User Management API')
    .setDescription(
      `
      NestJS 기반의 사용자 관리 및 게시글 CRUD 시스템 API
      
      ## 주요 기능
      - 🔐 JWT 기반 인증 시스템
      - 👥 사용자 관리 (CRUD)
      - 📄 페이지네이션과 검색 기능
      - 🛡️ Role 기반 권한 관리
      
      ## 인증 방법
      1. POST /api/v1/auth/login 으로 로그인
      2. 응답으로 받은 accessToken을 Bearer 토큰으로 사용
      3. 만료 시 refreshToken으로 갱신
      
      ## 에러 응답 형식
      모든 에러는 다음 형태로 응답됩니다:
      \`\`\`json
      {
        "statusCode": 400,
        "message": "에러 메시지",
        "error": "Bad Request",
        "timestamp": "2025-09-06T18:26:44.123Z",
        "path": "/api/v1/users"
      }
      \`\`\`
    `,
    )
    .setVersion('1.0.1')
    .setTermsOfService('https://example.com/terms')
    .setContact(
      'API Support',
      'https://example.com/support',
      'support@example.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'JWT 토큰을 입력하세요',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag(
      'Authentication',
      '🔐 인증 관련 API - 로그인, 토큰 갱신, 프로필 조회',
    )
    .addTag('Users', '👥 사용자 관리 API - 사용자 CRUD, 검색, 페이징')
    .addTag('Health', '🏥 시스템 상태 확인 API - DB 연결, 서비스 상태 모니터링')
    .addServer('http://localhost:3000', '개발 서버')
    .addServer('https://api.example.com', '운영 서버')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'User Management API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .topbar-wrapper .link { display: none; }
      .swagger-ui .topbar { background-color: #1976d2; }
      .swagger-ui .info .title { color: #1976d2; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      tryItOutEnabled: true,
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📖 Swagger documentation: http://localhost:${port}/api`);
}

void bootstrap();
