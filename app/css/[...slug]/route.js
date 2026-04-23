import { readFile } from 'fs/promises';
import path from 'path';

function isSafePath(parts) {
  return parts.every((p) => p && p !== '.' && p !== '..' && !p.includes('/'));
}

export async function GET(_request, { params }) {
  const slug = params?.slug || [];
  if (!slug.length || !isSafePath(slug)) {
    return new Response('Not found', { status: 404 });
  }

  const filePath = path.join(process.cwd(), 'css', ...slug);
  if (!filePath.endsWith('.css')) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const content = await readFile(filePath, 'utf8');
    return new Response(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/css; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
