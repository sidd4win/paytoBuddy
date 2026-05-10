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
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { amount, to } = req.body;

        if (!amount || amount <= 0) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Invalid amount" });
        }

        // Fetch the account within the transaction
        const account = await Account.findOne({ userId: req.userId }).session(session);

        if (!account || account.balance < amount) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Insufficient balance"
            });
        }

        const toAccount = await Account.findOne({ userId: to }).session(session);

        if (!toAccount) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Invalid account"
            });
        }

        // Perform the transfer
        await Account.updateOne({ userId: req.userId }, { $inc: { balance: -amount } }).session(session);
        await Account.updateOne({ userId: to }, { $inc: { balance: amount } }).session(session);

        // Record transaction
        await Transaction.create([{
            senderId: req.userId,
            receiverId: to,
            amount: amount,
            date: new Date()
        }], { session });

        await session.commitTransaction();
        res.json({
            message: "Transfer successful"
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Transfer error:", error);
        res.status(500).json({ message: "Transaction failed" });
    } finally {
        session.endSession();
    }
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