import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Explicit Database Connections
import connectMongo from './config/db-mongo';
import { connectMySQL } from './config/db-mysql';

// Import Routes
import memberRoutes from './routes/memberRoutes';

dotenv.config();

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Both Databases Explicitly
connectMongo();
connectMySQL();

// ==========================================
// API ROUTES
// ==========================================
app.use('/api/members', memberRoutes);

// Health Check Route
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'Active',
        message: 'City Archive TypeScript API is running.',
        timestamp: new Date().toISOString()
    });
});

// Start the Express Server
const PORT: number = parseInt(process.env.PORT as string, 10) || 5000;
app.listen(PORT, () => {
    console.log(`🚀 City Archive TS-Backend operational on port ${PORT}`);
});