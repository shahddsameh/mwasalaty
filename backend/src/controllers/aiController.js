import { ErrorCodes, makeError } from '../helpers/errors.js';
import { resolveRouteIntent } from '../services/aiRouteIntentService.js';

const MAX_PROMPT_LENGTH = 1000;

export async function routeIntentHandler(req, res) {
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt) {
    return res.status(400).json(makeError(ErrorCodes.VALIDATION_ERROR, 'Request validation failed', {
      fields: ['prompt is required'],
    }));
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return res.status(400).json(makeError(ErrorCodes.AI_PROMPT_TOO_LONG, `Prompt must be ${MAX_PROMPT_LENGTH} characters or fewer`));
  }

  try {
    return res.json(await resolveRouteIntent(prompt));
  } catch (error) {
    const statuses = {
      [ErrorCodes.AI_REQUEST_TIMEOUT]: 504,
      [ErrorCodes.AI_SERVICE_UNAVAILABLE]: 503,
      [ErrorCodes.AI_INVALID_RESPONSE]: 502,
    };
    const status = statuses[error.code] ?? 500;
    if (status === 500) console.error('[aiController]', error);
    return res.status(status).json(makeError(error.code ?? ErrorCodes.INTERNAL_SERVER_ERROR, error.message, error.details));
  }
}
