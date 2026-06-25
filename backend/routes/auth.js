const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// Register User
// In the register route, add isVerified: true
router.post('/register', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('type').isIn(['patient', 'pharmacist', 'doctor']).withMessage('Invalid user type')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { 
            name, email, password, type, 
            phoneNumber, address,
            pharmacyName, pharmacyLocation, 
            hospitalName, hospitalLocation, specialization,
            latitude, longitude
        } = req.body;
        
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        let userData = {
            name,
            email,
            password,
            type,
            phoneNumber,
            address,
            latitude: latitude || null,
            longitude: longitude || null,
            isVerified: true  // <-- ADD THIS LINE - Auto-verify all users
        };
        
        if (type === 'pharmacist') {
            userData.pharmacyName = pharmacyName;
            userData.pharmacyLocation = pharmacyLocation;
        } else if (type === 'doctor') {
            userData.hospitalName = hospitalName;
            userData.hospitalLocation = hospitalLocation;
            userData.specialization = specialization;
        }
        
        const user = await User.create(userData);
        const token = generateToken(user._id);
        
        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                type: user.type,
                phoneNumber: user.phoneNumber,
                pharmacyName: user.pharmacyName,
                hospitalName: user.hospitalName,
                pharmacyLocation: user.pharmacyLocation,
                hospitalLocation: user.hospitalLocation,
                latitude: user.latitude,
                longitude: user.longitude
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login User
router.post('/login', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const token = generateToken(user._id);
        
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                type: user.type,
                phoneNumber: user.phoneNumber,
                pharmacyName: user.pharmacyName,
                hospitalName: user.hospitalName,
                pharmacyLocation: user.pharmacyLocation,
                hospitalLocation: user.hospitalLocation,
                latitude: user.latitude,
                longitude: user.longitude
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Forgot Password
router.post('/forgot-password', [
    body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
        
        await user.save();
        
        res.json({
            success: true,
            message: 'Password reset token generated',
            resetToken: resetToken
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset Password
router.post('/reset-password', [
    body('token').notEmpty().withMessage('Token is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { token, newPassword } = req.body;
        
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');
        
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }
        
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        
        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get current user
router.get('/me', protect, async (req, res) => {
    res.json({
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            type: req.user.type,
            phoneNumber: req.user.phoneNumber,
            pharmacyName: req.user.pharmacyName,
            hospitalName: req.user.hospitalName,
            pharmacyLocation: req.user.pharmacyLocation,
            hospitalLocation: req.user.hospitalLocation,
            latitude: req.user.latitude,
            longitude: req.user.longitude
        }
    });
});

// ============================================
// GET ALL PHARMACISTS & DOCTORS
// ============================================
// Get all pharmacists (for patients to see)
router.get('/pharmacists', protect, async (req, res) => {
    try {
        // Remove isVerified filter temporarily for testing
        const pharmacists = await User.find({ 
            type: 'pharmacist'
            // isVerified: true  // Comment this out temporarily
        }).select('name pharmacyName pharmacyLocation latitude longitude phoneNumber address');
        res.json(pharmacists);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all doctors (for patients to see)
router.get('/doctors', protect, async (req, res) => {
    try {
        // Remove isVerified filter temporarily for testing
        const doctors = await User.find({ 
            type: 'doctor'
            // isVerified: true  // Comment this out temporarily
        }).select('name hospitalName hospitalLocation latitude longitude specialization phoneNumber address');
        res.json(doctors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Get all doctors (for patients to see) - FIXED: changed req, req to req, res
router.get('/doctors', protect, async (req, res) => {
    try {
        const doctors = await User.find({ 
            type: 'doctor',
            isVerified: true
        }).select('name hospitalName hospitalLocation latitude longitude specialization phoneNumber address');
        res.json(doctors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// SEARCH ENDPOINTS
// ============================================

// Search pharmacists by location or name
router.get('/search/pharmacists', protect, async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }
        
        const searchRegex = new RegExp(query, 'i');
        
        const pharmacists = await User.find({
            type: 'pharmacist',
            isVerified: true,
            $or: [
                { pharmacyName: searchRegex },
                { pharmacyLocation: searchRegex },
                { name: searchRegex },
                { 'address.city': searchRegex },
                { 'address.state': searchRegex },
                { 'address.street': searchRegex }
            ]
        }).select('name pharmacyName pharmacyLocation latitude longitude phoneNumber address');
        
        res.json(pharmacists);
    } catch (error) {
        console.error('Search pharmacists error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Search doctors by location, name, or specialization
router.get('/search/doctors', protect, async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }
        
        const searchRegex = new RegExp(query, 'i');
        
        const doctors = await User.find({
            type: 'doctor',
            isVerified: true,
            $or: [
                { hospitalName: searchRegex },
                { hospitalLocation: searchRegex },
                { name: searchRegex },
                { specialization: searchRegex },
                { 'address.city': searchRegex },
                { 'address.state': searchRegex },
                { 'address.street': searchRegex }
            ]
        }).select('name hospitalName hospitalLocation latitude longitude specialization phoneNumber address');
        
        res.json(doctors);
    } catch (error) {
        console.error('Search doctors error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;