const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { authMiddleware } = require('../auth');
const { Account, Transaction } = require('../db');

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post('/orders', authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        const options = {
            amount: amount * 100, // amount in smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_order_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        if (!order) return res.status(500).json({ message: "Error creating order" });

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency
        });
    } catch (err) {
        console.error("Razorpay order error:", err);
        res.status(500).json({ message: "Server error creating order" });
    }
});

router.post('/verify', authMiddleware, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Update balance
            await Account.updateOne(
                { userId: req.userId },
                { $inc: { balance: amount } }
            );

            // Record transaction as a deposit (senderId and receiverId as the same user for topup)
            await Transaction.create({
                senderId: req.userId,
                receiverId: req.userId,
                amount: amount,
                date: new Date()
            });

            res.json({ message: "Payment verified and balance updated" });
        } else {
            res.status(400).json({ message: "Invalid Signature" });
        }
    } catch (err) {
        console.error("Payment verification error:", err);
        res.status(500).json({ message: "Server error verifying payment" });
    }
});

module.exports = router;
