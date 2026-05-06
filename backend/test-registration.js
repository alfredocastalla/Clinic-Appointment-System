const https = require('https');

function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3003,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: body ? JSON.parse(body) : null,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: body,
          });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Use http instead since the backend likely uses http
const http = require('http');

function makeHttpRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3003,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: body ? JSON.parse(body) : null,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: body,
          });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testRegistration() {
  try {
    console.log('🧪 Testing Patient Registration...\n');
    const patientReg = await makeHttpRequest('POST', '/auth/register/user', {
      name: 'John Patient',
      email: `patient${Date.now()}@clinic.local`,
      password: 'password123',
      location: 'New York',
    });
    console.log('Status:', patientReg.status);
    console.log('Response:', JSON.stringify(patientReg.body, null, 2));

    console.log('\n🧪 Testing Doctor Registration...\n');
    const doctorReg = await makeHttpRequest('POST', '/auth/register/doctor', {
      name: 'Dr. Jane Smith',
      email: `doctor${Date.now()}@clinic.local`,
      password: 'password123',
      specialization: 'Cardiology',
      address: '123 Medical Center, Boston',
    });
    console.log('Status:', doctorReg.status);
    console.log('Response:', JSON.stringify(doctorReg.body, null, 2));

    console.log('\n✅ Registrations completed!');
    console.log('Data will be persisted in MySQL clinic_appointment database.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRegistration();
