const baseUrl = process.env.SWOOP_BASE_URL || 'http://localhost:3000';

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`${path} failed: ${response.status} ${JSON.stringify(payload)}`);
  }

  return payload;
}

async function main() {
  const health = await request('/health', { headers: {} });
  const status = await request('/api/test/status', { headers: {} });

  if (!status.mockMode) {
    throw new Error('Test harness is disabled. Start the app with npm run dev:mock first.');
  }

  const missedCall = await request('/api/test/simulate', {
    method: 'POST',
    body: JSON.stringify({ scenario: 'missed_call' }),
  });

  const inbound = await request('/api/test/simulate', {
    method: 'POST',
    body: JSON.stringify({
      scenario: 'inbound_sms',
      leadId: missedCall.leadId,
      body: 'Can someone come out tomorrow morning?',
    }),
  });

  const followups = await request('/api/test/simulate', {
    method: 'POST',
    body: JSON.stringify({
      scenario: 'fire_followups',
      leadId: missedCall.leadId,
    }),
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl,
        health,
        status,
        missedCall,
        inbound,
        followups,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error('Smoke test failed.');
  console.error(error.message);
  process.exitCode = 1;
});