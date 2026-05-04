const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true
    },
    mobileOrEmail: {
        type: String,
        required: [true, 'Please add a mobile number or email'],
        unique: true
    },
    agriId: {
        type: String,
        unique: true,
        sparse: true // Allows nulls for older records without throwing unique constraint error
    },
    farmArea: {
        type: Number,
        default: 0
    },
    profilePicture: {
        type: String,
        default: ''
    },
    state: {
        type: String,
        default: ''
    },
    district: {
        type: String,
        default: ''
    },
    village: {
        type: String,
        default: ''
    },
    primaryCrop: {
        type: String,
        default: ''
    },
    language: {
        type: String,
        default: 'English'
    },
    notificationsEnabled: {
        type: Boolean,
        default: true
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false // Do not return password by default
    },
    otp: {
        type: String,
        select: false // Do not return otp by default
    },
    otpExpires: {
        type: Date,
        select: false
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
