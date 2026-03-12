import { useState, useEffect } from 'react';
import { getProfile, updateProfile, changePassword } from '../api/axios';

export default function Profile() {
    const [profile, setProfile] = useState({
        username: '',
        email: '',
        fullName: '',
        phone: '',
        role: ''
    });

    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [loading, setLoading] = useState(true);
    const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
    const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data } = await getProfile();
            setProfile(data);
        } catch (err) {
            setProfileMsg({ type: 'error', text: 'Không thể tải thông tin cá nhân' });
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setProfileMsg({ type: '', text: '' });

        try {
            const { data } = await updateProfile({
                fullName: profile.fullName,
                phone: profile.phone,
                email: profile.email
            });
            setProfile(data);
            setProfileMsg({ type: 'success', text: 'Cập nhật thông tin thành công' });

            // Store new name in local storage if we use it globally
            localStorage.setItem('user', JSON.stringify({
                ...JSON.parse(localStorage.getItem('user') || '{}'),
                fullName: data.fullName
            }));

        } catch (err) {
            setProfileMsg({
                type: 'error',
                text: err.response?.data?.error || err.response?.data?.message || 'Lỗi cập nhật'
            });
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordMsg({ type: '', text: '' });

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordMsg({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
            return;
        }

        try {
            await changePassword({
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword
            });

            setPasswordMsg({ type: 'success', text: 'Đổi mật khẩu thành công' });
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });

        } catch (err) {
            setPasswordMsg({
                type: 'error',
                text: err.response?.data?.error || err.response?.data?.message || 'Lỗi đổi mật khẩu'
            });
        }
    };

    if (loading) return <div className="loading">Đang tải...</div>;

    return (
        <div className="profile-page" style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
            <h1 style={{ marginBottom: '30px', textAlign: 'center' }}>👤 Hồ sơ cá nhân</h1>

            <div className="profile-grid" style={{ display: 'grid', gap: '30px', gridTemplateColumns: '1fr' }}>

                {/* Profile Information Form */}
                <div className="card" style={{ padding: '30px', borderRadius: '12px', background: 'var(--surface)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                    <h2 style={{ marginBottom: '20px', fontSize: '1.4rem' }}>Thông tin tài khoản</h2>

                    {profileMsg.text && (
                        <div className={`alert alert-${profileMsg.type}`} style={{ marginBottom: '20px' }}>
                            {profileMsg.text}
                        </div>
                    )}

                    <form onSubmit={handleProfileUpdate}>
                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label>Tên đăng nhập (Username):</label>
                            <input type="text" className="form-control" value={profile.username} disabled />
                            <small style={{ color: 'var(--text-secondary)' }}>Không thể thay đổi</small>
                        </div>

                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label>Email:</label>
                            <input
                                type="email"
                                className="form-control"
                                required
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label>Họ và tên:</label>
                            <input
                                type="text"
                                className="form-control"
                                required
                                value={profile.fullName}
                                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '25px' }}>
                            <label>Số điện thoại:</label>
                            <input
                                type="text"
                                className="form-control"
                                required
                                value={profile.phone}
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                            Lưu thông tin
                        </button>
                    </form>
                </div>

                {/* Change Password Form */}
                <div className="card" style={{ padding: '30px', borderRadius: '12px', background: 'var(--surface)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                    <h2 style={{ marginBottom: '20px', fontSize: '1.4rem', color: 'var(--error)' }}>Đổi mật khẩu</h2>

                    {passwordMsg.text && (
                        <div className={`alert alert-${passwordMsg.type}`} style={{ marginBottom: '20px' }}>
                            {passwordMsg.text}
                        </div>
                    )}

                    <form onSubmit={handlePasswordChange}>
                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label>Mật khẩu hiện tại:</label>
                            <input
                                type="password"
                                className="form-control"
                                required
                                value={passwordData.oldPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label>Mật khẩu mới:</label>
                            <input
                                type="password"
                                className="form-control"
                                required
                                minLength="6"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '25px' }}>
                            <label>Xác nhận mật khẩu mới:</label>
                            <input
                                type="password"
                                className="form-control"
                                required
                                minLength="6"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            />
                        </div>

                        <button type="submit" className="btn btn-outline" style={{ width: '100%', borderColor: 'var(--error)', color: 'var(--error)' }}>
                            Đổi mật khẩu
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
}
