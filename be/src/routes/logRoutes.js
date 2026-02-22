import express from 'express';
import UserTelemetryLog from '../models/UserTelemetryLog.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const docs = await UserTelemetryLog.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    const logs = docs.map((d) => ({
      _id: d._id,
      event_type: d.event_type,
      payload: d.payload ?? {},
      timestamp: d.timestamp ? new Date(d.timestamp).toISOString() : null,
    }));
    res.json({ logs });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { event_type, payload, timestamp } = req.body || {};
    if (!event_type) {
      return res.status(400).json({ status: 'error', message: 'event_type is required.' });
    }
    const doc = await UserTelemetryLog.create({
      event_type,
      payload: payload ?? {},
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });
    res.status(201).json({ status: 'ok', id: doc._id });
  } catch (err) {
    next(err);
  }
});

export default router;
