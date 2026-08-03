/**
 * @devflow/auth — JWT authentication middleware.
 * Implements doc 23-authentication.md: short-lived JWT access tokens,
 * validated locally at the gateway without a database round-trip.
 *
 * In dev mode (JWT_SECRET not set), auth is bypassed with a warning.
 * In production, set JWT_SECRET env var.
 */
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET;
const DEV_MODE = !JWT_SECRET;

if (DEV_MODE) {
  process.stderr.write(JSON.stringify({
    level: 'warn',
    message: 'JWT_SECRET not set — running in unauthenticated dev mode. Never do this in production.',
    timestamp: new Date().toISOString(),
  }) + '\n');
}

export interface JwtPayload {
  sub: string;       // user id
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * Express middleware: validates Bearer JWT on every request.
 * Attaches decoded payload to req.user.
 * In dev mode (no JWT_SECRET), sets req.user to a mock dev identity and passes through.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (DEV_MODE) {
    (req as any).user = { sub: 'dev-user', role: 'admin', email: 'dev@devflow.local' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      type: 'about:blank',
      title: 'Unauthorized',
      status: 401,
      detail: 'Missing or malformed Authorization header. Expected: Bearer <token>',
    });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET!) as JwtPayload;
    (req as any).user = payload;
    next();
  } catch (err: any) {
    res.status(401).json({
      type: 'about:blank',
      title: 'Unauthorized',
      status: 401,
      detail: `Token invalid or expired: ${err.message}`,
    });
  }
}

/**
 * Generate a signed JWT (used in /auth/login endpoint).
 */
export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresIn = '15m'): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as any);
}
