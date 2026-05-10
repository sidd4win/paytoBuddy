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
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
    }
});

async function sendOtp(email, user) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    console.log(`[DEV MODE] OTP for ${email} is: ${otp}`);

    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
        try {
            await transporter.sendMail({
                from: process.env.SMTP_EMAIL,
                to: email,
                subject: "Your PayBuddy OTP",
                text: `Your OTP for PayBuddy is: ${otp}. It is valid for 5 minutes.`
            });
        } catch (emailError) {
            console.error("Failed to send email:", emailError);
        }
    }
    return otp;
}

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
            if (!existingUser.isVerified) {
                // User exists but not verified, send OTP again
                await sendOtp(req.body.username, existingUser);
                return res.json({
                    message: "User already exists but is unverified. OTP resent.",
                    step: "OTP_REQUIRED",
                    email: req.body.username
                });
            }
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

        await sendOtp(req.body.username, user);

        res.json({
            message: "OTP sent to your email for verification",
            step: "OTP_REQUIRED",
            email: req.body.username
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
            await sendOtp(user.username, user);

            return res.json({
                step: "OTP_REQUIRED",
                email: user.username,
                message: "OTP sent to your email"
            });
        }

        res.status(411).json({
            message: "Error while logging in"
        });
    } catch (e) {
        console.error("Signin error:", e);
        res.status(500).json({ message: "Signin failed: " + e.message });
    }
});

router.post("/signin-otp-request", async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "User not found with this email" });
        }

        await sendOtp(username, user);
        res.json({ 
            message: "OTP sent to your email",
            step: "OTP_REQUIRED",
            email: username
        });
    } catch (e) {
        console.error("Signin OTP request error:", e);
        res.status(500).json({ message: "Server error" });
    }
});

const verifyOtpBody = zod.object({
    email: zod.string().email(),
    otp: zod.string()
});

router.post("/verify-otp", async (req, res) => {
    try {
        const { success } = verifyOtpBody.safeParse(req.body);
        if (!success) {
            return res.status(400).json({ message: "Invalid inputs" });
        }

        const user = await User.findOne({ username: req.body.email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.otp !== req.body.otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (user.otpExpiry && user.otpExpiry < new Date()) {
            return res.status(400).json({ message: "OTP expired" });
        }

        // OTP is valid
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.isVerified = true;
        await user.save();

        const token = jwt.sign({
            userId: user._id
        }, JWT_SECRET);

        res.json({ token: token });

    } catch (e) {
        console.error("Verify OTP error:", e);
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/resend-otp", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ username: email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await sendOtp(email, user);
        res.json({ message: "OTP resent successfully" });
    } catch (e) {
        console.error("Resend OTP error:", e);
        res.status(500).json({ message: "Server error" });
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