import { fetchOtpPlan } from '../services/otpClient.js';
import { GeocodingError, resolvePlace } from '../services/geocodingService.js';
import { mapOtpPlan } from '../mappers/tripMapper.js';
import { makeError, ErrorCodes } from '../helpers/errors.js';

const PLAN_TIME_ZONE = process.env.PLAN_TIME_ZONE || 'Africa/Cairo';

function hasCoordinates(place) {
  return typeof place?.lat === 'number' && typeof place?.lng === 'number';
}

function hasLabel(place) {
  return typeof place?.label === 'string' && place.label.trim().length > 0;
}

function parsePlanDateTime(date, time) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date ?? '');
  const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time ?? '');
  if (!match || !timeMatch) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const second = Number(timeMatch[3] ?? 0);
  const parsed = new Date(Date.UTC(year, month - 1, day, hour, minute, second, 0));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day ||
    parsed.getUTCHours() !== hour ||
    parsed.getUTCMinutes() !== minute ||
    parsed.getUTCSeconds() !== second
  ) {
    return null;
  }
  return `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
}

function localPlanTime(now) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PLAN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}:${value.second}`;
}

export function validateBody(body, now = new Date()) {
  const errors = [];
  const { from, to, date, time, timeMode } = body ?? {};

  if (!hasCoordinates(from) && !hasLabel(from)) {
    errors.push('from must include either numeric lat/lng or a non-empty label');
  }
  if (!hasCoordinates(to) && !hasLabel(to)) {
    errors.push('to must include either numeric lat/lng or a non-empty label');
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push('date is required in YYYY-MM-DD format');
  if (!time || !/^\d{2}:\d{2}(:\d{2})?$/.test(time)) errors.push('time is required in HH:MM or HH:MM:SS format');
  if (timeMode !== undefined && !['now', 'depart', 'arrive'].includes(timeMode)) {
    errors.push('timeMode must be now, depart, or arrive');
  }

  const planDateTime = parsePlanDateTime(date, time);
  if (date && time && !planDateTime) {
    errors.push('date and time must form a valid local date and time');
  } else if (planDateTime && timeMode !== 'now' && planDateTime <= localPlanTime(now)) {
    errors.push('departure or arrival time must be in the future');
  }
  if (
    body?.constraints?.maxDurationMinutes !== undefined &&
    (!Number.isFinite(body.constraints.maxDurationMinutes) || body.constraints.maxDurationMinutes <= 0)
  ) {
    errors.push('constraints.maxDurationMinutes must be a positive number');
  }

  return errors;
}

export function filterItinerariesByConstraints(result, constraints = {}) {
  const maxDurationMinutes = constraints.maxDurationMinutes;
  if (!Number.isFinite(maxDurationMinutes)) return result;
  return {
    ...result,
    constraints: { maxDurationMinutes },
    itineraries: result.itineraries.filter(
      (itinerary) => itinerary.durationMinutes <= maxDurationMinutes
    ),
  };
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
  const optimizedFor = req.body.preferences?.optimizeFor || 'quickest'

  try {
    const [resolvedFrom, resolvedTo] = await Promise.all([
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
      return res.status(404).json(
        makeError(ErrorCodes.OTP_EMPTY_PLAN, 'No itineraries found for the given route and time', {
          from: resolvedFrom,
          to: resolvedTo,
          date,
          time,
        })
      );
    }

    const result = filterItinerariesByConstraints(
      mapOtpPlan({ itineraries: allItineraries }, resolvedFrom, resolvedTo, date, time, optimizedFor),
      req.body.constraints
    );

    if (!result.itineraries.length) {
      return res.status(404).json(
        makeError(ErrorCodes.OTP_EMPTY_PLAN, 'No transit routes found for the given route and time', {
          from: resolvedFrom,
          to: resolvedTo,
          date,
          time,
        })
      );
    }

    return res.json(result);
  } catch (err) {
    if (err instanceof GeocodingError) {
      const statusCode = err.statusCode ?? 404;
      return res.status(statusCode).json(
        makeError(
          statusCode >= 500 ? ErrorCodes.GEOCODING_SERVICE_ERROR : ErrorCodes.GEOCODING_NOT_FOUND,
          err.message,
          err.details
        )
      );
    }
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.httpStatus >= 500) {
      return res.status(503).json(
        makeError(ErrorCodes.OTP_SERVICE_UNAVAILABLE, 'OpenTripPlanner service is unavailable', {
          url: process.env.OTP_GRAPHQL_URL || 'http://localhost:8081/otp/routers/default/index/graphql',
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
