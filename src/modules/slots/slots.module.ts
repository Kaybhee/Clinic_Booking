import { Module } from '@nestjs/common';
import { RepositoryModule } from '../repository/repository.module';
import { SlotsController } from './slots.controller';
import { SlotsService } from './slots.service';

@Module({ imports: [RepositoryModule], controllers: [SlotsController], providers: [SlotsService], exports: [SlotsService] })
export class SlotsModule {}
