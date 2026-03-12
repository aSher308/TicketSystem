import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import EventDetail from './pages/EventDetail';
import Checkout from './pages/Checkout';
import PaymentResult from './pages/PaymentResult';
import OrderHistory from './pages/OrderHistory';
import AdminVenues from './pages/AdminVenues';
import AdminEvents from './pages/AdminEvents';
import Checkin from './pages/Checkin';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import Profile from './pages/Profile';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Navbar />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/events/:id" element={<EventDetail />} />
                        <Route path="/payment-result" element={<PaymentResult />} />

                        {/* Protected Routes */}
                        <Route path="/checkout" element={
                            <ProtectedRoute><Checkout /></ProtectedRoute>
                        } />
                        <Route path="/orders" element={
                            <ProtectedRoute><OrderHistory /></ProtectedRoute>
                        } />
                        <Route path="/profile" element={
                            <ProtectedRoute><Profile /></ProtectedRoute>
                        } />

                        {/* Admin Routes */}
                        <Route path="/admin/dashboard" element={
                            <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
                        } />
                        <Route path="/admin/users" element={
                            <ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>
                        } />
                        <Route path="/admin/venues" element={
                            <ProtectedRoute adminOnly><AdminVenues /></ProtectedRoute>
                        } />
                        <Route path="/admin/events" element={
                            <ProtectedRoute adminOnly><AdminEvents /></ProtectedRoute>
                        } />
                        <Route path="/admin/checkin" element={
                            <ProtectedRoute adminOnly><Checkin /></ProtectedRoute>
                        } />
                    </Routes>
                </main>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
