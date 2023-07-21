CREATE CHANGEFEED INTO 'webhook-https://localhost:3000/resources/crl-cdc-webhook?insecure_tls_skip_verify=true' AS
SELECT
  id,
  name,
  guests,
  message
FROM rsvps;