import mysql, { Pool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create the connection pool with a strict 5-second timeout
const mysqlPool: Pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT as string, 10) || 3306,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 5000 // Force it to fail fast if DB is off
});

// Explicit connection tester function
export const connectMySQL = async (): Promise<void> => {
    try {
        const connection = await mysqlPool.getConnection();
        console.log('✅ MySQL Enterprise Pool Connected Successfully (TypeScript).');
        connection.release();
    } catch (error) {
        if (error instanceof Error) {
            console.error('❌ MySQL Connection Failed. Ensure MySQL is running locally!');
            console.error('Error Details:', error.message);
        }
        process.exit(1); // Halt backend if primary DB is unreachable
    }
};

export default mysqlPool;