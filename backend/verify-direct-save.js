const http = require('http');
const dotenv = require('dotenv');
const path = require('path');
const mysql = require('mysql2/promise');

dotenv.config({ path: path.join(__dirname, '.env') });

async function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3003,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
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

async function checkDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [users] = await connection.query('SELECT COUNT(*) as count FROM `user`');
  const [doctors] = await connection.query('SELECT COUNT(*) as count FROM `doctor`');

  await connection.end();
  return {
    userCount: users[0].count,
    doctorCount: doctors[0].count,
  };
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🔐 TESTING DIRECT DATABASE SAVE ON REGISTRATION');
  console.log('='.repeat(70));

  // Initial count
  console.log('\n📊 STEP 1: Check initial database counts');
  let dbBefore = await checkDatabase();
  console.log(`   Users in database: ${dbBefore.userCount}`);
  console.log(`   Doctors in database: ${dbBefore.doctorCount}`);

  // Register patient
  console.log('\n👤 STEP 2: Register new PATIENT');
  const timestamp = Date.now();
  const patientEmail = `patient${timestamp}@clinic.local`;
  const patientRes = await makeRequest('POST', '/auth/register/user', {
    name: 'Test Patient',
    email: patientEmail,
    password: 'password123',
    location: 'Test Location',
  });

  if (patientRes.status === 201) {
    console.log(`   ✅ Patient registration successful!`);
    console.log(`   📝 Response from backend:`);
    console.log(`      - ID: ${patientRes.body.user.id}`);
    console.log(`      - Name: ${patientRes.body.user.name}`);
    console.log(`      - Email: ${patientRes.body.user.email}`);
    console.log(`      - Location: ${patientRes.body.user.location}`);
    console.log(`      - Token received: ${patientRes.body.access_token ? '✅' : '❌'}`);
  } else {
    console.log(`   ❌ Registration failed: ${patientRes.status}`);
  }

  // Register doctor
  console.log('\n👨‍⚕️ STEP 3: Register new DOCTOR');
  const doctorEmail = `doctor${timestamp}@clinic.local`;
  const doctorRes = await makeRequest('POST', '/auth/register/doctor', {
    name: 'Dr. Test Doctor',
    email: doctorEmail,
    password: 'password123',
    specialization: 'General Medicine',
    address: 'Test Hospital',
  });

  if (doctorRes.status === 201) {
    console.log(`   ✅ Doctor registration successful!`);
    console.log(`   📝 Response from backend:`);
    console.log(`      - ID: ${doctorRes.body.user.id}`);
    console.log(`      - Name: ${doctorRes.body.user.name}`);
    console.log(`      - Email: ${doctorRes.body.user.email}`);
    console.log(`      - Specialization: ${doctorRes.body.user.specialization}`);
    console.log(`      - Token received: ${doctorRes.body.access_token ? '✅' : '❌'}`);
  } else {
    console.log(`   ❌ Registration failed: ${doctorRes.status}`);
  }

  // Check database after registration
  console.log('\n📊 STEP 4: Check database after registration');
  await new Promise((r) => setTimeout(r, 500)); // Small delay to ensure writes complete
  let dbAfter = await checkDatabase();
  console.log(`   Users in database: ${dbAfter.userCount}`);
  console.log(`   Doctors in database: ${dbAfter.doctorCount}`);

  // Verify counts increased
  console.log('\n✅ VERIFICATION SUMMARY');
  console.log('='.repeat(70));

  if (dbAfter.userCount > dbBefore.userCount) {
    console.log(
      `   ✅ PATIENT SAVED: User count increased from ${dbBefore.userCount} to ${dbAfter.userCount}`,
    );
  } else {
    console.log(`   ❌ PATIENT NOT SAVED: User count did not increase`);
  }

  if (dbAfter.doctorCount > dbBefore.doctorCount) {
    console.log(
      `   ✅ DOCTOR SAVED: Doctor count increased from ${dbBefore.doctorCount} to ${dbAfter.doctorCount}`,
    );
  } else {
    console.log(`   ❌ DOCTOR NOT SAVED: Doctor count did not increase`);
  }

  console.log('\n📝 IMPORTANT NOTES:');
  console.log(
    '   - Check the backend logs above to see the save confirmation messages',
  );
  console.log('   - Look for: "✅ User saved to database" or "✅ Doctor saved to database"');
  console.log('   - Registration data is encrypted with bcrypt before storing');
  console.log('   - Each account gets a unique JWT token immediately');
  console.log('\n' + '='.repeat(70) + '\n');
}

main().catch(console.error);
