// src/app/api/admin/[...slug]/route.ts
export const dynamic = 'force-dynamic';

export async function GET(req: Request)    { return handler(req); }
export async function POST(req: Request)   { return handler(req); }
export async function PUT(req: Request)    { return handler(req); }
export async function PATCH(req: Request)  { return handler(req); }
export async function DELETE(req: Request) { return handler(req); }
// (optional) some libs send preflight directly to same route
export async function OPTIONS(req: Request){ return handler(req); }

async function handler(request: Request) {
  console.log("[slug] HIT", request.method, new URL(request.url).pathname);
  const SUPABASE_URL  = process.env.SUPABASE_URL;
  const SERVICE_ROLE  = process.env.SUPABASE_SERVICE_ROLE;

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error('[admin-proxy] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE', {
      hasUrl: !!SUPABASE_URL, hasKey: !!SERVICE_ROLE,
    });
    return new Response('Server misconfigured', { status: 500 });
  }

  // Parse incoming URL and rebuild target (keeps query string)
  const inUrl = new URL(request.url);
  const afterAdmin = inUrl.pathname.split('/api/admin')[1] || '';
  const targetUrl = `${SUPABASE_URL}/rest/v1${afterAdmin}${inUrl.search}`;

  // Build headers for Supabase
  const headers: Record<string, string> = {
    // auth — required
    apikey: SERVICE_ROLE,
    Authorization: `Bearer ${SERVICE_ROLE}`,
    // pass through common request headers if present
    accept: request.headers.get('accept') ?? 'application/json',
    'content-type': request.headers.get('content-type') ?? 'application/json',
  };

  const acceptProfile = request.headers.get('accept-profile');
  if (acceptProfile) headers['Accept-Profile'] = acceptProfile;

  const contentProfile = request.headers.get('content-profile');
  if (contentProfile) headers['Content-Profile'] = contentProfile;

  const prefer = request.headers.get('prefer');
  if (prefer) headers.prefer = prefer;
  const range = request.headers.get('range'); // ra-data-postgrest may use this
  if (range) headers.range = range;

  // Build fetch options
  const options: RequestInit = { method: request.method, headers };

  // Only forward a body for methods that should have one
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    try {
      const body = await request.json();
      options.body = JSON.stringify(body);
    } catch {
      // no json body; ignore
    }
  }

  // Debug logging
  console.log('[admin-proxy] →', request.method, targetUrl);

  // Fire the request
  let response: Response;
  try {
    response = await fetch(targetUrl, options);
  } catch (err) {
    console.error('[admin-proxy] Fetch error', err);
    return new Response('Upstream fetch failed', { status: 502 });
  }

  // Log non-2xx to help diagnose quickly
  if (!response.ok) {
    const peek = await response.clone().text().catch(() => '');
    console.error('[admin-proxy] ←', response.status, targetUrl, peek?.slice(0, 300));
  } else {
    console.log('[admin-proxy] ←', response.status, targetUrl);
  }
  

  // Forward Content-Range for lists (React-Admin uses it for pagination)
  const outHeaders = new Headers();
  const contentRange = response.headers.get('content-range');
  if (contentRange) outHeaders.set('Content-Range', contentRange);

  const text = await response.text();
  return new Response(text, { status: response.status, headers: outHeaders });


}
