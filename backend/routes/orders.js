const express = require('express');
const Order = require('../models/Order');
const Medicine = require('../models/Medicine');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Book Appointment
router.post('/appointment', [
    protect,
    body('doctorId').notEmpty().withMessage('Doctor ID is required'),
    body('appointmentDate').isDate().withMessage('Valid appointment date is required'),
    body('appointmentTime').notEmpty().withMessage('Appointment time is required'),
    body('appointmentReason').notEmpty().withMessage('Reason is required'),
    body('patientPhone').notEmpty().withMessage('Phone number is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        if (req.user.type !== 'patient') {
            return res.status(403).json({ message: 'Only patients can book appointments' });
        }
        
        const { doctorId, appointmentDate, appointmentTime, appointmentReason, patientPhone, patientAddress } = req.body;
        
        const doctor = await User.findById(doctorId);
        if (!doctor || doctor.type !== 'doctor') {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        
        const order = await Order.create({
            patient: req.user._id,
            patientName: req.user.name,
            patientPhone: patientPhone,
            patientAddress: patientAddress || req.user.address,
            doctor: doctorId,
            hospitalName: doctor.hospitalName,
            appointmentDate: new Date(appointmentDate),
            appointmentTime,
            appointmentReason,
            orderType: 'appointment',
            status: 'Pending'
        });
        
        res.status(201).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Place Medicine Order
router.post('/medicine', [
    protect,
    body('pharmacistId').notEmpty().withMessage('Pharmacist ID is required'),
    body('medicines').isArray().withMessage('Medicines must be an array'),
    body('medicines.*.medicineId').notEmpty().withMessage('Medicine ID required'),
    body('medicines.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('patientPhone').notEmpty().withMessage('Phone number is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        if (req.user.type !== 'patient') {
            return res.status(403).json({ message: 'Only patients can place orders' });
        }
        
        const { pharmacistId, medicines, patientPhone, patientAddress } = req.body;
        
        const pharmacist = await User.findById(pharmacistId);
        if (!pharmacist || pharmacist.type !== 'pharmacist') {
            return res.status(404).json({ message: 'Pharmacist not found' });
        }
        
        let totalAmount = 0;
        const orderMedicines = [];
        
        // Validate and calculate total
        for (const item of medicines) {
            const medicine = await Medicine.findById(item.medicineId);
            if (!medicine) {
                return res.status(404).json({ message: `Medicine ${item.medicineId} not found` });
            }
            
            if (medicine.quantity < item.quantity) {
                return res.status(400).json({ message: `Insufficient quantity for ${medicine.name}` });
            }
            
            const itemTotal = medicine.price * item.quantity;
            totalAmount += itemTotal;
            
            orderMedicines.push({
                medicine: medicine._id,
                medicineName: medicine.name,
                quantity: item.quantity,
                price: medicine.price
            });
            
            // Update medicine quantity
            medicine.quantity -= item.quantity;
            await medicine.save();
        }
        
        const order = await Order.create({
            patient: req.user._id,
            patientName: req.user.name,
            patientPhone: patientPhone,
            patientAddress: patientAddress || req.user.address,
            medicines: orderMedicines,
            pharmacist: pharmacistId,
            pharmacyName: pharmacist.pharmacyName,
            orderType: 'medicine',
            totalAmount,
            status: 'Pending'
        });
        
        res.status(201).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get patient's orders (both medicines and appointments)
router.get('/my-orders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ patient: req.user._id })
            .populate('doctor', 'name hospitalName phoneNumber')
            .populate('pharmacist', 'name pharmacyName phoneNumber')
            .sort('-orderDate');
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get pharmacist's orders
router.get('/pharmacist-orders', protect, async (req, res) => {
    try {
        if (req.user.type !== 'pharmacist') {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const orders = await Order.find({ 
            pharmacist: req.user._id,
            orderType: 'medicine'
        })
        .populate('patient', 'name phoneNumber address')
        .sort('-orderDate');
        
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get doctor's appointments
router.get('/doctor-appointments', protect, async (req, res) => {
    try {
        if (req.user.type !== 'doctor') {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const orders = await Order.find({ 
            doctor: req.user._id,
            orderType: 'appointment'
        })
        .populate('patient', 'name phoneNumber address')
        .sort('-appointmentDate');
        
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update order status (for pharmacist or doctor)
router.put('/:id/status', protect, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        // Check authorization
        if (order.orderType === 'medicine' && req.user.type === 'pharmacist') {
            if (order.pharmacist.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized' });
            }
        } else if (order.orderType === 'appointment' && req.user.type === 'doctor') {
            if (order.doctor.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized' });
            }
        } else {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        order.status = status;
        if (status === 'Completed' || status === 'Delivered') {
            order.deliveryDate = new Date();
        }
        
        await order.save();
        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all pharmacists with their locations
router.get('/pharmacists-nearby', protect, async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;
        
        // Simple search - in production use MongoDB geospatial queries
        const pharmacists = await User.find({
            type: 'pharmacist',
            isVerified: true
        }).select('name pharmacyName pharmacyLocation latitude longitude phoneNumber address');
        
        // Calculate distance (simplified)
        const nearby = pharmacists.map(p => {
            if (p.latitude && p.longitude && lat && lng) {
                const distance = calculateDistance(
                    parseFloat(lat), parseFloat(lng),
                    p.latitude, p.longitude
                );
                return { ...p.toObject(), distance: distance.toFixed(2) };
            }
            return { ...p.toObject(), distance: 'N/A' };
        });
        
        // Sort by distance
        nearby.sort((a, b) => (a.distance !== 'N/A' && b.distance !== 'N/A') ? 
            parseFloat(a.distance) - parseFloat(b.distance) : 0);
        
        res.json(nearby);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

module.exports = router;