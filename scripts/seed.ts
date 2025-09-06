import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SeedService } from '../src/infrastructure/database/seeds/seed.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('SeedScript');
  
  try {
    logger.log('🚀 NestJS 애플리케이션 부트스트랩 중...');
    const app = await NestFactory.createApplicationContext(AppModule);
    
    const seedService = app.get(SeedService);
    
    // 명령줄 인수 확인
    const command = process.argv[2] || 'run';
    
    logger.log(`📋 명령: ${command}`);
    
    switch (command) {
      case 'run':
        await seedService.runAll();
        break;
      case 'clear':
        await seedService.clearAll();
        break;
      case 'reset':
        await seedService.reset();
        break;
      case 'status':
        await seedService.status();
        break;
      default:
        logger.error(`❌ 알 수 없는 명령: ${command}`);
        logger.log('사용 가능한 명령:');
        logger.log('  - run: 시드 데이터 실행');
        logger.log('  - clear: 모든 데이터 삭제');
        logger.log('  - reset: 데이터 재설정');
        logger.log('  - status: 현재 상태 확인');
        process.exit(1);
    }
    
    await app.close();
    logger.log('🎉 스크립트 실행 완료!');
  } catch (error) {
    logger.error('❌ 스크립트 실행 실패:', error.message);
    process.exit(1);
  }
}

bootstrap();