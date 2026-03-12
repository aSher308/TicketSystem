import axios from 'axios';

const API = axios.create({
    baseURL: '/api',
});

// Intercept requests to add JWT token
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Intercept responses to handle 401
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);

// User Info API (For checkout default)
export const getUserInfo = () => API.get('/auth/userinfo');

// Profile Management API
export const getProfile = () => API.get('/users/profile');
export const updateProfile = (data) => API.put('/users/profile', data);
export const changePassword = (data) => API.put('/users/password', data);

// Events (public)
export const getEvents = () => API.get('/events');
export const getEvent = (id) => API.get(`/events/${id}`);
export const getEventSeats = (id) => API.get(`/events/${id}/seats`);

// Orders
export const reserveSeats = (data) => API.post('/orders/reserve', data);
export const getMyOrders = () => API.get('/orders');
export const getOrder = (id) => API.get(`/orders/${id}`);
export const downloadTicket = (id) => API.get(`/orders/${id}/download-ticket`, { responseType: 'blob' });
export const simulatePayment = (id) => API.post(`/orders/${id}/simulate-pay`);
export const getQrCode = (id) => API.get(`/orders/${id}/qrcode`, { responseType: 'blob' });
export const cancelOrder = (id) => API.put(`/orders/${id}/cancel`);
export const getPaymentUrl = (id) => API.get(`/orders/${id}/payment-url`);

// Admin - Venues
export const getVenues = () => API.get('/admin/venues');
export const createVenue = (data) => API.post('/admin/venues', data);
export const updateVenue = (id, data) => API.put(`/admin/venues/${id}`, data);
export const deleteVenue = (id) => API.delete(`/admin/venues/${id}`);

// Admin - Events
export const createEvent = (data) => API.post('/admin/events', data);
export const updateEvent = (id, data) => API.put(`/admin/events/${id}`, data);
export const deleteEvent = (id) => API.delete(`/admin/events/${id}`);
export const uploadEventImage = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return API.post('/admin/upload/event-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

// Stripe
export const stripeVerify = (sessionId, orderId) => API.get('/stripe/verify', { params: { sessionId, orderId } });

// Checkin
export const scanCheckin = (data) => API.post('/checkin/scan', data);

// Admin - Dashboard
export const getAdminStats = () => API.get('/admin/dashboard/stats');
export const getCheckinSeats = (eventId) => API.get(`/admin/dashboard/events/${eventId}/checkin-seats`);

// Admin User API
export const getAllUsers = () => API.get('/admin/users');
export const toggleUserStatus = (id) => API.put(`/admin/users/${id}/toggle-status`);

export default API;
