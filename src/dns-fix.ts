import dns from 'node:dns';

// Use public DNS servers for SRV lookups
dns.setServers([
  '8.8.8.8',
  '1.1.1.1',
]);

console.log('DNS servers configured:', dns.getServers());