'use client';
import * as React from 'react';
import {
  Create,
  SimpleForm,
  TextInput,
  NumberInput,
  BooleanInput,
  DateInput,
  DateTimeInput,
  required,
  useResourceContext,
  useNotify,
} from 'react-admin';

type Col = {
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  column_default: string | null;
};

const HIDDEN = new Set(['id', 'created_at', 'updated_at']); // server-managed

function inputFor(col: Col) {
  const source = col.column_name;
  const isRequired = !col.is_nullable && !col.column_default;
  const validate = isRequired ? [required()] : undefined;
  const t = col.data_type.toLowerCase();

  // Map common Postgres types to RA inputs
  if (t.includes('boolean')) return <BooleanInput key={source} source={source} label={source} />;

  if (t.includes('timestamp')) return (
    <DateTimeInput key={source} source={source} label={source} />
  );

  if (t === 'date') return <DateInput key={source} source={source} label={source} />;

  if (t.includes('json')) {
    return (
   <TextInput
  key={source}
  source={source}
  label={source}
  helperText={`JSON (e.g. {"a":1})`}   // ← no backslash escaping; use a template literal
  parse={(v) => {
    if (v == null || v === '') return null;
    try { return JSON.parse(v); } catch { return v; }
  }}
  format={(v) =>
    v == null ? '' : (typeof v === 'string' ? v : JSON.stringify(v))
  }
  validate={validate}
  multiline
/>
    );
  }

  if (t.includes('int') || t.includes('numeric') || t.includes('decimal') || t.includes('double')) {
    return <NumberInput key={source} source={source} label={source} validate={validate} />;
  }

  // uuid, text, varchar, char, etc → TextInput
  return <TextInput key={source} source={source} label={source} validate={validate} />;
}

export default function DynamicCreate() {
  const resource = useResourceContext(); // the current table name
  const notify = useNotify();
  const [cols, setCols] = React.useState<Col[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setCols(null);
    setError(null);
    fetch(`/api/admin/schema?table=${encodeURIComponent(resource)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('bad schema response');
        // filter out server columns
        const filtered = data.filter((c: Col) => !HIDDEN.has(c.column_name));
        setCols(filtered);
      })
      .catch((e) => setError(String(e)));
  }, [resource]);

  if (error) {
    return <Create><SimpleForm><div>Failed to load schema: {error}</div></SimpleForm></Create>;
  }
  if (!cols) {
    return <Create><SimpleForm><div>Loading fields…</div></SimpleForm></Create>;
  }

  return (
    <Create
    mutationOptions={{
      onSuccess: () => notify('Created', { type: 'info' }),
      onError: (e) => notify(`Create failed: ${String(e)}`, { type: 'warning' }),
    }}
  >
    <SimpleForm>
      {cols.map(inputFor)}
    </SimpleForm>
  </Create>
  );
}
