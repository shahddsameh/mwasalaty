import * as catalogService from '../services/catalogService.js';

export function getPublicPlacesHandler(req, res) {
  const places = catalogService.listActivePlaces({ q: req.query.q }).map(({ name, aliases, type, location, line }) => ({
    name, aliases, type, location, ...(line ? { line } : {}),
  }));
  return res.status(200).json({ places });
}
