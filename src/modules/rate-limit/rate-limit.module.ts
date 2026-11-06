import { Module } from '@nestjs/common';
import { RepositoryModule } from '../repository/repository.module';
import { RateLimitService } from './rate-limit.service';

@Module({ imports: [RepositoryModule], providers: [RateLimitService], exports: [RateLimitService] })
export class RateLimitModule {}
