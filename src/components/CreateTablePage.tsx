'use client';
import * as React from 'react';
import {
  SimpleForm,
  TextInput,
  required,
  ArrayInput,
  SimpleFormIterator,
  SelectInput,
  BooleanInput,
  SaveButton,
  Toolbar,
  useNotify,
  useRedirect,
  ResourceContextProvider,   // ← add this
} from 'react-admin';

const typeChoices = [
  { id: 'text',      name: 'Text' },
  { id: 'number',    name: 'Number' },
  { id: 'integer',   name: 'Integer' },
  { id: 'boolean',   name: 'Boolean' },
  { id: 'date',      name: 'Date' },
  { id: 'timestamp', name: 'Timestamp' },
  { id: 'json',      name: 'JSON' },
  { id: 'uuid',      name: 'UUID' },
];

const CreateTableToolbar = (props: any) => (
  <Toolbar {...props}>
    <SaveButton alwaysEnable />
  </Toolbar>
);

export default function CreateTablePage() {
  const notify = useNotify();
  const redirect = useRedirect();

  const onSubmit = async (values: any) => {
    const payload = {
      table: values.table,
      schema: 'public',
      columns: (values.columns || []).map((c: any) => ({
        name: c.name,
        type: c.type,
        is_nullable: c.is_nullable ?? true,
        is_unique: c.is_unique ?? false,
        default: c.default ?? null,
      })),
    };

    const res = await fetch('/api/admin/create-table', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      notify(
        `Failed to create table: ${data?.message || data?.error || res.statusText}`,
        { type: 'warning' }
      );
      return;
    }

    notify(`Created ${payload.table}`, { type: 'info' });
    redirect('/');
  };

  return (
    // ✅ Provide a resource context for ArrayInput / SimpleFormIterator
    <ResourceContextProvider value="createTable">
      <SimpleForm onSubmit={onSubmit} toolbar={<CreateTableToolbar />} defaultValues={{ columns: [] }}>
        <TextInput
          source="table"
          label="Table name"
          validate={[required()]}
          helperText="letters, numbers, and underscores; must start with a letter or underscore"
        />

        <ArrayInput source="columns" label="Columns">
          <SimpleFormIterator inline>
            <TextInput source="name" label="Column name" validate={[required()]} />
            <SelectInput source="type" label="Type" choices={typeChoices} defaultValue="text" />
            <BooleanInput source="is_nullable" label="Nullable?" defaultValue />
            <BooleanInput source="is_unique" label="Unique?" />
            <TextInput
              source="default"
              label="Default (SQL literal)"
              helperText="e.g. 0, true, now(), gen_random_uuid()"
            />
          </SimpleFormIterator>
        </ArrayInput>
      </SimpleForm>
    </ResourceContextProvider>
  );
}
