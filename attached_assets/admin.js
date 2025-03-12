// API Base URL
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Check if user is admin
function checkAdminAccess() {
    if (!localStorage.getItem('accessToken') || localStorage.getItem('isAdmin') !== 'true') {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// API Calls
async function fetchWithAuth(endpoint, options = {}) {
    const token = localStorage.getItem('accessToken');
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('accessToken');
                window.location.href = 'login.html';
            }
            throw new Error('API request failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Dashboard Functions
async function loadDashboardStats() {
    try {
        const stats = await fetchWithAuth('/admin/stats');
        document.getElementById('total-users').textContent = stats.total_users;
        document.getElementById('total-products').textContent = stats.total_products;
        document.getElementById('total-orders').textContent = stats.total_orders;
        document.getElementById('total-revenue').textContent = `$${stats.revenue.toFixed(2)}`;
        
        // Load recent orders
        const recentOrdersTable = document.getElementById('recent-orders');
        recentOrdersTable.innerHTML = stats.recent_orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${order.user.username}</td>
                <td>$${order.total_amount.toFixed(2)}</td>
                <td><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></td>
                <td>${new Date(order.created_at).toLocaleDateString()}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Products Functions
async function loadProducts() {
    try {
        const products = await fetchWithAuth('/products');
        const productsTable = document.getElementById('products-table');
        
        productsTable.innerHTML = products.map(product => `
            <tr>
                <td><img src="${product.image_url}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover;"></td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td><span class="status-badge ${product.is_available ? 'status-delivered' : 'status-cancelled'}">
                    ${product.is_available ? 'Available' : 'Out of Stock'}
                </span></td>
                <td class="action-buttons">
                    <button class="edit-btn" onclick="editProduct(${product.id})">Edit</button>
                    <button class="delete-btn" onclick="deleteProduct(${product.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

async function saveProduct(productData) {
    try {
        const method = productData.id ? 'PUT' : 'POST';
        const endpoint = productData.id ? `/products/${productData.id}` : '/products';
        
        await fetchWithAuth(endpoint, {
            method,
            body: JSON.stringify(productData)
        });
        
        closeModal('product-modal');
        loadProducts();
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Failed to save product');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        await fetchWithAuth(`/products/${productId}`, {
            method: 'DELETE'
        });
        loadProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
    }
}

// Orders Functions
async function loadOrders(status = '') {
    try {
        const orders = await fetchWithAuth(`/orders${status ? `?status=${status}` : ''}`);
        const ordersTable = document.getElementById('orders-table');
        
        ordersTable.innerHTML = orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${order.user.username}</td>
                <td>${order.items.length} items</td>
                <td>$${order.total_amount.toFixed(2)}</td>
                <td><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></td>
                <td class="action-buttons">
                    <button class="edit-btn" onclick="viewOrderDetails(${order.id})">View</button>
                    <button class="btn btn-outline" onclick="updateOrderStatus(${order.id})">Update Status</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

async function updateOrderStatus(orderId) {
    const newStatus = prompt('Enter new status (pending, processing, shipped, delivered, cancelled):');
    if (!newStatus) return;
    
    try {
        await fetchWithAuth(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        loadOrders();
    } catch (error) {
        console.error('Error updating order status:', error);
        alert('Failed to update order status');
    }
}

// Users Functions
async function loadUsers() {
    try {
        const users = await fetchWithAuth('/admin/users');
        const usersTable = document.getElementById('users-table');
        
        usersTable.innerHTML = users.map(user => `
            <tr>
                <td>#${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td><span class="status-badge ${user.is_admin ? 'status-delivered' : 'status-processing'}">
                    ${user.is_admin ? 'Admin' : 'User'}
                </span></td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td class="action-buttons">
                    ${!user.is_admin ? `
                        <button class="edit-btn" onclick="makeAdmin(${user.id})">Make Admin</button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function makeAdmin(userId) {
    if (!confirm('Are you sure you want to make this user an admin?')) return;
    
    try {
        await fetchWithAuth(`/admin/users/${userId}/make-admin`, {
            method: 'PUT'
        });
        loadUsers();
    } catch (error) {
        console.error('Error making user admin:', error);
        alert('Failed to update user role');
    }
}

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAdminAccess()) return;
    
    // Load initial dashboard data
    loadDashboardStats();
    
    // Navigation
    const navLinks = document.querySelectorAll('.nav-links a[data-page]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show selected page
            document.querySelectorAll('.admin-page').forEach(page => {
                page.style.display = 'none';
            });
            document.getElementById(`${pageId}-page`).style.display = 'block';
            
            // Load page data
            switch (pageId) {
                case 'dashboard':
                    loadDashboardStats();
                    break;
                case 'products':
                    loadProducts();
                    break;
                case 'orders':
                    loadOrders();
                    break;
                case 'users':
                    loadUsers();
                    break;
            }
        });
    });
    
    // Product form
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(productForm);
            const productData = {
                name: formData.get('name'),
                description: formData.get('description'),
                price: parseFloat(formData.get('price')),
                category: formData.get('category'),
                image_url: formData.get('image_url'),
                is_new: formData.get('is_new') === 'on',
                discount_percent: parseInt(formData.get('discount_percent')) || 0,
                is_available: true
            };
            
            await saveProduct(productData);
        });
    }
    
    // Add product button
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            document.getElementById('product-form').reset();
            document.getElementById('product-modal-title').textContent = 'Add Product';
            openModal('product-modal');
        });
    }
    
    // Order status filter
    const statusFilter = document.getElementById('order-status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            loadOrders(statusFilter.value);
        });
    }
    
    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });
    
    // Logout
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('accessToken');
        localStorage.removeItem('isAdmin');
        window.location.href = 'login.html';
    });
});