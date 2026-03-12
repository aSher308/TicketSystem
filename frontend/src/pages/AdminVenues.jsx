import { useState, useEffect } from 'react';
import { getVenues, createVenue, updateVenue, deleteVenue } from '../api/axios';
import AdminLayout from '../components/AdminLayout';

const DEFAULT_ROW = { label: '', seatCount: 10, seatType: 'STANDARD' };

export default function AdminVenues() {
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ name: '', address: '' });
    const [seatRows, setSeatRows] = useState([
        { label: 'A', seatCount: 10, seatType: 'VIP' },
        { label: 'B', seatCount: 10, seatType: 'VIP' },
        { label: 'C', seatCount: 12, seatType: 'STANDARD' },
        { label: 'D', seatCount: 12, seatType: 'STANDARD' },
        { label: 'E', seatCount: 14, seatType: 'ECONOMY' },
    ]);
    const [error, setError] = useState('');

    useEffect(() => { loadVenues(); }, []);

    const loadVenues = async () => {
        try {
            const { data } = await getVenues();
            setVenues(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addRow = () => {
        const lastLabel = seatRows.length > 0
            ? seatRows[seatRows.length - 1].label
            : '@';
        const nextLabel = String.fromCharCode(lastLabel.charCodeAt(0) + 1);
        setSeatRows([...seatRows, { label: nextLabel, seatCount: 10, seatType: 'STANDARD' }]);
    };

    const removeRow = (index) => {
        setSeatRows(seatRows.filter((_, i) => i !== index));
    };

    const updateRow = (index, field, value) => {
        const updated = [...seatRows];
        updated[index] = { ...updated[index], [field]: value };
        setSeatRows(updated);
    };

    const getTotalSeats = () => seatRows.reduce((sum, r) => sum + (r.seatCount || 0), 0);

    const getSeatSummary = () => {
        const groups = {};
        seatRows.forEach(r => {
            if (!groups[r.seatType]) groups[r.seatType] = 0;
            groups[r.seatType] += r.seatCount || 0;
        });
        return Object.entries(groups).map(([type, count]) => `${type}: ${count}`).join(' | ');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const payload = {
                name: form.name,
                address: form.address,
                seatRows: seatRows,
                totalRows: seatRows.length,
                totalColumns: Math.max(...seatRows.map(r => r.seatCount || 0))
            };
            if (editId) {
                await updateVenue(editId, payload);
            } else {
                await createVenue(payload);
            }
            setShowForm(false);
            setEditId(null);
            resetForm();
            loadVenues();
        } catch (err) {
            setError(err.response?.data?.error || 'Lỗi!');
        }
    };

    const resetForm = () => {
        setForm({ name: '', address: '' });
        setSeatRows([
            { label: 'A', seatCount: 10, seatType: 'VIP' },
            { label: 'B', seatCount: 10, seatType: 'VIP' },
            { label: 'C', seatCount: 12, seatType: 'STANDARD' },
            { label: 'D', seatCount: 12, seatType: 'STANDARD' },
            { label: 'E', seatCount: 14, seatType: 'ECONOMY' },
        ]);
    };

    const handleEdit = (venue) => {
        setForm({ name: venue.name, address: venue.address });
        // Generate rows from venue data (fallback to grid)
        const rows = [];
        for (let i = 0; i < venue.totalRows; i++) {
            const label = String.fromCharCode('A'.charCodeAt(0) + i);
            const seatType = i < 2 ? 'VIP' : (i < Math.floor(venue.totalRows / 2) ? 'STANDARD' : 'ECONOMY');
            rows.push({ label, seatCount: venue.totalColumns, seatType });
        }
        setSeatRows(rows);
        setEditId(venue.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa venue này?')) return;
        try {
            await deleteVenue(id);
            loadVenues();
        } catch (err) {
            alert(err.response?.data?.error || 'Xóa thất bại!');
        }
    };

    if (loading) return <div className="loading">Đang tải...</div>;

    return (
        <AdminLayout>
            <div className="admin-page">
                <div className="admin-header">
                    <h1>🏟️ Quản lý Venue</h1>
                    <button className="btn btn-primary" onClick={() => {
                        resetForm();
                        setEditId(null);
                        setShowForm(true);
                    }}>
                        + Thêm Venue
                    </button>
                </div>

                {showForm && (
                    <div className="modal-overlay" onClick={() => setShowForm(false)}>
                        <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                            <h2>{editId ? 'Sửa Venue' : 'Thêm Venue mới'}</h2>
                            {error && <div className="alert alert-error">{error}</div>}
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Tên venue *</label>
                                    <input
                                        type="text" value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        placeholder="Nhà hát Lớn Hà Nội" required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Địa chỉ</label>
                                    <input
                                        type="text" value={form.address}
                                        onChange={e => setForm({ ...form, address: e.target.value })}
                                        placeholder="1 Tràng Tiền, Hoàn Kiếm, Hà Nội"
                                    />
                                </div>

                                {/* Seat Row Editor */}
                                <div className="seat-editor">
                                    <label style={{ fontWeight: 600, marginBottom: '12px', display: 'block' }}>
                                        🪑 Cấu hình ghế ngồi
                                    </label>

                                    <div className="seat-editor-header">
                                        <span>Hàng</span>
                                        <span>Số ghế</span>
                                        <span>Loại</span>
                                        <span></span>
                                    </div>

                                    {seatRows.map((row, idx) => (
                                        <div key={idx} className="seat-editor-row">
                                            <input
                                                type="text"
                                                value={row.label}
                                                onChange={e => updateRow(idx, 'label', e.target.value.toUpperCase())}
                                                maxLength={2}
                                                className="seat-editor-label"
                                            />
                                            <input
                                                type="number"
                                                value={row.seatCount}
                                                onChange={e => updateRow(idx, 'seatCount', parseInt(e.target.value) || 0)}
                                                min={1} max={50}
                                                className="seat-editor-count"
                                            />
                                            <select
                                                value={row.seatType}
                                                onChange={e => updateRow(idx, 'seatType', e.target.value)}
                                                className={`seat-editor-type type-${row.seatType.toLowerCase()}`}
                                            >
                                                <option value="VIP">⭐ VIP</option>
                                                <option value="STANDARD">🔵 Standard</option>
                                                <option value="ECONOMY">⬜ Economy</option>
                                            </select>
                                            <button
                                                type="button"
                                                className="seat-editor-delete"
                                                onClick={() => removeRow(idx)}
                                                title="Xóa hàng"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ))}

                                    <button type="button" className="btn btn-outline btn-sm" onClick={addRow}
                                        style={{ marginTop: '8px', width: '100%' }}>
                                        + Thêm hàng ghế
                                    </button>

                                    <div className="seat-editor-summary">
                                        Tổng: <strong>{getTotalSeats()}</strong> ghế | {getSeatSummary()}
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Hủy</button>
                                    <button type="submit" className="btn btn-primary">{editId ? 'Cập nhật' : 'Tạo'}</button>
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
                                <th>Tên</th>
                                <th>Địa chỉ</th>
                                <th>Hàng</th>
                                <th>Tổng ghế</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {venues.map(venue => (
                                <tr key={venue.id}>
                                    <td>{venue.id}</td>
                                    <td><strong>{venue.name}</strong></td>
                                    <td>{venue.address}</td>
                                    <td>{venue.totalRows}</td>
                                    <td>{venue.totalSeats}</td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="btn btn-sm btn-outline" onClick={() => handleEdit(venue)}>✏️ Sửa</button>
                                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(venue.id)}>🗑️ Xóa</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {venues.length === 0 && <div className="empty-state">Chưa có venue nào</div>}
                </div>
            </div>
        </AdminLayout>
    );
}
