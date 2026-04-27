// backend/routes/account.js
const express = require('express');
const { authMiddleware } = require('../auth'); // Updated from ../middleware
const { Account, Transaction } = require('../db');
const mongoose=require('mongoose');

const router = express.Router();

router.get("/balance", authMiddleware, async (req, res) => {
    const account = await Account.findOne({
        userId: req.userId
    });

    res.json({
        balance: account.balance
    })
});
router.post("/transfer", authMiddleware, async (req, res) => {
    const { amount, to } = req.body;

    // Apna account dhundo
    const account = await Account.findOne({ 
        userId: req.userId 
    });

    // Balance kam hai?
    if (!account || account.balance < amount) {
        return res.status(400).json({ 
            message: "Insufficient balance" 
        });
    }

    // Receiver exist karta hai?
    const toAccount = await Account.findOne({ userId: to });
    if (!toAccount) {
        return res.status(400).json({ 
            message: "Invalid account" 
        });
    }

    // Transfer karo
    await Account.updateOne(
        { userId: req.userId },
        { $inc: { balance: -amount } }
    );
    await Account.updateOne(
        { userId: to },
        { $inc: { balance: amount } }
    );

    // Record transaction
    await Transaction.create({
        senderId: req.userId,
        receiverId: to,
        amount: amount
    });

    res.json({ message: "Transfer successful" });
});

router.get("/history", authMiddleware, async (req, res) => {
    const transactions = await Transaction.find({
        $or: [
            { senderId: req.userId },
            { receiverId: req.userId }
        ]
    })
    .populate('senderId', 'firstName lastName')
    .populate('receiverId', 'firstName lastName')
    .sort({ date: -1 });

    res.json({
        transactions: transactions.map(t => ({
            id: t._id,
            sender: `${t.senderId.firstName} ${t.senderId.lastName}`,
            receiver: `${t.receiverId.firstName} ${t.receiverId.lastName}`,
            amount: t.amount,
            date: t.date,
            type: t.senderId._id.toString() === req.userId ? "sent" : "received"
        }))
    });
});
module.exports = router;