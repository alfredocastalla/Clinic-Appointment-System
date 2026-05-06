const dotenv = require('dotenv');
const path = require('path');
const mysql = require('mysql2/promise');

dotenv.config({ path: path.join(__dirname, '.env') });

async function testRegistrations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'clinic_appointment',
  });

  console.log('\n📊 BEFORE REGISTRATION:\n');

  // Count users
  const [[userCount]] = await connection.query('SELECT COUNT(*) as count FROM `user`');
  console.log(`Users in database: ${userCount.count}`);

  // Count doctors
  const [[doctorCount]] = await connection.query('SELECT COUNT(*) as count FROM `doctor`');
  console.log(`Doctors in database: ${doctorCount.count}`);

  console.log('\n--- Users in database ---');
  const [users] = await connection.query('SELECT id, name, email, role FROM `user`');
  if (users.length === 0) {
    console.log('(empty)');
  } else {
    users.forEach((u) => console.log(`  ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`));
  }

  console.log('\n--- Doctors in database ---');
  const [doctors] = await connection.query('SELECT id, name, email, specialization FROM `doctor`');
  if (doctors.length === 0) {
    console.log('(empty)');
  } else {
    doctors.forEach((d) => console.log(`  ID: ${d.id}, Name: ${d.name}, Email: ${d.email}, Specialization: ${d.specialization}`));
  }

  await connection.end();
}

testRegistrations().catch((error) => {
  console.error(error);
  process.exit(1);
});
