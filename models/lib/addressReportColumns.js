'use strict';

const { classifyAddress } = require('./ipAddress');
const { countryFlag, locationLabel } = require('./geoHeaders');

function addressValue(row, family) {
  if (!row) return '';
  return row[family] || classifyAddress(row.ip)[family] || '';
}

function locationFor(row, family) {
  if (!addressValue(row, family)) return null;
  return row[`${family}Location`] || row.location || null;
}

function locationText(row, family) {
  if (!addressValue(row, family)) return '';
  const location = locationFor(row, family);
  return location ? locationLabel(location) : row.locationLabel || row.city || '';
}

function locationFlag(row, family) {
  if (!addressValue(row, family)) return '';
  const location = locationFor(row, family);
  return location ? countryFlag(location.country) : row.flag || '';
}

function mapLocation(row, family) {
  const location = locationFor(row, family);
  if (!location) return null;
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    label: locationText(row, family) || addressValue(row, family),
  };
}

function addressReportColumns({ map = false } = {}) {
  // Both from the translated 'location': the IPv6 one was the English text
  // "IPv6 location" in every language (Admin Panel / Problems / Security in
  // Finnish read "Sijainti" beside "IPv6 location").
  const locationColumn = family => ({
    labelKey: 'location',
    ...(family === 'ipv6' ? { labelSuffix: ' (IPv6)' } : {}),
    value: row => locationText(row, family),
    flag: row => locationFlag(row, family),
    ...(map ? { location: row => mapLocation(row, family) } : {}),
  });
  return [
    { labelKey: 'event-ipv4', value: row => addressValue(row, 'ipv4') },
    locationColumn('ipv4'),
    { labelKey: 'event-ipv6', value: row => addressValue(row, 'ipv6') },
    locationColumn('ipv6'),
  ];
}

module.exports = { addressValue, locationFor, locationText, locationFlag,
  mapLocation, addressReportColumns };
