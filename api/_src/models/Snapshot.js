const mongoose = require('mongoose');

const snapshotSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // 'holders', 'fees', 'market'
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Snapshot', snapshotSchema);
