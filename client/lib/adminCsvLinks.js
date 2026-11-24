import { Accounts } from 'meteor/accounts-base';

// The CSV downloads of the shared table page (WP-10,
// server/routes/adminCsvExport.js): one link per dataset, carrying the login
// token the way Download my data does, since a plain link sends no DDP login.
export function adminCsvLinks(datasets) {
  const params = new URLSearchParams({ authToken: Accounts._storedLoginToken() || '' });
  return datasets.map(({ name, labelKey }) => ({
    name,
    labelKey,
    url: `/api/admin/export/${name}.csv?${params.toString()}`,
  }));
}
