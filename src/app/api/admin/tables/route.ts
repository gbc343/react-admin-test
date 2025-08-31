export const dynamic = 'force-dynamic';

export async function GET() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return new Response(JSON.stringify({ error: 'Missing Supabase config' }), { status: 500 });
  }

  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/list_tables_with_id`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_schema: 'public' }),
  });

  let data: any;
  try {
    data = await resp.json();
  } catch {
    data = null;
  }

  if (!resp.ok) {
    console.error('Error fetching tables', data);
    return new Response(JSON.stringify({ error: 'rpc failed', details: data }), { status: resp.status });
  }

  // Normalize: PostgREST can return ["a","b"] or [{list_tables_with_id:"a"}, ...] or [{"?column?":"a"}, ...]
  let list: string[] = [];
  if (Array.isArray(data)) {
    if (data.length === 0) list = [];
    else if (typeof data[0] === 'string') list = data as string[];
    else if (typeof data[0] === 'object' && data[0] !== null) {
      const key = Object.keys(data[0])[0];
      list = data.map((row: any) => String(row[key]));
    }
  }

  return new Response(JSON.stringify(list), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
