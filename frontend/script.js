const API_URL = 'http://localhost:5000/api';

let currentUser = null;
let token = null;
let cart = [];
let selectedPharmacist = null;
let selectedDoctor = null;

// Check for saved session
const savedToken = localStorage.getItem('token');
const savedUser = localStorage.getItem('user');
if (savedToken && savedUser) {
    token = savedToken;
    currentUser = JSON.parse(savedUser);
    showApp();
}

// ============================================
// API HELPER
// ============================================

async function apiCall(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }
    
    return data;
}

// ============================================
// AUTH FUNCTIONS
// ============================================

async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const type = document.getElementById('loginType').value;
    
    if (!email || !password) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    try {
        const data = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (data.user.type !== type) {
            showToast('Invalid user type', 'error');
            return;
        }
        
        token = data.token;
        currentUser = data.user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        showToast('Login successful!', 'success');
        showApp();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleRegister() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const type = document.getElementById('regType').value;
    const phoneNumber = document.getElementById('regPhone').value;
    const streetAddress = document.getElementById('regAddress').value;
    const city = document.getElementById('regCity').value;
    const state = document.getElementById('regState').value;
    
    if (!name || !email || !password || !phoneNumber || !streetAddress || !city || !state) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    let registerData = {
        name,
        email,
        password,
        type,
        phoneNumber,
        address: {
            street: streetAddress,
            city: city,
            state: state,
            country: 'India'
        }
    };
    
    if (type === 'pharmacist') {
        const pharmacyName = document.getElementById('regPharmacyName').value;
        const pharmacyLocation = document.getElementById('regPharmacyLocation').value;
        if (!pharmacyName || !pharmacyLocation) {
            showToast('Please fill all pharmacy details', 'error');
            return;
        }
        registerData.pharmacyName = pharmacyName;
        registerData.pharmacyLocation = pharmacyLocation;
    }
    
    if (type === 'doctor') {
        const hospitalName = document.getElementById('regHospitalName').value;
        const hospitalLocation = document.getElementById('regHospitalLocation').value;
        const specialization = document.getElementById('regSpecialization').value;
        if (!hospitalName || !hospitalLocation || !specialization) {
            showToast('Please fill all hospital details', 'error');
            return;
        }
        registerData.hospitalName = hospitalName;
        registerData.hospitalLocation = hospitalLocation;
        registerData.specialization = specialization;
    }
    
    try {
        const data = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify(registerData)
        });
        
        token = data.token;
        currentUser = data.user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        showToast('Registration successful!', 'success');
        showApp();
        
        // Force refresh the data if registered as patient
        if (currentUser.type === 'patient') {
            setTimeout(() => {
                loadPharmacists();
                loadDoctors();
            }, 500);
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleForgotPassword() {
    const email = document.getElementById('resetEmail').value;
    
    if (!email) {
        showToast('Please enter your email', 'error');
        return;
    }
    
    try {
        const data = await apiCall('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
        
        showToast('Reset token sent to your email!', 'success');
        document.getElementById('forgotPasswordForm').style.display = 'none';
        document.getElementById('resetPasswordForm').style.display = 'block';
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleResetPassword() {
    const tokenInput = document.getElementById('resetToken').value;
    const newPassword = document.getElementById('newPassword').value;
    
    if (!tokenInput || !newPassword) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    try {
        await apiCall('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token: tokenInput, newPassword })
        });
        
        showToast('Password reset successfully! Please login.', 'success');
        document.getElementById('resetPasswordForm').style.display = 'none';
        showLoginTab();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function logout() {
    token = null;
    currentUser = null;
    cart = [];
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showAuth();
}

// ============================================
// NAVIGATION FUNCTIONS
// ============================================

function showApp() {
    document.getElementById('authForms').style.display = 'none';
    document.getElementById('navbar').style.display = 'flex';
    
    // Hide all views
    document.getElementById('patientHome').style.display = 'none';
    document.getElementById('pharmacistPanel').style.display = 'none';
    document.getElementById('doctorPanel').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('historyView').style.display = 'none';
    
    if (currentUser.type === 'pharmacist') {
        document.querySelectorAll('.pharmacist-only').forEach(el => {
            el.style.display = 'inline-block';
        });
        document.querySelectorAll('.doctor-only').forEach(el => {
            el.style.display = 'none';
        });
        document.getElementById('pharmacistPanel').style.display = 'block';
        loadPharmacistMedicines();
        loadPharmacistOrders();
    } else if (currentUser.type === 'doctor') {
        document.querySelectorAll('.doctor-only').forEach(el => {
            el.style.display = 'inline-block';
        });
        document.querySelectorAll('.pharmacist-only').forEach(el => {
            el.style.display = 'none';
        });
        document.getElementById('doctorPanel').style.display = 'block';
        loadDoctorAppointments();
    } else {
        document.querySelectorAll('.pharmacist-only').forEach(el => {
            el.style.display = 'none';
        });
        document.querySelectorAll('.doctor-only').forEach(el => {
            el.style.display = 'none';
        });
        document.getElementById('patientHome').style.display = 'block';
        loadHealthcareThought();
        loadPharmacists();
    }
}

function showAuth() {
    document.getElementById('authForms').style.display = 'flex';
    document.getElementById('navbar').style.display = 'none';
    document.getElementById('patientHome').style.display = 'none';
    document.getElementById('pharmacistPanel').style.display = 'none';
    document.getElementById('doctorPanel').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('historyView').style.display = 'none';
    showLoginTab();
}

function showHome() {
    document.getElementById('patientHome').style.display = 'block';
    document.getElementById('pharmacistPanel').style.display = 'none';
    document.getElementById('doctorPanel').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('historyView').style.display = 'none';
    loadHealthcareThought();
    document.getElementById('orderMedicineSection').style.display = 'block';
    document.getElementById('bookAppointmentSection').style.display = 'none';
    loadPharmacists();
}

function showDashboard() {
    document.getElementById('patientHome').style.display = 'none';
    document.getElementById('pharmacistPanel').style.display = 'none';
    document.getElementById('doctorPanel').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'block';
    document.getElementById('historyView').style.display = 'none';
    loadDashboard();
}

function showHistory() {
    document.getElementById('patientHome').style.display = 'none';
    document.getElementById('pharmacistPanel').style.display = 'none';
    document.getElementById('doctorPanel').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('historyView').style.display = 'block';
    loadHistory();
}

function showPharmacistPanel() {
    document.getElementById('patientHome').style.display = 'none';
    document.getElementById('pharmacistPanel').style.display = 'block';
    document.getElementById('doctorPanel').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('historyView').style.display = 'none';
    loadPharmacistMedicines();
    loadPharmacistOrders();
}

function showDoctorPanel() {
    document.getElementById('patientHome').style.display = 'none';
    document.getElementById('pharmacistPanel').style.display = 'none';
    document.getElementById('doctorPanel').style.display = 'block';
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('historyView').style.display = 'none';
    loadDoctorAppointments();
}

// ============================================
// AUTH FORM NAVIGATION
// ============================================

function showLoginTab() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'none';
    document.getElementById('resetPasswordForm').style.display = 'none';
}

function showRegisterTab() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('forgotPasswordForm').style.display = 'none';
    document.getElementById('resetPasswordForm').style.display = 'none';
}

function showForgotPassword() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'block';
    document.getElementById('resetPasswordForm').style.display = 'none';
}

function toggleRegisterFields() {
    const type = document.getElementById('regType').value;
    document.getElementById('pharmacistFields').style.display = 'none';
    document.getElementById('doctorFields').style.display = 'none';
    
    if (type === 'pharmacist') {
        document.getElementById('pharmacistFields').style.display = 'block';
    } else if (type === 'doctor') {
        document.getElementById('doctorFields').style.display = 'block';
    }
}

// ============================================
// PATIENT FUNCTIONS
// ============================================

function showOrderMedicine() {
    document.getElementById('orderMedicineSection').style.display = 'block';
    document.getElementById('bookAppointmentSection').style.display = 'none';
    loadPharmacists();
}

function showBookAppointment() {
    document.getElementById('orderMedicineSection').style.display = 'none';
    document.getElementById('bookAppointmentSection').style.display = 'block';
    loadDoctors();
}

async function loadPharmacists() {
    try {
        const pharmacists = await apiCall('/auth/pharmacists');
        const container = document.getElementById('pharmacistsList');
        
        if (!pharmacists || pharmacists.length === 0) {
            container.innerHTML = `
                <div class="no-data" style="text-align: center; padding: 2rem; background: white; border-radius: 12px;">
                    <p style="font-size: 2rem;">🏪</p>
                    <p>No pharmacists available.</p>
                    <p style="color: #999; font-size: 0.9rem; margin-top: 0.5rem;">
                        Register as a pharmacist to add medicines.
                    </p>
                </div>
            `;
            document.getElementById('medicinesList').innerHTML = '';
            return;
        }
        
        container.innerHTML = `
            <h3 style="color: var(--dark); margin-bottom: 1rem;">🏪 All Pharmacies (${pharmacists.length})</h3>
            <div class="providers-grid">
                ${pharmacists.map(pharmacist => `
                    <div class="card pharmacy-card">
                        <h3>🏪 ${pharmacist.pharmacyName || pharmacist.name}</h3>
                        <p><strong>Pharmacist:</strong> ${pharmacist.name}</p>
                        <p><strong>Location:</strong> ${pharmacist.pharmacyLocation || pharmacist.address?.city || 'N/A'}</p>
                        <p><strong>Phone:</strong> ${pharmacist.phoneNumber || 'N/A'}</p>
                        <button class="btn-primary" onclick="selectPharmacist('${pharmacist._id}')">View Medicines</button>
                    </div>
                `).join('')}
            </div>
        `;
        
        if (pharmacists.length > 0) {
            selectPharmacist(pharmacists[0]._id);
        }
    } catch (error) {
        showToast('Error loading pharmacists: ' + error.message, 'error');
    }
}

async function selectPharmacist(pharmacistId) {
    selectedPharmacist = pharmacistId;
    try {
        const medicines = await apiCall(`/medicines?pharmacist=${pharmacistId}`);
        const container = document.getElementById('medicinesList');
        
        if (!medicines || medicines.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; background: #f8f9fa; border-radius: 8px; margin-top: 1rem;">
                    <p>📦 No medicines available from this pharmacy.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = medicines.map(medicine => `
            <div class="card">
                <h3>💊 ${medicine.name}</h3>
                <p><strong>Expiry:</strong> ${new Date(medicine.expiryDate).toLocaleDateString()}</p>
                <p><strong>Quantity:</strong> ${medicine.quantity}</p>
                <p><strong>Purpose:</strong> ${medicine.purpose}</p>
                <p class="price">💰 $${medicine.price}</p>
                <button class="btn-add-to-cart" onclick="addToCart('${medicine._id}', '${medicine.name}', ${medicine.price})">
                    🛒 Add to Cart
                </button>
            </div>
        `).join('');
    } catch (error) {
        showToast('Error loading medicines: ' + error.message, 'error');
    }
}

async function loadDoctors() {
    try {
        const doctors = await apiCall('/auth/doctors');
        const container = document.getElementById('doctorsList');
        
        if (!doctors || doctors.length === 0) {
            container.innerHTML = `
                <div class="no-data" style="text-align: center; padding: 2rem; background: white; border-radius: 12px;">
                    <p style="font-size: 2rem;">🏥</p>
                    <p>No doctors available.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = doctors.map(doctor => `
            <div class="card">
                <h3>👨‍⚕️ ${doctor.name}</h3>
                <p><strong>Hospital:</strong> ${doctor.hospitalName || 'N/A'}</p>
                <p><strong>Location:</strong> ${doctor.hospitalLocation || doctor.address?.city || 'N/A'}</p>
                <p><strong>Specialization:</strong> ${doctor.specialization || 'N/A'}</p>
                <p><strong>Phone:</strong> ${doctor.phoneNumber || 'N/A'}</p>
                <button class="btn-book-appointment" onclick="bookAppointment('${doctor._id}')">Book Appointment</button>
            </div>
        `).join('');
    } catch (error) {
        showToast('Error loading doctors: ' + error.message, 'error');
    }
}

// ============================================
// SEARCH
// ============================================

async function searchProviders() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!query) {
        showToast('Please enter a search term', 'error');
        return;
    }
    
    try {
        let filteredPharmacists = [];
        let filteredDoctors = [];
        
        try {
            const pharmacistsResponse = await apiCall(`/auth/search/pharmacists?query=${encodeURIComponent(query)}`);
            filteredPharmacists = pharmacistsResponse || [];
        } catch (e) {}
        
        try {
            const doctorsResponse = await apiCall(`/auth/search/doctors?query=${encodeURIComponent(query)}`);
            filteredDoctors = doctorsResponse || [];
        } catch (e) {}
        
        let hasResults = false;
        
        if (filteredPharmacists.length > 0) {
            hasResults = true;
            document.getElementById('orderMedicineSection').style.display = 'block';
            document.getElementById('bookAppointmentSection').style.display = 'none';
            
            const container = document.getElementById('pharmacistsList');
            container.innerHTML = `
                <h3 style="color: var(--dark); margin-bottom: 1rem;">🏪 Pharmacies Found (${filteredPharmacists.length})</h3>
                <div class="providers-grid">
                    ${filteredPharmacists.map(pharmacist => `
                        <div class="card">
                            <h3>🏪 ${pharmacist.pharmacyName || pharmacist.name}</h3>
                            <p><strong>Location:</strong> ${pharmacist.pharmacyLocation || pharmacist.address?.city || 'N/A'}</p>
                            <button class="btn-primary" onclick="selectPharmacist('${pharmacist._id}')">View Medicines</button>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        if (filteredDoctors.length > 0) {
            hasResults = true;
            document.getElementById('bookAppointmentSection').style.display = 'block';
            
            const container = document.getElementById('doctorsList');
            container.innerHTML = `
                <h3 style="color: var(--dark); margin-bottom: 1rem;">🏥 Doctors Found (${filteredDoctors.length})</h3>
                <div class="providers-grid">
                    ${filteredDoctors.map(doctor => `
                        <div class="card">
                            <h3>👨‍⚕️ ${doctor.name}</h3>
                            <p><strong>Hospital:</strong> ${doctor.hospitalName || 'N/A'}</p>
                            <p><strong>Specialization:</strong> ${doctor.specialization || 'N/A'}</p>
                            <button class="btn-book-appointment" onclick="bookAppointment('${doctor._id}')">Book Appointment</button>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        if (!hasResults) {
            showToast(`❌ No results found for "${query}"`, 'error');
            
            document.getElementById('pharmacistsList').innerHTML = `
                <div class="no-results" style="text-align: center; padding: 3rem; background: white; border-radius: 12px;">
                    <p style="font-size: 3rem;">🔍</p>
                    <h3 style="color: var(--dark);">No Results Found</h3>
                    <p style="color: #666;">No pharmacies or doctors found matching "<strong>${query}</strong>".</p>
                </div>
            `;
        }
    } catch (error) {
        showToast('Error searching: ' + error.message, 'error');
    }
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                showToast('📍 Location detected!', 'success');
            },
            (error) => {
                showToast('Unable to get location', 'error');
            }
        );
    } else {
        showToast('Geolocation not supported', 'error');
    }
}

// ============================================
// BOOK APPOINTMENT
// ============================================

async function bookAppointment(doctorId) {
    const appointmentDate = prompt('Enter appointment date (YYYY-MM-DD):');
    if (!appointmentDate) return;
    
    const appointmentTime = prompt('Enter appointment time (e.g., 10:00 AM):');
    if (!appointmentTime) return;
    
    const appointmentReason = prompt('Reason for appointment:');
    if (!appointmentReason) return;
    
    const patientPhone = prompt('Your phone number:');
    if (!patientPhone) return;
    
    try {
        await apiCall('/orders/appointment', {
            method: 'POST',
            body: JSON.stringify({
                doctorId,
                appointmentDate,
                appointmentTime,
                appointmentReason,
                patientPhone
            })
        });
        
        showToast('Appointment booked successfully!', 'success');
        loadDoctors();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ============================================
// CART FUNCTIONS
// ============================================

function addToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    updateCartCount();
    showToast(`${name} added to cart!`, 'success');
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = count;
}

function showCart() {
    const modal = document.getElementById('cartModal');
    const cartItemsDiv = document.getElementById('cartItems');
    const cartTotalSpan = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        cartTotalSpan.textContent = '0';
    } else {
        cartItemsDiv.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <strong>${item.name}</strong>
                    <p>$${item.price} x ${item.quantity}</p>
                </div>
                <div class="cart-item-actions">
                    <button onclick="updateCartItemQuantity(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartItemQuantity(${index}, 1)">+</button>
                    <button onclick="removeCartItem(${index})">🗑️</button>
                </div>
            </div>
        `).join('');
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotalSpan.textContent = total.toFixed(2);
    }
    
    modal.style.display = 'flex';
}

function updateCartItemQuantity(index, change) {
    const item = cart[index];
    const newQuantity = item.quantity + change;
    
    if (newQuantity <= 0) {
        removeCartItem(index);
    } else {
        item.quantity = newQuantity;
        updateCartCount();
        showCart();
    }
}

function removeCartItem(index) {
    cart.splice(index, 1);
    updateCartCount();
    showCart();
}

function closeCart() {
    document.getElementById('cartModal').style.display = 'none';
}

async function placeOrder() {
    if (cart.length === 0) {
        showToast('Cart is empty!', 'error');
        return;
    }
    
    if (!selectedPharmacist) {
        showToast('Please select a pharmacist first', 'error');
        return;
    }
    
    const patientPhone = prompt('Enter your phone number:');
    if (!patientPhone) return;
    
    const orderMedicines = cart.map(item => ({
        medicineId: item.id,
        quantity: item.quantity
    }));
    
    try {
        await apiCall('/orders/medicine', {
            method: 'POST',
            body: JSON.stringify({
                pharmacistId: selectedPharmacist,
                medicines: orderMedicines,
                patientPhone: patientPhone
            })
        });
        
        showToast('Order placed successfully!', 'success');
        cart = [];
        updateCartCount();
        closeCart();
        loadPharmacists();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ============================================
// PHARMACIST FUNCTIONS
// ============================================

async function addMedicine() {
    const name = document.getElementById('medName').value;
    const expiryDate = document.getElementById('expiryDate').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const price = parseFloat(document.getElementById('price').value);
    const purpose = document.getElementById('purpose').value;
    
    if (!name || !expiryDate || !quantity || !price || !purpose) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    try {
        await apiCall('/medicines', {
            method: 'POST',
            body: JSON.stringify({ name, expiryDate, quantity, purpose, price })
        });
        
        showToast('✅ Medicine added successfully!', 'success');
        
        document.getElementById('medName').value = '';
        document.getElementById('expiryDate').value = '';
        document.getElementById('quantity').value = '';
        document.getElementById('price').value = '';
        document.getElementById('purpose').value = '';
        
        loadPharmacistMedicines();
        loadPharmacistOrders();
    } catch (error) {
        showToast('❌ ' + error.message, 'error');
    }
}

async function loadPharmacistMedicines() {
    try {
        const medicines = await apiCall('/medicines/my-medicines');
        const container = document.getElementById('pharmacistMedicinesList');
        
        if (!medicines || medicines.length === 0) {
            container.innerHTML = `
                <div class="no-data" style="text-align: center; padding: 2rem; background: #f8f9fa; border-radius: 8px;">
                    <p>📦 No medicines added yet.</p>
                    <p style="font-size: 0.9rem; color: #999;">Use the form above to add your first medicine.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = medicines.map(medicine => `
            <div class="card">
                <h3>💊 ${medicine.name}</h3>
                <p><strong>Quantity:</strong> ${medicine.quantity}</p>
                <p><strong>Expiry:</strong> ${new Date(medicine.expiryDate).toLocaleDateString()}</p>
                <p><strong>Purpose:</strong> ${medicine.purpose}</p>
                <p class="price">💰 $${medicine.price}</p>
                <button class="btn-delete" onclick="deleteMedicine('${medicine._id}')">🗑️ Delete</button>
            </div>
        `).join('');
    } catch (error) {
        showToast('Error loading medicines: ' + error.message, 'error');
    }
}

async function deleteMedicine(medicineId) {
    if (!confirm('Are you sure you want to delete this medicine?')) {
        return;
    }
    
    try {
        await apiCall(`/medicines/${medicineId}`, {
            method: 'DELETE'
        });
        
        showToast('Medicine deleted successfully!', 'success');
        loadPharmacistMedicines();
        loadPharmacistOrders();
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

async function loadPharmacistOrders() {
    try {
        const orders = await apiCall('/orders/pharmacist-orders');
        const container = document.getElementById('pharmacistOrders');
        
        if (!orders || orders.length === 0) {
            container.innerHTML = `
                <h3 style="color: white; margin-top: 2rem;">📋 Orders Received</h3>
                <div class="no-data" style="color: white; text-align: center; padding: 2rem; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    No orders received yet.
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <h3 style="color: white; margin-top: 2rem;">📋 Orders Received</h3>
            <div class="orders-grid">
                ${orders.map(order => `
                    <div class="card">
                        <h4>🛒 Order #${order._id.slice(-6)}</h4>
                        <p><strong>Patient:</strong> ${order.patientName}</p>
                        <p><strong>Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
                        <p><strong>Total:</strong> $${order.totalAmount}</p>
                        <p><strong>Status:</strong> 
                            <select onchange="updateOrderStatus('${order._id}', this.value)">
                                <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                <option value="In Progress" ${order.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                                <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                            </select>
                        </p>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        showToast('Error loading orders: ' + error.message, 'error');
    }
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        await apiCall(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        
        showToast('Order status updated!', 'success');
        loadPharmacistOrders();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ============================================
// DOCTOR FUNCTIONS
// ============================================

async function loadDoctorAppointments() {
    try {
        const appointments = await apiCall('/orders/doctor-appointments');
        const container = document.getElementById('doctorAppointments');
        
        if (!appointments || appointments.length === 0) {
            container.innerHTML = `
                <h3 style="color: white;">Appointments</h3>
                <div class="no-data" style="color: white; text-align: center; padding: 2rem; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    No appointments booked yet.
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <h3 style="color: white;">Appointments</h3>
            <div class="orders-grid">
                ${appointments.map(appointment => `
                    <div class="card">
                        <h4>📅 Appointment #${appointment._id.slice(-6)}</h4>
                        <p><strong>Patient:</strong> ${appointment.patientName}</p>
                        <p><strong>Date:</strong> ${new Date(appointment.appointmentDate).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> ${appointment.appointmentTime}</p>
                        <p><strong>Reason:</strong> ${appointment.appointmentReason}</p>
                        <p><strong>Status:</strong> 
                            <select onchange="updateAppointmentStatus('${appointment._id}', this.value)">
                                <option value="Pending" ${appointment.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                <option value="Confirmed" ${appointment.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                                <option value="Completed" ${appointment.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            </select>
                        </p>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        showToast('Error loading appointments: ' + error.message, 'error');
    }
}

async function updateAppointmentStatus(orderId, newStatus) {
    try {
        await apiCall(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        
        showToast('Appointment status updated!', 'success');
        loadDoctorAppointments();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ============================================
// DASHBOARD & HISTORY
// ============================================

async function loadDashboard() {
    try {
        const orders = await apiCall('/orders/my-orders');
        
        if (!orders || orders.length === 0) {
            document.getElementById('dashboardStats').innerHTML = `
                <div class="stat-card">
                    <div class="stat-number">0</div>
                    <div class="stat-label">Total Activities</div>
                </div>
            `;
            document.getElementById('dashboardContent').innerHTML = '<p style="color:white;">No activities yet.</p>';
            return;
        }
        
        const stats = {
            total: orders.length,
            pending: orders.filter(o => o.status === 'Pending').length,
            inProgress: orders.filter(o => o.status === 'In Progress').length,
            completed: orders.filter(o => o.status === 'Completed' || o.status === 'Delivered').length
        };
        
        document.getElementById('dashboardStats').innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${stats.total}</div>
                <div class="stat-label">Total Activities</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.pending}</div>
                <div class="stat-label">Pending</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.inProgress}</div>
                <div class="stat-label">In Progress</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.completed}</div>
                <div class="stat-label">Completed</div>
            </div>
        `;
        
        const recent = orders.slice(-5);
        document.getElementById('dashboardContent').innerHTML = `
            <h3 style="color: white; margin-bottom: 1rem;">Recent Activities</h3>
            <div class="orders-grid">
                ${recent.map(order => `
                    <div class="card">
                        <h4>${order.orderType === 'appointment' ? '📅 Appointment' : '💊 Order'}</h4>
                        <p><strong>Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
                        <p><strong>Status:</strong> ${order.status}</p>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        showToast('Error loading dashboard: ' + error.message, 'error');
    }
}

async function loadHistory() {
    try {
        const orders = await apiCall('/orders/my-orders');
        const container = document.getElementById('historyContent');
        
        if (!orders || orders.length === 0) {
            container.innerHTML = `
                <div class="no-data" style="color: white; text-align: center; padding: 2rem; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    No activities found.
                </div>
            `;
            return;
        }
        
        container.innerHTML = orders.map(order => `
            <div class="card">
                <h4>${order.orderType === 'appointment' ? '📅 Appointment' : '💊 Order'} #${order._id.slice(-6)}</h4>
                <p><strong>Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
                <p><strong>Status:</strong> ${order.status}</p>
            </div>
        `).join('');
    } catch (error) {
        showToast('Error loading history: ' + error.message, 'error');
    }
}

// ============================================
// REFRESH DATA
// ============================================

function refreshData() {
    showToast('🔄 Refreshing data...', 'success');
    if (currentUser && currentUser.type === 'patient') {
        loadPharmacists();
        loadDoctors();
        setTimeout(() => {
            showToast('✅ Data refreshed!', 'success');
        }, 1000);
    } else if (currentUser && currentUser.type === 'pharmacist') {
        loadPharmacistMedicines();
        loadPharmacistOrders();
    } else if (currentUser && currentUser.type === 'doctor') {
        loadDoctorAppointments();
    }
}

// ============================================
// UTILITY
// ============================================

function loadHealthcareThought() {
    const thoughts = [
        "Your health is an investment, not an expense.",
        "Take care of your body. It's the only place you have to live.",
        "Prevention is better than cure.",
        "The greatest wealth is health.",
        "Health is not valued till sickness comes.",
        "A healthy outside starts from the inside."
    ];
    
    const randomThought = thoughts[Math.floor(Math.random() * thoughts.length)];
    document.getElementById('healthcareThought').textContent = randomThought;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}
// ============================================
// CHATBOT - AI Assistant
// ============================================

let chatbotOpen = false;

// Toggle Chatbot
function toggleChatbot() {
    const window = document.getElementById('chatbotWindow');
    const toggle = document.querySelector('.chatbot-toggle');
    chatbotOpen = !chatbotOpen;
    
    if (chatbotOpen) {
        window.classList.add('open');
        toggle.classList.add('active');
        toggle.textContent = '✕';
        setTimeout(() => {
            document.getElementById('chatInput').focus();
        }, 300);
    } else {
        window.classList.remove('open');
        toggle.classList.remove('active');
        toggle.textContent = '💬';
    }
}

// Send Message
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addMessage(message, 'user');
    input.value = '';
    
    // Show typing indicator
    showTyping();
    
    try {
        // Send to OpenAI backend
        const response = await apiCall('/chatbot/chat', {
            method: 'POST',
            body: JSON.stringify({ message })
        });
        
        hideTyping();
        
        if (response.success) {
            addMessage(response.response, 'bot');
        } else {
            addMessage("❌ Sorry, I'm having trouble processing your request. Please try again.", 'bot');
        }
    } catch (error) {
        hideTyping();
        console.error('Chat error:', error);
        addMessage("❌ Sorry, I'm having trouble connecting. Please try again later.", 'bot');
    }
}

// Add Message to Chat
function addMessage(text, sender) {
    const container = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Convert newlines to <br> for better display
    const formattedText = text.replace(/\n/g, '<br>');
    
    messageDiv.innerHTML = `
        <div class="message-content">
            ${formattedText}
            <span class="message-time">${time}</span>
        </div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// Show Typing Indicator
function showTyping() {
    const container = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;
}

// Hide Typing Indicator
function hideTyping() {
    const typing = document.getElementById('typingIndicator');
    if (typing) {
        typing.remove();
    }
}

// ============================================
// INITIALIZE
// ============================================

if (savedToken && savedUser) {
    showApp();
} else {
    showAuth();
}