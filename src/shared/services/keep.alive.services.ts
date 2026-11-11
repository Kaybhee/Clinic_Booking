import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);
  private readonly pingUrl = 'https://clinic-booking-8hc1.onrender.com/';
  // private readonly configService: ConfigService;

  constructor(private readonly httpService: HttpService) {}

  @Cron('*/5 * * * *') // Every 5 minutes
  async pingServer() {
    try {
      this.logger.log(`Pinging server at ${this.pingUrl}...`);

      // const pingUrl = this.configService.get<string>('PING_URL') || '';

      const startTime = Date.now();
      const response = await firstValueFrom(
        this.httpService.get(this.pingUrl, {
          timeout: 30000, // 30 second timeout
          headers: {
            'User-Agent': 'ClinicBooking-Cron-Job/1.0',
          },
        }),
      );

      const responseTime = Date.now() - startTime;

      this.logger.log(`Server ping successful - Status: ${response.status}, Response time: ${responseTime}ms`);
    } catch (error: any) {
      this.logger.error(`Failed to ping server at ${this.pingUrl}: ${error.message}`, error.stack);
    }
  }
}
