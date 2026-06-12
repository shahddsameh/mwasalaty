import { searchPlaces } from '../services/geocodingService.js';
import { makeError, ErrorCodes } from '../helpers/errors.js';

const MAX_QUERY_LENGTH = 120;
const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 20;

export async function placesSearchHandler(req, res) {
  const q = typeof req.query.q === 'string' ? req.query.q : '';

  if (q.length > MAX_QUERY_LENGTH) {
    return res.status(400).json(
      makeError(ErrorCodes.VALIDATION_ERROR, 'Request validation failed', {
        fields: [`q must be ${MAX_QUERY_LENGTH} characters or fewer`],
      })
    );
  }

  const parsedLimit = Number.parseInt(req.query.limit, 10);
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(parsedLimit, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  return res.status(200).json({ places: searchPlaces(q, limit) });
}
