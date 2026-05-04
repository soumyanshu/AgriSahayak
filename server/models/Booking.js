const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    farmerName: { type: String, required: true },
    mobile: { type: String, required: true },
    address: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String, required: true },
    exactLocation: { type: String, required: true },
    cropName: { type: String, required: true },
    cropStage: { type: String, required: true },
    sprayType: { type: String, required: true },
    chemicalName: { type: String },
    landArea: { type: Number, required: true },
    preferredDate: { type: String, required: true },
    preferredTime: { type: String, required: true },
    paymentMode: { type: String, required: true },
    totalCost: { type: Number, required: true },
    paymentStatus: { type: String, default: 'Pending' }, // Pending, Paid, Failed, Pending (Cash)
    ticketId: { type: String },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String }
}, {
    timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
