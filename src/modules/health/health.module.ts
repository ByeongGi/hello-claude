import { Module } from '@nestjs/common';
import { HealthController } from './adapters/health.http.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
