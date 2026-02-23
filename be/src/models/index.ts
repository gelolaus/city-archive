// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= --
// JhunDB Database Solutions | Mongoose TS Schemas V2.0
// Client: City Archive Library
// Architect: Johnny
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= --

import mongoose, { Schema, Document } from 'mongoose';

// ==========================================
// 1. User Sessions & Telemetry
// ==========================================
export interface ITelemetryLog extends Document {
    session_id: string;
    member_mongo_id?: mongoose.Types.ObjectId | null;
    event_type: 'PAGE_VIEW' | 'SEARCH_EXECUTED' | 'UI_CLICK' | 'BOOK_HOVER';
    search_query?: string | null;
    target_book_id?: mongoose.Types.ObjectId | null;
    device_info: string;
    ip_address: string;
    timestamp: Date;
}

const telemetrySchema = new Schema<ITelemetryLog>({
    session_id: { type: String, required: true, index: true },
    member_mongo_id: { type: Schema.Types.ObjectId, ref: 'MemberProfile', default: null },
    event_type: { 
        type: String, 
        enum: ['PAGE_VIEW', 'SEARCH_EXECUTED', 'UI_CLICK', 'BOOK_HOVER'], 
        required: true 
    },
    search_query: { type: String, default: null },
    target_book_id: { type: Schema.Types.ObjectId, ref: 'BookContent', default: null },
    device_info: { type: String, default: 'Unknown' },
    ip_address: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true }
});

// ==========================================
// 2. Transaction Ledger
// ==========================================
export interface ITransactionLedger extends Document {
    mysql_loan_id: number;
    mysql_fine_id?: number | null;
    action: 'BORROW_INITIATED' | 'BOOK_RETURNED' | 'FINE_PAID';
    member_mongo_id: mongoose.Types.ObjectId;
    book_mongo_id: mongoose.Types.ObjectId;
    duration_days?: number | null;
    timestamp: Date;
}

const transactionLedgerSchema = new Schema<ITransactionLedger>({
    mysql_loan_id: { type: Number, index: true },
    mysql_fine_id: { type: Number, default: null },
    action: { 
        type: String, 
        enum: ['BORROW_INITIATED', 'BOOK_RETURNED', 'FINE_PAID'], 
        required: true 
    },
    member_mongo_id: { type: Schema.Types.ObjectId, ref: 'MemberProfile', required: true },
    book_mongo_id: { type: Schema.Types.ObjectId, ref: 'BookContent', required: true },
    duration_days: { type: Number, default: null },
    timestamp: { type: Date, default: Date.now }
});

// ==========================================
// 3. Book Analytics Snapshots
// ==========================================
export interface IBookAnalytics extends Document {
    book_mongo_id: mongoose.Types.ObjectId;
    total_views: number;
    total_borrows: number;
    conversion_rate: number;
    avg_return_time_days: number;
    last_updated: Date;
    return_durations: number[];
    total_returns: number;
}

const bookAnalyticsSchema = new Schema<IBookAnalytics>({
    book_mongo_id: { type: Schema.Types.ObjectId, ref: 'BookContent', required: true, unique: true },
    total_views: { type: Number, default: 0 },
    total_borrows: { type: Number, default: 0 },
    conversion_rate: { type: Number, default: 0.0 },
    avg_return_time_days: { type: Number, default: 0.0 },
    last_updated: { type: Date, default: Date.now },
    return_durations: { type: [Number], default: [] },
    total_returns: { type: Number, default: 0 }
});

// Modernized async hook: keeps conversion rate and average return time in sync
bookAnalyticsSchema.pre('save', async function (this: IBookAnalytics) {
    if (this.total_views > 0) {
        this.conversion_rate = parseFloat((this.total_borrows / this.total_views).toFixed(4));
    }

    if (this.return_durations && this.return_durations.length > 0) {
        const sum = this.return_durations.reduce((acc, val) => acc + val, 0);
        this.avg_return_time_days = parseFloat(
            (sum / this.return_durations.length).toFixed(2)
        );
    }

    this.last_updated = new Date();
});

// ==========================================
// 4. Book Rich Content
// ==========================================
export interface IBookContent extends Document {
    mysql_book_id: number;
    synopsis: string;
    cover_image_url: string;
    tags_and_keywords: string[];
    inventory: {
        total_copies: number;
        available_copies: number;
    };
}

const bookContentSchema = new Schema<IBookContent>({
    mysql_book_id: { type: Number, required: true, unique: true },
    synopsis: { type: String, default: 'No synopsis available.' },
    cover_image_url: { type: String, default: '/assets/default-cover.png' },
    tags_and_keywords: { type: [String], index: true },
    inventory: {
        total_copies: { type: Number, required: true, default: 1 },
        available_copies: { type: Number, required: true, default: 1 }
    }
}, { timestamps: true });

// ==========================================
// 5. Member Profiles
// ==========================================
export interface IMemberProfile extends Document {
    mysql_member_id: number;
    ui_theme: 'light' | 'dark' | 'system';
    reading_preferences: string[];
    notification_settings: {
        email_alerts: boolean;
        sms_alerts: boolean;
    };
}

const memberProfileSchema = new Schema<IMemberProfile>({
    mysql_member_id: { type: Number, required: true, unique: true },
    ui_theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
    reading_preferences: { type: [String], default: [] },
    notification_settings: {
        email_alerts: { type: Boolean, default: true },
        sms_alerts: { type: Boolean, default: false }
    }
}, { timestamps: true });

// ==========================================
// Model Exports
// ==========================================
export const TelemetryLog = mongoose.model<ITelemetryLog>('TelemetryLog', telemetrySchema);
export const TransactionLedger = mongoose.model<ITransactionLedger>('TransactionLedger', transactionLedgerSchema);
export const BookAnalytics = mongoose.model<IBookAnalytics>('BookAnalytics', bookAnalyticsSchema);
export const BookContent = mongoose.model<IBookContent>('BookContent', bookContentSchema);
export const MemberProfile = mongoose.model<IMemberProfile>('MemberProfile', memberProfileSchema);