const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`✅ Server is running! Status: ${res.statusCode}`);
  console.log(`Response headers:`, res.headers);
  process.exit(0);
});

req.on('error', (e) => {
  console.error(`❌ Server not responding: ${e.message}`);
  process.exit(1);
});

req.end();
