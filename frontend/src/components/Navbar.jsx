import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isAdminPage = location.pathname.startsWith('/admin');

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="nav-container">
                <Link to={user?.role === 'ADMIN' ? '/admin/dashboard' : '/'} className="nav-logo">
                    <span className="logo-icon">🎫</span>
                    <span className="logo-text">TicketBox</span>
                </Link>

                <div className="nav-links">
                    {!isAdminPage && (
                        <Link to="/" className="nav-link">Sự kiện</Link>
                    )}

                    {user ? (
                        <>
                            {!isAdminPage && (
                                <Link to="/orders" className="nav-link">Đơn hàng</Link>
                            )}

                            {user.role === 'ADMIN' && !isAdminPage && (
                                <div className="nav-dropdown">
                                    <span className="nav-link dropdown-trigger">Admin ▾</span>
                                    <div className="dropdown-menu">
                                        <Link to="/admin/dashboard" className="dropdown-item">Dashboard</Link>
                                        <Link to="/admin/users" className="dropdown-item">Quản lý Người dùng</Link>
                                        <Link to="/admin/venues" className="dropdown-item">Quản lý Venue</Link>
                                        <Link to="/admin/events" className="dropdown-item">Quản lý Sự kiện</Link>
                                        <Link to="/admin/checkin" className="dropdown-item">Check-in</Link>
                                    </div>
                                </div>
                            )}

                            <div className="nav-user">
                                <Link to="/profile" className="user-badge" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <span className="user-avatar">{user.username[0].toUpperCase()}</span>
                                    {user.username}
                                </Link>
                                <button onClick={handleLogout} className="btn-logout">Đăng xuất</button>
                            </div>
                        </>
                    ) : (
                        <div className="nav-auth">
                            <Link to="/login" className="btn-login">Đăng nhập</Link>
                            <Link to="/register" className="btn-register">Đăng ký</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
