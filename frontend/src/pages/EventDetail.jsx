import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvent, getEventSeats, reserveSeats, simulatePayment } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import SeatMap from '../components/SeatMap';

export default function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState(null);
    const [seats, setSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reserving, setReserving] = useState(false);
    const [payingSimulated, setPayingSimulated] = useState(false);
    const [error, setError] = useState('');
    const [reservedOrder, setReservedOrder] = useState(null);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const [eventRes, seatsRes] = await Promise.all([
                getEvent(id),
                getEventSeats(id)
            ]);
            setEvent(eventRes.data);
            setSeats(seatsRes.data);
        } catch (err) {
            setError('Không thể tải thông tin sự kiện');
        } finally {
            setLoading(false);
        }
    };

    const handleSeatClick = (seat) => {
        if (seat.status !== 'AVAILABLE') return;
        setSelectedSeats(prev =>
            prev.includes(seat.id)
                ? prev.filter(sid => sid !== seat.id)
                : [...prev, seat.id]
        );
    };

    const handleReserve = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (selectedSeats.length === 0) return;

        setReserving(true);
        setError('');
        try {
            const { data } = await reserveSeats({
                eventId: parseInt(id),
                eventSeatIds: selectedSeats
            });

            setReservedOrder(data);
        } catch (err) {
            setError(err.response?.data?.error || 'Đặt ghế thất bại!');
            loadData();
        } finally {
            setReserving(false);
        }
    };

    const handleStripePayment = () => {
        if (reservedOrder?.paymentUrl) {
            window.location.href = reservedOrder.paymentUrl;
        }
    };

    const handleSimulatePayment = async () => {
        if (!reservedOrder) return;
        setPayingSimulated(true);
        setError('');
        try {
            await simulatePayment(reservedOrder.id);
            navigate('/payment-result?simulated=true&orderId=' + reservedOrder.id);
        } catch (err) {
            setError(err.response?.data?.error || 'Thanh toán thất bại!');
        } finally {
            setPayingSimulated(false);
        }
    };

    const getSelectedSeatNames = () => {
        return seats
            .filter(s => selectedSeats.includes(s.id))
            .map(s => `${s.rowLabel}${s.colNumber}`)
            .join(', ');
    };

    const getSelectedTotal = () => {
        return seats
            .filter(s => selectedSeats.includes(s.id))
            .reduce((sum, s) => sum + s.price, 0);
    };

    const getSelectedBreakdown = () => {
        const groups = {};
        seats.filter(s => selectedSeats.includes(s.id)).forEach(s => {
            const key = s.seatType;
            if (!groups[key]) groups[key] = { count: 0, price: s.price, type: s.seatType };
            groups[key].count++;
        });
        return Object.values(groups)
            .map(g => `${g.count}× ${g.type} (${formatPrice(g.price)})`)
            .join(' + ');
    };

    const getMinPrice = () => {
        if (seats.length === 0) return event.price;
        return Math.min(...seats.map(s => s.price).filter(p => p > 0));
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
    };

    if (loading) return <div className="loading">Đang tải...</div>;
    if (!event) return <div className="loading">Sự kiện không tồn tại</div>;

    return (
        <div className="event-detail-page">
            {/* Event Header */}
            <div className="event-header">
                <div className="event-header-bg">
                    <img
                        src={event.imageUrl || `https://picsum.photos/seed/event${event.id}/1200/400`}
                        alt={event.title}
                        onError={e => { e.target.src = `https://picsum.photos/seed/event${event.id}/1200/400`; }}
                    />
                </div>
                <div className="event-header-content">
                    <span className="event-status-badge">{event.status}</span>
                    <h1>{event.title}</h1>
                    <div className="event-header-meta">
                        <span>📅 {formatDate(event.eventDate)}</span>
                        <span>📍 {event.venueName} - {event.venueAddress}</span>
                        <span>💰 Từ {formatPrice(getMinPrice())} / vé</span>
                    </div>
                </div>
            </div>

            <div className="event-detail-body">
                {/* Description */}
                <div className="event-description">
                    <h2>Thông tin sự kiện</h2>
                    <p>{event.description}</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {/* Payment Options - shown after reservation */}
                {reservedOrder && (
                    <div className="payment-options">
                        <h2>💳 Chọn phương thức thanh toán</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                            Đơn hàng #{reservedOrder.id} — Ghế: {reservedOrder.seats?.join(', ')} — Tổng: {formatPrice(reservedOrder.totalAmount)}
                        </p>
                        <div className="payment-buttons">
                            <button
                                className="btn btn-lg"
                                style={{ background: 'linear-gradient(135deg, #635bff, #7a73ff)', color: 'white' }}
                                onClick={handleStripePayment}
                            >
                                💳 Thanh toán Stripe
                            </button>
                            <button
                                className="btn btn-lg"
                                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}
                                onClick={handleSimulatePayment}
                                disabled={payingSimulated}
                            >
                                {payingSimulated ? 'Đang xử lý...' : '⚡ Thanh toán giả lập (Demo)'}
                            </button>
                        </div>
                        <p className="form-hint" style={{ marginTop: '12px' }}>
                            💡 Stripe test mode — dùng thẻ test: <strong>4242 4242 4242 4242</strong>, MM/YY bất kỳ, CVC bất kỳ
                        </p>
                    </div>
                )}

                {/* Seat Selection - hide after reservation */}
                {!reservedOrder && (
                    <>
                        <div className="seat-selection-section">
                            <h2>Chọn ghế ngồi</h2>
                            <p className="seat-availability">
                                Còn <strong>{event.availableSeats}</strong> / {event.totalSeats} ghế trống
                            </p>

                            <SeatMap
                                seats={seats}
                                selectedSeats={selectedSeats}
                                onSeatClick={handleSeatClick}
                            />
                        </div>

                        {/* Booking Summary */}
                        {selectedSeats.length > 0 && (
                            <div className="booking-summary">
                                <div className="summary-info">
                                    <h3>Tóm tắt đặt vé</h3>
                                    <p><strong>Ghế đã chọn:</strong> {getSelectedSeatNames()}</p>
                                    <p><strong>Chi tiết:</strong> {getSelectedBreakdown()}</p>
                                    <p className="summary-total">
                                        <strong>Tổng cộng:</strong> {formatPrice(getSelectedTotal())}
                                    </p>
                                </div>
                                <button
                                    className="btn btn-primary btn-lg"
                                    onClick={handleReserve}
                                    disabled={reserving}
                                >
                                    {reserving ? 'Đang xử lý...' : `Đặt vé (${formatPrice(getSelectedTotal())})`}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
