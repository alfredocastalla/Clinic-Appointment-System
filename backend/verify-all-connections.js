const http = require('http');
const dotenv = require('dotenv');
const path = require('path');
const mysql = require('mysql2/promise');

dotenv.config({ path: path.join(__dirname, '.env') });

async function makeRequest(method, path, token = null) {
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
    req.end();
  });
}

async function getDatabaseSummary() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const tables = [
    'user',
    'doctor',
    'appointment',
    'notification',
    'payment',
    'payment_method',
    'prescription',
  ];

  const summary = {};

  for (const table of tables) {
    const [[{ count }]] = await connection.query(
      `SELECT COUNT(*) as count FROM \`${table}\``,
    );
    summary[table] = count;
  }

  // Get detailed records
  const [users] = await connection.query('SELECT id, name, email, role, phone FROM `user` LIMIT 10');
  const [doctors] = await connection.query('SELECT id, name, email, specialization FROM `doctor` LIMIT 10');
  const [appointments] = await connection.query('SELECT id, patientName, doctorId, status FROM `appointment` LIMIT 5');
  const [payments] = await connection.query('SELECT id, patientId, amount, status FROM `payment` LIMIT 5');
  const [prescriptions] = await connection.query('SELECT id, patientName, medication FROM `prescription` LIMIT 5');
  const [notifications] = await connection.query('SELECT id, title, type FROM `notification` LIMIT 5');

  await connection.end();

  return {
    counts: summary,
    records: {
      users,
      doctors,
      appointments,
      payments,
      prescriptions,
      notifications,
    },
  };
}

async function testAPIConnections(adminToken) {
  const tests = [
    { name: 'Users List', endpoint: '/users', token: adminToken },
    { name: 'Doctors List', endpoint: '/doctors', token: adminToken },
    { name: 'Appointments List', endpoint: '/appointments', token: adminToken },
    { name: 'Payments List', endpoint: '/payments', token: adminToken },
    { name: 'Prescriptions List', endpoint: '/prescriptions', token: adminToken },
    { name: 'Notifications', endpoint: '/notifications', token: adminToken },
  ];

  const results = {};

  for (const test of tests) {
    try {
      const res = await makeRequest('GET', test.endpoint, test.token);
      results[test.name] = {
        status: res.status,
        connected: res.status === 200,
        count: Array.isArray(res.body) ? res.body.length : 0,
      };
    } catch (e) {
      results[test.name] = {
        status: 'ERROR',
        connected: false,
        error: e.message,
      };
    }
  }

  return results;
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🏥 CLINIC APPOINTMENT SYSTEM - DATABASE CONNECTION VERIFICATION');
  console.log('='.repeat(80));

  try {
    // Get database summary
    console.log('\n📊 DATABASE SUMMARY');
    console.log('-'.repeat(80));

    const dbData = await getDatabaseSummary();

    console.log('\n📋 Table Record Counts:');
    console.log('   ├─ users:            ', dbData.counts.user, 'records');
    console.log('   ├─ doctors:          ', dbData.counts.doctor, 'records');
    console.log('   ├─ appointments:     ', dbData.counts.appointment, 'records');
    console.log('   ├─ notifications:    ', dbData.counts.notification, 'records');
    console.log('   ├─ payments:         ', dbData.counts.payment, 'records');
    console.log('   ├─ payment_methods:  ', dbData.counts.payment_method, 'records');
    console.log('   └─ prescriptions:    ', dbData.counts.prescription, 'records');

    console.log('\n👥 REGISTERED USERS:');
    if (dbData.records.users.length > 0) {
      dbData.records.users.forEach((u) => {
        console.log(`   ✅ ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}${u.phone ? `, Phone: ${u.phone}` : ''}`);
      });
    } else {
      console.log('   (no users)');
    }

    console.log('\n👨‍⚕️ REGISTERED DOCTORS:');
    if (dbData.records.doctors.length > 0) {
      dbData.records.doctors.forEach((d) => {
        console.log(`   ✅ ID: ${d.id}, Name: ${d.name}, Email: ${d.email}, Specialization: ${d.specialization}`);
      });
    } else {
      console.log('   (no doctors)');
    }

    console.log('\n📅 APPOINTMENTS:');
    if (dbData.records.appointments.length > 0) {
      dbData.records.appointments.forEach((a) => {
        console.log(`   📌 ID: ${a.id}, Patient: ${a.patientName}, Doctor ID: ${a.doctorId}, Status: ${a.status}`);
      });
    } else {
      console.log('   (no appointments)');
    }

    console.log('\n💰 PAYMENTS:');
    if (dbData.records.payments.length > 0) {
      dbData.records.payments.forEach((p) => {
        console.log(`   💳 ID: ${p.id}, Patient ID: ${p.patientId}, Amount: ${p.amount}, Status: ${p.status}`);
      });
    } else {
      console.log('   (no payments)');
    }

    console.log('\n💊 PRESCRIPTIONS:');
    if (dbData.records.prescriptions.length > 0) {
      dbData.records.prescriptions.forEach((pr) => {
        console.log(`   📝 ID: ${pr.id}, Patient: ${pr.patientName}, Medication: ${pr.medication}`);
      });
    } else {
      console.log('   (no prescriptions)');
    }

    console.log('\n🔔 NOTIFICATIONS:');
    if (dbData.records.notifications.length > 0) {
      dbData.records.notifications.forEach((n) => {
        console.log(`   🔊 ID: ${n.id}, Title: ${n.title}, Type: ${n.type}`);
      });
    } else {
      console.log('   (no notifications)');
    }

    // Test API connections
    console.log('\n\n🌐 API CONNECTION TEST');
    console.log('-'.repeat(80));

    // Get admin token for API calls
    console.log('\n   Testing API endpoints...');
    const loginRes = await makeRequest('POST', '/auth/login', null);
    // We don't have credentials, so just test GET endpoints without auth

    const apiResults = await testAPIConnections(null);

    console.log('\n   Endpoint Status:');
    for (const [name, result] of Object.entries(apiResults)) {
      const status = result.connected ? '✅' : '❌';
      const info = result.connected ? ` (${result.count} records)` : ` (${result.status})`;
      console.log(`   ${status} ${name}${info}`);
    }

    // Summary
    console.log('\n\n✨ VERIFICATION SUMMARY');
    console.log('='.repeat(80));

    const totalRecords = Object.values(dbData.counts).reduce((a, b) => a + b, 0);
    const connectedEndpoints = Object.values(apiResults).filter((r) => r.connected).length;

    console.log(`\n   📊 Total records in database: ${totalRecords}`);
    console.log(`   🌐 API endpoints connected: ${connectedEndpoints}/${Object.keys(apiResults).length}`);

    if (dbData.counts.user > 0) {
      console.log(`   👥 Users registered: ${dbData.counts.user}`);
    }
    if (dbData.counts.doctor > 0) {
      console.log(`   👨‍⚕️ Doctors registered: ${dbData.counts.doctor}`);
    }

    console.log('\n   ✅ Database is properly connected to clinic appointment system!');
    console.log('\n' + '='.repeat(80) + '\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
