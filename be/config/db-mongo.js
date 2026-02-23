const mongoose = require('mongoose');
require('dotenv').config();

const connectMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Telemetry Cluster Connected Successfully.');
    } catch (error) {
        console.error('❌ MongoDB Connection Failed:', error.message);
        // Telemetry failure is a degraded state, not a fatal crash. We do not exit(1) here.
    }
};

module.exports = connectMongo;