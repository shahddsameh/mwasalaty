const DEFAULT_OTP_URL = 'http://localhost:8081/otp/routers/default/index/graphql';

function buildModesFragment(modes) {
  return (modes || ['WALK', 'BUS', 'SUBWAY'])
    .map(m => `{ mode: ${m} }`)
    .join(', ');
}

export async function fetchOtpPlan({ fromLat, fromLng, toLat, toLng, date, time, modes, numItineraries = 5 }) {
  const url = process.env.OTP_GRAPHQL_URL || DEFAULT_OTP_URL;

  const query = `{
    plan(
      from: { lat: ${fromLat}, lon: ${fromLng} }
      to: { lat: ${toLat}, lon: ${toLng} }
      date: "${date}"
      time: "${time}"
      transportModes: [${buildModesFragment(modes)}]
      numItineraries: ${numItineraries}
    ) {
      itineraries {
        duration
        legs {
          mode
          distance
          route { shortName longName }
          from { name }
          to { name }
          startTime
          endTime
          intermediateStops { name }
        }
      }
    }
  }`;

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
  } catch (networkErr) {
    const err = new Error(networkErr.message);
    err.code = networkErr.code || 'ECONNREFUSED';
    throw err;
  }

  if (!response.ok) {
    const err = new Error(`OTP returned HTTP ${response.status}`);
    err.httpStatus = response.status;
    throw err;
  }

  const json = await response.json();

  if (json.errors?.length > 0) {
    const err = new Error(json.errors[0].message);
    err.graphqlErrors = json.errors;
    throw err;
  }

  return json.data.plan;
}
