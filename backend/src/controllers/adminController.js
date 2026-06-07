import * as adminAuthService from '../services/adminAuthService.js';
import * as catalogService from '../services/catalogService.js';
import * as routeStore from '../stores/routeStore.js';
import { ErrorCodes, makeError } from '../helpers/errors.js';

const STATUS_MAP = {
  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.ADMIN_UNAUTHORIZED]: 401,
  [ErrorCodes.PLACE_NOT_FOUND]: 404,
  [ErrorCodes.ROUTE_NOT_FOUND]: 404,
  [ErrorCodes.CATALOG_PERSISTENCE_ERROR]: 500,
};

function handleServiceError(res, err) {
  const status = STATUS_MAP[err?.code];
  if (status) return res.status(status).json(makeError(err.code, err.message, err.details));
  console.error('[adminController]', err);
  return res.status(500).json(makeError(ErrorCodes.INTERNAL_SERVER_ERROR, 'An unexpected error occurred'));
}

export function loginHandler(req, res) {
  const secret = req.body?.secret;
  if (!String(secret ?? '').trim()) {
    return res.status(400).json(makeError(ErrorCodes.VALIDATION_ERROR, 'Request validation failed', { fields: ['secret is required'] }));
  }
  try { return res.status(200).json(adminAuthService.login(secret)); } catch (error) { return handleServiceError(res, error); }
}

export function logoutHandler(req, res) {
  adminAuthService.logout(req.adminToken);
  return res.status(204).send();
}

export function listPlacesHandler(req, res) {
  try { return res.status(200).json({ places: catalogService.listPlaces({ type: req.query.type, includeInactive: req.query.includeInactive !== 'false' }) }); } catch (error) { return handleServiceError(res, error); }
}
export function createPlaceHandler(req, res) {
  try { return res.status(201).json(catalogService.createPlace(req.body)); } catch (error) { return handleServiceError(res, error); }
}
export function getPlaceHandler(req, res) {
  try { return res.status(200).json({ place: catalogService.getPlaceById(req.params.id) }); } catch (error) { return handleServiceError(res, error); }
}
export function updatePlaceHandler(req, res) {
  try { return res.status(200).json(catalogService.updatePlace(req.params.id, req.body)); } catch (error) { return handleServiceError(res, error); }
}
export function deletePlaceHandler(req, res) {
  try { return res.status(200).json(catalogService.deletePlace(req.params.id)); } catch (error) { return handleServiceError(res, error); }
}
export function getRoutesHandler(_req, res) { return res.status(200).json({ routes: routeStore.getAllRoutes() }); }
export function getDashboardHandler(_req, res) {
  try { return res.status(200).json(catalogService.getDashboardSummary()); } catch (error) { return handleServiceError(res, error); }
}
