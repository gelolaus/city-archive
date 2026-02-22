/**
 * One-time migration: add return_date to loans per ERD if missing.
 * Run from repo root: node be/scripts/run-add-returned-at.js
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await pool.query(`
      ALTER TABLE loans
      ADD COLUMN return_date TIMESTAMP NULL DEFAULT NULL AFTER borrowed_at
    `);
    console.log('Migration complete: loans.return_date added.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column loans.return_date already exists; nothing to do.');
    } else {
      console.error('Migration failed:', err.message);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

run();
