import { createHash, timingSafeEqual } from 'crypto';
import { ApiException } from '../../exceptions/api.exception';

const sha = (v: string) => createHash('sha256').update(v).digest();

/** Paths that never need a key: the health probe used by the host, and the Swagger UI. */
const PUBLIC_PATHS = [/^\/health\/?$/, /^\/docs(\/|-json|$)/];

/**
 * Express middleware that runs BEFORE the body parser, so a request without the right
 * key is turned away with 401 whatever its body looks like.
 * Both sides are hashed first so the comparison is constant-time and length-safe.
 */
export function apiKeyMiddleware(expectedKey: string) {
  const expected = sha(expectedKey);
  return (req: any, _res: any, next: (err?: unknown) => void) => {
    const path: string = (req.originalUrl ?? req.url ?? '').split('?')[0];
    if (PUBLIC_PATHS.some((re) => re.test(path))) return next();

    const header = req.headers['x-api-key'];
    const provided = Array.isArray(header) ? header[0] : header;
    if (typeof provided !== 'string' || provided.length === 0 || !timingSafeEqual(sha(provided), expected)) {
      return next(ApiException.UNAUTHORIZED());
    }
    next();
  };
}
