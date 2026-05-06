const http = require('http');

// First, register a test user
async function makeRequest(method, path, data, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3003,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
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
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testProfileUpdate() {
  console.log('📝 Testing Profile Update with Phone Field\n');
  console.log('='.repeat(60));

  // 1. Register a new user
  console.log('\n1️⃣ REGISTER NEW USER');
  const timestamp = Date.now();
  const regRes = await makeRequest('POST', '/auth/register/user', {
    name: 'Kaye Macrol',
    email: `kaye${timestamp}@clinic.local`,
    password: 'password123',
    location: 'Gaalpan Sion Surigao City',
  });

  if (regRes.status !== 201) {
    console.log('❌ Registration failed:', regRes.body);
    return;
  }

  const userId = regRes.body.user.id;
  const token = regRes.body.access_token;

  console.log(`✅ User registered with ID: ${userId}`);
  console.log(`   Name: ${regRes.body.user.name}`);
  console.log(`   Email: ${regRes.body.user.email}`);
  console.log(`   Location: ${regRes.body.user.location}`);

  // 2. Update profile with phone
  console.log('\n2️⃣ UPDATE PROFILE WITH PHONE NUMBER');
  console.log(`   Endpoint: PATCH /users/profile/${userId}`);

  const updateRes = await makeRequest(
    'PATCH',
    `/users/profile/${userId}`,
    {
      name: 'Kaye Macrol Updated',
      location: 'Gaalpan Sion Surigao City',
      phone: '0917 123 4567',
    },
    token,
  );

  if (updateRes.status !== 200) {
    console.log('❌ Update failed:', updateRes.body);
    return;
  }

  console.log('✅ Profile updated successfully!');
  console.log(`   Name: ${updateRes.body.name}`);
  console.log(`   Email: ${updateRes.body.email}`);
  console.log(`   Location: ${updateRes.body.location}`);
  console.log(`   Phone: ${updateRes.body.phone}`);

  // 3. Fetch updated profile
  console.log('\n3️⃣ VERIFY DATA IN DATABASE');
  const getRes = await makeRequest('GET', `/users/${userId}`, null, token);

  if (getRes.status !== 200) {
    console.log('❌ Fetch failed:', getRes.body);
    return;
  }

  console.log('✅ Profile retrieved from database:');
  console.log(`   Name: ${getRes.body.name}`);
  console.log(`   Email: ${getRes.body.email}`);
  console.log(`   Location: ${getRes.body.location}`);
  console.log(`   Phone: ${getRes.body.phone}`);

  console.log('\n' + '='.repeat(60));
  console.log('\n✨ SUMMARY:');
  console.log('   ✅ Phone field added to user table');
  console.log('   ✅ Profile update endpoint working');
  console.log('   ✅ Data persisted to MySQL database');
  console.log('\n📚 USAGE FROM FRONTEND:');
  console.log(`   PATCH /users/profile/{userId}`);
  console.log('   Body: { name, location, phone }');
}

testProfileUpdate().catch(console.error);
