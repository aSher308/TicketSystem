import { useState, useEffect } from 'react';
import { getEvents, getVenues, createEvent, updateEvent, deleteEvent, uploadEventImage } from '../api/axios';
import AdminLayout from '../components/AdminLayout';

export default function AdminEvents() {
    const [events, setEvents] = useState([]);
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({
        title: '', description: '', venueId: '', eventDate: '',
        priceVip: '', priceStandard: '', priceEconomy: '', imageUrl: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [eventsRes, venuesRes] = await Promise.all([getEvents(), getVenues()]);
            setEvents(eventsRes.data);
            setVenues(venuesRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate date is in the future
        if (form.eventDate) {
            const selectedDate = new Date(form.eventDate);
            if (selectedDate <= new Date()) {
                setError('Ngày sự kiện phải sau thời điểm hiện tại!');
                return;
            }
        }

        try {
            let finalImageUrl = form.imageUrl;

            // Upload image file if selected
            if (imageFile) {
                setUploading(true);
                try {
                    const uploadRes = await uploadEventImage(imageFile);
                    finalImageUrl = uploadRes.data.imageUrl;
                } catch (uploadErr) {
                    setError('Lỗi khi upload ảnh: ' + (uploadErr.response?.data?.error || uploadErr.message));
                    setUploading(false);
                    return;
                }
                setUploading(false);
            }

            const payload = {
                title: form.title,
                description: form.description,
                venueId: parseInt(form.venueId),
                eventDate: form.eventDate,
                priceVip: parseFloat(form.priceVip) || 0,
                priceStandard: parseFloat(form.priceStandard) || 0,
                priceEconomy: parseFloat(form.priceEconomy) || 0,
                price: parseFloat(form.priceStandard) || 0,
                imageUrl: finalImageUrl
            };
            if (editId) {
                await updateEvent(editId, payload);
            } else {
                await createEvent(payload);
            }
            setShowForm(false);
            setEditId(null);
            resetForm();
            loadData();
        } catch (err) {
            setError(err.response?.data?.error || 'Lỗi!');
        }
    };

    const resetForm = () => {
        setForm({
            title: '', description: '', venueId: '', eventDate: '',
            priceVip: '', priceStandard: '', priceEconomy: '', imageUrl: ''
        });
        setImageFile(null);
        setImagePreview('');
    };

    const handleEdit = (event) => {
        const dateStr = event.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : '';
        setForm({
            title: event.title,
            description: event.description || '',
            venueId: event.venueId?.toString() || '',
            eventDate: dateStr,
            priceVip: '',
            priceStandard: event.price?.toString() || '',
            priceEconomy: '',
            imageUrl: event.imageUrl || ''
        });
        setEditId(event.id);
        setImageFile(null);
        setImagePreview(event.imageUrl || '');
        setShowForm(true);
    };

    const handleImageFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP)!');
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setError('File ảnh tối đa 10MB!');
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setForm({ ...form, imageUrl: '' }); // Clear URL when file is selected
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa sự kiện này?')) return;
        try {
            await deleteEvent(id);
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Xóa thất bại!');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('vi-VN');
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
    };

    if (loading) return <div className="loading">Đang tải...</div>;

    return (
        <AdminLayout>
            <div className="admin-page">
                <div className="admin-header">
                    <h1>🎪 Quản lý Sự kiện</h1>
                    <button className="btn btn-primary" onClick={() => {
                        resetForm();
                        setEditId(null);
                        setShowForm(true);
                    }}>
                        + Thêm Sự kiện
                    </button>
                </div>

                {showForm && (
                    <div className="modal-overlay" onClick={() => setShowForm(false)}>
                        <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                            <h2>{editId ? 'Sửa Sự kiện' : 'Thêm Sự kiện mới'}</h2>
                            {error && <div className="alert alert-error">{error}</div>}
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Tên sự kiện *</label>
                                    <input
                                        type="text" value={form.title}
                                        onChange={e => setForm({ ...form, title: e.target.value })}
                                        placeholder="Live Concert ABC" required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Mô tả</label>
                                    <textarea
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                        placeholder="Mô tả chi tiết sự kiện..."
                                        rows="3"
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Venue *</label>
                                        <select
                                            value={form.venueId}
                                            onChange={e => setForm({ ...form, venueId: e.target.value })}
                                            required
                                        >
                                            <option value="">-- Chọn venue --</option>
                                            {venues.map(v => (
                                                <option key={v.id} value={v.id}>{v.name} ({v.totalSeats} ghế)</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Ngày giờ *</label>
                                        <input
                                            type="datetime-local" value={form.eventDate}
                                            onChange={e => setForm({ ...form, eventDate: e.target.value })}
                                            min={new Date().toISOString().slice(0, 16)}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Per-type pricing */}
                                <div className="pricing-section">
                                    <label style={{ fontWeight: 600, marginBottom: '12px', display: 'block' }}>💰 Giá vé theo loại ghế</label>
                                    <div className="pricing-grid">
                                        <div className="pricing-card pricing-vip">
                                            <span className="pricing-label">⭐ VIP</span>
                                            <input
                                                type="number" value={form.priceVip} min="0"
                                                onChange={e => setForm({ ...form, priceVip: e.target.value })}
                                                placeholder="750000" required
                                            />
                                            <span className="pricing-unit">VNĐ</span>
                                        </div>
                                        <div className="pricing-card pricing-standard">
                                            <span className="pricing-label">🔵 Standard</span>
                                            <input
                                                type="number" value={form.priceStandard} min="0"
                                                onChange={e => setForm({ ...form, priceStandard: e.target.value })}
                                                placeholder="500000" required
                                            />
                                            <span className="pricing-unit">VNĐ</span>
                                        </div>
                                        <div className="pricing-card pricing-economy">
                                            <span className="pricing-label">⬜ Economy</span>
                                            <input
                                                type="number" value={form.priceEconomy} min="0"
                                                onChange={e => setForm({ ...form, priceEconomy: e.target.value })}
                                                placeholder="300000" required
                                            />
                                            <span className="pricing-unit">VNĐ</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Hình ảnh sự kiện</label>
                                    <div style={{
                                        border: '2px dashed rgba(139, 92, 246, 0.4)',
                                        borderRadius: '12px',
                                        padding: '20px',
                                        textAlign: 'center',
                                        background: 'rgba(139, 92, 246, 0.05)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s'
                                    }}
                                        onClick={() => document.getElementById('event-image-input').click()}
                                        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#8b5cf6'; }}
                                        onDragLeave={e => { e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)'; }}
                                        onDrop={e => {
                                            e.preventDefault();
                                            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                                            const file = e.dataTransfer.files[0];
                                            if (file && file.type.startsWith('image/')) {
                                                setImageFile(file);
                                                setImagePreview(URL.createObjectURL(file));
                                                setForm({ ...form, imageUrl: '' });
                                            }
                                        }}
                                    >
                                        <input
                                            id="event-image-input"
                                            type="file" accept="image/*"
                                            onChange={handleImageFileChange}
                                            style={{ display: 'none' }}
                                        />
                                        {imagePreview ? (
                                            <div>
                                                <img src={imagePreview} alt="Preview" style={{
                                                    maxWidth: '100%', maxHeight: '200px',
                                                    borderRadius: '8px', objectFit: 'cover',
                                                    marginBottom: '10px'
                                                }} />
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                    {imageFile ? imageFile.name : 'Ảnh hiện tại'} — Bấm để đổi ảnh
                                                </p>
                                            </div>
                                        ) : (
                                            <div>
                                                <span style={{ fontSize: '2.5rem' }}>📷</span>
                                                <p style={{ margin: '10px 0 5px', fontWeight: 500 }}>Kéo thả ảnh vào đây hoặc bấm để chọn</p>
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>JPG, PNG, GIF, WebP — Tối đa 10MB</p>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ marginTop: '10px' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Hoặc nhập URL ảnh:</span>
                                        <input
                                            type="text" value={form.imageUrl}
                                            onChange={e => {
                                                setForm({ ...form, imageUrl: e.target.value });
                                                if (e.target.value) {
                                                    setImageFile(null);
                                                    setImagePreview(e.target.value);
                                                }
                                            }}
                                            placeholder="https://example.com/image.jpg"
                                            style={{ marginTop: '5px' }}
                                        />
                                    </div>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Hủy</button>
                                    <button type="submit" className="btn btn-primary" disabled={uploading}>
                                        {uploading ? '⏳ Đang upload...' : editId ? 'Cập nhật' : 'Tạo sự kiện'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tên sự kiện</th>
                                <th>Venue</th>
                                <th>Ngày</th>
                                <th>Giá (Standard)</th>
                                <th>Ghế trống</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map(event => (
                                <tr key={event.id}>
                                    <td>{event.id}</td>
                                    <td><strong>{event.title}</strong></td>
                                    <td>{event.venueName}</td>
                                    <td>{formatDate(event.eventDate)}</td>
                                    <td>{formatPrice(event.price)}</td>
                                    <td>{event.availableSeats}/{event.totalSeats}</td>
                                    <td><span className={`status-badge status-${event.status?.toLowerCase()}`}>{event.status === 'UPCOMING' ? 'Sắp diễn ra' : event.status === 'COMPLETED' ? 'Đã kết thúc' : event.status === 'CANCELLED' ? 'Đã hủy' : event.status}</span></td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="btn btn-sm btn-outline" onClick={() => handleEdit(event)}>✏️ Sửa</button>
                                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(event.id)}>🗑️ Xóa</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {events.length === 0 && <div className="empty-state">Chưa có sự kiện nào</div>}
                </div>
            </div>
        </AdminLayout>
    );
}
