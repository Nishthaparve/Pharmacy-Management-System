const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Medicine = require('./models/Medicine');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        // Clear existing data
        await User.deleteMany({});
        await Medicine.deleteMany({});
        console.log('Cleared existing data');
        
        // Create Pharmacists with location data
        const pharmacists = [
            {
                name: 'Rajesh Sharma',
                email: 'pharmacy1@test.com',
                password: '123456',
                type: 'pharmacist',
                phoneNumber: '9876543210',
                pharmacyName: 'Sharma Medical Store',
                pharmacyLocation: 'Pune, Maharashtra',
                latitude: 18.5204,
                longitude: 73.8567,
                address: {
                    street: '123 Main Road',
                    city: 'Pune',
                    state: 'Maharashtra',
                    zipCode: '411001',
                    country: 'India'
                },
                isVerified: true
            },
            {
                name: 'Priya Patel',
                email: 'pharmacy2@test.com',
                password: '123456',
                type: 'pharmacist',
                phoneNumber: '9876543211',
                pharmacyName: 'Patel Pharmacy',
                pharmacyLocation: 'Akurdi, Pune',
                latitude: 18.6298,
                longitude: 73.7654,
                address: {
                    street: '45 Akurdi Road',
                    city: 'Akurdi',
                    state: 'Maharashtra',
                    zipCode: '411035',
                    country: 'India'
                },
                isVerified: true
            },
            {
                name: 'Amit Kumar',
                email: 'pharmacy3@test.com',
                password: '123456',
                type: 'pharmacist',
                phoneNumber: '9876543212',
                pharmacyName: 'Kumar Medical Hall',
                pharmacyLocation: 'Mumbai, Maharashtra',
                latitude: 19.0760,
                longitude: 72.8777,
                address: {
                    street: '789 Marine Drive',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    zipCode: '400001',
                    country: 'India'
                },
                isVerified: true
            }
        ];
        
        const savedPharmacists = [];
        for (const data of pharmacists) {
            const user = new User(data);
            await user.save();
            savedPharmacists.push(user);
            console.log(`Created pharmacist: ${data.name} at ${data.pharmacyLocation}`);
        }
        
        // Create Medicines for each pharmacist
        const medicines = [
            {
                name: 'Azithromycin',
                expiryDate: new Date('2029-02-05'),
                quantity: 899,
                purpose: 'Treats various bacterial infections, including respiratory and skin infections.',
                price: 45,
                pharmacist: savedPharmacists[0]._id
            },
            {
                name: 'Naproxen',
                expiryDate: new Date('2029-06-26'),
                quantity: 1000,
                purpose: 'An NSAID for long-lasting relief from arthritis, menstrual cramps, and muscle aches.',
                price: 46,
                pharmacist: savedPharmacists[0]._id
            },
            {
                name: 'Ibuprofen',
                expiryDate: new Date('2029-09-08'),
                quantity: 1000,
                purpose: 'A non-steroidal anti-inflammatory drug (NSAID) used to relieve pain, reduce inflammation, and lower fever.',
                price: 34,
                pharmacist: savedPharmacists[0]._id
            },
            {
                name: 'Vitamin E Capsule',
                expiryDate: new Date('2027-08-04'),
                quantity: 100,
                purpose: 'A dietary supplement that contains vitamin E, which supports immune function, skin health, and hair health.',
                price: 34,
                pharmacist: savedPharmacists[0]._id
            },
            {
                name: 'Amoxicillin',
                expiryDate: new Date('2026-06-23'),
                quantity: 100,
                purpose: 'An antibiotic used to treat bacterial infections (e.g., ear, chest, or urinary tract).',
                price: 45,
                pharmacist: savedPharmacists[0]._id
            },
            {
                name: 'Aspirin',
                expiryDate: new Date('2026-03-30'),
                quantity: 100,
                purpose: 'Aspirin medicine for headache.',
                price: 80,
                pharmacist: savedPharmacists[0]._id
            },
            {
                name: 'Paracetamol',
                expiryDate: new Date('2026-04-01'),
                quantity: 100,
                purpose: 'A non-steroidal anti-inflammatory drug (NSAID).',
                price: 50,
                pharmacist: savedPharmacists[0]._id
            }
        ];
        
        for (const data of medicines) {
            const medicine = new Medicine(data);
            await medicine.save();
            console.log(`Created medicine: ${data.name}`);
        }
        
        console.log('✅ Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedData();