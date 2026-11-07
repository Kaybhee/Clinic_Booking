import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SlotsService } from './slots.service';

@ApiTags('slots')
@ApiSecurity('api-key')
@Controller()
export class SlotsController {
  constructor(private readonly service: SlotsService) {}

  @Post('reset')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete every booking and replace all slots' })
  reset(@Body() body: unknown) {
    return this.service.reset(body);
  }

  @Get('slots')
  @ApiOperation({ summary: 'List slots, earliest first. Optional ?provider= exact match.' })
  async list(@Query('provider') provider?: string | string[]) {
    return { slots: await this.service.list(typeof provider === 'string' && provider !== '' ? provider : undefined) };
  }
}
