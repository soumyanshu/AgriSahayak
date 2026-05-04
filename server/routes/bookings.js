const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay conditionally (to avoid crash if keys are missing/invalid)
let razorpayInstance = null;
try {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }
} catch(err) {
    console.error("Razorpay init error:", err.message);
}

// Generate Ticket ID
const generateTicketId = () => {
    return 'TKT-' + Math.floor(10000 + Math.random() * 90000) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
};

// Create Booking
router.post('/create', async (req, res) => {
    try {
        const data = req.body;
        
        const newBooking = new Booking({
            userId: data.userId,
            farmerName: data.farmerName,
            mobile: data.mobile,
            address: data.address,
            state: data.state,
            district: data.district,
            exactLocation: data.exactLocation,
            cropName: data.cropName,
            cropStage: data.cropStage,
            sprayType: data.sprayType,
            chemicalName: data.chemicalName,
            landArea: data.landArea,
            preferredDate: data.preferredDate,
            preferredTime: data.preferredTime,
            paymentMode: data.paymentMode,
            totalCost: data.totalCost,
            paymentStatus: data.paymentMode === 'Cash' ? 'Pending (Cash)' : 'Pending',
            ticketId: generateTicketId()
        });

        await newBooking.save();

        // If Cash, no Razorpay
        if (data.paymentMode === 'Cash') {
            return res.status(201).json({ success: true, booking: newBooking });
        }

        // Create Razorpay Order
        if (!razorpayInstance || process.env.RAZORPAY_KEY_SECRET === 'dummysecret12345') {
            // Mock response if razorpay is not configured (dummy mode)
            newBooking.razorpayOrderId = 'order_mock_' + Date.now();
            await newBooking.save();
            return res.status(201).json({ 
                success: true, 
                booking: newBooking, 
                orderId: newBooking.razorpayOrderId,
                amount: data.totalCost * 100,
                isMock: true
            });
        }

        const options = {
            amount: data.totalCost * 100, // amount in smallest currency unit (paise)
            currency: "INR",
            receipt: "receipt_order_" + newBooking._id,
        };

        const order = await razorpayInstance.orders.create(options);
        
        newBooking.razorpayOrderId = order.id;
        await newBooking.save();

        res.status(201).json({
            success: true,
            booking: newBooking,
            orderId: order.id,
            amount: order.amount,
            isMock: false
        });

    } catch (error) {
        console.error("Booking create error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Verify Payment
router.post('/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId, isMock } = req.body;

        if (isMock) {
            // Allow mock verification
            const booking = await Booking.findByIdAndUpdate(bookingId, {
                paymentStatus: 'Paid',
                razorpayPaymentId: razorpay_payment_id || 'pay_mock_' + Date.now()
            }, { new: true });
            return res.status(200).json({ success: true, booking });
        }

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Payment is verified
            const booking = await Booking.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                { 
                    paymentStatus: 'Paid',
                    razorpayPaymentId: razorpay_payment_id
                },
                { new: true }
            );

            res.status(200).json({ success: true, message: "Payment verified successfully", booking });
        } else {
            res.status(400).json({ success: false, message: "Invalid signature sent!" });
        }
    } catch (error) {
        console.error("Payment verify error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Get User Bookings
router.get('/user/:userId', async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, bookings });
    } catch (error) {
        console.error("Fetch bookings error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;
