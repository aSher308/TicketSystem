import { NavLink } from 'react-router-dom';

export default function AdminLayout({ children }) {
    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <span className="sidebar-logo">⚙️</span>
                    <span className="sidebar-title">ADMIN PANEL</span>
                </div>
                <nav className="sidebar-nav">
                    <NavLink to="/admin/dashboard" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
                        <span className="sidebar-icon">📊</span>
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/admin/users" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
                        <span className="sidebar-icon">👥</span>
                        <span>Người Dùng</span>
                    </NavLink>
                    <NavLink to="/admin/events" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
                        <span className="sidebar-icon">🎪</span>
                        <span>Sự kiện</span>
                    </NavLink>
                    <NavLink to="/admin/venues" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
                        <span className="sidebar-icon">🏟️</span>
                        <span>Địa điểm</span>
                    </NavLink>
                    <NavLink to="/admin/checkin" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
                        <span className="sidebar-icon">✅</span>
                        <span>Check-in</span>
                    </NavLink>
                    <div className="sidebar-divider"></div>
                    <NavLink to="/" className="sidebar-link">
                        <span className="sidebar-icon">🏠</span>
                        <span>Về trang chủ</span>
                    </NavLink>
                </nav>
            </aside>
            <main className="admin-main">
                {children}
            </main>
        </div>
    );
}
