import { Request, Response } from 'express';
import mongoose from 'mongoose';
import mysqlPool from '../config/db-mysql';
import { MemberProfile, TelemetryLog } from '../models';

export const registerMember = async (req: Request, res: Response): Promise<void> => {
    const { firstName, lastName, email, phone, password } = req.body;

    // 1. Generate a new MongoDB ObjectId ahead of time
    const newMongoId = new mongoose.Types.ObjectId();
    const sessionId = (req.headers['x-session-id'] as string) || 'anonymous-session';

    try {
        // 2. Execute the ACID-Compliant MySQL Stored Procedure
        // If the password fails the Regex, or email is a duplicate, MySQL throws an error here and stops execution.
        await mysqlPool.execute(
            'CALL create_member(?, ?, ?, ?, ?, ?)',
            [newMongoId.toString(), password, firstName, lastName, email, phone]
        );

        // 3. Fetch the newly generated MySQL member_id and auto-generated username
        const [rows]: any = await mysqlPool.execute(
            'SELECT member_id, username FROM members WHERE email = ? LIMIT 1',
            [email]
        );

        const memberData = rows[0];

        // 4. Create the NoSQL Member Profile in MongoDB
        await MemberProfile.create({
            _id: newMongoId,
            mysql_member_id: memberData.member_id,
            ui_theme: 'light',
            reading_preferences: [],
            notification_settings: { email_alerts: true, sms_alerts: false }
        });

        // 5. Log the successful registration in our Telemetry engine
        await TelemetryLog.create({
            session_id: sessionId,
            member_mongo_id: newMongoId,
            event_type: 'UI_CLICK',
            search_query: 'Account Registration',
            device_info: req.headers['user-agent'] || 'Unknown Device',
            ip_address: req.ip || req.socket.remoteAddress || 'Unknown IP'
        });

        // 6. Return the success payload to the Frontend
        res.status(201).json({
            status: 'success',
            message: 'Member registered successfully.',
            data: {
                member_id: memberData.member_id,
                username: memberData.username,
                mongo_id: newMongoId
            }
        });
    } catch (error: any) {
        // If MySQL throws a regex constraint or duplicate error, we catch it and send it to the frontend cleanly
        console.error('Registration Error:', error.message);
        res.status(400).json({
            status: 'error',
            message: 'Registration failed. Ensure password meets strict complexity requirements and email is unique.',
            database_error: error.message
        });
    }
};

