'use client';
import * as React from 'react';
import {
  List,
  Datagrid,
  TextField,
  NumberField,
  BooleanField,
  DateField,
  CreateButton,
  useResourceContext,
} from 'react-admin';

type Col = {
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  column_default: string | null;
};

// keep id, hide server-maintained timestamps in grid if you prefer
const HIDE_FROM_GRID = new Set(['created_at', 'updated_at']);

function fieldFor(col: Col) {
  const source = col.column_name;
  const t = col.data_type.toLowerCase();

  if (t.includes('boolean')) return <BooleanField key={source} source={source} />;
  if (t.includes('timestamp')) return <DateField key={source} source={source} />;
  if (t === 'date') return <DateField key={source} source={source} />;
  if (
    t.includes('int') ||
    t.includes('numeric') ||
    t.includes('decimal') ||
    t.includes('double') ||
    t.includes('real')
  ) {
    return <NumberField key={source} source={source} />;
  }

  // uuid, text, varchar, char, json, etc -> just show as text in the grid
  return <TextField key={source} source={source} />;
}

const EmptyState = () => {
  const resource = useResourceContext();
  return (
    <div style={{ padding: 24 }}>
      <p>No records yet.</p>
      <CreateButton resource={resource} label="Create your first record" />
    </div>
  );
};

export default function DynamicList() {
  const resource = useResourceContext();
  const [cols, setCols] = React.useState<Col[] | null>(null);

  React.useEffect(() => {
    setCols(null);
    fetch(`/api/admin/schema?table=${encodeURIComponent(resource)}`)
      .then(r => r.json())
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Bad schema response');
        const filtered = data.filter((c: Col) => !HIDE_FROM_GRID.has(c.column_name));
        // Put id first if present
        filtered.sort((a, b) => (a.column_name === 'id' ? -1 : b.column_name === 'id' ? 1 : 0));
        setCols(filtered);
      })
      .catch(() => setCols([]));
  }, [resource]);

  // We can render the List with an empty component immediately;
  // RA will handle “no rows” vs “has rows”. When there are rows,
  // we use the schema-driven Datagrid fields.
  return (
    <List empty={<EmptyState />}>
      <Datagrid rowClick="edit">
        {(cols ?? []).map(fieldFor)}
      </Datagrid>
    </List>
  );
}
