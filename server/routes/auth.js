const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Generate Alphanumeric Agri-ID
const generateAgriId = () => {
    return 'AGRI-' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

// @route   POST /api/auth/register
// @desc    Request registration - saves user as unverified and sends OTP
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, 'mobile-email': mobileOrEmail, password, firebaseVerified } = req.body;

        if (!name || (!email && !mobileOrEmail) || !password) {
            return res.status(400).json({ message: 'Please add all required fields' });
        }

        let user = await User.findOne({ 
            $or: [{ email }, { mobileOrEmail }] 
        }).select('+password +otp +otpExpires');

        if (user) {
            if (user.isVerified) {
                return res.status(400).json({ message: 'User already exists and is verified. Please log in.' });
            }
            // If they exist but are not verified, we can just update their details and resend OTP
            user.name = name;
            user.password = password;
        } else {
            // Create brand new unverified user
            const generatedAgriId = generateAgriId();
            user = new User({
                name,
                email,
                mobileOrEmail,
                password,
                agriId: generatedAgriId,
                isVerified: firebaseVerified ? true : false
            });
        }

        if (firebaseVerified) {
            user.isVerified = true;
            if (!user.agriId) {
                user.agriId = generateAgriId();
            }
            await user.save();
            return res.status(200).json({ 
                message: 'Registration complete via Firebase', 
                _id: user.id,
                name: user.name,
                email: user.email,
                mobileOrEmail: user.mobileOrEmail,
                agriId: user.agriId,
                farmArea: user.farmArea,
                profilePicture: user.profilePicture,
                state: user.state,
                district: user.district,
                village: user.village,
                primaryCrop: user.primaryCrop,
                language: user.language,
                notificationsEnabled: user.notificationsEnabled,
                token: generateToken(user._id)
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = Date.now() + 2 * 60 * 1000; // 2 min
        await user.save();

        console.log(`[REGISTER OTP for ${user.email}]: ${otp}`);
        
        // Send actual email via Gmail SMTP
        await sendEmail({
            email: user.email,
            subject: 'AgriSahayak - Verify Registration',
            message: `Welcome to AgriSahayak!\nYour registration OTP is: ${otp}\nIt will expire in 2 minutes.`
        });

        res.status(200).json({ message: 'OTP sent to email/mobile', userId: user._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/verify-register
// @desc    Verify OTP for registration making account active
// @access  Public
router.post('/verify-register', async (req, res) => {
    try {
        const { userId, otp } = req.body;
        const user = await User.findById(userId).select('+otp +otpExpires');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        if (!user.otp || user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }
        
        if (user.otpExpires && Date.now() > user.otpExpires) {
            return res.status(400).json({ message: 'OTP has expired' });
        }
        
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            mobileOrEmail: user.mobileOrEmail,
            agriId: user.agriId,
            farmArea: user.farmArea,
            profilePicture: user.profilePicture,
            state: user.state,
            district: user.district,
            village: user.village,
            primaryCrop: user.primaryCrop,
            language: user.language,
            notificationsEnabled: user.notificationsEnabled,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/login
// @desc    Standard Login with Email/Mobile and Password directly (or firebaseVerified)
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { 'mobile-email': mobileOrEmail, password, firebaseVerified } = req.body;

        // Find user by mobileOrEmail
        let user = await User.findOne({ mobileOrEmail }).select('+password');
        if (!user) {
            user = await User.findOne({ email: mobileOrEmail }).select('+password');
        }

        if (user && (firebaseVerified || (await user.matchPassword(password)))) {
            if (!user.isVerified) {
                return res.status(401).json({ message: 'Please verify your account first.' });
            }

            // Auto-generate missing agriId for legacy users
            if (!user.agriId) {
                user.agriId = generateAgriId();
                await user.save();
            }

            res.status(200).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                mobileOrEmail: user.mobileOrEmail,
                agriId: user.agriId,
                farmArea: user.farmArea,
                profilePicture: user.profilePicture,
                state: user.state,
                district: user.district,
                village: user.village,
                primaryCrop: user.primaryCrop,
                language: user.language,
                notificationsEnabled: user.notificationsEnabled,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/forgot-password
// @desc    Send OTP to reset password
// @access  Public
router.post('/forgot-password', async (req, res) => {
    try {
        const { 'mobile-email': mobileOrEmail, firebaseVerified } = req.body;

        let user = await User.findOne({ mobileOrEmail });
        if (!user) {
            user = await User.findOne({ email: mobileOrEmail });
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (firebaseVerified) {
            return res.status(200).json({ message: 'User exists, proceed to reset', userId: user._id });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = Date.now() + 2 * 60 * 1000; // 2 minutes
        await user.save();

        console.log(`[FORGOT PASSWORD OTP for ${user.email}]: ${otp}`);
        
        // Send email
        await sendEmail({
            email: user.email,
            subject: 'AgriSahayak - Reset Password OTP',
            message: `You requested a password reset.\nYour OTP is: ${otp}\nIt will expire in 2 minutes.`
        });

        res.status(200).json({ message: 'OTP sent successfully', userId: user._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using OTP
// @access  Public
router.post('/reset-password', async (req, res) => {
    try {
        const { userId, otp, newPassword, firebaseVerified } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // We need to select password here to overwrite it and re-hash it inside pre-save
        const user = await User.findById(userId).select('+otp +otpExpires +password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!firebaseVerified) {
            // OTP VERIFICATION BYPASSED BY REQUEST
            // if (!user.otp || user.otp !== otp) {
            //     return res.status(400).json({ message: 'Invalid OTP' });
            // }
            // 
            // if (user.otpExpires && Date.now() > user.otpExpires) {
            //     return res.status(400).json({ message: 'OTP has expired' });
            // }
        }

        // Update password and clear OTP
        user.password = newPassword;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile data (Farm Area, Profile Photo)
// @access  Public (in production, use auth middleware, for now user ID supplied)
router.put('/profile', async (req, res) => {
    try {
        const { 
            userId, farmArea, profilePicture, name, agriId,
            state, district, village, primaryCrop, language, notificationsEnabled 
        } = req.body;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (farmArea !== undefined) user.farmArea = farmArea;
        if (profilePicture !== undefined) user.profilePicture = profilePicture;
        if (name !== undefined) user.name = name;
        if (agriId !== undefined) user.agriId = agriId;
        if (state !== undefined) user.state = state;
        if (district !== undefined) user.district = district;
        if (village !== undefined) user.village = village;
        if (primaryCrop !== undefined) user.primaryCrop = primaryCrop;
        if (language !== undefined) user.language = language;
        if (notificationsEnabled !== undefined) user.notificationsEnabled = notificationsEnabled;

        await user.save();

        res.status(200).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            mobileOrEmail: user.mobileOrEmail,
            agriId: user.agriId,
            farmArea: user.farmArea,
            profilePicture: user.profilePicture,
            state: user.state,
            district: user.district,
            village: user.village,
            primaryCrop: user.primaryCrop,
            language: user.language,
            notificationsEnabled: user.notificationsEnabled,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
});

// @route   POST /api/auth/send-login-otp
// @desc    Send OTP to email for passwordless login
// @access  Public
router.post('/send-login-otp', async (req, res) => {
    try {
        const { email } = req.body;
        
        let user = await User.findOne({ email });
        if (!user) {
            user = await User.findOne({ mobileOrEmail: email });
        }
        
        if (!user) {
            return res.status(404).json({ message: 'No account found with this email' });
        }
        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = Date.now() + 2 * 60 * 1000; // 2 min
        await user.save();
        
        console.log(`[LOGIN OTP for ${user.email}]: ${otp}`);
        
        await sendEmail({
            email: user.email,
            subject: 'AgriSahayak - Login OTP',
            message: `Welcome back to AgriSahayak!\nYour Login OTP is: ${otp}\nIt will expire in 2 minutes.`
        });
        
        res.status(200).json({ message: 'OTP sent successfully to email', userId: user._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error sending OTP' });
    }
});

// @route   POST /api/auth/verify-login-otp
// @desc    Verify OTP for passwordless login
// @access  Public
router.post('/verify-login-otp', async (req, res) => {
    try {
        const { userId, otp } = req.body;
        const user = await User.findById(userId).select('+otp +otpExpires');
        
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (!user.otp || user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
        if (user.otpExpires && Date.now() > user.otpExpires) return res.status(400).json({ message: 'OTP has expired' });
        
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            mobileOrEmail: user.mobileOrEmail,
            agriId: user.agriId,
            farmArea: user.farmArea,
            profilePicture: user.profilePicture,
            state: user.state,
            district: user.district,
            village: user.village,
            primaryCrop: user.primaryCrop,
            language: user.language,
            notificationsEnabled: user.notificationsEnabled,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error verifying OTP' });
    }
});

module.exports = router;
