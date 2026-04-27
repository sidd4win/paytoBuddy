// backend/routes/user.js
const express = require('express');

const router = express.Router();
const zod = require("zod");
const { User, Account } = require("../db");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, GOOGLE_CLIENT_ID } = require("../config");
const  { authMiddleware } = require("../auth"); // Updated from ../middleware
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const signupBody = zod.object({
    username: zod.string().email(),
	firstName: zod.string(),
	lastName: zod.string(),
	password: zod.string()
})

router.post("/signup", async (req, res) => {
    try {
        const { success, error } = signupBody.safeParse(req.body);
        if (!success) {
            return res.status(411).json({
                message: "Incorrect inputs: " + error.errors.map(e => e.message).join(", ")
            });
        }

        const existingUser = await User.findOne({
            username: req.body.username
        });

        if (existingUser) {
            return res.status(411).json({
                message: "Email already taken"
            });
        }

        const user = await User.create({
            username: req.body.username,
            password: req.body.password,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            isAdmin: req.body.username === "admin@paybuddy.com"
        });
        const userId = user._id;

        await Account.create({
            userId,
            balance: 1 + Math.random() * 10000
        });

        const token = jwt.sign({
            userId
        }, JWT_SECRET);

        res.json({
            message: "User created successfully",
            token: token
        });
    } catch (e) {
        console.error("Signup error details:", e);
        // Include the actual error message in the 'message' property so the user sees it in the alert
        res.status(500).json({
            message: "SERVER ERROR: " + e.message + " (Check MONGODB_URI on Vercel and MongoDB IP whitelist)",
            error: e.message
        });
    }
});


const signinBody = zod.object({
    username: zod.string().email(),
	password: zod.string()
})

router.post("/signin", async (req, res) => {
    try {
        const { success, error } = signinBody.safeParse(req.body);
        if (!success) {
            return res.status(411).json({
                message: "Incorrect inputs"
            });
        }

        const user = await User.findOne({
            username: req.body.username,
            password: req.body.password
        });

        if (user) {
            const token = jwt.sign({
                userId: user._id
            }, JWT_SECRET);
    
            res.json({
                token: token
            });
            return;
        }

        res.status(411).json({
            message: "Error while logging in"
        });
    } catch (e) {
        console.error("Signin error:", e);
        res.status(500).json({ message: "Signin failed: " + e.message });
    }
});

const updateBody = zod.object({
	password: zod.string().optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional(),
})

router.put("/", authMiddleware, async (req, res) => {
    const { success } = updateBody.safeParse(req.body)
    if (!success) {
        res.status(411).json({
            message: "Error while updating information"
        })
    }

    await User.updateOne(req.body, {
        id: req.userId
    })

    res.json({
        message: "Updated successfully"
    })
})

router.get("/me", authMiddleware, async (req, res) => {
    const user = await User.findOne({ _id: req.userId });
    if (user) {
        // Temporary: Promote to admin if firstName contains 'admin' (case-insensitive)
        const isActuallyAdmin = user.isAdmin || user.firstName.toLowerCase().includes("admin") || user.username === "admin@paybuddy.com";
        
        res.json({
            firstName: user.firstName,
            lastName: user.lastName,
            isAdmin: isActuallyAdmin
        });
    } else {
        res.status(404).json({ message: "User not found" });
    }
});

router.get("/bulk", async (req, res) => {
    const filter = req.query.filter || "";

    const users = await User.find({
        $or: [{
            firstName: {
                "$regex": filter
            }
        }, {
            lastName: {
                "$regex": filter
            }
        }]
    })

    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })
})

router.post("/google-signin", async (req, res) => {
    try {
        const { credential } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const email = payload['email'];
        const firstName = payload['given_name'] || "";
        const lastName = payload['family_name'] || "";

        let user = await User.findOne({ username: email });

        if (!user) {
            user = await User.create({
                username: email,
                password: Math.random().toString(36).slice(-8),
                firstName: firstName,
                lastName: lastName,
            });

            await Account.create({
                userId: user._id,
                balance: 1 + Math.random() * 10000
            });
        }

        const token = jwt.sign({
            userId: user._id
        }, JWT_SECRET);

        res.json({
            message: "Logged in via Google",
            token: token
        });
    } catch (e) {
        res.status(411).json({
            message: "Google sign-in failed"
        });
    }
});

module.exports = router;