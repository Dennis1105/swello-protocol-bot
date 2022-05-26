const mongoose = require("mongoose");

const SwelloSchema = new mongoose.Schema({
    timestamp: { type: Date },
    swelloPrice: { type: Number },
    circulatingSupply: { type: String },
    treasuryReceiverBalance: { type: String },
    safetyFundReceiverBalance: { type: String },
}, {
    timestamps: { createdAt: 'created_at' }
});

const SwelloModel = mongoose.model(
    "Swello",
    SwelloSchema,
    "Swello"
);
module.exports = { SwelloModel };
