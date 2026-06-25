const express = require('express');
const { protect } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// ============================================
// CHATBOT - LOCAL AI ENGINE (NO API KEY)
// ============================================

router.post('/chat', protect, [
    body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { message } = req.body;
        const userType = req.user.type || 'patient';
        const userName = req.user.name || 'User';
        
        // Get AI-like response from local engine
        const response = getLocalAIResponse(message, userType, userName);
        
        res.json({
            success: true,
            response: response
        });
        
    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error processing your request' 
        });
    }
});

// ============================================
// LOCAL AI RESPONSE ENGINE
// ============================================

function getLocalAIResponse(message, userType, userName) {
    const msg = message.toLowerCase().trim();
    
    // ============================================
    // GREETINGS & PERSONALIZATION
    // ============================================
    
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
        return getRandom([
            `👋 Hello ${userName}! How can I help you today?`,
            `Hi there ${userName}! What can I assist you with?`,
            `Hey ${userName}! I'm here to help with your healthcare needs.`
        ]);
    }
    
    if (msg.includes('how are you')) {
        return getRandom([
            "I'm doing great, thanks for asking! How can I help you today? 😊",
            "I'm functioning perfectly! Ready to assist you with any pharmacy needs.",
            "All systems operational! What can I do for you today?"
        ]);
    }
    
    if (msg.includes('thank') || msg.includes('thanks')) {
        return getRandom([
            "You're welcome! 😊 Anything else I can help with?",
            "Happy to help! 🤗 Is there anything else you need?",
            "Anytime! 😊 Feel free to ask if you need anything else."
        ]);
    }
    
    if (msg.includes('bye') || msg.includes('goodbye')) {
        return getRandom([
            "Goodbye! Take care of your health! 👋",
            "See you later! Stay healthy! 💪",
            "Bye! Remember, your health is your wealth! 🌟"
        ]);
    }
    
    // ============================================
    // MEDICINE & ORDER QUESTIONS
    // ============================================
    
    if (msg.includes('medicine') || msg.includes('medicines')) {
        if (msg.includes('order') || msg.includes('buy') || msg.includes('purchase')) {
            return getRandom([
                "💊 To order medicines:\n1. Go to 'Order Medicine'\n2. Select a pharmacy\n3. Browse available medicines\n4. Click 'Add to Cart'\n5. Go to Cart and click 'Place Order'",
                "💊 Ordering medicines is easy!\n• Go to Order Medicine\n• Pick a pharmacy\n• Add items to cart\n• Place your order\n\nNeed any specific medicine help?"
            ]);
        }
        if (msg.includes('price') || msg.includes('cost') || msg.includes('rate')) {
            return "💰 Each medicine has its price listed in USD ($). You can see the price when viewing any medicine in a pharmacy.";
        }
        if (msg.includes('search') || msg.includes('find')) {
            return "🔍 You can search for medicines by name or purpose using the search bar in the Order Medicine section.";
        }
        return getRandom([
            "💊 You can browse all available medicines in the 'Order Medicine' section. Each pharmacy has its own list of medicines with details like name, expiry date, quantity, purpose, and price.",
            "💊 All medicines are listed with their complete details. You can compare prices and choose the best option for your needs."
        ]);
    }
    
    if (msg.includes('order') || msg.includes('orders')) {
        if (msg.includes('status') || msg.includes('track') || msg.includes('delivered')) {
            return getRandom([
                "📦 You can track your order status in the 'Dashboard' or 'History' section. Statuses include: Pending, In Progress, and Delivered.",
                "📦 Your order status shows the current stage of delivery. Check your Dashboard for real-time updates."
            ]);
        }
        if (msg.includes('cancel')) {
            return "❌ To cancel an order, please contact the pharmacist directly. Orders can only be cancelled before they are processed.";
        }
        if (msg.includes('history')) {
            return "📜 Your complete order history is available in the 'History' section. You can view all past orders with their status and dates.";
        }
        return getRandom([
            "🛒 You can place orders by:\n1. Going to 'Order Medicine'\n2. Selecting a pharmacy\n3. Adding medicines to cart\n4. Clicking 'Place Order'\n\nMake sure to provide your phone number for confirmation!",
            "🛒 Orders are processed by the pharmacist. You'll receive updates as your order status changes."
        ]);
    }
    
    // ============================================
    // APPOINTMENT & DOCTOR QUESTIONS
    // ============================================
    
    if (msg.includes('appointment') || msg.includes('appointments')) {
        if (msg.includes('book') || msg.includes('schedule') || msg.includes('new')) {
            return getRandom([
                "📅 To book an appointment:\n1. Go to 'Book Appointment'\n2. Select a doctor\n3. Choose date and time\n4. Enter your details\n5. Confirm booking",
                "📅 Booking an appointment is simple!\n• Navigate to Book Appointment\n• Pick a doctor\n• Select date/time\n• Enter your phone number\n• Click Book"
            ]);
        }
        if (msg.includes('cancel')) {
            return "❌ To cancel an appointment, please contact the doctor directly or use the Doctor Panel in the app.";
        }
        if (msg.includes('confirm') || msg.includes('confirmed')) {
            return "✅ Once you book an appointment, the doctor will confirm it. You'll see the status update in your Dashboard.";
        }
        if (msg.includes('doctor') || msg.includes('doctors')) {
            return "👨‍⚕️ All registered doctors are listed in the 'Book Appointment' section. Each doctor shows their hospital, location, specialization, and contact details.";
        }
        return getRandom([
            "📅 You can book appointments with doctors through the 'Book Appointment' section. All registered doctors are listed there with their specializations and hospital details.",
            "📅 Appointments can be booked, confirmed, and tracked. Check your Dashboard for appointment status updates."
        ]);
    }
    
    // ============================================
    // PHARMACY & LOCATION QUESTIONS
    // ============================================
    
    if (msg.includes('pharmacy') || msg.includes('pharmacies') || msg.includes('store')) {
        if (msg.includes('near') || msg.includes('nearby') || msg.includes('location')) {
            return getRandom([
                "📍 You can find pharmacies near you by:\n1. Going to 'Order Medicine'\n2. Clicking 'Use My Location'\n3. Seeing nearby pharmacies with distance",
                "📍 Use the 'Use My Location' button to find pharmacies near you. Each pharmacy shows its location and distance from you."
            ]);
        }
        if (msg.includes('contact') || msg.includes('phone') || msg.includes('call')) {
            return "📞 Each pharmacy has its phone number listed on their card. You can contact them directly for any queries about medicines or orders.";
        }
        if (msg.includes('directions')) {
            return "🗺️ Click 'Get Directions' on any pharmacy card to open Google Maps and get directions from your current location.";
        }
        return getRandom([
            "🏪 Pharmacies are healthcare providers that dispense medicines. You can see all registered pharmacies in the 'Order Medicine' section.",
            "🏪 Each pharmacy has its own location, contact details, and list of available medicines. Choose the one that best suits your needs."
        ]);
    }
    
    if (msg.includes('location') || msg.includes('distance') || msg.includes('near me')) {
        return "📍 Use the 'Use My Location' button in the search section to find pharmacies near you. The app will show you the distance to each pharmacy.";
    }
    
    // ============================================
    // ACCOUNT & PROFILE QUESTIONS
    // ============================================
    
    if (msg.includes('register') || msg.includes('sign up') || msg.includes('create account')) {
        return getRandom([
            "📝 To register:\n1. Click 'Register' tab\n2. Select your role (Patient/Pharmacist/Doctor)\n3. Fill in your details\n4. Click 'Create Account'\n\nPharmacists need to add pharmacy details, doctors need hospital details.",
            "📝 Creating an account is quick and easy! Choose your role, fill in your details, and start using the app immediately."
        ]);
    }
    
    if (msg.includes('login') || msg.includes('sign in') || msg.includes('log in')) {
        return getRandom([
            "🔐 To login:\n1. Enter your email and password\n2. Select your user type (Patient/Pharmacist/Doctor)\n3. Click 'Login'\n\nForgot password? Click 'Forgot Password?' to reset it.",
            "🔐 Login with your email and password. Make sure to select the correct user type."
        ]);
    }
    
    if (msg.includes('forgot password') || msg.includes('reset password')) {
        return "🔑 To reset your password:\n1. Click 'Forgot Password?' on the login page\n2. Enter your email\n3. You'll receive a reset token\n4. Enter the token and your new password\n5. Click 'Reset Password'";
    }
    
    if (msg.includes('profile') || msg.includes('update')) {
        return "👤 You can update your profile details in the 'Dashboard' section. For major changes, please contact support.";
    }
    
    // ============================================
    // CART QUESTIONS
    // ============================================
    
    if (msg.includes('cart') || msg.includes('shopping cart')) {
        if (msg.includes('empty') || msg.includes('clear')) {
            return "🛒 You can remove items from your cart individually. Your cart shows all medicines you've added before placing an order.";
        }
        if (msg.includes('quantity')) {
            return "🛒 You can adjust quantities in your cart using the + and - buttons. The total amount updates automatically.";
        }
        return getRandom([
            "🛒 Your cart shows all medicines you've added. You can:\n• View items\n• Adjust quantities\n• Remove items\n• Place order",
            "🛒 Access your cart by clicking the 'Cart' button in the navigation bar. From there, you can manage your items and place your order."
        ]);
    }
    
    // ============================================
    // DASHBOARD & HISTORY QUESTIONS
    // ============================================
    
    if (msg.includes('dashboard')) {
        return getRandom([
            "📊 The Dashboard shows:\n• Total activities\n• Pending items\n• In-progress items\n• Completed items\n• Recent orders/appointments",
            "📊 Your dashboard gives you a complete overview of all your activities including orders, appointments, and their statuses."
        ]);
    }
    
    if (msg.includes('history')) {
        return getRandom([
            "📜 Your History shows:\n• All past orders\n• All appointments\n• Dates and statuses\n• Complete details\n\nClick 'History' in the navigation bar to view it.",
            "📜 View your complete order and appointment history in the 'History' section. Everything is organized by date."
        ]);
    }
    
    if (msg.includes('status') || msg.includes('statuses')) {
        return "📊 Order statuses include:\n• Pending - Waiting for pharmacist\n• In Progress - Being processed\n• Delivered - Completed\n\nAppointment statuses include:\n• Pending - Waiting for doctor\n• Confirmed - Approved\n• Completed - Done";
    }
    
    // ============================================
    // PRICE & PAYMENT QUESTIONS
    // ============================================
    
    if (msg.includes('price') || msg.includes('prices') || msg.includes('cost') || msg.includes('rate')) {
        return getRandom([
            "💰 All medicine prices are listed in USD ($). You can see the price on each medicine card in the pharmacy view.",
            "💰 Prices vary by pharmacy and medicine. Always check the price before adding to cart."
        ]);
    }
    
    if (msg.includes('payment') || msg.includes('pay')) {
        return "💳 Payment is handled directly with the pharmacy. Contact the pharmacist for payment options and details.";
    }
    
    // ============================================
    // HELP & SUPPORT QUESTIONS
    // ============================================
    
    if (msg.includes('help') || msg.includes('support') || msg.includes('guide')) {
        return getRandom([
            "🆘 I'm here to help! You can ask me about:\n\n• 💊 Medicines & Orders\n• 📅 Appointments & Doctors\n• 🏪 Pharmacies & Locations\n• 👤 Account & Login\n• 📊 Dashboard & History\n• 🛒 Cart & Checkout\n\nWhat would you like to know?",
            "🆘 How can I assist you? Try asking about medicines, appointments, or how to place an order!",
            "🆘 I support all features of PharmaCare. Just ask me anything about the app!"
        ]);
    }
    
    if (msg.includes('contact') || msg.includes('phone') || msg.includes('call') || msg.includes('email')) {
        return "📞 Each pharmacy and doctor has their contact details listed. You can find phone numbers on their profile cards.";
    }
    
    // ============================================
    // EMERGENCY & SAFETY
    // ============================================
    
    if (msg.includes('emergency') || msg.includes('urgent') || msg.includes('accident')) {
        return "🚨 For medical emergencies, please call your local emergency number immediately (e.g., 911 in US, 112 in Europe, 108 in India). This app is for non-emergency consultations and orders.";
    }
    
    if (msg.includes('advice') || msg.includes('medical advice') || msg.includes('treatment')) {
        return "⚠️ I cannot provide medical advice. Please consult a qualified healthcare professional for any medical concerns or treatment decisions.";
    }
    
    if (msg.includes('side effect') || msg.includes('symptom')) {
        return "⚠️ For information about side effects or symptoms, please consult your doctor or pharmacist. Always read the medicine label carefully.";
    }
    
    // ============================================
    // APP FEATURES
    // ============================================
    
    if (msg.includes('what can you do') || msg.includes('features')) {
        return getRandom([
            "🌟 PharmaCare features:\n\n• 💊 Order medicines from pharmacies\n• 📅 Book appointments with doctors\n• 🏪 Find pharmacies near you\n• 📊 View dashboard and statistics\n• 📜 Check order/appointment history\n• 🗺️ Get directions to pharmacies\n• 🔍 Search by location\n\nAnything specific you'd like to know about?",
            "🌟 I'm your healthcare assistant! I help you order medicines, book appointments, find pharmacies, and track your health activities."
        ]);
    }
    
    if (msg.includes('about')) {
        return "💡 PharmaCare is a comprehensive pharmacy and healthcare management system. It connects patients with pharmacists and doctors for seamless healthcare services.";
    }
    
    // ============================================
    // DEFAULT RESPONSE
    // ============================================
    
    const defaultResponses = [
        `🤔 I'm not quite sure I understand. Could you rephrase your question?`,
        `💡 I'm here to help with pharmacy and healthcare related questions. Try asking about medicines, orders, appointments, or pharmacies.`,
        `❓ I didn't quite get that. Feel free to ask about ordering medicines, booking appointments, or finding pharmacies!`,
        `😊 I'm your PharmaCare assistant. I can help with medicine orders, appointments, pharmacies, and more! Try being more specific.`,
        `🤔 Hmm, I'm not sure about that. Can you ask about:\n• Medicines & Orders\n• Appointments & Doctors\n• Pharmacies & Locations\n• Account & Login\n• Dashboard & History`
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// ============================================
// HELPER: Random Response Picker
// ============================================

function getRandom(responses) {
    return responses[Math.floor(Math.random() * responses.length)];
}

module.exports = router;