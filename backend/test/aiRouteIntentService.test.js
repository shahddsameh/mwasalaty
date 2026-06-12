import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseRouteIntentDeterministically,
  parseRouteIntentWithGroq,
  resolveRouteIntent,
} from '../src/services/aiRouteIntentService.js';

function groqResponse(content) {
  return {
    ok: true,
    json: async () => ({ choices: [{ message: { content } }] }),
  };
}

test('deterministic parser extracts places, filter, and duration constraint', () => {
  const intent = parseRouteIntentDeterministically(
    'Find the cheapest route from Abbassiya to Stadium in under an hour'
  );
  assert.equal(intent.from, 'Abbassiya');
  assert.equal(intent.to, 'Stadium');
  assert.equal(intent.filter, 'cheapest');
  assert.equal(intent.maxDurationMinutes, 60);
});

test('destination-only request asks for an origin when Groq is unavailable', async () => {
  const previousKey = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;
  try {
    const result = await resolveRouteIntent('How do I get to Cairo Airport?');
    assert.equal(result.status, 'needs_clarification');
    assert.ok(result.missingFields.includes('from'));
    assert.equal(result.intent.to, 'Cairo Airport');
  } finally {
    if (previousKey) process.env.GROQ_API_KEY = previousKey;
  }
});

test('deterministic parser snaps Arabic from/to to canonical catalog labels', () => {
  const intent = parseRouteIntentDeterministically('ارخص طريق من العباسية إلى الاستاد');
  assert.equal(intent.from, 'Abbassiya');
  assert.equal(intent.to, 'Cairo Stadium');
  assert.equal(intent.filter, 'cheapest');
});

test('deterministic parser treats a reach request as destination-only', () => {
  const intent = parseRouteIntentDeterministically("What's the cheapest way to reach Giza Pyramids?");
  assert.equal(intent.from, null);
  assert.equal(intent.to, 'Giza Pyramids');
  assert.equal(intent.filter, 'cheapest');
});

test('deterministic parser detects a bare personal destination', () => {
  const intent = parseRouteIntentDeterministically('i wanna go home');
  assert.equal(intent.from, null);
  assert.equal(intent.to, 'home');
});

test('deterministic parser handles reversed "<personal> from <origin>" phrasing', () => {
  const intent = parseRouteIntentDeterministically('get me home from Abbassiya');
  assert.equal(intent.from, 'Abbassiya');
  assert.equal(intent.to, 'home');
});

test('deterministic parser leaves a real stop containing a personal word alone', () => {
  // "Stadium" must not be mistaken for a personal place; only whole-fragment matches snap.
  const intent = parseRouteIntentDeterministically('take me to work from Stadium');
  assert.equal(intent.from, 'Stadium');
  assert.equal(intent.to, 'work');
});

test('"i wanna go home" asks for the starting location when origin is missing', async () => {
  const previousKey = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;
  try {
    const result = await resolveRouteIntent('i wanna go home');
    assert.equal(result.status, 'needs_clarification');
    assert.ok(result.missingFields.includes('from'));
    assert.equal(result.intent.to, 'home');
  } finally {
    if (previousKey) process.env.GROQ_API_KEY = previousKey;
  }
});

test('a misspelled origin routes through Groq and snaps to a catalog stop', async () => {
  const previousKey = process.env.GROQ_API_KEY;
  process.env.GROQ_API_KEY = 'test-key';
  try {
    const result = await resolveRouteIntent(
      'i wanna go from abasseya to stadium in under an hour',
      async () => groqResponse(
        JSON.stringify({
          from: 'Abbassiya',
          to: 'Stadium',
          filter: 'comfortable',
          timeMode: 'now',
          date: null,
          time: null,
          maxDurationMinutes: 30,
        })
      )
    );
    assert.equal(result.status, 'ready');
    assert.equal(result.source, 'groq');
    assert.equal(result.intent.from, 'Abbassiya');
    assert.equal(result.intent.to, 'Stadium');
    // Reliable regex-derived fields win over the LLM's guesses.
    assert.equal(result.intent.filter, 'fastest');
    assert.equal(result.intent.maxDurationMinutes, 60);
  } finally {
    if (previousKey) process.env.GROQ_API_KEY = previousKey;
    else delete process.env.GROQ_API_KEY;
  }
});

test('exact catalog endpoints resolve without calling Groq', async () => {
  const previousKey = process.env.GROQ_API_KEY;
  process.env.GROQ_API_KEY = 'test-key';
  try {
    const result = await resolveRouteIntent(
      'Find the cheapest route from Abbassiya to Stadium in under an hour',
      () => {
        throw new Error('Groq should not be called for exact catalog matches');
      }
    );
    assert.equal(result.status, 'ready');
    assert.equal(result.source, 'deterministic');
    assert.equal(result.intent.from, 'Abbassiya');
    assert.equal(result.intent.to, 'Stadium');
    assert.equal(result.intent.filter, 'cheapest');
  } finally {
    if (previousKey) process.env.GROQ_API_KEY = previousKey;
    else delete process.env.GROQ_API_KEY;
  }
});

test('Groq fallback accepts a structured JSON response', async () => {
  const previousKey = process.env.GROQ_API_KEY;
  process.env.GROQ_API_KEY = 'test-key';
  try {
    const intent = await parseRouteIntentWithGroq('route request', async () => groqResponse(
      JSON.stringify({
        from: 'Abbassiya',
        to: 'Stadium',
        filter: 'comfortable',
        timeMode: 'now',
        date: null,
        time: null,
        maxDurationMinutes: null,
      })
    ));
    assert.equal(intent.filter, 'comfortable');
  } finally {
    if (previousKey) process.env.GROQ_API_KEY = previousKey;
    else delete process.env.GROQ_API_KEY;
  }
});

test('Groq fallback rejects malformed output', async () => {
  const previousKey = process.env.GROQ_API_KEY;
  process.env.GROQ_API_KEY = 'test-key';
  try {
    await assert.rejects(
      () => parseRouteIntentWithGroq('route request', async () => groqResponse('not json')),
      (error) => error.code === 'AI_INVALID_RESPONSE'
    );
  } finally {
    if (previousKey) process.env.GROQ_API_KEY = previousKey;
    else delete process.env.GROQ_API_KEY;
  }
});

test('Groq fallback reports an unavailable key', async () => {
  const previousKey = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;
  try {
    await assert.rejects(
      () => parseRouteIntentWithGroq('route request'),
      (error) => error.code === 'AI_SERVICE_UNAVAILABLE'
    );
  } finally {
    if (previousKey) process.env.GROQ_API_KEY = previousKey;
  }
});

test('Groq fallback rejects an empty response', async () => {
  const previousKey = process.env.GROQ_API_KEY;
  process.env.GROQ_API_KEY = 'test-key';
  try {
    await assert.rejects(
      () => parseRouteIntentWithGroq('route request', async () => ({
        ok: true,
        json: async () => ({ choices: [] }),
      })),
      (error) => error.code === 'AI_INVALID_RESPONSE'
    );
  } finally {
    if (previousKey) process.env.GROQ_API_KEY = previousKey;
    else delete process.env.GROQ_API_KEY;
  }
});

test('Groq fallback enforces its timeout', async () => {
  const previousKey = process.env.GROQ_API_KEY;
  const previousTimeout = process.env.GROQ_TIMEOUT_MS;
  process.env.GROQ_API_KEY = 'test-key';
  process.env.GROQ_TIMEOUT_MS = '1';
  try {
    await assert.rejects(
      () => parseRouteIntentWithGroq('route request', (_url, options) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener('abort', () => {
            const error = new Error('aborted');
            error.name = 'AbortError';
            reject(error);
          });
        })
      ),
      (error) => error.code === 'AI_REQUEST_TIMEOUT'
    );
  } finally {
    if (previousKey) process.env.GROQ_API_KEY = previousKey;
    else delete process.env.GROQ_API_KEY;
    if (previousTimeout) process.env.GROQ_TIMEOUT_MS = previousTimeout;
    else delete process.env.GROQ_TIMEOUT_MS;
  }
});
