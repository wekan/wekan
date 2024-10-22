CNAME to CNAME does not work well. Last one should be A IPv4 (and AAAA IPv6).

To get Let's Encrypt SSL/TLS cert for custom subdomain, for example with Caddy, you subdomain should have grey cloud icon. Not orange cloud icon CloudFlare proxy. Also turn off any SSL/TLS of CloudFlare. This is so that Let's Encrypt verifying servers can see hosting server actual IP address and validate cert.

If needing wildcard SSL/TLS cert, for example for Sandstorm, create CloudFlare Origin Certificate, add it to Caddy or Nginx certs .pem file (private key above, other key below, at same textfile). Set CloudFlare SSL/TLS as Strict for using Origin Certificate. Set DNS to orange cloud icon proxy. Add DNS records for example.com , *.example.com , www.example.com .