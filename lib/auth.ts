import jwt from 'jsonwebtoken';
import dbConnect from './mongodb';
import User from '@/models/User';
import { checkRateLimit } from './rateLimit';

interface JwtPayload {
  id: string;
  email: string;
}

// Accepts EITHER a session JWT (issued at login, used by the website
// itself) OR a user's personal API key (issued at registration, viewable
// and regenerable on the Settings page - format "sammy_<40 hex chars>").
// This is what makes every existing endpoint that calls getUserId() -
// buy a number, place an SMM order, check balance, list orders, etc. -
// usable by an external developer's own code, with no separate "public
// API" routes or duplicated business logic needed.
//
// This is async now (it wasn't before) because validating an API key
// requires a database lookup - callers must await it.
export async function getUserId(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const token = authHeader.split(' ')[1];
  if (!token) return null;

  // API keys have a distinct, recognizable prefix, so we can tell which
  // kind of credential this is up front rather than trying JWT verify
  // first and only falling back on failure (which would make every API
  // key request pay for a wasted, doomed JWT verification attempt).
  if (token.startsWith('sammy_')) {
    // A browser session is implicitly rate-limited by one human clicking
    // buttons. Programmatic API key access has no such natural ceiling,
    // so every endpoint gets a shared floor here - one place protects
    // all of them, rather than needing this added route-by-route.
    const limit = await checkRateLimit(`apikey:${token}`, 60, 60 * 1000);
    if (!limit.allowed) return null;

    try {
      await dbConnect();
      const user = await User.findOne({ apiKey: token }).select('_id');
      return user ? String(user._id) : null;
    } catch (e) {
      console.error('API key lookup failed:', e instanceof Error ? e.message : e);
      return null;
    }
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET environment variable is not set');
    return null;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    return decoded.id;
  } catch (e) {
    console.warn('JWT verification failed:', e instanceof Error ? e.message : 'Unknown error');
    return null;
  }
}
