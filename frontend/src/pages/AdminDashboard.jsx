import { useState, useEffect, useMemo } from 'react';
import { getAdminStats, getCheckinSeats, getEvents } from '../api/axios';
import AdminLayout from '../components/AdminLayout';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement,
    Title, Tooltip, Legend, ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [selectedSeat, setSelectedSeat] = useState(null);
    const [seats, setSeats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingSeats, setLoadingSeats] = useState(false);

    useEffect(() => { loadData(); }, []);
    useEffect(() => {
        if (selectedEventId) loadCheckinSeats(selectedEventId);
    }, [selectedEventId]);

    const loadData = async () => {
        try {
            const [statsRes, eventsRes] = await Promise.all([getAdminStats(), getEvents()]);
            setStats(statsRes.data);
            setEvents(eventsRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const loadCheckinSeats = async (eventId) => {
        setLoadingSeats(true);
        try { const { data } = await getCheckinSeats(eventId); setSeats(data); }
        catch (err) { console.error(err); }
        finally { setLoadingSeats(false); }
    };

    const fmt = (v) => new Intl.NumberFormat('vi-VN').format(v);

    // Bar chart: Revenue per event
    const barData = useMemo(() => {
        if (!stats?.revenueByEvent) return null;
        const labels = stats.revenueByEvent.map(e =>
            e.eventTitle.length > 20 ? e.eventTitle.substring(0, 18) + '...' : e.eventTitle
        );
        return {
            labels,
            datasets: [{
                label: 'Doanh thu (VNĐ)',
                data: stats.revenueByEvent.map(e => e.revenue),
                backgroundColor: [
                    'rgba(139,92,246,0.7)', 'rgba(59,130,246,0.7)',
                    'rgba(245,158,11,0.7)', 'rgba(16,185,129,0.7)',
                    'rgba(239,68,68,0.7)'
                ],
                borderColor: [
                    '#8b5cf6', '#3b82f6', '#f59e0b', '#10b981', '#ef4444'
                ],
                borderWidth: 2,
                borderRadius: 8,
            }]
        };
    }, [stats]);

    // Doughnut chart: Tickets distribution
    const doughnutData = useMemo(() => {
        if (!stats?.revenueByEvent) return null;
        return {
            labels: stats.revenueByEvent.map(e =>
                e.eventTitle.length > 15 ? e.eventTitle.substring(0, 13) + '...' : e.eventTitle
            ),
            datasets: [{
                data: stats.revenueByEvent.map(e => e.ticketsSold),
                backgroundColor: [
                    '#8b5cf6', '#3b82f6', '#f59e0b', '#10b981', '#ef4444'
                ],
                borderColor: 'transparent',
                hoverOffset: 8,
            }]
        };
    }, [stats]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15,23,42,0.9)',
                titleColor: '#e2e8f0',
                bodyColor: '#e2e8f0',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: (ctx) => ` ${fmt(ctx.raw)} VNĐ`
                }
            }
        },
        scales: {
            x: {
                ticks: { color: '#94a3b8', font: { size: 11 } },
                grid: { color: 'rgba(255,255,255,0.04)' }
            },
            y: {
                ticks: { color: '#94a3b8', callback: v => fmt(v), font: { size: 11 } },
                grid: { color: 'rgba(255,255,255,0.04)' }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#94a3b8', padding: 16, usePointStyle: true, pointStyleWidth: 10 }
            },
            tooltip: {
                backgroundColor: 'rgba(15,23,42,0.9)',
                titleColor: '#e2e8f0',
                bodyColor: '#e2e8f0',
                callbacks: {
                    label: (ctx) => ` ${ctx.label}: ${ctx.raw} vé`
                }
            }
        }
    };

    // Seat map
    const getRows = () => {
        const rows = {};
        seats.forEach(s => { if (!rows[s.rowLabel]) rows[s.rowLabel] = []; rows[s.rowLabel].push(s); });
        Object.values(rows).forEach(r => r.sort((a, b) => a.colNumber - b.colNumber));
        return rows;
    };
    const getSeatClass = (s) => {
        let c = 'seat';
        if (s.checkedIn) return c + ' seat-checkedin';
        if (s.status === 'RESERVED' || s.status === 'SOLD') return c + ' seat-taken';
        return c + ` seat-${s.seatType?.toLowerCase() || 'standard'}`;
    };
    const checkinStats = () => {
        const sold = seats.filter(s => s.status === 'RESERVED' || s.status === 'SOLD' || s.checkedIn);
        return { total: sold.length, checkedIn: seats.filter(s => s.checkedIn).length };
    };
    const selectedEvent = events.find(e => e.id === parseInt(selectedEventId));

    if (loading) return <AdminLayout><div className="loading">Đang tải...</div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="dashboard-content">
                {/* Header */}
                <div className="dashboard-header">
                    <div>
                        <h1>Dashboard</h1>
                        <p className="dashboard-subtitle">Tổng quan hệ thống bán vé</p>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="dashboard-stats">
                        <div className="stat-card stat-events">
                            <div className="stat-icon">🎪</div>
                            <div className="stat-info">
                                <span className="stat-value">{stats.totalEvents}</span>
                                <span className="stat-label">Sự kiện</span>
                            </div>
                        </div>
                        <div className="stat-card stat-orders">
                            <div className="stat-icon">🎫</div>
                            <div className="stat-info">
                                <span className="stat-value">{stats.totalTicketsSold}</span>
                                <span className="stat-label">Vé đã bán</span>
                            </div>
                        </div>
                        <div className="stat-card stat-revenue">
                            <div className="stat-icon">💰</div>
                            <div className="stat-info">
                                <span className="stat-value">{fmt(stats.totalRevenue)}đ</span>
                                <span className="stat-label">Doanh thu</span>
                            </div>
                        </div>
                        <div className="stat-card stat-checkin">
                            <div className="stat-icon">✅</div>
                            <div className="stat-info">
                                <span className="stat-value">{stats.totalCheckedIn}</span>
                                <span className="stat-label">Đã Check-in</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Charts Row */}
                <div className="dashboard-charts">
                    <div className="chart-card chart-main">
                        <div className="chart-header">
                            <h3>📈 Doanh thu theo sự kiện</h3>
                        </div>
                        <div className="chart-body">
                            {barData && <Bar data={barData} options={chartOptions} />}
                        </div>
                    </div>
                    <div className="chart-card chart-side">
                        <div className="chart-header">
                            <h3>🎯 Phân bổ vé bán</h3>
                        </div>
                        <div className="chart-body">
                            {doughnutData && <Doughnut data={doughnutData} options={doughnutOptions} />}
                        </div>
                    </div>
                </div>

                {/* Recent Orders Table */}
                {stats?.recentOrders?.length > 0 && (
                    <div className="dashboard-table-card">
                        <div className="chart-header">
                            <h3>📋 Đơn hàng gần đây</h3>
                        </div>
                        <div className="table-responsive">
                            <table className="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Khách hàng</th>
                                        <th>Sự kiện</th>
                                        <th>Số ghế</th>
                                        <th>Tổng tiền</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recentOrders.map(order => (
                                        <tr key={order.orderId}>
                                            <td className="td-id">#{order.orderId}</td>
                                            <td>{order.userName}</td>
                                            <td className="td-event">{order.eventTitle}</td>
                                            <td className="td-center">{order.seatCount}</td>
                                            <td className="td-amount">{fmt(order.amount)}đ</td>
                                            <td>
                                                <span className={`status-badge status-${order.status.toLowerCase()}`}>
                                                    {order.status === 'PAID' ? '✅ Đã TT' :
                                                        order.status === 'CHECKED_IN' ? '🎫 Checked-in' :
                                                            order.status === 'PENDING' ? '⏳ Chờ TT' : order.status}
                                                </span>
                                            </td>
                                            <td className="td-date">{order.createdAt}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Check-in Seat Map */}
                <div className="dashboard-table-card">
                    <div className="chart-header">
                        <h3>🪑 Trạng thái Check-in</h3>
                    </div>
                    <div className="event-selector">
                        <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
                            <option value="">-- Chọn sự kiện --</option>
                            {events.map(ev => (
                                <option key={ev.id} value={ev.id}>
                                    {ev.title} ({ev.availableSeats}/{ev.totalSeats} ghế trống)
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedEventId && !loadingSeats && seats.length > 0 && (
                        <>
                            <div className="checkin-event-info">
                                <div>
                                    <strong>{selectedEvent?.title}</strong>
                                    <span className="checkin-venue">{selectedEvent?.venueName}</span>
                                </div>
                                <div className="checkin-progress">
                                    <span className="checkin-count">
                                        {checkinStats().checkedIn} / {checkinStats().total} đã check-in
                                    </span>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{
                                            width: checkinStats().total > 0
                                                ? `${(checkinStats().checkedIn / checkinStats().total) * 100}%` : '0%'
                                        }} />
                                    </div>
                                </div>
                            </div>

                            <div className="seat-legend">
                                <div className="legend-item"><div className="seat-mini seat-checkedin"></div><span>Đã check-in</span></div>
                                <div className="legend-item"><div className="seat-mini seat-taken"></div><span>Đã đặt</span></div>
                                <div className="legend-item"><div className="seat-mini seat-vip"></div><span>VIP</span></div>
                                <div className="legend-item"><div className="seat-mini seat-standard"></div><span>Standard</span></div>
                                <div className="legend-item"><div className="seat-mini seat-economy"></div><span>Economy</span></div>
                            </div>

                            <div className="seat-map-container">
                                <div className="stage"><div className="stage-inner">SÂN KHẤU / MÀN HÌNH</div></div>
                                <div className="seat-grid">
                                    {Object.keys(getRows()).sort().map(rowLabel => (
                                        <div key={rowLabel} className="seat-row">
                                            <span className="row-label">{rowLabel}</span>
                                            <div className="row-seats">
                                                {getRows()[rowLabel].map(seat => (
                                                    <div key={seat.id} className={getSeatClass(seat)}
                                                        onClick={() => setSelectedSeat(seat)}
                                                        title={`${seat.rowLabel}${seat.colNumber} — ${seat.seatType} — ${seat.checkedIn ? '✅ Đã check-in' : seat.status === 'RESERVED' || seat.status === 'SOLD' ? '🎫 Đã đặt' : '⬜ Trống'}`}>
                                                        {seat.colNumber}
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="row-label">{rowLabel}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {selectedEventId && loadingSeats && (
                        <div className="loading" style={{ padding: '40px' }}>Đang tải dữ liệu ghế...</div>
                    )}
                    {!selectedEventId && (
                        <div className="empty-state">👆 Chọn sự kiện để xem trạng thái check-in</div>
                    )}
                </div>
            </div>

            {/* Seat Details Modal */}
            {selectedSeat && (
                <div className="modal-overlay" onClick={() => setSelectedSeat(null)} style={{ zIndex: 9999 }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', width: '100%', padding: '25px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>
                            <h3 style={{ margin: 0, color: 'var(--text)' }}>🪑 Ghế {selectedSeat.rowLabel}{selectedSeat.colNumber}</h3>
                            <button
                                onClick={() => setSelectedSeat(null)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '1.2rem', cursor: 'pointer' }}
                            >✕</button>
                        </div>

                        <div style={{ background: 'var(--surface)', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border)' }}>
                            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Loại ghế:</span>
                                <strong>{selectedSeat.seatType}</strong>
                            </div>
                            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Giá vé:</span>
                                <strong>{fmt(selectedSeat.price)} VNĐ</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Trạng thái:</span>
                                <span className={`badge ${selectedSeat.checkedIn ? 'bg-success' : selectedSeat.status === 'RESERVED' || selectedSeat.status === 'SOLD' ? 'bg-error' : 'bg-primary'}`}>
                                    {selectedSeat.checkedIn ? '✅ Đã check-in' : selectedSeat.status === 'RESERVED' || selectedSeat.status === 'SOLD' ? '🎟️ Đã đặt' : '⬜ Trống'}
                                </span>
                            </div>
                        </div>

                        {(selectedSeat.status === 'RESERVED' || selectedSeat.status === 'SOLD' || selectedSeat.checkedIn) && selectedSeat.bookedBy ? (
                            <div>
                                <h4 style={{ marginBottom: '15px', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Thông tin người đặt</h4>
                                <div style={{ background: 'var(--surface)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                        <span style={{ fontSize: '1.2rem' }}>👤</span>
                                        <div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Họ Tên</div>
                                            <div style={{ fontWeight: 600 }}>{selectedSeat.bookedBy}</div>
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                        <span style={{ fontSize: '1.2rem' }}>📧</span>
                                        <div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Email</div>
                                            <div>{selectedSeat.bookedEmail || '--'}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                        <span style={{ fontSize: '1.2rem' }}>📱</span>
                                        <div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Số điện thoại</div>
                                            <div>{selectedSeat.bookedPhone || '--'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (selectedSeat.status === 'RESERVED' || selectedSeat.status === 'SOLD' || selectedSeat.checkedIn) ? (
                            <div className="alert alert-info">Chưa có thông tin người đặt</div>
                        ) : null}

                        <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-outline" onClick={() => setSelectedSeat(null)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
