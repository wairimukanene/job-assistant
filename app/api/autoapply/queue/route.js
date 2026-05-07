const bridgeQueue = globalThis.__AP_AUTOAPPLY_BRIDGE__ || [];
globalThis.__AP_AUTOAPPLY_BRIDGE__ = bridgeQueue;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return Response.json({ error: { message: 'Invalid payload' } }, { status: 400, headers: corsHeaders() });
    }
    bridgeQueue.push({
      id: Date.now() + Math.floor(Math.random() * 10000),
      createdAt: new Date().toISOString(),
      role: body.role || '',
      co: body.co || '',
      type: body.type || 'Other',
      sourceUrl: body.sourceUrl || '',
      fields: Array.isArray(body.fields) ? body.fields.slice(0, 100) : [],
    });
    return Response.json({ ok: true }, { headers: corsHeaders() });
  } catch (e) {
    return Response.json({ error: { message: 'Invalid JSON' } }, { status: 400, headers: corsHeaders() });
  }
}

export async function GET() {
  const items = bridgeQueue.splice(0, bridgeQueue.length);
  return Response.json({ items }, { headers: corsHeaders() });
}
