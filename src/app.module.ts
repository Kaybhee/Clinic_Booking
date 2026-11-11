/* eslint-disable @typescript-eslint/require-await */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { developmentConfig, productionConfig } from './config';
import * as dotenv from 'dotenv';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './filters';
import { SlotsModule } from './modules/slots/slots.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { KeepAliveService } from './shared/services/keep.alive.services';
import { HttpModule } from '@nestjs/axios';

dotenv.config();
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(__dirname, './../../.env'),
      load: [developmentConfig, productionConfig],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>(
          process.env.NODE_ENV === 'production' ? 'production.mongodbConnectionUrl' : 'development.mongodbConnectionUrl',
        );
        if (!uri) {
          throw new Error('MongoDB connection URI is undefined');
        }
        return { uri };
      },
      inject: [ConfigService],
    }),
    // Application Modules Go Here
    HttpModule,
    SlotsModule,
    BookingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService, 
    KeepAliveService,
    { provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
