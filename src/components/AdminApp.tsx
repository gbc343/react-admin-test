// src/app/AdminApp.tsx (or ../components/Admin)
'use client';
import * as React from 'react';
import {
  Admin, Resource, ListGuesser, EditGuesser, fetchUtils,
  CustomRoutes, MenuItemLink, Layout, AppBar
} from 'react-admin';
import { Route } from 'react-router-dom';
import postgrestRestProvider, { IDataProviderConfig, defaultPrimaryKeys, defaultSchema } from '@raphiniert/ra-data-postgrest';
import CreateTablePage from './CreateTablePage';
import DynamicCreate from '../app/DynamicCreate';
import DynamicList from '../app/DynamicList';
const dataProvider = postgrestRestProvider({
  apiUrl: '/api/admin',
  httpClient: fetchUtils.fetchJson,
  defaultListOp: 'eq',
  primaryKeys: defaultPrimaryKeys,
  schema: defaultSchema,
});

const MyMenu = ({ onMenuClick }: any) => {
  const [tables, setTables] = React.useState<string[]>([]);
  React.useEffect(() => {
    fetch('/api/admin/tables').then(r => r.json()).then(d => setTables(Array.isArray(d) ? d : [])).catch(() => setTables([]));
  }, []);
  return (
    <div>
      <MenuItemLink to="/" primaryText="Dashboard" onClick={onMenuClick} />
      <MenuItemLink to="/create-table" primaryText="Create Table" onClick={onMenuClick} />
      {tables.map(t => (
        <MenuItemLink key={t} to={`/${t}`} primaryText={t} onClick={onMenuClick} />
      ))}
    </div>
  );
};

const MyLayout = (props: any) => <Layout {...props} menu={MyMenu} appBar={AppBar} />;

export default function AdminApp() {
  const [tables, setTables] = React.useState<string[]>([]);
  React.useEffect(() => {
    fetch('/api/admin/tables').then(r => r.json()).then(d => setTables(Array.isArray(d) ? d : [])).catch(() => setTables([]));
  }, []);

  return (
    <Admin dataProvider={dataProvider} layout={MyLayout}>
      {tables.map((table) => (
        <Resource
          key={table}
          name={table}
          list={DynamicList}     // ← was ListGuesser
          edit={EditGuesser}
          create={DynamicCreate} // keeps the Create button visible
        />
      ))}

      <CustomRoutes>
        <Route path="/create-table" element={<CreateTablePage />} />
      </CustomRoutes>
    </Admin>
  );
}
