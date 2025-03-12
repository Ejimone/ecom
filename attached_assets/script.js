// API Base URL
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Authentication functions
async function login(username, password) {
    try {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        const data = await response.json();
        localStorage.setItem('accessToken', data.access_token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('isAdmin', data.is_admin);
        
        // Redirect admin users to admin dashboard
        if (data.is_admin) {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'index.html';
        }
        
        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

async function register(username, email, password, fullName = '') {
    try {
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                email,
                password,
                full_name: fullName
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Registration failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    localStorage.removeItem('isAdmin');
    window.location.href = 'index.html';
}

// Cart management
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function addToCart(product, quantity = 1) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            quantity
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showCartNotification();
}

function updateCartCount() {
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
        element.textContent = cartCount;
    });
}

function showCartNotification() {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `
        <div class="cart-notification-content">
            <i class="fas fa-check-circle"></i>
            <span>Item added to cart successfully!</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// User Interface Update
async function updateUserUI() {
    const userSection = document.querySelector('.nav-buttons');
    if (!userSection) return;

    if (localStorage.getItem('accessToken')) {
        const username = localStorage.getItem('username');
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        
        userSection.innerHTML = `
            <a href="cart.html" class="cart-icon">
                <i class="fas fa-shopping-cart"></i>
                <span class="cart-count">0</span>
            </a>
            <div class="user-section">
                <div class="user-info">
                    <span class="user-name">${username}</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="user-dropdown">
                    <div class="user-dropdown-header">
                        <div class="user-info-details">
                            <h4>${username}</h4>
                            <p>${isAdmin ? 'Administrator' : 'Member'}</p>
                        </div>
                    </div>
                    <ul>
                        <li><a href="orders.html"><i class="fas fa-box"></i> My Orders</a></li>
                        ${isAdmin ? '<li><a href="admin.html"><i class="fas fa-cog"></i> Admin Dashboard</a></li>' : ''}
                        <li><a href="#" class="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
                    </ul>
                </div>
            </div>`;
        
        updateCartCount();
        
        // Add event listener for logout
        const logoutBtn = userSection.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
    } else {
        userSection.innerHTML = `
            <a href="cart.html" class="cart-icon">
                <i class="fas fa-shopping-cart"></i>
                <span class="cart-count">0</span>
            </a>
            <a href="login.html" class="btn btn-outline">Login</a>
            <a href="register.html" class="btn btn-primary">Register</a>
        `;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    updateUserUI();
    updateCartCount();
    
    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            
            try {
                await login(username, password);
            } catch (error) {
                alert('Login failed. Please check your credentials.');
            }
        });
    }
    
    // Handle registration form submission
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('reg-username').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;
            
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            
            try {
                await register(username, email, password);
                alert('Registration successful! Please login.');
                window.location.href = 'login.html';
            } catch (error) {
                alert('Registration failed. ' + error.message);
            }
        });
    }
    
    // Handle mobile menu
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('nav');
    if (mobileMenuBtn && nav) {
        mobileMenuBtn.addEventListener('click', () => {
            nav.classList.toggle('show');
        });
    }
    
    // Handle user dropdown
    document.addEventListener('click', (e) => {
        const userInfo = e.target.closest('.user-info');
        const dropdown = document.querySelector('.user-dropdown');
        
        if (userInfo && dropdown) {
            dropdown.classList.toggle('show');
        } else if (!e.target.closest('.user-dropdown') && dropdown) {
            dropdown.classList.remove('show');
        }
    });
});