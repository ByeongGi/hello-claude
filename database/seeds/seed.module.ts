import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from '@/modules/users/database/user.orm-entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
