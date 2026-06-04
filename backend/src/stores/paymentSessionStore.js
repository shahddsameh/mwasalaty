const sessions = new Map();

export function saveSession(session) {
  sessions.set(session.sessionId, session);
}

export function getSession(sessionId) {
  return sessions.get(sessionId) ?? null;
}

export function updateSession(session) {
  sessions.set(session.sessionId, session);
}
