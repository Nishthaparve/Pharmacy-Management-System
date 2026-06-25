const express = require('express');
const Medicine = require('../models/Medicine');
const { protect, pharmacistOnly } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all medicines (for patients) - FILTER BY PHARMACIST
router.get('/', protect, async (req, res) => {
    try {
        const { pharmacist } = req.query;
        
        let query = { quantity: { $gt: 0 } };
        
        // If pharmacist ID is provided, filter by that pharmacist
        if (pharmacist) {
            query.pharmacist = pharmacist;
        }
        
        const medicines = await Medicine.find(query)
            .populate('pharmacist', 'name pharmacyName')
            .sort('-createdAt');
            
        res.json(medicines);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get pharmacist's own medicines (for pharmacist panel)
router.get('/my-medicines', protect, pharmacistOnly, async (req, res) => {
    try {
        const medicines = await Medicine.find({ pharmacist: req.user._id })
            .sort('-createdAt');
        res.json(medicines);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add medicine (pharmacist only)
router.post('/', [
    protect,
    pharmacistOnly,
    body('name').notEmpty().withMessage('Medicine name is required'),
    body('expiryDate').isDate().withMessage('Valid expiry date is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('purpose').notEmpty().withMessage('Purpose is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { name, expiryDate, quantity, purpose, price } = req.body;
        
        const medicine = await Medicine.create({
            name,
            expiryDate,
            quantity,
            purpose,
            price,
            pharmacist: req.user._id
        });
        
        res.status(201).json(medicine);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update medicine (pharmacist only)
router.put('/:id', protect, pharmacistOnly, async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);
        
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }
        
        if (medicine.pharmacist.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        const updatedMedicine = await Medicine.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        res.json(updatedMedicine);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete medicine (pharmacist only)
router.delete('/:id', protect, pharmacistOnly, async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);
        
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }
        
        if (medicine.pharmacist.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        await medicine.deleteOne();
        res.json({ message: 'Medicine removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;