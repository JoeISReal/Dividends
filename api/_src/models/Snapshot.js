import mongoose from 'mongoose';

const snapshotSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // 'holders', 'fees', 'market'
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model('Snapshot', snapshotSchema);
