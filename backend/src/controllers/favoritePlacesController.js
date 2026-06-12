import { ErrorCodes, makeError } from '../helpers/errors.js';
import {
  deleteFavoritePlace,
  listFavoritePlaces,
  patchFavoritePlace,
  upsertFavoritePlace,
  validateFavoriteId,
  validateFavoritePlace,
} from '../services/favoritePlacesService.js';

function handleError(res, error) {
  const status = error.code === ErrorCodes.FAVORITE_PLACE_NOT_FOUND ? 404 : 503;
  return res.status(status).json(makeError(error.code ?? ErrorCodes.INTERNAL_SERVER_ERROR, error.message, error.details));
}

function validateRequest(req, res, partial = false) {
  const errors = validateFavoritePlace(req.body, { partial });
  if (!validateFavoriteId(req.params.id)) errors.push('id must be 200 characters or fewer and cannot contain slashes');
  if (errors.length) {
    res.status(400).json(makeError(ErrorCodes.VALIDATION_ERROR, 'Request validation failed', { fields: errors }));
    return false;
  }
  return true;
}

export async function listFavoritePlacesHandler(req, res) {
  try {
    return res.json({ places: await listFavoritePlaces(req.auth.token) });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function upsertFavoritePlaceHandler(req, res) {
  if (!validateRequest(req, res)) return;
  try {
    const place = await upsertFavoritePlace(req.auth.token, req.auth.user.id, req.params.id, req.body);
    return res.status(200).json(place);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchFavoritePlaceHandler(req, res) {
  if (!validateRequest(req, res, true)) return;
  try {
    return res.json(await patchFavoritePlace(req.auth.token, req.params.id, req.body));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteFavoritePlaceHandler(req, res) {
  if (!validateFavoriteId(req.params.id)) {
    return res.status(400).json(makeError(ErrorCodes.VALIDATION_ERROR, 'Request validation failed', {
      fields: ['id must be 200 characters or fewer and cannot contain slashes'],
    }));
  }
  try {
    await deleteFavoritePlace(req.auth.token, req.params.id);
    return res.status(204).end();
  } catch (error) {
    return handleError(res, error);
  }
}
