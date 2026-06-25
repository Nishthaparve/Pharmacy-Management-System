const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    patientName: {
        type: String,
        required: true
    },
    patientPhone: {
        type: String,
        required: true
    },
    patientAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    // For medicine orders
    medicines: [{
        medicine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine'
        },
        medicineName: String,
        quantity: {
            type: Number,
            min: 1
        },
        price: Number
    }],
    pharmacist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    pharmacyName: String,
    // For appointment booking
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    hospitalName: String,
    appointmentDate: {
        type: Date
    },
    appointmentTime: {
        type: String
    },
    appointmentReason: {
        type: String
    },
    orderType: {
        type: String,
        enum: ['medicine', 'appointment'],
        required: true
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'Delivered'],
        default: 'Pending'
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    deliveryDate: {
        type: Date
    }
});

module.exports = mongoose.model('Order', orderSchema);