const dotenv = require('dotenv');
const path = require('path');
const mysql = require('mysql2/promise');

dotenv.config({ path: path.join(__dirname, '.env') });

async function verify() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'clinic_appointment',
  });

  const [[db]] = await connection.query('SELECT DATABASE() AS db');
  const [[version]] = await connection.query('SELECT VERSION() AS version');
  const [tables] = await connection.query(
    'SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = ?',
    [process.env.DB_NAME || 'clinic_appointment'],
  );

  console.log('database=', db.db);
  console.log('version=', version.version);
  console.log('tables=', JSON.stringify(tables, null, 2));

  await connection.end();
}

verify().catch((error) => {
  console.error(error);
  process.exit(1);
});
