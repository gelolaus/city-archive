const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool to queue requests and prevent crashing under load
const mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Self-executing initialization test
(async () => {
    try {
        const connection = await mysqlPool.getConnection();
        console.log('✅ MySQL Enterprise Pool Connected Successfully.');
        connection.release();
    } catch (error) {
        console.error('❌ MySQL Connection Failed:', error.message);
        process.exit(1); // Halt backend if primary ACID database is unreachable
    }
})();

module.exports = mysqlPool;