# Limits

Configure attachment upload, attachment download, API upload and API download as
Unlimited, Maximum file size or Blocked. Maximum sizes use positive values in
Bytes, MB or GB. Avatar uploads have a separate on/off block.

The modern and Legacy HTML4 forms share normalization, display-unit selection and
safe byte conversion. Unknown modes or units, zero and negative maximums,
non-numbers and values exceeding JavaScript's safe integer range are rejected.
HTML4 exposes every value in one semantic fieldset with labels and natural Tab
order; fields not relevant to Unlimited or Blocked remain visible because no
JavaScript is required, but they are ignored by the server.

Both views call the same Global Admin-only settings operation. Refused HTML4
writes are reported to Admin Panel / Problems / Security with the available
request and actor details. The same-URL browser test verifies both representations,
stored values and non-admin isolation, then restores the original global settings.
