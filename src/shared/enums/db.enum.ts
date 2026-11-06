export enum DatabaseModelNames {
  SLOT = 'Slot',
  BOOKING = 'Booking',
  IDEMPOTENCY = 'IdempotencyRecord',
  RATE_LIMIT = 'RateLimitWindow',
}

export enum BookingStatus {
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

export enum RepositoryTokens {
  SLOT = 'SlotRepository',
  BOOKING = 'BookingRepository',
  IDEMPOTENCY = 'IdempotencyRepository',
  RATE_LIMIT = 'RateLimitRepository',
}
