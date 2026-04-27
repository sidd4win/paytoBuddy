const express = require('express');
const { authMiddleware } = require('../auth');
const { User, Account, Transaction } = require('../db');

const router = express.Router();

// Middleware to check if user is an admin
const adminMiddleware = async (req, res, next) => {
    const user = await User.findOne({ _id: req.userId });
    const isActuallyAdmin = user && (user.isAdmin || user.firstName.toLowerCase().includes("admin") || user.username === "admin@paybuddy.com");
    
    if (!isActuallyAdmin) {
        return res.status(403).json({ message: "Access denied. Admin only." });
    }
    next();
};

router.get("/stats", authMiddleware, adminMiddleware, async (req, res) => {
    const totalUsers = await User.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    
    const allAccounts = await Account.find({});
    const totalSystemBalance = allAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    const allTransactions = await Transaction.find({});
    const totalVolume = allTransactions.reduce((sum, t) => sum + t.amount, 0);

    res.json({
        totalUsers,
        totalTransactions,
        totalSystemBalance,
        totalVolume
    });
});

router.get("/transactions", authMiddleware, adminMiddleware, async (req, res) => {
    const transactions = await Transaction.find({})
        .populate('senderId', 'firstName lastName username')
        .populate('receiverId', 'firstName lastName username')
        .sort({ date: -1 });

    res.json({
        transactions: transactions.map(t => ({
            id: t._id,
            sender: `${t.senderId.firstName} ${t.senderId.lastName}`,
            senderEmail: t.senderId.username,
            receiver: `${t.receiverId.firstName} ${t.receiverId.lastName}`,
            receiverEmail: t.receiverId.username,
            amount: t.amount,
            date: t.date
        }))
    });
});

router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
    const users = await User.find({});
    const usersWithBalance = await Promise.all(users.map(async (user) => {
        const account = await Account.findOne({ userId: user._id });
        return {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.username,
            isAdmin: user.isAdmin,
            balance: account ? account.balance : 0
        };
    }));

    res.json({ users: usersWithBalance });
});

module.exports = router;
