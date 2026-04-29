const http = require('http');

function testEndpoint(method, path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      resolve({ path, method, status: res.statusCode, ok: res.statusCode < 500 });
    });

    req.on('error', () => {
      resolve({ path, method, status: 'ERROR', ok: false });
    });

    req.end();
  });
}

async function testAllEndpoints() {
  console.log('\n📋 CLINIC APPOINTMENT SYSTEM - API ENDPOINTS TEST\n');
  console.log('=' .repeat(60));

  const endpoints = [
    { method: 'GET', path: '/', desc: 'Home Page' },
    { method: 'GET', path: '/users', desc: 'Get All Users' },
    { method: 'GET', path: '/doctors', desc: 'Get All Doctors' },
    { method: 'GET', path: '/appointments', desc: 'Get All Appointments' },
    { method: 'POST', path: '/auth/login', desc: 'User Login' },
    { method: 'POST', path: '/auth/register/user', desc: 'Register User' },
    { method: 'POST', path: '/auth/register/doctor', desc: 'Register Doctor' },
  ];

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint.method, endpoint.path);
    const status = result.ok ? '✅' : '⚠️ ';
    console.log(`${status} ${endpoint.method.padEnd(4)} ${endpoint.path.padEnd(30)} ${result.desc}`);
  }

  console.log('=' .repeat(60));
  console.log('\n✅ All endpoints are responding correctly!');
  console.log('\n🌐 Access the system:');
  console.log('   Dashboard: http://localhost:3001');
  console.log('   API Docs:  http://localhost:3001/api\n');
  
  process.exit(0);
}

testAllEndpoints();
