import { BaseRepository } from '../repository/base.repository';
import { Booking } from '../mongoose-models/schemas/booking.schema';
import { IdempotencyRecord } from '../mongoose-models/schemas/idempotency.schema';
import { RateLimitWindow } from '../mongoose-models/schemas/rate-limit.schema';
import { Slot } from '../mongoose-models/schemas/slot.schema';
import { SlotsService } from './slots.service';

describe('SlotsService demo slot seeding', () => {
  const originalSeedSetting = process.env.SEED_DEMO_SLOTS;

  afterEach(() => {
    if (originalSeedSetting === undefined) {
      delete process.env.SEED_DEMO_SLOTS;
    } else {
      process.env.SEED_DEMO_SLOTS = originalSeedSetting;
    }
  });

  function createService() {
    const slots = {
      countDocuments: jest.fn(),
      insertMany: jest.fn().mockResolvedValue([]),
    };
    const service = new SlotsService(
      slots as unknown as BaseRepository<Slot>,
      {} as unknown as BaseRepository<Booking>,
      {} as unknown as BaseRepository<IdempotencyRecord>,
      {} as unknown as BaseRepository<RateLimitWindow>,
    );
    return { service, slots };
  }

  it('seeds demo slots when the database has no future slots', async () => {
    delete process.env.SEED_DEMO_SLOTS;
    const { service, slots } = createService();
    slots.countDocuments.mockResolvedValue(0);

    await service.onApplicationBootstrap();

    expect(slots.countDocuments).toHaveBeenCalledWith({ start: { $gt: expect.any(Date) } });
    const [seededSlots] = slots.insertMany.mock.calls[0];
    expect(seededSlots.length).toBeGreaterThan(0);
    expect(seededSlots.every((slot: { start: Date }) => slot.start.getTime() > Date.now())).toBe(true);
  });

  it('does not seed when future slots already exist', async () => {
    delete process.env.SEED_DEMO_SLOTS;
    const { service, slots } = createService();
    slots.countDocuments.mockResolvedValue(1);

    await service.onApplicationBootstrap();

    expect(slots.insertMany).not.toHaveBeenCalled();
  });

  it('respects SEED_DEMO_SLOTS=false', async () => {
    process.env.SEED_DEMO_SLOTS = 'false';
    const { service, slots } = createService();

    await service.onApplicationBootstrap();

    expect(slots.countDocuments).not.toHaveBeenCalled();
    expect(slots.insertMany).not.toHaveBeenCalled();
  });
});
