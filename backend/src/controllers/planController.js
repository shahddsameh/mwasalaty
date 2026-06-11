import { fetchOtpPlan } from '../services/otpClient.js';
import { GeocodingError, resolvePlace } from '../services/geocodingService.js';
import { mapOtpPlan } from '../mappers/tripMapper.js';
import { makeError, ErrorCodes } from '../helpers/errors.js';
import { resolveRouteSearchUserId, safeLogRouteSearch } from '../services/routeSearchLogService.js';

function hasCoordinates(place) {
  return typeof place?.lat === 'number' && typeof place?.lng === 'number';
}

function hasLabel(place) {
  return typeof place?.label === 'string' && place.label.trim().length > 0;
}

function validateBody(body) {
  const errors = [];
  const { from, to, date, time } = body ?? {};

  if (!hasCoordinates(from) && !hasLabel(from)) {
    errors.push('from must include either numeric lat/lng or a non-empty label');
  }
  if (!hasCoordinates(to) && !hasLabel(to)) {
    errors.push('to must include either numeric lat/lng or a non-empty label');
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push('date is required in YYYY-MM-DD format');
  if (!time || !/^\d{2}:\d{2}(:\d{2})?$/.test(time)) errors.push('time is required in HH:MM or HH:MM:SS format');

  return errors;
}

async function resolvePlanPoint(point) {
  if (hasCoordinates(point)) {
    return {
      lat: point.lat,
      lng: point.lng,
      label: point.label ?? null,
      geocodingSource: 'request',
    };
  }

  const resolved = await resolvePlace(point.label);
  return {
    lat: resolved.lat,
    lng: resolved.lng,
    label: point.label,
    geocodingSource: resolved.source,
    resolvedLabel: resolved.label,
  };
}

export async function planHandler(req, res) {
  const validationErrors = validateBody(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json(
      makeError(ErrorCodes.VALIDATION_ERROR, 'Request validation failed', { fields: validationErrors })
    );
  }

  const { from, to, date, time, preferences = {} } = req.body;
  const arriveBy = req.body.arriveBy === true;
  const modes = preferences.modes?.length ? preferences.modes : ['WALK', 'BUS', 'SUBWAY'];
  const transitModes = modes.filter(m => m !== 'WALK');
  const optimizedFor = req.body.preferences?.optimizeFor || 'quickest';
  const anonymousSessionId = req.body.anonymousSessionId || req.headers['x-anonymous-session-id'] || null;
  const userId = await resolveRouteSearchUserId(req);
  let resolvedFrom = null;
  let resolvedTo = null;

  try {
    [resolvedFrom, resolvedTo] = await Promise.all([
      resolvePlanPoint(from),
      resolvePlanPoint(to),
    ]);
    const allModes = transitModes.length ? [...transitModes, 'WALK'] : ['WALK'];
    const plan = await fetchOtpPlan({
      fromLat: resolvedFrom.lat,
      fromLng: resolvedFrom.lng,
      toLat: resolvedTo.lat,
      toLng: resolvedTo.lng,
      date,
      time,
      modes: allModes,
      numItineraries: 10,
      arriveBy,
    });

    const allItineraries = plan.itineraries ?? [];

    if (!allItineraries.length) {
      const searchLog = await safeLogRouteSearch({
        status: 'no_results',
        source: 'otp',
        userId,
        anonymousSessionId,
        requestFrom: from,
        requestTo: to,
        resolvedFrom,
        resolvedTo,
        date,
        time,
        optimizedFor,
        itineraries: [],
        errorMessage: 'No itineraries found for the given route and time',
      });
      return res.status(404).json(
        makeError(ErrorCodes.OTP_EMPTY_PLAN, 'No itineraries found for the given route and time', {
          from: resolvedFrom,
          to: resolvedTo,
          date,
          time,
          searchLog,
        })
      );
    }

    const result = mapOtpPlan({ itineraries: allItineraries }, resolvedFrom, resolvedTo, date, time, optimizedFor);

    if (!result.itineraries.length) {
      const searchLog = await safeLogRouteSearch({
        status: 'no_results',
        source: result.source || 'otp',
        userId,
        anonymousSessionId,
        requestFrom: from,
        requestTo: to,
        resolvedFrom,
        resolvedTo,
        date,
        time,
        optimizedFor,
        planId: result.planId,
        itineraries: [],
        errorMessage: 'No transit routes found for the given route and time',
      });
      return res.status(404).json(
        makeError(ErrorCodes.OTP_EMPTY_PLAN, 'No transit routes found for the given route and time', {
          from: resolvedFrom,
          to: resolvedTo,
          date,
          time,
          searchLog,
        })
      );
    }

    const searchLog = await safeLogRouteSearch({
      status: 'success',
      source: result.source || 'otp',
      userId,
      anonymousSessionId,
      requestFrom: from,
      requestTo: to,
      resolvedFrom,
      resolvedTo,
      date,
      time,
      optimizedFor,
      planId: result.planId,
      itineraries: result.itineraries,
    });

    return res.json({ ...result, searchLog });
  } catch (err) {
    const failedSearchLog = await safeLogRouteSearch({
      status: 'failed',
      source: 'otp',
      userId,
      anonymousSessionId,
      requestFrom: from,
      requestTo: to,
      resolvedFrom,
      resolvedTo,
      date,
      time,
      optimizedFor,
      itineraries: [],
      errorMessage: err.message || 'Route planning failed',
    });

    if (err instanceof GeocodingError) {
      const statusCode = err.statusCode ?? 404;
      return res.status(statusCode).json(
        makeError(
          statusCode >= 500 ? ErrorCodes.GEOCODING_SERVICE_ERROR : ErrorCodes.GEOCODING_NOT_FOUND,
          err.message,
          { ...err.details, searchLog: failedSearchLog }
        )
      );
    }
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.httpStatus >= 500) {
      return res.status(503).json(
        makeError(ErrorCodes.OTP_SERVICE_UNAVAILABLE, 'OpenTripPlanner service is unavailable', {
          url: process.env.OTP_GRAPHQL_URL || 'http://localhost:8081/otp/routers/default/index/graphql',
          searchLog: failedSearchLog,
        })
      );
    }
    if (err.graphqlErrors) {
      return res.status(502).json(
        makeError(ErrorCodes.OTP_GRAPHQL_ERROR, 'OpenTripPlanner returned a GraphQL error', {
          errors: err.graphqlErrors,
          searchLog: failedSearchLog,
        })
      );
    }
    console.error('[planController]', err);
    return res.status(500).json(
      makeError(ErrorCodes.INTERNAL_SERVER_ERROR, 'An unexpected error occurred', { searchLog: failedSearchLog })
    );
  }
}
