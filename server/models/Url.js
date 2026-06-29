import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema({
    shortCode: { type: String, required: true, unique: true, index: true },
    originalUrl: { type: String, required: true },
    clicks: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('Url', urlSchema);
