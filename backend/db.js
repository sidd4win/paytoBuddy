// backend/db.js
const mongoose = require('mongoose');

// Supporting both MONGODB_URI and MONGODB_URL to avoid confusion
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL;

if (!MONGODB_URI) {
    console.error("❌ CRITICAL ERROR: MONGODB_URI/URL environment variable is not defined!");
    console.error("Please set MONGODB_URI in your deployment platform (Render/Vercel).");
} else {
    const maskedURI = MONGODB_URI.replace(/:([^@]+)@/, ':****@');
    console.log(`📡 Attempting to connect to MongoDB: ${maskedURI}`);
}

mongoose.connect(MONGODB_URI || "mongodb://localhost:27017/paytm", {
    serverSelectionTimeoutMS: 5000, 
})
    .then(() => console.log("✅ MongoDB connected successfully!"))
    .catch((err) => {
        console.error("❌ MongoDB connection error:");
        console.error(err.message);
    });

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minLength: 3,
        maxLength: 30
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    }
});

const accountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    balance: {
        type: Number,
        required: true
    }
});

const Account = mongoose.model('Account', accountSchema);
const User = mongoose.model('User', userSchema);

module.exports = {
	User,
  Account,
};