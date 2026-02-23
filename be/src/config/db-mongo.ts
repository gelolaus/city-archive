import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectMongo = async (): Promise<void> => {
    try {
        const uri = process.env.MONGO_URI as string;
        if (!uri) throw new Error("MONGO_URI is undefined in .env");

        await mongoose.connect(uri);
        console.log('✅ MongoDB Telemetry Cluster Connected Successfully (TypeScript).');
    } catch (error) {
        if (error instanceof Error) {
            console.error('❌ MongoDB Connection Failed:', error.message);
        }
    }
};

export default connectMongo;