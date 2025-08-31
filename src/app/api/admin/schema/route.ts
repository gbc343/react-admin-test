export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return new Response(JSON.stringify({ error: 'Missing Supabase config' }), { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const table = searchParams.get('table');
  const schema = searchParams.get('schema') ?? 'public';

  if (!table) {
    return new Response(JSON.stringify({ error: 'Missing "table" query param' }), { status: 400 });
  }

  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/list_columns`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_table: table, p_schema: schema }),
  });

  const data = await resp.json().catch(() => null);
  if (!resp.ok) {
    return new Response(JSON.stringify({ error: 'rpc failed', details: data }), { status: resp.status });
  }

  // normalize shape
  const rows = Array.isArray(data) ? data : [];
  return new Response(JSON.stringify(rows), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
