import { fetchOtpPlan } from '../services/otpClient.js';
import { mapOtpPlan } from '../mappers/tripMapper.js';
import { makeError, ErrorCodes } from '../helpers/errors.js';

function validateBody(body) {
  const errors = [];
  const { from, to, date, time } = body ?? {};

  if (typeof from?.lat !== 'number') errors.push('from.lat is required and must be a number');
  if (typeof from?.lng !== 'number') errors.push('from.lng is required and must be a number');
  if (typeof to?.lat !== 'number') errors.push('to.lat is required and must be a number');
  if (typeof to?.lng !== 'number') errors.push('to.lng is required and must be a number');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push('date is required in YYYY-MM-DD format');
  if (!time || !/^\d{2}:\d{2}(:\d{2})?$/.test(time)) errors.push('time is required in HH:MM or HH:MM:SS format');

  return errors;
}

export async function planHandler(req, res) {
  const validationErrors = validateBody(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json(
      makeError(ErrorCodes.VALIDATION_ERROR, 'Request validation failed', { fields: validationErrors })
    );
  }

  const { from, to, date, time, preferences = {} } = req.body;
  const modes = preferences.modes?.length ? preferences.modes : ['WALK', 'BUS', 'SUBWAY'];
  const transitModes = modes.filter(m => m !== 'WALK');
  const optimizedFor = req.body.preferences?.optimizeFor || 'quickest'

  try {
    const allModes = transitModes.length ? [...transitModes, 'WALK'] : ['WALK'];
    const plan = await fetchOtpPlan({
      fromLat: from.lat,
      fromLng: from.lng,
      toLat: to.lat,
      toLng: to.lng,
      date,
      time,
      modes: allModes,
      numItineraries: 10,
    });

    const allItineraries = plan.itineraries ?? [];

    if (!allItineraries.length) {
      return res.status(404).json(
        makeError(ErrorCodes.OTP_EMPTY_PLAN, 'No itineraries found for the given route and time', { from, to, date, time })
      );
    }

    const result = mapOtpPlan({ itineraries: allItineraries }, from, to, date, time, optimizedFor);

    if (!result.itineraries.length) {
      return res.status(404).json(
        makeError(ErrorCodes.OTP_EMPTY_PLAN, 'No transit routes found for the given route and time', { from, to, date, time })
      );
    }

    return res.json(result);
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.httpStatus >= 500) {
      return res.status(503).json(
        makeError(ErrorCodes.OTP_SERVICE_UNAVAILABLE, 'OpenTripPlanner service is unavailable', {
          url: process.env.OTP_GRAPHQL_URL || 'http://localhost:8080/otp/routers/default/index/graphql',
        })
      );
    }
    if (err.graphqlErrors) {
      return res.status(502).json(
        makeError(ErrorCodes.OTP_GRAPHQL_ERROR, 'OpenTripPlanner returned a GraphQL error', { errors: err.graphqlErrors })
      );
    }
    console.error('[planController]', err);
    return res.status(500).json(
      makeError(ErrorCodes.INTERNAL_SERVER_ERROR, 'An unexpected error occurred')
    );
  }
}
