process.env.NODE_ENV = 'development';
process.env.API_KEY = 'test-key';
process.env.MONGODB_URI = process.env.TEST_MONGODB_URI ?? 'mongodb://127.0.0.1:27017/clinic_booking_test';

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/setup-app';

const KEY = 'test-key';
const hours = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();

describe('Clinic booking API (levels 1-5)', () => {
  let app: INestApplication;
  let baseUrl: string;
  const http = () => request(baseUrl);
  const authed = (r: request.Test) => r.set('X-API-Key', KEY);
  const get = (url: string) => authed(http().get(url));
  const post = (url: string, body?: unknown) => authed(http().post(url)).send(body as any);
  const del = (url: string) => authed(http().delete(url));

  const seed = () =>
    post('/reset', {
      slots: [
        { id: 's1', provider: 'Dr Ade', start: hours(30), end: hours(30.5) },
        { id: 's2', provider: 'Dr Ade', start: hours(26), end: hours(26.5) },
        { id: 's3', provider: 'Dr Bello', start: hours(28), end: hours(28.5) },
        { id: 'past', provider: 'Dr Ade', start: hours(-2), end: hours(-1.5) },
      ],
    });
  const book = (slot_id: string, email = 'ada@example.com', extra: Record<string, string> = {}) =>
    authed(http().post('/bookings')).set(extra).send({ slot_id, name: 'Ada Obi', email });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    configureApp(app, KEY);
    await app.listen(0);
    baseUrl = await app.getUrl();
  });
  afterAll(() => app.close());
  beforeEach(async () => {
    await seed().expect(200);
  });

  describe('level 1: list, book, look up', () => {
    it('lists slots earliest first with availability, and filters by provider', async () => {
      const all = await get('/slots').expect(200);
      expect(all.body.slots.map((s: any) => s.id)).toEqual(['past', 's2', 's3', 's1']);
      expect(all.body.slots[1]).toEqual({ id: 's2', provider: 'Dr Ade', start: expect.any(String), end: expect.any(String), available: true });
      const ade = await get('/slots?provider=Dr Ade').expect(200);
      expect(ade.body.slots.map((s: any) => s.id)).toEqual(['past', 's2', 's1']);
    });

    it('books a slot (201) and looks it up (200); the slot becomes unavailable', async () => {
      const res = await book('s1').expect(201);
      expect(res.body).toMatchObject({ slot_id: 's1', name: 'Ada Obi', email: 'ada@example.com', status: 'confirmed' });
      const found = await get(`/bookings/${res.body.id}`).expect(200);
      expect(found.body).toEqual(res.body);
      const slots = await get('/slots').expect(200);
      expect(slots.body.slots.find((s: any) => s.id === 's1').available).toBe(false);
    });

    it('returns 404 for an unknown booking', async () => {
      await get('/bookings/64b64b64b64b64b64b64b64b').expect(404);
      await get('/bookings/not-an-id').expect(404);
    });
  });

  describe('level 2: api key and validation', () => {
    it('rejects missing or wrong keys with 401 on every route, even with a broken body', async () => {
      await http().get('/slots').expect(401);
      await http().get('/slots').set('X-API-Key', 'nope').expect(401);
      await http().post('/reset').send({ slots: [] }).expect(401);
      await http().post('/bookings').set('Content-Type', 'application/json').send('{not json').expect(401);
      await http().get('/bookings/abc').expect(401);
      await http().delete('/bookings/abc').expect(401);
    });

    it('turns away missing or invalid details with 400', async () => {
      for (const body of [{}, { slot_id: 's1', name: 'A' }, { slot_id: 's1', email: 'a1@b.co' }, { name: 'A', email: 'a2@b.co' },
        { slot_id: 's1', name: '   ', email: 'a3@b.co' }, { slot_id: 's1', name: 'A', email: 'not-an-email' }, { slot_id: 5, name: 'A', email: 'a4@b.co' }, { slot_id: 's1', name: 'A', email: '  ' }]) {
        const res = await post('/bookings', body).expect(400);
        expect(res.body).toEqual({ error: expect.any(String) });
      }
      await authed(http().post('/bookings')).set('Content-Type', 'application/json').send('{oops').expect(400);
    });

    it('404 for an unknown slot, 400 for a slot that already started, and normalises the email', async () => {
      await book('missing').expect(404);
      await book('past').expect(400);
      const res = await post('/bookings', { slot_id: 's1', name: '  Ada  ', email: '  ADA@Example.COM ' }).expect(201);
      expect(res.body).toMatchObject({ name: 'Ada', email: 'ada@example.com' });
    });
  });

  describe('level 3: no double booking, cancellation', () => {
    it('gives exactly one winner when many people grab the same slot at the same instant', async () => {
      const results = await Promise.all(Array.from({ length: 25 }, (_, i) => book('s1', `person${i}@example.com`)));
      const codes = results.map((r) => r.status);
      expect(codes.filter((c) => c === 201)).toHaveLength(1);
      expect(codes.filter((c) => c === 409)).toHaveLength(24);
      const taken = await get('/slots').expect(200);
      expect(taken.body.slots.find((s: any) => s.id === 's1').available).toBe(false);
    });

    it('returns 409 when the slot is already booked', async () => {
      await book('s1', 'a@example.com').expect(201);
      const res = await book('s1', 'b@example.com').expect(409);
      expect(res.body).toEqual({ error: 'slot already booked' });
    });

    it('cancels a booking, frees the slot, and lets someone else book it', async () => {
      const first = await book('s1', 'a@example.com').expect(201);
      const cancelled = await del(`/bookings/${first.body.id}`).expect(200);
      expect(cancelled.body.status).toBe('cancelled');
      expect((await get(`/bookings/${first.body.id}`).expect(200)).body.status).toBe('cancelled');
      expect((await get('/slots')).body.slots.find((s: any) => s.id === 's1').available).toBe(true);
      await book('s1', 'b@example.com').expect(201);
    });

    it('cancelling twice is 409 and an unknown booking is 404', async () => {
      const b = await book('s1').expect(201);
      await del(`/bookings/${b.body.id}`).expect(200);
      await del(`/bookings/${b.body.id}`).expect(409);
      await del('/bookings/64b64b64b64b64b64b64b64b').expect(404);
    });
  });

  describe('level 4: idempotency and paging', () => {
    it('replays the same booking for a retried request', async () => {
      const first = await book('s1', 'a@example.com', { 'Idempotency-Key': 'k-1' }).expect(201);
      const retry = await book('s1', 'a@example.com', { 'Idempotency-Key': 'k-1' }).expect(201);
      expect(retry.body).toEqual(first.body);
      const list = await get('/bookings?email=a@example.com').expect(200);
      expect(list.body.bookings).toHaveLength(1);
    });

    it('never double-creates when retries arrive simultaneously', async () => {
      const results = await Promise.all(Array.from({ length: 12 }, () => book('s1', 'a@example.com', { 'Idempotency-Key': 'k-race' })));
      expect(results.every((r) => r.status === 201)).toBe(true);
      expect(new Set(results.map((r) => r.body.id)).size).toBe(1);
      expect((await get('/bookings?email=a@example.com')).body.bookings).toHaveLength(1);
    });

    it('rejects the same key with a different body (422)', async () => {
      await book('s1', 'a@example.com', { 'Idempotency-Key': 'k-2' }).expect(201);
      const res = await book('s2', 'a@example.com', { 'Idempotency-Key': 'k-2' }).expect(422);
      expect(res.body).toEqual({ error: expect.stringContaining('Idempotency-Key') });
    });

    it('a failed attempt does not burn the key', async () => {
      await book('missing', 'a@example.com', { 'Idempotency-Key': 'k-3' }).expect(404);
      await post('/reset', { slots: [{ id: 'missing', provider: 'Dr X', start: hours(5), end: hours(6) }] }).expect(200);
      await book('missing', 'a@example.com', { 'Idempotency-Key': 'k-3' }).expect(201);
    });

    it('pages through a person\'s bookings, oldest first, without gaps or repeats', async () => {
      const slots = Array.from({ length: 7 }, (_, i) => ({ id: `p${i}`, provider: 'Dr Ade', start: hours(40 + i), end: hours(40.5 + i) }));
      await post('/reset', { slots }).expect(200);
      const ids: string[] = [];
      for (const s of slots) {
        // spread over several emails would dodge the limiter; same email stays under 5/min by cancelling nothing and using 2 emails
        ids.push((await book(s.id, ids.length < 5 ? 'pager@example.com' : 'other@example.com')).body.id);
      }
      const mine = ids.slice(0, 5);
      const seen: string[] = [];
      let cursor: string | null = null;
      let pages = 0;
      do {
        const res: any = await get(`/bookings?email=PAGER@example.com&limit=2${cursor ? `&cursor=${cursor}` : ''}`).expect(200);
        seen.push(...res.body.bookings.map((b: any) => b.id));
        cursor = res.body.next_cursor;
        pages++;
      } while (cursor);
      expect(seen).toEqual(mine);
      expect(pages).toBe(3);
      await get('/bookings').expect(400);
      await get('/bookings?email=pager@example.com&limit=0').expect(400);
      await get('/bookings?email=pager@example.com&limit=51').expect(400);
      await get('/bookings?email=pager@example.com&limit=abc').expect(400);
      expect((await get('/bookings?email=pager@example.com')).body.bookings).toHaveLength(5);
      await get('/bookings?email=pager@example.com&cursor=zzz').expect(400);
      expect((await get('/bookings?email=nobody@example.com')).body).toEqual({ bookings: [], next_cursor: null });
    });
  });

  describe('level 5: spam protection', () => {
    it('allows 5 attempts per email per minute, then 429 with Retry-After', async () => {
      const codes: number[] = [];
      let last: any;
      for (let i = 0; i < 7; i++) {
        last = await book('missing', 'spammer@example.com');
        codes.push(last.status);
      }
      expect(codes).toEqual([404, 404, 404, 404, 404, 429, 429]);
      expect(Number(last.headers['retry-after'])).toBeGreaterThan(0);
      expect(Number(last.headers['retry-after'])).toBeLessThanOrEqual(60);
      expect(last.body).toEqual({ error: expect.stringMatching(/too many/) });
      await book('s1', 'someone-else@example.com').expect(201); // other people are unaffected
    });

    it('counts failed attempts of every kind, so the 6th is 429 even if it would be a 400', async () => {
      const codes: number[] = [];
      for (let i = 0; i < 6; i++) codes.push((await post('/bookings', { slot_id: 's1', name: '', email: 'sloppy@example.com' })).status);
      expect(codes).toEqual([400, 400, 400, 400, 400, 429]);
    });

    it('gives whole-second Retry-After and still answers 401 before anything else', async () => {
      for (let i = 0; i < 6; i++) await book('missing', 'secs@example.com');
      const res = await book('missing', 'secs@example.com').expect(429);
      expect(res.headers['retry-after']).toMatch(/^\d+$/);
      await http().post('/bookings').send({ slot_id: 's1', name: 'A', email: 'secs@example.com' }).expect(401);
    });

    it('holds under a simultaneous burst for one email', async () => {
      const results = await Promise.all(Array.from({ length: 20 }, () => book('missing', 'burst@example.com')));
      expect(results.filter((r) => r.status === 429)).toHaveLength(15);
      expect(results.filter((r) => r.status === 404)).toHaveLength(5);
    });

    it('does not count replays of an idempotent request as new attempts', async () => {
      for (let i = 0; i < 8; i++) await book('s1', 'a@example.com', { 'Idempotency-Key': 'k-replay' }).expect(201);
    });
  });
});
