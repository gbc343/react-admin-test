export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return new Response(JSON.stringify({ error: 'Missing Supabase config' }), { status: 500 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { table, schema = 'public', columns = [] } = body || {};

  // Quick guard rails to prevent bad identifiers reaching SQL layer
  const ident = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  if (!table || !ident.test(table)) {
    return new Response(JSON.stringify({ error: 'Invalid table name' }), { status: 400 });
  }
  if (!ident.test(schema)) {
    return new Response(JSON.stringify({ error: 'Invalid schema name' }), { status: 400 });
  }

  const url = `${SUPABASE_URL}/rest/v1/rpc/create_table_with_columns`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_schema: schema,
      p_table: table,
      p_columns: columns,
    }),
  });

  const data = await resp.json().catch(() => ({}));
  return new Response(JSON.stringify(data), {
    status: resp.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
