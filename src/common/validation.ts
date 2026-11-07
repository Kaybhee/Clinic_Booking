import { ApiException } from '../exceptions/api.exception';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface CreateBookingInput {
  slotId: string;
  name: string;
  email: string;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function normaliseEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length > 0 && email.length <= 254 && EMAIL_RE.test(email) ? email : null;
}

/** Missing or invalid booking details are turned away with 400 before anything else happens. */
export function validateCreateBooking(body: unknown): CreateBookingInput {
  if (!isObject(body)) throw ApiException.VALIDATION('Request body must be a JSON object');

  const { slot_id, name, email } = body;
  if (typeof slot_id !== 'string' || slot_id.trim() === '') throw ApiException.VALIDATION('slot_id is required');
  if (typeof name !== 'string' || name.trim() === '') throw ApiException.VALIDATION('name is required');
  if (name.trim().length > 120) throw ApiException.VALIDATION('name must be 120 characters or fewer');
  if (typeof email !== 'string' || email.trim() === '') throw ApiException.VALIDATION('email is required');
  const cleanEmail = normaliseEmail(email);
  if (!cleanEmail) throw ApiException.VALIDATION('email is not a valid email address');

  return { slotId: slot_id.trim(), name: name.trim(), email: cleanEmail };
}

export interface ResetSlotInput {
  id: string;
  provider: string;
  start: string;
  end: string;
  startDate: Date;
  endDate: Date;
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

export function validateReset(body: unknown): ResetSlotInput[] {
  if (!isObject(body) || !Array.isArray(body.slots)) throw ApiException.VALIDATION('slots must be an array');
  const seen = new Set<string>();
  return body.slots.map((raw, i) => {
    if (!isObject(raw)) throw ApiException.VALIDATION(`slots[${i}] must be an object`);
    const { id, provider, start, end } = raw;
    if (typeof id !== 'string' || id.trim() === '') throw ApiException.VALIDATION(`slots[${i}].id is required`);
    if (seen.has(id)) throw ApiException.VALIDATION(`slots[${i}].id "${id}" is duplicated`);
    seen.add(id);
    if (typeof provider !== 'string' || provider.trim() === '') throw ApiException.VALIDATION(`slots[${i}].provider is required`);
    for (const [field, value] of [['start', start], ['end', end]] as const) {
      if (typeof value !== 'string' || !ISO_RE.test(value) || Number.isNaN(Date.parse(value))) {
        throw ApiException.VALIDATION(`slots[${i}].${field} must be an ISO 8601 timestamp`);
      }
    }
    const startDate = new Date(start as string);
    const endDate = new Date(end as string);
    if (endDate <= startDate) throw ApiException.VALIDATION(`slots[${i}].end must be after start`);
    return { id, provider, start: start as string, end: end as string, startDate, endDate };
  });
}
