import { useState, useEffect } from 'react';
import { getAllUsers, toggleUserStatus } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';

export default function AdminUsers() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL'); // ALL, ADMIN, USER
    const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, LOCKED

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await getAllUsers();
            setUsers(data);
            setLoading(false);
        } catch (err) {
            setError('Không thể tải danh sách người dùng');
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        if (!window.confirm(`Bạn có chắc muốn ${currentStatus ? 'khoá' : 'mở khoá'} tài khoản này?`)) return;

        try {
            setError('');
            setSuccess('');
            await toggleUserStatus(id);
            setSuccess(`Đã ${currentStatus ? 'khoá' : 'mở khoá'} tài khoản thành công!`);
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const filteredUsers = users.filter((u) => {
        // Search text match
        let textMatch = true;
        if (searchTerm) {
            const searchStr = searchTerm.toLowerCase();
            const username = u.username || '';
            const email = u.email || '';
            const fullName = u.fullName || '';
            const phone = u.phone || '';

            textMatch = username.toLowerCase().includes(searchStr) ||
                email.toLowerCase().includes(searchStr) ||
                fullName.toLowerCase().includes(searchStr) ||
                phone.toLowerCase().includes(searchStr);
        }

        // Role match
        let roleMatch = true;
        if (roleFilter !== 'ALL') {
            roleMatch = u.role === roleFilter;
        }

        // Status match
        let statusMatch = true;
        const accountEnabled = u.enabled ?? u.isEnabled;
        if (statusFilter === 'ACTIVE') {
            statusMatch = accountEnabled === true;
        } else if (statusFilter === 'LOCKED') {
            statusMatch = accountEnabled === false;
        }

        return textMatch && roleMatch && statusMatch;
    });

    if (loading) return <div className="loading">Đang tải dữ liệu...</div>;

    return (
        <AdminLayout>
            <div className="admin-page">
                <div className="admin-header" style={{ marginBottom: '10px' }}>
                    <h1>👥 Quản lý Người Dùng</h1>
                </div>

                {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}
                {success && <div className="alert alert-success" style={{ marginBottom: '20px' }}>{success}</div>}

                <div className="admin-toolbar" style={{
                    marginBottom: '25px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap',
                    background: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)'
                }}>
                    <div style={{ position: 'relative', flex: '1', minWidth: '250px', maxWidth: '400px' }}>
                        <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                            🔍
                        </span>
                        <input
                            type="text" className="form-control" placeholder="Tìm kiếm tài khoản..."
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                paddingLeft: '45px', borderRadius: '8px', border: '1px solid var(--border)',
                                backgroundColor: 'var(--bg)', color: 'var(--text)', height: '42px', width: '100%'
                            }}
                        />
                    </div>
                    <select
                        className="form-control" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                        style={{
                            minWidth: '150px', height: '42px', borderRadius: '8px', border: '1px solid var(--border)',
                            backgroundColor: 'var(--bg)', color: 'var(--text)', padding: '0 15px', cursor: 'pointer'
                        }}
                    >
                        <option value="ALL" style={{ color: 'black' }}>Tất cả Vai trò</option>
                        <option value="USER" style={{ color: 'black' }}>User (Khách)</option>
                        <option value="ADMIN" style={{ color: 'black' }}>Admin (Quản trị)</option>
                    </select>
                    <select
                        className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            minWidth: '160px', height: '42px', borderRadius: '8px', border: '1px solid var(--border)',
                            backgroundColor: 'var(--bg)', color: 'var(--text)', padding: '0 15px', cursor: 'pointer'
                        }}
                    >
                        <option value="ALL" style={{ color: 'black' }}>Tình trạng (Tất cả)</option>
                        <option value="ACTIVE" style={{ color: 'black' }}>Chỉ Hoạt động</option>
                        <option value="LOCKED" style={{ color: 'black' }}>Chỉ Bị khoá</option>
                    </select>
                </div>

                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Họ tên</th>
                                <th>Email</th>
                                <th>Điện thoại</th>
                                <th>Role</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                                        Không tìm thấy người dùng nào phù hợp
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u, index) => {
                                    const isSelf = currentUser && currentUser.username === u.username;
                                    const isSuperAdmin = u.username === 'admin';
                                    const isDisabledButton = isSelf || isSuperAdmin;
                                    const accountEnabled = u.enabled ?? u.isEnabled;

                                    return (
                                        <tr key={u.username || index}>
                                            <td><strong>{u.username}</strong></td>
                                            <td>{u.fullName || '--'}</td>
                                            <td>{u.email}</td>
                                            <td>{u.phone || '--'}</td>
                                            <td>
                                                <span className={`status-badge ${u.role === 'ADMIN' ? 'status-completed' : 'status-upcoming'}`} style={{ fontSize: '0.8rem' }}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${accountEnabled ? 'status-completed' : 'status-cancelled'}`} style={{ fontSize: '0.8rem' }}>
                                                    {accountEnabled ? 'Hoạt động' : 'Bị khoá'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="table-actions">
                                                    <button
                                                        onClick={() => handleToggleStatus(u.username, accountEnabled)}
                                                        className={`btn btn-sm ${accountEnabled ? 'btn-danger' : 'btn-primary'}`}
                                                        disabled={isDisabledButton}
                                                        title={isSelf ? "Không thể tự khoá chính mình" : (isSuperAdmin ? "Không thể khoá super admin" : "")}
                                                        style={{ opacity: isDisabledButton ? 0.5 : 1, cursor: isDisabledButton ? 'not-allowed' : 'pointer' }}
                                                    >
                                                        {accountEnabled ? '🔐 Khóa' : '🔓 Mở khóa'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
