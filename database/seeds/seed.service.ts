import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOrmEntity } from '@/modules/users/database/user.orm-entity';
import { userSeeds } from './user.seed';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
  ) {}

  /**
   * 모든 시드 데이터를 실행
   */
  async runAll(): Promise<void> {
    this.logger.log('🌱 시드 데이터 실행 시작...');

    try {
      await this.seedUsers();

      this.logger.log('✅ 모든 시드 데이터 실행 완료!');
    } catch (error: any) {
      this.logger.error('❌ 시드 데이터 실행 실패:', error.message);
      throw error;
    }
  }

  /**
   * 사용자 시드 데이터 실행
   */
  async seedUsers(): Promise<void> {
    this.logger.log('👥 사용자 시드 데이터 실행 중...');

    // 기존 데이터 확인
    const existingCount = await this.userRepository.count();
    if (existingCount > 0) {
      this.logger.log(
        `이미 ${existingCount}개의 사용자가 존재합니다. 시드 건너뛰기.`,
      );
      return;
    }

    // ORM엔티티로 변환
    const ormEntities = userSeeds.map((seed) => ({
      name: seed.name,
      email: seed.email.value,
      password: seed.password,
    }));
    
    const savedUsers = await this.userRepository.save(ormEntities);
    this.logger.log(`✅ ${savedUsers.length}명의 사용자 시드 데이터 생성 완료`);

    // 생성된 사용자 로그
    savedUsers.forEach((user: any) => {
      this.logger.log(`  - ${user.name} (${user.email})`);
    });
  }

  /**
   * 모든 데이터 삭제 (테스트용)
   */
  async clearAll(): Promise<void> {
    this.logger.warn('🗑️ 모든 데이터 삭제 중...');

    await this.userRepository.delete({});

    this.logger.warn('⚠️ 모든 데이터 삭제 완료');
  }

  /**
   * 데이터 재설정 (삭제 후 시드 실행)
   */
  async reset(): Promise<void> {
    this.logger.log('🔄 데이터 재설정 중...');

    await this.clearAll();
    await this.runAll();

    this.logger.log('✅ 데이터 재설정 완료');
  }

  /**
   * 현재 데이터 상태 확인
   */
  async status(): Promise<void> {
    const userCount = await this.userRepository.count();

    this.logger.log('📊 현재 데이터베이스 상태:');
    this.logger.log(`  - 사용자: ${userCount}명`);

    if (userCount > 0) {
      const users = await this.userRepository.find({
        select: ['name', 'email'],
      });

      this.logger.log('📝 사용자 목록:');
      users.forEach((user) => {
          this.logger.log(`  - ${user.name} (${user.email})`)
      });
    }
  }
}
