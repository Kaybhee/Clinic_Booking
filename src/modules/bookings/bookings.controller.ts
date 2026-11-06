import { Body, Controller, Delete, Get, Headers, HttpCode, Param, Post, Query, Res } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';

@ApiTags('bookings')
@ApiSecurity('api-key')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly service: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Book a slot' })
  @ApiHeader({ name: 'Idempotency-Key', required: false, description: 'Retries with the same key and body never create a second booking.' })
  async create(@Body() body: unknown, @Headers('idempotency-key') key: string | undefined, @Res({ passthrough: true }) res: any) {
    const result = await this.service.create(body, key);
    res.status(result.status);
    return result.body;
  }

  @Get()
  @ApiOperation({ summary: "A person's bookings, oldest first. ?email=&limit=&cursor=" })
  list(@Query('email') email: unknown, @Query('limit') limit: unknown, @Query('cursor') cursor: unknown) {
    return this.service.listByEmail(email, limit, cursor);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Look up a booking' })
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel a booking and free its slot' })
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }
}
