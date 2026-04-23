const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
import https from 'https';

// Sanitize content to remove non-ASCII characters that cause encoding errors
function sanitizeContent(text) {
  if (typeof text !== 'string') return text;
  // Replace non-ASCII characters with ASCII equivalents or remove
  return text.replace(/[^\x00-\x7F]/g, (char) => {
    const code = char.charCodeAt(0);
    // Common smart quotes and dashes
    if (code === 8217 || code === 8216 || code === 8218 || code === 8219) return "'";
    if (code === 8220 || code === 8221 || code === 8222) return '"';
    if (code === 8211 || code === 8212) return '-';
    if (code === 8230) return '...';
    if (code === 8226) return '*';
    return '';
  });
}

function makeHttpsRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: { error: { message: 'Invalid response from Anthropic' } } });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error: {
          message: 'Missing ANTHROPIC_API_KEY in server environment',
          type: 'configuration_error',
        },
      },
      { status: 500 }
    );
  }

  let payload;
  try {
    const bodyText = await request.text();
    payload = JSON.parse(bodyText);
  } catch (err) {
    return Response.json(
      {
        error: {
          message: 'Invalid JSON payload: ' + (err?.message || 'unknown'),
          type: 'invalid_request_error',
        },
      },
      { status: 400 }
    );
  }

  // Sanitize content to remove non-ASCII characters
  if (payload.messages && payload.messages[0] && payload.messages[0].content) {
    payload.messages[0].content = sanitizeContent(payload.messages[0].content);
  }

  try {
    const bodyString = JSON.stringify(payload);
    const url = new URL(ANTHROPIC_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(bodyString, 'utf8'),
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    };

    const result = await makeHttpsRequest(url.href, options, bodyString);
    return Response.json(result.data, { status: result.status });
  } catch (err) {
    console.error('[DEBUG] Request error:', err);
    return Response.json(
      {
        error: {
          message: 'Network error while contacting Anthropic: ' + (err?.message || 'unknown'),
          type: 'api_connection_error',
        },
      },
      { status: 502 }
    );
  }
}
