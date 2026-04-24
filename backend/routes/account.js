// backend/routes/account.js
const express = require('express');
const { authMiddleware } = require('../middleware');
const { Account } = require('../db');
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

    res.json({ message: "Transfer successful" });
});
module.exports = router;